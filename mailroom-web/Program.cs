using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.RateLimiting;
using MailKit.Net.Imap;
using MailKit.Security;

[assembly: System.Runtime.CompilerServices.InternalsVisibleTo("Mailroom.Tests")]

namespace Mailroom;

internal static class Program
{
    public static async Task Main()
    {
        var app = WebHost.Build();
        await app.RunAsync();
    }
}

internal static class WebHost
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { MaxDepth = 16 };
    internal static WebApplication Build(SessionStore? testSessions = null, bool? allowHttp = null, string? url = null)
    {
        var localHttp = allowHttp ?? Environment.GetEnvironmentVariable("MAILROOM_ALLOW_HTTP") == "1";
        var cookieName = localHttp ? "mailroom_session" : "__Host-mailroom_session";
        var configuredOrigin = Environment.GetEnvironmentVariable("PUBLIC_ORIGIN")?.TrimEnd('/');
        var builder = WebApplication.CreateSlimBuilder(new WebApplicationOptions { Args = [], ContentRootPath = AppContext.BaseDirectory });
        builder.Logging.ClearProviders(); // Never log mailbox requests, credentials or provider replies.
        builder.WebHost.ConfigureKestrel(options => { options.AddServerHeader = false; options.Limits.MaxRequestBodySize = 131072; options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(10); });
        builder.WebHost.UseUrls(url ?? "http://0.0.0.0:" + (Environment.GetEnvironmentVariable("PORT") ?? "8080"));
        builder.Services.AddSingleton(testSessions ?? new SessionStore());
        builder.Services.AddSingleton<RateLimiterRegistry>();
        builder.Services.AddHostedService<SessionCleanup>();
        builder.Services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = 429;
            options.OnRejected = async (context, ct) => { context.HttpContext.Response.Headers.RetryAfter = "60"; await context.HttpContext.Response.WriteAsJsonAsync(new { error = "rate_limited", message = "请求较频繁，请稍后再试。" }, ct); };
            options.AddPolicy("bootstrap", context => RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions { PermitLimit = 30, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context => RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions { PermitLimit = 300, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
        });
        var app = builder.Build();
        app.Use(async (context, next) =>
        {
            var headers = context.Response.Headers;
            headers.ContentSecurityPolicy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'";
            headers.XContentTypeOptions = "nosniff";
            headers["Referrer-Policy"] = "no-referrer";
            headers.XFrameOptions = "DENY";
            headers.CacheControl = "no-store";
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
            if (!localHttp) headers.StrictTransportSecurity = "max-age=31536000";
            try
            {
                if (context.Request.Path.StartsWithSegments("/api"))
                {
                    var expectedOrigin = configuredOrigin ?? (localHttp ? "http://" : "https://") + context.Request.Host;
                    var origin = context.Request.Headers.Origin.ToString();
                    if (context.Request.Headers["Sec-Fetch-Site"] == "cross-site" || origin.Length > 0 && !string.Equals(origin, expectedOrigin, StringComparison.OrdinalIgnoreCase))
                    {
                        await Fail(context, 403, "origin_denied", "请从拾邮网站内发起此操作。"); return;
                    }
                    if (context.Request.Method != "GET" && !context.Request.HasJsonContentType())
                    {
                        await Fail(context, 415, "json_required", "请求格式无效。"); return;
                    }
                }
                await next();
            }
            catch (Exception error) when (!context.Response.HasStarted)
            {
                var message = error switch
                {
                    UserError => error.Message,
                    MailKit.Security.AuthenticationException => "邮箱拒绝了登录，请检查邮箱地址、授权码，以及 IMAP 服务是否已开启。",
                    SslHandshakeException => "邮箱服务器的加密证书验证未通过，请检查 IMAP 地址；没有发送登录凭证。",
                    ImapCommandException => "邮箱服务暂时拒绝了请求，请检查 IMAP 权限，或稍后重新连接。",
                    OperationCanceledException => "操作超时或已取消，请检查当前邮件状态后再操作。",
                    IOException or System.Net.Sockets.SocketException or MailKit.ServiceNotConnectedException or MailKit.ServiceNotAuthenticatedException => "邮箱连接中断，请重新连接。未确认的移动操作不会自动重试。",
                    BadHttpRequestException or JsonException => "请求内容不完整或格式有误。",
                    _ => "本次操作未完成，请稍后重新整理或重新连接。"
                };
                await Fail(context, error is UserError or BadHttpRequestException or JsonException ? 400 : 502, "request_failed", message);
            }
        });
        app.UseRateLimiter();
        app.MapGet("/health", () => Results.Json(new { status = "ok", version = "1.0.0" }));
        var sessions = app.Services.GetRequiredService<SessionStore>();
        app.MapGet("/api/session", async (HttpContext context) =>
        {
            using var session = sessions.Acquire(context.Request.Cookies[cookieName], true)!;
            context.Response.Cookies.Append(cookieName, session.Entry.Id, new CookieOptions { HttpOnly = true, Secure = !localHttp, SameSite = SameSiteMode.Strict, Path = "/", MaxAge = TimeSpan.FromHours(8), IsEssential = true });
            return Results.Json(new { token = session.Entry.Token, state = await session.Service.State(), providers = Providers.All });
        }).RequireRateLimiting("bootstrap");
        app.MapMethods("/api/{**path}", ["GET", "POST"], async (HttpContext context, string path) =>
        {
            using var lease = sessions.Acquire(context.Request.Cookies[cookieName], false);
            var supplied = context.Request.Headers.Authorization.ToString();
            if (lease == null || !MatchesToken(supplied, lease.Entry.Token)) { await Fail(context, 401, "session_expired", "连接会话已失效，请刷新网页后重新连接邮箱。"); return; }
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(context.RequestAborted);
            timeout.CancelAfter(TimeSpan.FromMinutes(2));
            var ct = timeout.Token;
            var service = lease.Service;
            object result;
            if (context.Request.Method == "GET")
                result = path switch { "state" => await service.State(), _ => throw new UserError("此接口不存在。") };
            else
            {
                if (path == "connect")
                {
                    // Connection attempts also have a small per-session budget.
                    var limiter = context.RequestServices.GetRequiredService<RateLimiterRegistry>();
                    if (!limiter.TryConnect(lease.Entry.Id)) { await Fail(context, 429, "rate_limited", "连接尝试较频繁，请五分钟后再试。"); return; }
                }
                result = path switch
                {
                    "connect" => await service.Connect(await Read<ConnectRequest>(context), ct),
                    "refresh" => await service.Refresh((await Read<RefreshRequest>(context)).Limit, ct),
                    "disconnect" => await service.Disconnect(ct),
                    "move" => await service.Move(await Read<MoveRequest>(context), ct),
                    "undo" => await service.Undo(await Read<UndoRequest>(context), ct),
                    "classify" => await service.Classify(await Read<ClassifyRequest>(context), ct),
                    _ => throw new UserError("此接口不存在。")
                };
            }
            await context.Response.WriteAsJsonAsync(result, JsonOptions, ct);
        });
        app.MapGet("/{**path}", (string? path) =>
        {
            var asset = string.IsNullOrEmpty(path) ? "index.html" : path;
            var type = asset switch { "index.html" => "text/html; charset=utf-8", "app.js" => "application/javascript; charset=utf-8", "style.css" => "text/css; charset=utf-8", _ => null };
            if (type == null) return Results.NotFound();
            var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("Mailroom.Web." + asset);
            return stream == null ? Results.NotFound() : Results.Stream(stream, type);
        });
        return app;
    }
    private static bool MatchesToken(string supplied, string expected)
    {
        if (!supplied.StartsWith("Bearer ", StringComparison.Ordinal)) return false;
        var value = supplied[7..];
        return value.Length == expected.Length && CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(value), Encoding.ASCII.GetBytes(expected));
    }
    private static async Task<T> Read<T>(HttpContext context) => await JsonSerializer.DeserializeAsync<T>(context.Request.Body, JsonOptions, context.RequestAborted) ?? throw new UserError("请求内容不能为空。");
    private static async Task Fail(HttpContext context, int status, string error, string message)
    {
        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(new { error, message });
    }
}

// A bounded, expiring counter; contains random session identifiers, never email addresses.
internal sealed class RateLimiterRegistry
{
    private readonly object sync = new();
    private readonly Dictionary<string, (DateTimeOffset Start, int Count)> attempts = [];
    public bool TryConnect(string id)
    {
        lock (sync)
        {
            var now = DateTimeOffset.UtcNow;
            foreach (var old in attempts.Where(p => now - p.Value.Start >= TimeSpan.FromMinutes(5)).Select(p => p.Key).ToArray()) attempts.Remove(old);
            var entry = attempts.GetValueOrDefault(id, (Start: now, Count: 0));
            if (entry.Count >= 5) return false;
            attempts[id] = (entry.Start, entry.Count + 1);
            return true;
        }
    }
}
