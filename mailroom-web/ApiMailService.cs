using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using MimeKit;

namespace Mailroom;

// Gmail API and Microsoft Graph only. No provider URL comes from the browser.
internal sealed class ApiMailService(OAuthClient oauth, HttpClient? http = null) : IMailService
{
    private readonly HttpClient http = http ?? new(new HttpClientHandler { AllowAutoRedirect = false }) { Timeout = TimeSpan.FromSeconds(30) };
    private readonly SemaphoreSlim gate = new(1, 1);
    private OAuthGrant? grant;
    private string email = "", provider = "";
    private int limit = 500, total;
    private List<MailRow> mails = [];
    private readonly Dictionary<string, string> remoteIds = [];
    private readonly HashSet<string> operations = [];
    private (string[] Ids, bool Trash)? undo;
    private MailState Snapshot() => new(grant != null, email, provider, limit, total, grant != null, provider == "google" ? "Gmail 垃圾箱" : "已删除邮件", grant == null ? "请重新连接邮箱。" : "", mails.ToArray(), grant != null && undo != null);
    private async Task<MailState> Locked(Func<Task<MailState>> action, CancellationToken ct = default)
    { await gate.WaitAsync(ct); try { return await action(); } finally { gate.Release(); } }
    public Task<MailState> State() => Locked(() => Task.FromResult(Snapshot()));
    public Task<MailState> Connect(ConnectRequest request, CancellationToken ct) => throw new UserError("请选择官方登录连接这个邮箱。");
    public Task<MailState> ConnectOAuth(OAuthGrant value, int count, CancellationToken ct) => Locked(async () =>
    {
        if (value.Provider.Id is not ("google" or "microsoft")) throw new UserError("不支持此邮箱的官方登录。");
        Reset();
        grant = value; provider = value.Provider.Id; limit = Providers.ValidLimit(count);
        try
        {
            using var profile = await Send(HttpMethod.Get, provider == "google" ? "profile" : "?$select=mail,userPrincipalName", null, ct);
            email = OAuthClient.Text(profile.RootElement, provider == "google" ? "emailAddress" : "mail");
            if (email.Length == 0 && provider == "microsoft") email = OAuthClient.Text(profile.RootElement, "userPrincipalName");
            if (email.Length > 254 || !System.Net.Mail.MailAddress.TryCreate(email, out _)) throw new UserError("未能确认已授权的邮箱地址，请重新登录。");
            return await RefreshCore(limit, ct);
        }
        catch { Reset(); throw; }
    }, ct);
    public Task<MailState> Refresh(int count, CancellationToken ct) => Locked(() => RefreshCore(Providers.ValidLimit(count), ct), ct);
    private async Task<MailState> RefreshCore(int count, CancellationToken ct)
    {
        await EnsureToken(ct);
        var rows = new List<MailRow>(); var ids = new Dictionary<string, string>();
        var categories = mails.ToDictionary(m => remoteIds[m.Id], m => m.Cat);
        if (provider == "google")
        {
            string page = "";
            var pages = new HashSet<string>();
            do
            {
                if (!pages.Add(page)) throw new UserError("邮箱返回了重复分页，请重新整理。");
                using var listing = await Send(HttpMethod.Get, "messages?labelIds=INBOX&maxResults=" + Math.Min(100, count - rows.Count) + (page.Length > 0 ? "&pageToken=" + Uri.EscapeDataString(page) : ""), null, ct);
                if (!listing.RootElement.TryGetProperty("messages", out var messages)) break;
                var batch = messages.EnumerateArray().Select(m => OAuthClient.Text(m, "id")).Where(id => id.Length > 0).Take(count - rows.Count).ToArray();
                foreach (var chunk in batch.Chunk(8))
                {
                    var loaded = await Task.WhenAll(chunk.Select(async id =>
                    {
                        using var message = await Send(HttpMethod.Get, "messages/" + Uri.EscapeDataString(id) + "?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=List-Unsubscribe", null, ct);
                        var root = message.RootElement;
                        var headers = root.GetProperty("payload").GetProperty("headers").EnumerateArray().GroupBy(h => OAuthClient.Text(h, "name"), StringComparer.OrdinalIgnoreCase).ToDictionary(g => g.Key, g => OAuthClient.Text(g.First(), "value"), StringComparer.OrdinalIgnoreCase);
                        var from = headers.GetValueOrDefault("From", ""); MailboxAddress.TryParse(from, out var address);
                        var labels = root.GetProperty("labelIds").EnumerateArray().Select(v => v.GetString()).ToArray();
                        var subject = headers.GetValueOrDefault("Subject", ""); long.TryParse(OAuthClient.Text(root, "internalDate"), out var date);
                        return (id, row: new MailRow(Guid.NewGuid().ToString("N"), address?.Name ?? from, address?.Address ?? "", subject, "", date, labels.Contains("UNREAD"), false, categories.GetValueOrDefault(id) ?? Classifier.Classify(subject, from, headers.ContainsKey("List-Unsubscribe"))));
                    }));
                    foreach (var item in loaded) { if (ids.ContainsValue(item.id)) throw new UserError("邮件在读取期间发生变化，请重新整理。"); rows.Add(item.row); ids[item.row.Id] = item.id; }
                }
                page = OAuthClient.Text(listing.RootElement, "nextPageToken");
                if (batch.Length == 0) break;
            } while (page.Length > 0 && rows.Count < count);
        }
        else
        {
            var next = "mailFolders/inbox/messages?$top=" + Math.Min(100, count) + "&$select=id,from,subject,receivedDateTime,isRead&$orderby=receivedDateTime%20desc";
            var pages = new HashSet<string>();
            do
            {
                if (!pages.Add(next)) throw new UserError("邮箱返回了重复分页，请重新整理。");
                using var listing = await Send(HttpMethod.Get, next, null, ct);
                foreach (var item in listing.RootElement.GetProperty("value").EnumerateArray().Take(count - rows.Count))
                {
                    var id = OAuthClient.Text(item, "id"); if (id.Length == 0) throw new UserError("邮箱返回了不完整的邮件信息，请重试整理。");
                    if (ids.ContainsValue(id)) throw new UserError("邮件在读取期间发生变化，请重新整理。");
                    var from = item.TryGetProperty("from", out var sender) && sender.TryGetProperty("emailAddress", out var address) ? address : default;
                    var name = from.ValueKind == JsonValueKind.Object ? OAuthClient.Text(from, "name") : "";
                    var addressText = from.ValueKind == JsonValueKind.Object ? OAuthClient.Text(from, "address") : "";
                    var subject = OAuthClient.Text(item, "subject"); DateTimeOffset.TryParse(OAuthClient.Text(item, "receivedDateTime"), out var date);
                    var row = new MailRow(Guid.NewGuid().ToString("N"), name, addressText, subject, "", date == default ? 0 : date.ToUnixTimeMilliseconds(), !item.GetProperty("isRead").GetBoolean(), false, categories.GetValueOrDefault(id) ?? Classifier.Classify(subject, name + " " + addressText, false));
                    rows.Add(row); ids[row.Id] = id;
                }
                next = OAuthClient.Text(listing.RootElement, "@odata.nextLink");
                if (next.Length > 0 && (!Uri.TryCreate(next, UriKind.Absolute, out var uri) || uri.Scheme != "https" || uri.Host != "graph.microsoft.com" || !uri.IsDefaultPort || uri.UserInfo != "" || uri.Fragment != "" || !new[] { "/v1.0/me/mailFolders/inbox/messages", "/v1.0/me/mailFolders('inbox')/messages" }.Contains(uri.AbsolutePath, StringComparer.OrdinalIgnoreCase))) throw new UserError("邮箱分页地址无效，已停止读取。");
            } while (next.Length > 0 && rows.Count < count);
        }
        // Preserve this session's trash records. Refresh never writes to a mailbox.
        foreach (var row in mails.Where(m => m.Trash)) { rows.Add(row); ids[row.Id] = remoteIds[row.Id]; }
        limit = count; total = rows.Count(m => !m.Trash); mails = rows; remoteIds.Clear(); foreach (var pair in ids) remoteIds[pair.Key] = pair.Value;
        return Snapshot();
    }
    public Task<MailState> Move(MoveRequest request, CancellationToken ct) => Locked(async () =>
    {
        ValidateOperation(request.OperationId); ValidateIds(request.Ids, request.Trash);
        await MoveCore(request.Ids, request.Trash, ct); undo = (request.Ids.ToArray(), request.Trash); return Snapshot();
    }, ct);
    public Task<MailState> Undo(UndoRequest request, CancellationToken ct) => Locked(async () =>
    {
        ValidateOperation(request.OperationId); var previous = undo ?? throw new UserError("没有可撤销的操作。");
        ValidateIds(previous.Ids, !previous.Trash); await MoveCore(previous.Ids, !previous.Trash, ct); undo = null; return Snapshot();
    }, ct);
    private void ValidateOperation(string id)
    {
        if (grant == null || !Guid.TryParse(id, out _) || !operations.Add(id)) throw new UserError("连接已失效或操作已经提交，请先核对邮件状态。");
    }
    private void ValidateIds(string[] ids, bool trash)
    {
        if (ids == null || ids.Length is < 1 or > 1000 || ids.Distinct().Count() != ids.Length || ids.Any(id => id == null || !remoteIds.ContainsKey(id) || !mails.Any(m => m.Id == id && m.Trash != trash))) throw new UserError("选择的邮件已发生变化，请重新整理后再操作。");
    }
    private async Task MoveCore(string[] ids, bool trash, CancellationToken ct)
    {
        await EnsureToken(ct); // Refresh authorization before any write; never retry a write.
        try
        {
            if (provider == "google")
            {
                using var result = await Send(HttpMethod.Post, "messages/batchModify", new { ids = ids.Select(id => remoteIds[id]).ToArray(), addLabelIds = trash ? new[] { "TRASH" } : new[] { "INBOX" }, removeLabelIds = trash ? new[] { "INBOX" } : new[] { "TRASH" } }, ct);
            }
            else foreach (var id in ids)
            {
                using var result = await Send(HttpMethod.Post, "messages/" + Uri.EscapeDataString(remoteIds[id]) + "/move", new { destinationId = trash ? "deleteditems" : "inbox" }, ct);
                var replacement = OAuthClient.Text(result.RootElement, "id"); if (replacement.Length == 0) throw new IOException("Missing moved message identity");
                remoteIds[id] = replacement;
            }
            mails = mails.Select(m => ids.Contains(m.Id) ? m with { Trash = trash } : m).ToList(); total = mails.Count(m => !m.Trash);
        }
        catch
        {
            grant = null; undo = null;
            throw new UserError("移动结果未确认，已停止连接且不会自动重试。请先在原邮箱核对，再重新连接。");
        }
    }
    public Task<MailState> Classify(ClassifyRequest request, CancellationToken ct) => Locked(() =>
    {
        if (grant == null || !Classifier.Categories.Contains(request.Category) || !remoteIds.ContainsKey(request.Id)) throw new UserError("邮件或分类已失效，请重新整理。");
        mails = mails.Select(m => m.Id == request.Id ? m with { Cat = request.Category } : m).ToList(); return Task.FromResult(Snapshot());
    }, ct);
    public Task<MailState> Disconnect(CancellationToken ct) => Locked(() => { Reset(); return Task.FromResult(Snapshot()); }, ct);
    private void Reset() { grant = null; email = ""; provider = ""; mails.Clear(); remoteIds.Clear(); operations.Clear(); undo = null; total = 0; }
    public async ValueTask DisposeAsync() { await gate.WaitAsync(); try { Reset(); http.Dispose(); } finally { gate.Release(); } }
    private async Task EnsureToken(CancellationToken ct)
    {
        if (grant == null) throw new UserError("邮箱连接已过期，请重新点击官方登录。");
        if (grant.Expires <= DateTimeOffset.UtcNow.AddSeconds(60))
        {
            try { grant = await oauth.Refresh(grant, ct); }
            catch { grant = null; undo = null; throw; }
        }
    }
    private async Task<JsonDocument> Send(HttpMethod method, string path, object? body, CancellationToken ct)
    {
        // The service gate serializes token refresh; concurrent metadata reads use
        // the same already-checked token, never independently refresh it.
        if (grant == null) throw new UserError("请重新连接邮箱。");
        var root = provider == "google" ? "https://gmail.googleapis.com/gmail/v1/users/me/" : "https://graph.microsoft.com/v1.0/me/";
        using var request = new HttpRequestMessage(method, new Uri(new Uri(root), path));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", grant.AccessToken);
        if (body != null) request.Content = JsonContent.Create(body);
        using var response = await http.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode) throw new UserError(response.StatusCode is System.Net.HttpStatusCode.Unauthorized or System.Net.HttpStatusCode.Forbidden ? "邮箱授权已过期或权限不足，请重新点击官方登录。" : "邮箱服务暂时没有完成请求，请稍后重新整理。");
        var text = await response.Content.ReadAsStringAsync(ct); return JsonDocument.Parse(string.IsNullOrWhiteSpace(text) ? "{}" : text);
    }
}
