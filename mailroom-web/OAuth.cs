using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.WebUtilities;

namespace Mailroom;

internal sealed record OAuthProvider(string Id, string Name, string ClientId, string ClientSecret, string Authorize, string Token, string Scope);
internal sealed record OAuthStart(string Provider, int Limit = 500);
internal sealed record OAuthGrant(OAuthProvider Provider, string AccessToken, string RefreshToken, DateTimeOffset Expires);

// Client secrets and tokens never enter HTML, URLs, cookies or visitor storage.
internal sealed class OAuthClient
{
    private readonly HttpClient http;
    public string Origin { get; }
    private readonly OAuthProvider[] providers;
    public OAuthClient(string? origin, Func<string, string?>? read = null, HttpClient? http = null)
    {
        read ??= Environment.GetEnvironmentVariable;
        Origin = Uri.TryCreate(origin, UriKind.Absolute, out var uri) && uri.Scheme == "https" && uri.AbsolutePath == "/" && uri.Query == "" && uri.Fragment == "" && uri.UserInfo == "" ? uri.GetLeftPart(UriPartial.Authority) : "";
        this.http = http ?? new HttpClient(new HttpClientHandler { AllowAutoRedirect = false }) { Timeout = TimeSpan.FromSeconds(30) };
        providers = [
            new("google", "Gmail", read("GOOGLE_CLIENT_ID") ?? "", read("GOOGLE_CLIENT_SECRET") ?? "", "https://accounts.google.com/o/oauth2/v2/auth", "https://oauth2.googleapis.com/token", "https://www.googleapis.com/auth/gmail.modify"),
            new("microsoft", "Outlook / Hotmail", read("MICROSOFT_CLIENT_ID") ?? "", read("MICROSOFT_CLIENT_SECRET") ?? "", "https://login.microsoftonline.com/common/oauth2/v2.0/authorize", "https://login.microsoftonline.com/common/oauth2/v2.0/token", "https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.ReadWrite offline_access")
        ];
    }
    public object[] Availability() => providers.Select(p => (object)new { id = p.Id, name = p.Name, ready = Origin.Length > 0 && p.ClientId.Length > 0 && p.ClientSecret.Length > 0 }).ToArray();
    public OAuthProvider Provider(string id)
    {
        var p = providers.FirstOrDefault(p => p.Id == id);
        if (p == null || Origin.Length == 0 || p.ClientId.Length == 0 || p.ClientSecret.Length == 0) throw new UserError("该邮箱的官方登录尚未开放，请稍后再试。");
        return p;
    }
    public string Callback(string id) => Origin + "/oauth/callback/" + id;
    public string Authorize(OAuthProvider p, string state, string verifier) => QueryHelpers.AddQueryString(p.Authorize, new Dictionary<string, string?> {
        ["client_id"] = p.ClientId, ["redirect_uri"] = Callback(p.Id), ["response_type"] = "code", ["scope"] = p.Scope,
        ["state"] = state, ["code_challenge"] = WebEncoders.Base64UrlEncode(SHA256.HashData(Encoding.ASCII.GetBytes(verifier))), ["code_challenge_method"] = "S256",
        ["prompt"] = p.Id == "google" ? "consent select_account" : "select_account", ["access_type"] = p.Id == "google" ? "offline" : null, ["response_mode"] = p.Id == "microsoft" ? "query" : null
    }.Where(p => p.Value != null).ToDictionary());
    public async Task<OAuthGrant> Exchange(OAuthProvider p, string code, string verifier, CancellationToken ct) => await RequestToken(p, new() {
        ["grant_type"] = "authorization_code", ["code"] = code, ["code_verifier"] = verifier, ["redirect_uri"] = Callback(p.Id)
    }, "", ct);
    public async Task<OAuthGrant> Refresh(OAuthGrant grant, CancellationToken ct)
    {
        if (grant.RefreshToken.Length == 0) throw new UserError("邮箱授权已过期，请重新点击官方登录。");
        return await RequestToken(grant.Provider, new() { ["grant_type"] = "refresh_token", ["refresh_token"] = grant.RefreshToken }, grant.RefreshToken, ct);
    }
    private async Task<OAuthGrant> RequestToken(OAuthProvider p, Dictionary<string, string> body, string previousRefresh, CancellationToken ct)
    {
        body["client_id"] = p.ClientId; body["client_secret"] = p.ClientSecret;
        using var response = await http.PostAsync(p.Token, new FormUrlEncodedContent(body), ct);
        if (!response.IsSuccessStatusCode) throw new UserError("邮箱授权未完成或已失效，请重新点击官方登录。组织邮箱可能需要管理员允许此应用。");
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct)); var root = json.RootElement;
        var access = Text(root, "access_token"); var refresh = Text(root, "refresh_token");
        if (access.Length is < 10 or > 30000 || access.Any(char.IsWhiteSpace) || !root.TryGetProperty("expires_in", out var expires) || !expires.TryGetInt32(out var seconds) || seconds is < 60 or > 86400) throw new UserError("邮箱没有返回有效授权，请重新登录。");
        if (!string.Equals(Text(root, "token_type"), "Bearer", StringComparison.OrdinalIgnoreCase)) throw new UserError("邮箱返回的授权类型不可用。");
        var scope = Text(root, "scope");
        if (scope.Length > 0 && !(p.Id == "google" ? scope.Split(' ').Contains("https://www.googleapis.com/auth/gmail.modify") : scope.Split(' ').Any(s => s.Equals("Mail.ReadWrite", StringComparison.OrdinalIgnoreCase) || s.Equals("https://graph.microsoft.com/Mail.ReadWrite", StringComparison.OrdinalIgnoreCase)))) throw new UserError("尚未授予邮件整理权限，请重新登录并确认授权。");
        return new(p, access, refresh.Length > 0 ? refresh : previousRefresh, DateTimeOffset.UtcNow.AddSeconds(seconds));
    }
    internal static string Text(JsonElement value, string key) => value.TryGetProperty(key, out var field) && field.ValueKind == JsonValueKind.String ? field.GetString() ?? "" : "";
}

// A second, narrowly scoped Lax cookie proves the callback browser, while the
// mailbox cookie remains Strict. Single-use state is also tied to a live session.
internal sealed class OAuthFlows(TimeProvider? clock = null)
{
    private readonly TimeProvider clock = clock ?? TimeProvider.System;
    private readonly Dictionary<string, Pending> pending = [];
    private readonly object sync = new();
    internal sealed record Pending(string SessionId, string Provider, string Proof, string Verifier, int Limit, DateTimeOffset Expires);
    public (string State, Pending Flow) Start(string sessionId, string provider, int limit)
    {
        lock (sync)
        {
            foreach (var expired in pending.Where(p => p.Value.Expires <= clock.GetUtcNow() || p.Value.SessionId == sessionId).Select(p => p.Key).ToArray()) pending.Remove(expired);
            if (pending.Count >= 100) throw new UserError("登录请求较多，请稍后重试。");
            var state = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            var flow = new Pending(sessionId, provider, Convert.ToHexString(RandomNumberGenerator.GetBytes(32)), WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32)), Providers.ValidLimit(limit), clock.GetUtcNow().AddMinutes(10));
            pending.Add(state, flow); return (state, flow);
        }
    }
    public Pending Consume(string state, string provider, string proof)
    {
        lock (sync)
        {
            if (state.Length != 64 || !pending.TryGetValue(state, out var flow) || flow.Expires <= clock.GetUtcNow() || flow.Provider != provider || proof.Length != flow.Proof.Length || !CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(proof), Encoding.ASCII.GetBytes(flow.Proof))) throw new UserError("登录已过期或不属于当前浏览器，请返回拾邮重新连接。");
            pending.Remove(state); return flow;
        }
    }
}
