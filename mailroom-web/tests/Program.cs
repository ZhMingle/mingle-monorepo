using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Mailroom;

var passed = new List<string>();
void Check(bool condition, string name) { if (!condition) throw new Exception(name); passed.Add(name); }
void Throws(Action action, string name) { try { action(); } catch (UserError) { passed.Add(name); return; } throw new Exception(name); }

Check(Classifier.Classify("Payslip for Mingle Zhang for May 2026", "noreply@post.xero.com", true) == "bill", "工资单优先归入账单凭证");
Check(Classifier.Classify("May pay-slip", "Payroll", false) == "bill", "英文工资单变体");
Check(Classifier.Classify("五月工资条", "财务", false) == "bill", "中文工资条");
Check(Classifier.Classify("Weekly payroll newsletter", "Xero", false) == "sub", "工资软件资讯保留订阅分类");
Check(Classifier.Classify("Security alert", "Xero", false) == "notice", "普通Xero安全通知");
Check(Classifier.Classify("Re: meeting tomorrow", "friend", false) == "personal", "普通往来邮件");
Throws(() => Providers.Validate(new("qq", "invalid", "code")), "拒绝无效邮箱");
Throws(() => Providers.Validate(new("qq", "a@qq.com", "")), "拒绝空授权码");
Throws(() => Providers.Validate(new("custom", "a@example.com", "code", "https://imap.example.com", 993)), "拒绝服务器URL路径");
Throws(() => Providers.Validate(new("custom", "a@example.com", "code", "imap.example.com", 993, "none")), "禁止明文连接");
Check(Providers.Validate(new("qq", "a@qq.com", "code", "evil.example.com", 1)).Host == "imap.qq.com", "预设邮箱不能覆盖服务器");
foreach (var ip in new[] { "127.0.0.1", "10.0.0.1", "172.16.2.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1", "2001:db8::1" })
    Check(!NetworkPolicy.IsPublic(IPAddress.Parse(ip)), "阻止私有或保留网络 " + ip);
Check(NetworkPolicy.IsPublic(IPAddress.Parse("8.8.8.8")), "允许公共IPv4");
Check(NetworkPolicy.IsPublic(IPAddress.Parse("2606:4700:4700::1111")), "允许公共IPv6");

var time = new Clock();
var fakes = new List<FakeMail>();
await using (var pool = new SessionStore(time, () => { var f = new FakeMail(); fakes.Add(f); return f; }, 2))
{
    string firstId;
    using (var first = pool.Acquire(null, true)!) { firstId = first.Entry.Id; Check(first.Entry.Token.Length == 64, "会话令牌为256位随机值"); }
    using (var first = pool.Acquire(firstId, false)!) Check(first.Entry.Id == firstId, "刷新保留本人会话");
    Check(pool.Acquire("fabricated", false) == null, "拒绝伪造会话");
    using (var second = pool.Acquire(null, true)!) Check(second.Entry.Id != firstId, "访客会话隔离");
    Throws(() => pool.Acquire(null, true), "限制并发会话数量");
    time.Now += TimeSpan.FromMinutes(21);
    Check(pool.Acquire(firstId, false) == null, "闲置会话失效");
    await pool.Cleanup();
    Check(fakes.All(f => f.Disposed), "过期连接被释放");
    using var next = pool.Acquire(null, true)!;
    Check(next.Entry.Id != firstId, "清理后可建立新会话");
}

await using var store = new SessionStore(factory: () => new FakeMail());
await using var app = Mailroom.WebHost.Build(store, true, "http://127.0.0.1:0");
await app.StartAsync();
var baseUrl = app.Urls.Single();
using var alice = new HttpClient(new HttpClientHandler { CookieContainer = new() }) { BaseAddress = new(baseUrl) };
using var bob = new HttpClient(new HttpClientHandler { CookieContainer = new() }) { BaseAddress = new(baseUrl) };
using var anonymous = new HttpClient { BaseAddress = new(baseUrl) };
Check((await anonymous.GetAsync("/api/state")).StatusCode == HttpStatusCode.Unauthorized, "匿名请求不能读取邮箱");
var page = await alice.GetAsync("/");
var html = await page.Content.ReadAsStringAsync();
Check(page.IsSuccessStatusCode && html.Contains("给收件箱") && !html.Contains("托盘"), "服务实际提供网页资源");
Check(page.Headers.Contains("Content-Security-Policy") && page.Headers.GetValues("X-Frame-Options").Single() == "DENY", "网页限制外部脚本和嵌入");
Check((await alice.GetAsync("/.env")).StatusCode == HttpStatusCode.NotFound, "禁止读取配置文件");
var bootstrap = await alice.GetAsync("/api/session");
Check(bootstrap.Headers.GetValues("Set-Cookie").Single().Contains("httponly", StringComparison.OrdinalIgnoreCase), "会话cookie不可由脚本读取");
var a = JsonDocument.Parse(await bootstrap.Content.ReadAsStringAsync());
var aToken = a.RootElement.GetProperty("token").GetString()!;
alice.DefaultRequestHeaders.Authorization = new("Bearer", aToken);
var b = await bob.GetFromJsonAsync<JsonElement>("/api/session");
var bToken = b.GetProperty("token").GetString()!;
bob.DefaultRequestHeaders.Authorization = new("Bearer", bToken);
Check(aToken != bToken, "不同访客的防伪令牌不同");
var connect = await alice.PostAsJsonAsync("/api/connect", new { provider = "qq", email = "alice@example.com", password = "test-not-a-real-credential", limit = 100 });
Check(connect.IsSuccessStatusCode, "本人可连接自己的邮箱（协议替身）");
var connected = await connect.Content.ReadFromJsonAsync<JsonElement>();
Check(connected.GetProperty("email").GetString() == "alice@example.com", "连接结果属于当前访客");
var bobState = await bob.GetFromJsonAsync<JsonElement>("/api/state");
Check(!bobState.GetProperty("connected").GetBoolean() && bobState.GetProperty("mails").GetArrayLength() == 0, "其他访客不能看到已连接邮箱");
bob.DefaultRequestHeaders.Authorization = new("Bearer", aToken);
Check((await bob.GetAsync("/api/state")).StatusCode == HttpStatusCode.Unauthorized, "另一访客的token不能与当前cookie混用");
bob.DefaultRequestHeaders.Authorization = new("Bearer", bToken);
using (var cross = new HttpRequestMessage(HttpMethod.Post, "/api/disconnect") { Content = JsonContent.Create(new { }) })
{
    cross.Headers.Add("Origin", "https://attacker.example");
    Check((await alice.SendAsync(cross)).StatusCode == HttpStatusCode.Forbidden, "阻止跨站操作");
}
using (var textRequest = new HttpRequestMessage(HttpMethod.Post, "/api/disconnect") { Content = new StringContent("{}", Encoding.UTF8, "text/plain") })
    Check((await alice.SendAsync(textRequest)).StatusCode == HttpStatusCode.UnsupportedMediaType, "写操作要求JSON");
var operationId = Guid.NewGuid().ToString();
var request = new { ids = new[] { "message-1" }, trash = true, operationId };
Check((await alice.PostAsJsonAsync("/api/move", request)).IsSuccessStatusCode, "显式移动请求只执行一次");
Check((await alice.PostAsJsonAsync("/api/move", request)).StatusCode == HttpStatusCode.BadRequest, "重复提交不重复执行");
Check((await bob.PostAsJsonAsync("/api/move", new { ids = new[] { "message-1" }, trash = true, operationId = Guid.NewGuid().ToString() })).StatusCode == HttpStatusCode.BadRequest, "访客不能移动其他人的邮件");
Check((await alice.PostAsJsonAsync("/api/undo", new { operationId = Guid.NewGuid().ToString() })).IsSuccessStatusCode, "本人可撤销上次操作（协议替身）");
Check((await alice.PostAsJsonAsync("/api/disconnect", new { })).IsSuccessStatusCode, "主动断开清除邮箱信息");
var after = await alice.GetFromJsonAsync<JsonElement>("/api/state");
Check(after.GetProperty("email").GetString() == "" && after.GetProperty("mails").GetArrayLength() == 0, "断开后数据为空");
await app.StopAsync();
foreach (var supportsMove in new[] { true, false })
{
    await using var fixture = new ImapFixture(supportsMove);
    await using var service = new MailService(fixture.Open);
    using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(15));
    var loaded = await service.Connect(new("custom", "alice@example.com", "fixture-only", "imap.example.com", 993, Limit: 100), timeout.Token);
    Check(loaded.Mails.Count == 2 && loaded.Mails.Any(m => m.Cat == "bill" && m.Subject.Contains("Payslip")), "真实MailKit读取并分类元数据 " + supportsMove);
    Check(loaded.CanTrash, "识别已删除文件夹及UIDPLUS " + supportsMove);
    var id = loaded.Mails.First(m => m.Cat == "bill").Id;
    var operation = Guid.NewGuid().ToString();
    var moved = await service.Move(new([id], true, operation), timeout.Token);
    Check(moved.Mails.Single(m => m.Id == id).Trash && moved.CanUndo, "真实移动保存目标UID " + supportsMove);
    try { await service.Move(new([id], true, operation), timeout.Token); throw new Exception("duplicate accepted"); } catch (UserError) { passed.Add("生产服务拒绝重复写入 " + supportsMove); }
    var restored = await service.Undo(new(Guid.NewGuid().ToString()), timeout.Token);
    Check(!restored.Mails.Single(m => m.Id == id).Trash && !restored.CanUndo, "真实撤销使用映射后的UID " + supportsMove);
    var ids = restored.Mails.Select(m => m.Id).ToArray();
    var batch = await service.Move(new(ids, true, Guid.NewGuid().ToString()), timeout.Token);
    Check(batch.Mails.All(m => m.Trash), "批量移动全部选中邮件 " + supportsMove);
    var batchUndo = await service.Undo(new(Guid.NewGuid().ToString()), timeout.Token);
    Check(batchUndo.Mails.All(m => !m.Trash), "批量撤销保持每封邮件的UID映射 " + supportsMove);
    Check(!fixture.Commands.Any(c => RegexCommand(c, "EXPUNGE")), "未发送整文件夹EXPUNGE " + supportsMove);
    if (!supportsMove) Check(fixture.Commands.Any(c => c.Contains("UID EXPUNGE")), "非MOVE邮箱只定向清理选中UID");
}
await using (var fixture = new ImapFixture(dropMove: true))
await using (var service = new MailService(fixture.Open))
{
    var loaded = await service.Connect(new("custom", "alice@example.com", "fixture-only", "imap.example.com", 993, Limit: 100), CancellationToken.None);
    try { await service.Move(new([loaded.Mails[0].Id], true, Guid.NewGuid().ToString()), CancellationToken.None); throw new Exception("disconnect accepted"); }
    catch (UserError e) { Check(e.Message.Contains("不会自动重试"), "移动中断明确告知结果不确定"); }
    Check(!(await service.State()).Connected && fixture.Commands.Count(c => c.Contains("UID MOVE")) == 1, "移动中断停止连接并且只提交一次");
}
await using (var fixture = new ImapFixture(supportsUidPlus: false))
await using (var service = new MailService(fixture.Open))
{
    var loaded = await service.Connect(new("custom", "alice@example.com", "fixture-only", "imap.example.com", 993, Limit: 100), CancellationToken.None);
    Check(!loaded.CanTrash, "不支持可追踪移动时只读整理");
    try { await service.Move(new([loaded.Mails[0].Id], true, Guid.NewGuid().ToString()), CancellationToken.None); throw new Exception("unsafe move accepted"); } catch (UserError) { passed.Add("阻止不安全的整箱移动回退"); }
}
Console.WriteLine($"PASS: {passed.Count} checks");
foreach (var name in passed) Console.WriteLine("  " + name);
static bool RegexCommand(string line, string command) => line[(line.IndexOf(' ') + 1)..].StartsWith(command, StringComparison.Ordinal);

sealed class Clock : TimeProvider { public DateTimeOffset Now = DateTimeOffset.UtcNow; public override DateTimeOffset GetUtcNow() => Now; }
sealed class FakeMail : IMailService
{
    private MailState state = new(false, "", "", 500, 0, false, "", "", [], false);
    private readonly HashSet<string> operations = [];
    public bool Disposed;
    public Task<MailState> State() => Task.FromResult(state);
    public Task<MailState> Connect(ConnectRequest r, CancellationToken ct) => Task.FromResult(state = new(true, r.Email, r.Provider, r.Limit, 1, true, "Trash", "", [new("message-1", "Payroll", "pay@example.com", "Payslip May", "", 1, true, false, "bill")], false));
    public Task<MailState> Refresh(int limit, CancellationToken ct) => Task.FromResult(state with { Limit = limit });
    public Task<MailState> Disconnect(CancellationToken ct) => Task.FromResult(state = state with { Connected = false, Email = "", Mails = [], CanTrash = false, CanUndo = false });
    public Task<MailState> Move(MoveRequest r, CancellationToken ct)
    {
        if (!state.Connected || !operations.Add(r.OperationId)) throw new UserError("invalid operation");
        return Task.FromResult(state = state with { Mails = state.Mails.Select(m => m with { Trash = r.Trash }).ToArray(), CanUndo = true });
    }
    public Task<MailState> Undo(UndoRequest r, CancellationToken ct) => Task.FromResult(state = state with { Mails = state.Mails.Select(m => m with { Trash = false }).ToArray(), CanUndo = false });
    public Task<MailState> Classify(ClassifyRequest r, CancellationToken ct) => State();
    public ValueTask DisposeAsync() { Disposed = true; return ValueTask.CompletedTask; }
}
