using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Mailroom;
using Microsoft.AspNetCore.WebUtilities;

internal static class OAuthTests
{
    public static async Task Run(Action<bool, string> check)
    {
        var clock = new Clock(); var flows = new OAuthFlows(clock);
        var first = flows.Start("alice", "google", 100);
        check(first.State.Length == 64 && first.Flow.Proof.Length == 64 && first.Flow.Verifier.Length >= 43, "OAuth随机state、浏览器证明及PKCE");
        Reject(() => flows.Consume(first.State, "microsoft", first.Flow.Proof));
        Reject(() => flows.Consume(first.State, "google", new string('0', 64)));
        check(flows.Consume(first.State, "google", first.Flow.Proof).SessionId == "alice", "回调绑定原浏览器和邮箱类型");
        Reject(() => flows.Consume(first.State, "google", first.Flow.Proof));
        var previous = flows.Start("alice", "google", 100); var current = flows.Start("alice", "google", 500);
        Reject(() => flows.Consume(previous.State, "google", previous.Flow.Proof));
        clock.Now += TimeSpan.FromMinutes(11); Reject(() => flows.Consume(current.State, "google", current.Flow.Proof));
        check(true, "OAuth拒绝重放、旧登录和过期回调");

        using var tokens = new FixtureHandler(); using var tokenHttp = new HttpClient(tokens);
        var oauth = Config(tokenHttp); var google = oauth.Provider("google"); var microsoft = oauth.Provider("microsoft");
        var auth = new Uri(oauth.Authorize(google, first.State, first.Flow.Verifier)); var query = QueryHelpers.ParseQuery(auth.Query);
        check(auth.Host == "accounts.google.com" && query["code_challenge"] == WebEncoders.Base64UrlEncode(SHA256.HashData(Encoding.ASCII.GetBytes(first.Flow.Verifier))) && query["code_challenge_method"] == "S256", "Google官方授权使用S256 PKCE");
        check(query["redirect_uri"] == "https://mailroom.example/oauth/callback/google" && !auth.AbsoluteUri.Contains("fixture-secret"), "回调地址由站点固定且不暴露客户端密钥");
        var msAuth = new Uri(oauth.Authorize(microsoft, first.State, first.Flow.Verifier));
        check(msAuth.Host == "login.microsoftonline.com" && microsoft.Scope.Contains("Mail.ReadWrite") && !microsoft.Scope.Contains("Mail.Send"), "Outlook使用委托读写权限且不申请发信");
        Reject(() => new OAuthClient("https://mailroom.example", _ => null).Provider("google"));
        Reject(() => new OAuthClient("http://mailroom.example", _ => "configured").Provider("google"));
        check(true, "缺少站点配置或HTTPS时不能伪装官方登录可用");
        var grant = await oauth.Exchange(google, "fixture-code", first.Flow.Verifier, CancellationToken.None);
        check(grant.RefreshToken == "fixture-refresh" && tokens.Bodies.Any(b => b.Contains("code_verifier=") && b.Contains("client_secret=fixture-secret")), "授权码仅在服务端换取令牌");
        var refreshed = await oauth.Refresh(grant, CancellationToken.None);
        check(refreshed.RefreshToken == "fixture-refresh" && tokens.Bodies.Any(b => b.Contains("grant_type=refresh_token")), "刷新授权保留服务商未轮换的refresh token");
        tokens.BadScope = true;
        await RejectAsync(() => oauth.Exchange(google, "fixture-code", first.Flow.Verifier, CancellationToken.None)); tokens.BadScope = false;
        check(true, "拒绝缺少邮件读写权限的授权结果");

        foreach (var provider in new[] { google, microsoft })
        {
            using var handler = new FixtureHandler();
            await using var service = new ApiMailService(oauth, new HttpClient(handler));
            var loaded = await service.ConnectOAuth(new(provider, "fixture-access-token", "fixture-refresh", DateTimeOffset.UtcNow.AddHours(1)), 100, CancellationToken.None);
            check(loaded.Email == "alice@example.com" && loaded.Mails.Count == 2 && loaded.Mails.Any(m => m.Cat == "bill"), provider.Id + " API读取、分类及账户身份来自服务商");
            check(handler.Paths.All(p => !p.Contains("attachments") && !p.Contains("format=full") && !p.Contains("bodyPreview")), provider.Id + "不下载邮件正文和附件");
            var id = loaded.Mails.First().Id; var operation = Guid.NewGuid().ToString();
            var moved = await service.Move(new([id], true, operation), CancellationToken.None);
            check(moved.Mails.Single(m => m.Id == id).Trash && moved.CanUndo, provider.Id + "仅移动本人选择的已加载邮件");
            await RejectAsync(() => service.Move(new([id], true, operation), CancellationToken.None));
            await RejectAsync(() => service.Move(new(["another-visitor-id"], true, Guid.NewGuid().ToString()), CancellationToken.None));
            var restored = await service.Undo(new(Guid.NewGuid().ToString()), CancellationToken.None);
            check(!restored.Mails.Single(m => m.Id == id).Trash && !restored.CanUndo, provider.Id + "撤销保留每封邮件的服务商ID映射");
            if (provider.Id == "microsoft") check(handler.Paths.Any(p => p.Contains("m-1-moved/move")), "Graph移动后的新ID用于恢复");
            check(!handler.Methods.Contains("DELETE"), provider.Id + "不调用永久删除");
            handler.DropWrite = true;
            var writes = handler.Writes;
            await RejectAsync(() => service.Move(new([id], true, Guid.NewGuid().ToString()), CancellationToken.None));
            check(!(await service.State()).Connected && handler.Writes == writes + 1, provider.Id + "网络中断后停止连接且不重试写入");
            await service.Disconnect(CancellationToken.None);
            check((await service.State()).Mails.Count == 0 && (await service.State()).Email == "", provider.Id + "断开清除邮件及令牌会话");
        }

        using (var handler = new FixtureHandler { HostilePage = true })
        await using (var service = new ApiMailService(oauth, new HttpClient(handler)))
        {
            await RejectAsync(() => service.ConnectOAuth(new(microsoft, "fixture-access-token", "", DateTimeOffset.UtcNow.AddHours(1)), 100, CancellationToken.None));
            check(handler.Hosts.All(h => h == "graph.microsoft.com"), "Graph分页不能将令牌发送到其他主机");
        }
        using (var handler = new FixtureHandler { RepeatPage = true })
        await using (var service = new ApiMailService(oauth, new HttpClient(handler)))
        {
            await RejectAsync(() => service.ConnectOAuth(new(microsoft, "fixture-access-token", "", DateTimeOffset.UtcNow.AddHours(1)), 100, CancellationToken.None));
            check(handler.Writes == 0 && handler.Paths.Count <= 3, "重复分页停止读取且不返回重复邮件");
        }
        using (var handler = new FixtureHandler())
        await using (var service = new ApiMailService(oauth, new HttpClient(handler)))
        {
            var count = tokens.Bodies.Count;
            var state = await service.ConnectOAuth(grant with { Expires = DateTimeOffset.UtcNow.AddSeconds(-1) }, 100, CancellationToken.None);
            check(state.Connected && tokens.Bodies.Count == count + 1, "读取前自动刷新过期授权，不要求用户生成密码");
        }

        await using var store = new SessionStore(factory: () => new MailboxService(oauth, api: () => new ApiMailService(oauth, new HttpClient(new FixtureHandler()))));
        await using var app = Mailroom.WebHost.Build(store, true, "http://127.0.0.1:0", oauth); await app.StartAsync();
        using var alice = new HttpClient(new HttpClientHandler { CookieContainer = new(), AllowAutoRedirect = false }) { BaseAddress = new(app.Urls.Single()) };
        using var bob = new HttpClient(new HttpClientHandler { CookieContainer = new(), AllowAutoRedirect = false }) { BaseAddress = alice.BaseAddress };
        var a = await alice.GetFromJsonAsync<JsonElement>("/api/session"); var b = await bob.GetFromJsonAsync<JsonElement>("/api/session");
        alice.DefaultRequestHeaders.Authorization = new("Bearer", a.GetProperty("token").GetString());
        var start = await alice.PostAsJsonAsync("/api/oauth/start", new { provider = "google", limit = 100 });
        check(start.IsSuccessStatusCode && start.Headers.GetValues("Set-Cookie").Single().Contains("samesite=lax", StringComparison.OrdinalIgnoreCase), "官方登录使用独立的Lax回调证明cookie");
        var started = await start.Content.ReadFromJsonAsync<JsonElement>(); var q = QueryHelpers.ParseQuery(new Uri(started.GetProperty("url").GetString()!).Query);
        var callback = "/oauth/callback/google?state=" + q["state"] + "&code=fixture-code";
        var wrong = await bob.GetAsync(callback);
        check(wrong.Headers.Location?.OriginalString == "/#oauth-expired", "其他浏览器无法消费本人的OAuth回调");
        var completed = await alice.GetAsync(callback);
        check(completed.StatusCode == HttpStatusCode.Redirect && completed.Headers.Location?.OriginalString == "/", "本人完成官方授权后返回干净地址");
        var connected = await alice.GetFromJsonAsync<JsonElement>("/api/session"); var isolated = await bob.GetFromJsonAsync<JsonElement>("/api/session");
        check(connected.GetProperty("state").GetProperty("email").GetString() == "alice@example.com" && !isolated.GetProperty("state").GetProperty("connected").GetBoolean(), "OAuth邮箱数据只属于发起登录的访客");
        var serialized = connected.ToString(); check(!serialized.Contains("fixture-secret") && !serialized.Contains("fixture-access-token") && !serialized.Contains("fixture-refresh"), "浏览器会话响应不包含客户端密钥或邮箱令牌");
        check((await alice.GetAsync(callback)).Headers.Location?.OriginalString == "/#oauth-expired", "HTTP回调也拒绝重复使用授权码");
        using var cross = new HttpRequestMessage(HttpMethod.Post, "/api/oauth/start") { Content = JsonContent.Create(new { provider = "google", limit = 100 }) }; cross.Headers.Add("Origin", "https://attacker.example");
        check((await alice.SendAsync(cross)).StatusCode == HttpStatusCode.Forbidden, "跨站请求不能发起邮箱授权");
        var cancelled = await alice.PostAsJsonAsync("/api/oauth/start", new { provider = "google", limit = 100 });
        var cancelUrl = new Uri((await cancelled.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("url").GetString()!);
        var cancelState = QueryHelpers.ParseQuery(cancelUrl.Query)["state"];
        var exchanges = tokens.Bodies.Count;
        await alice.GetAsync("/oauth/callback/google?state=" + cancelState + "&error=access_denied&error_description=untrusted-provider-text");
        var afterCancel = await alice.GetFromJsonAsync<JsonElement>("/api/session");
        check(afterCancel.GetProperty("state").GetProperty("connected").GetBoolean() && !afterCancel.GetProperty("notice").GetString()!.Contains("untrusted-provider-text") && exchanges == tokens.Bodies.Count, "取消新授权保留原连接且不展示服务商原始错误");
        check((await alice.GetAsync("/privacy.html")).IsSuccessStatusCode, "公开隐私说明可供用户及服务商查看");
        await app.StopAsync();
    }
    private static OAuthClient Config(HttpClient http) => new("https://mailroom.example", name => name.EndsWith("CLIENT_ID") ? "fixture-client" : "fixture-secret", http);
    private static void Reject(Action action) { try { action(); } catch (UserError) { return; } throw new Exception("Expected rejection"); }
    private static async Task RejectAsync(Func<Task> action) { try { await action(); } catch (UserError) { return; } throw new Exception("Expected rejection"); }
}

internal sealed class FixtureHandler : HttpMessageHandler
{
    public readonly List<string> Paths = [], Methods = [], Bodies = [], Hosts = [];
    public bool BadScope, DropWrite, HostilePage, RepeatPage;
    public int Writes;
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        var uri = request.RequestUri!; var body = request.Content == null ? "" : await request.Content.ReadAsStringAsync(ct);
        lock (Paths) { Paths.Add(uri.PathAndQuery); Hosts.Add(uri.Host); Bodies.Add(body); Methods.Add(request.Method.Method); }
        if (uri.Host is "oauth2.googleapis.com" or "login.microsoftonline.com") return Json(new { access_token = "fixture-access-token", refresh_token = body.Contains("grant_type=refresh_token") ? "" : "fixture-refresh", token_type = "Bearer", expires_in = 3600, scope = BadScope ? "openid" : uri.Host == "oauth2.googleapis.com" ? "https://www.googleapis.com/auth/gmail.modify" : "Mail.ReadWrite User.Read" });
        if (request.Headers.Authorization?.Parameter != "fixture-access-token") throw new Exception("Missing bearer token");
        if (request.Method == HttpMethod.Post)
        {
            Writes++; if (DropWrite) throw new IOException("Fixture dropped after a single write");
            if (uri.Host == "gmail.googleapis.com")
            {
                using var payload = JsonDocument.Parse(body);
                if (payload.RootElement.GetProperty("ids")[0].GetString() != "g-1") throw new Exception("Wrong Gmail selection");
                return new(HttpStatusCode.NoContent);
            }
            return Json(new { id = uri.AbsolutePath.Contains("m-1-moved") ? "m-1-restored" : "m-1-moved" });
        }
        if (uri.Host == "gmail.googleapis.com")
        {
            if (uri.AbsolutePath.EndsWith("/profile")) return Json(new { emailAddress = "alice@example.com" });
            if (uri.AbsolutePath.EndsWith("/messages")) return Json(new { messages = new[] { new { id = "g-1" }, new { id = "g-2" } } });
            return Json(new { internalDate = "1794900000000", labelIds = new[] { "INBOX", "UNREAD" }, payload = new { headers = new[] { new { name = "From", value = "Payroll <pay@example.com>" }, new { name = "Subject", value = "Payslip May" } } } });
        }
        if (uri.AbsolutePath.TrimEnd('/') == "/v1.0/me") return Json(new { mail = "alice@example.com" });
        return Json(new Dictionary<string, object> { ["value"] = new[] { new { id = "m-1", from = new { emailAddress = new { name = "Payroll", address = "pay@example.com" } }, subject = "Payslip May", receivedDateTime = "2026-11-17T00:00:00Z", isRead = false }, new { id = "m-2", from = new { emailAddress = new { name = "Friend", address = "friend@example.com" } }, subject = "Hello", receivedDateTime = "2026-11-16T00:00:00Z", isRead = true } }, ["@odata.nextLink"] = HostilePage ? "https://attacker.example/steal" : RepeatPage ? "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$skip=2" : "" });
    }
    private static HttpResponseMessage Json(object value) => new(HttpStatusCode.OK) { Content = JsonContent.Create(value) };
}
