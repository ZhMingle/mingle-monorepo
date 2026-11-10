using MailKit;
using MailKit.Net.Imap;
using MailKit.Search;
using MailKit.Security;
using MimeKit;

namespace Mailroom;

internal sealed class MailService : IMailService
{
    private readonly Func<ConnectionSettings, CancellationToken, Task<ImapClient>> openClient;
    public MailService(Func<ConnectionSettings, CancellationToken, Task<ImapClient>>? openClient = null) => this.openClient = openClient ?? OpenImap;
    private static async Task<ImapClient> OpenImap(ConnectionSettings settings, CancellationToken ct)
    {
        var connection = new ImapClient { Timeout = 45000, CheckCertificateRevocation = true };
        var socket = await NetworkPolicy.Connect(settings.Host, settings.Port, ct);
        try
        {
            await connection.ConnectAsync(socket, settings.Host, settings.Port, settings.Security == "ssl" ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls, ct);
            return connection;
        }
        catch { socket.Dispose(); connection.Dispose(); throw; }
    }
    private readonly SemaphoreSlim gate = new(1, 1);
    private ImapClient? client;
    private IMailFolder? inbox, trash;
    private string email = "", provider = "", unavailable = "请先连接邮箱。";
    private int limit = 500, total;
    private bool writable;
    private List<MailRow> mails = [];
    private readonly Dictionary<string, Location> locations = [];
    private readonly HashSet<string> operations = [];
    private UndoBatch? undo;
    private sealed record Location(IMailFolder Folder, uint Validity, UniqueId Uid);
    private sealed record UndoBatch(string[] Ids, bool Trash);

    private bool Connected => client is { IsConnected: true, IsAuthenticated: true };
    private bool CanTrash => Connected && writable && trash != null && client!.Capabilities.HasFlag(ImapCapabilities.UidPlus);
    private MailState Snapshot() => new(Connected, email, provider, limit, total, CanTrash, trash?.FullName ?? "", CanTrash ? "" : unavailable, mails.ToArray(), CanTrash && undo != null);

    public async Task<MailState> State()
    {
        await gate.WaitAsync();
        try { return Snapshot(); } finally { gate.Release(); }
    }

    public async Task<MailState> Connect(ConnectRequest request, CancellationToken ct)
    {
        var settings = Providers.Validate(request);
        await gate.WaitAsync(ct);
        try
        {
            await ResetConnection(false);
            var next = await openClient(settings, ct);
            try
            {
                // Default certificate and hostname validation is intentionally retained.
                if (next.Capabilities.HasFlag(ImapCapabilities.Id))
                    await next.IdentifyAsync(new ImapImplementation { Name = "Mailroom", Version = "1.0.0", Vendor = "Mailroom Web" }, ct);
                next.AuthenticationMechanisms.Remove("XOAUTH2");
                next.AuthenticationMechanisms.Remove("OAUTHBEARER");
                await next.AuthenticateAsync(settings.Email, settings.Password, ct);
                client = next;
                inbox = next.Inbox;
                email = settings.Email;
                provider = settings.Provider;
                limit = settings.Limit;
                try { await inbox.OpenAsync(FolderAccess.ReadWrite, ct); writable = inbox.Access == FolderAccess.ReadWrite; }
                catch (ImapCommandException) { await inbox.OpenAsync(FolderAccess.ReadOnly, ct); writable = false; }
                trash = await FindTrash(next, ct);
                unavailable = !writable ? "邮箱仅允许读取，无法移动邮件。" : trash == null ? "没有找到邮箱的“已删除”文件夹，本次仅整理和分类。" : !next.Capabilities.HasFlag(ImapCapabilities.UidPlus) ? "邮箱不支持可追踪的邮件移动，本次仅整理和分类。" : "";
                return await RefreshCore(settings.Limit, ct);
            }
            catch
            {
                if (client != next) next.Dispose();
                await ResetConnection(false);
                throw;
            }
        }
        finally { gate.Release(); }
    }

    private static async Task<IMailFolder?> FindTrash(ImapClient connection, CancellationToken ct)
    {
        if (connection.Capabilities.HasFlag(ImapCapabilities.SpecialUse) || connection.Capabilities.HasFlag(ImapCapabilities.XList))
        {
            var special = connection.GetFolder(SpecialFolder.Trash);
            if (special != null) return special;
        }
        // Never confuse the spam folder with the deleted-items folder, or create folders.
        var names = new HashSet<string>(["Trash", "Deleted Messages", "Deleted Items", "Deleted", "已删除", "已删除邮件", "垃圾箱"], StringComparer.OrdinalIgnoreCase);
        foreach (var space in connection.PersonalNamespaces)
        {
            var folders = await connection.GetFoldersAsync(space, StatusItems.None, false, ct);
            var match = folders.FirstOrDefault(f => !f.Attributes.HasFlag(FolderAttributes.NoSelect) && !f.Attributes.HasFlag(FolderAttributes.Junk) && (f.Attributes.HasFlag(FolderAttributes.Trash) || names.Contains(f.Name)));
            if (match != null) return match;
        }
        return null;
    }

    public async Task<MailState> Refresh(int nextLimit, CancellationToken ct)
    {
        Providers.ValidLimit(nextLimit);
        await gate.WaitAsync(ct);
        try { RequireConnection(); return await RefreshCore(nextLimit, ct); }
        finally { gate.Release(); }
    }

    private async Task<MailState> RefreshCore(int nextLimit, CancellationToken ct)
    {
        var folder = inbox!;
        if (!folder.IsOpen) await folder.OpenAsync(writable ? FolderAccess.ReadWrite : FolderAccess.ReadOnly, ct);
        await client!.NoOpAsync(ct);
        var count = folder.Count;
        var start = Math.Max(0, count - nextLimit);
        IList<IMessageSummary> summaries = [];
        if (count > 0)
            summaries = await folder.FetchAsync(start, count - 1, MessageSummaryItems.UniqueId | MessageSummaryItems.Envelope | MessageSummaryItems.Flags | MessageSummaryItems.InternalDate, new[] { "List-Unsubscribe" }, ct);
        // Ignore unsolicited FETCH summaries outside the requested range.
        var requested = summaries.Where(m => m.Index >= start && m.Index < count && m.UniqueId.IsValid && m.Envelope != null && !(m.Flags ?? MessageFlags.None).HasFlag(MessageFlags.Deleted)).DistinctBy(m => m.UniqueId).Take(nextLimit);
        var previous = locations.Where(p => p.Value.Folder.FullName == folder.FullName && p.Value.Validity == folder.UidValidity).ToDictionary(p => p.Value.Uid, p => p.Key);
        var rows = new List<MailRow>();
        var nextLocations = new Dictionary<string, Location>();
        foreach (var summary in requested)
        {
            var id = previous.GetValueOrDefault(summary.UniqueId) ?? Guid.NewGuid().ToString("N");
            var sender = summary.Envelope!.From.Mailboxes.FirstOrDefault();
            var from = sender?.Name;
            if (string.IsNullOrWhiteSpace(from)) from = sender?.Address ?? "（未知发件人）";
            var address = sender?.Address ?? "";
            var subject = summary.Envelope.Subject ?? "（无主题）";
            var category = mails.FirstOrDefault(m => m.Id == id)?.Cat ?? Classifier.Classify(subject, from + " " + address, summary.Headers?.Contains("List-Unsubscribe") == true);
            rows.Add(new(id, from, address, subject, "", (summary.InternalDate ?? summary.Envelope.Date ?? DateTimeOffset.UtcNow).ToUnixTimeMilliseconds(), !(summary.Flags ?? MessageFlags.None).HasFlag(MessageFlags.Seen), false, category));
            nextLocations[id] = new(folder, folder.UidValidity, summary.UniqueId);
        }
        // Only this session's deleted items appear in the local trash view.
        foreach (var row in mails.Where(m => m.Trash))
            if (locations.TryGetValue(row.Id, out var location)) { rows.Add(row); nextLocations[row.Id] = location; }
        mails = rows;
        locations.Clear();
        foreach (var item in nextLocations) locations.Add(item.Key, item.Value);
        limit = nextLimit;
        total = count;
        if (undo != null && undo.Ids.Any(id => !locations.ContainsKey(id))) undo = null;
        return Snapshot();
    }

    public async Task<MailState> Move(MoveRequest request, CancellationToken ct)
    {
        await gate.WaitAsync(ct);
        try
        {
            RequireConnection();
            RegisterOperation(request.OperationId);
            ValidateIds(request.Ids, request.Trash);
            await MoveCore(request.Ids, request.Trash, ct);
            undo = new(request.Ids, request.Trash);
            return Snapshot();
        }
        finally { gate.Release(); }
    }

    private void RegisterOperation(string id)
    {
        if (!Guid.TryParse(id, out _)) throw new UserError("操作标识无效，请重新选择邮件。");
        if (operations.Contains(id)) throw new UserError("此操作已提交，请查看当前结果；不会重复执行。");
        if (operations.Count >= 10000) throw new UserError("本次会话操作较多，请重新连接邮箱后继续。");
        operations.Add(id);
    }

    private void ValidateIds(string[]? ids, bool toTrash)
    {
        if (!CanTrash) throw new UserError(unavailable.Length > 0 ? unavailable : "请重新连接邮箱后再操作。");
        if (ids == null || ids.Length is < 1 or > 1000 || ids.Distinct().Count() != ids.Length) throw new UserError("请选择 1–1000 封不同的邮件。");
        foreach (var id in ids)
            if (!locations.ContainsKey(id) || !mails.Any(m => m.Id == id && m.Trash != toTrash)) throw new UserError("选择的邮件已发生变化，请刷新后重新选择。");
    }

    private async Task MoveCore(string[] ids, bool toTrash, CancellationToken ct)
    {
        var source = toTrash ? inbox! : trash!;
        var destination = toTrash ? trash! : inbox!;
        foreach (var id in ids)
            if (locations[id].Folder.FullName != source.FullName) throw new UserError("邮件所在文件夹已变化，请重新整理。");
        // Select destination first so its UIDVALIDITY is known before any mutation.
        await destination.OpenAsync(FolderAccess.ReadOnly, ct);
        var destinationValidity = destination.UidValidity;
        await source.OpenAsync(FolderAccess.ReadWrite, ct);
        if (ids.Any(id => locations[id].Validity != source.UidValidity)) throw new UserError("邮箱文件夹已重建，请重新连接后再操作。");
        var uids = ids.Select(id => locations[id].Uid).ToList();
        var existing = await source.SearchAsync(SearchQuery.Uids(uids).And(SearchQuery.NotDeleted), ct);
        if (existing.Count != uids.Count || !existing.ToHashSet().SetEquals(uids)) throw new UserError("部分邮件已被其他客户端移动或删除，请重新整理。");
        try
        {
            // UIDPLUS ensures fallback moves use targeted UID EXPUNGE, never EXPUNGE-all.
            // No write is retried after an error or an uncertain network outcome.
            var mapping = await source.MoveToAsync(uids, destination, ct);
            if (uids.Any(uid => !mapping.ContainsKey(uid))) throw new IOException("The server did not return complete destination identifiers.");
            foreach (var id in ids)
            {
                locations[id] = new(destination, destinationValidity, mapping[locations[id].Uid]);
                var index = mails.FindIndex(m => m.Id == id);
                mails[index] = mails[index] with { Trash = toTrash };
            }
            total = Math.Max(0, total + (toTrash ? -ids.Length : ids.Length));
        }
        catch
        {
            // Close without LOGOUT/CLOSE/EXPUNGE. Preserve stale rows for review.
            await DropConnectionPreservingRows();
            throw new UserError("移动结果未确认，连接已停止以避免重复操作。请先在原邮箱核对，再重新连接；不会自动重试。");
        }
    }

    public async Task<MailState> Undo(UndoRequest request, CancellationToken ct)
    {
        await gate.WaitAsync(ct);
        try
        {
            RequireConnection();
            RegisterOperation(request.OperationId);
            var previous = undo ?? throw new UserError("当前没有可以撤销的操作。");
            ValidateIds(previous.Ids, !previous.Trash);
            await MoveCore(previous.Ids, !previous.Trash, ct);
            undo = null;
            return Snapshot();
        }
        finally { gate.Release(); }
    }

    public async Task<MailState> Classify(ClassifyRequest request, CancellationToken ct)
    {
        await gate.WaitAsync(ct);
        try
        {
            RequireConnection();
            if (!Classifier.Categories.Contains(request.Category)) throw new UserError("分类不存在。");
            var index = mails.FindIndex(m => m.Id == request.Id);
            if (index < 0) throw new UserError("邮件已不在当前列表，请重新整理。");
            mails[index] = mails[index] with { Cat = request.Category };
            return Snapshot();
        }
        finally { gate.Release(); }
    }

    public async Task<MailState> Disconnect(CancellationToken ct)
    {
        await gate.WaitAsync(ct);
        try { await ResetConnection(true); return Snapshot(); }
        finally { gate.Release(); }
    }

    private void RequireConnection()
    {
        if (!Connected) throw new UserError("邮箱连接已断开，请重新连接后继续。");
    }

    private async Task DropConnectionPreservingRows()
    {
        if (client != null) { try { await client.DisconnectAsync(false); } catch { } client.Dispose(); }
        client = null; inbox = null; trash = null; writable = false; undo = null;
        locations.Clear();
        unavailable = "上次移动结果未确认，请核对原邮箱并重新连接。";
    }

    private async Task ResetConnection(bool logout)
    {
        if (client != null)
        {
            // Logging out does not expunge deleted messages; no folder is closed with expunge.
            try { await client.DisconnectAsync(logout, new CancellationTokenSource(TimeSpan.FromSeconds(3)).Token); } catch { }
            client.Dispose();
        }
        client = null; inbox = null; trash = null; writable = false;
        email = ""; provider = ""; total = 0; mails.Clear(); locations.Clear(); operations.Clear(); undo = null;
        unavailable = "请先连接邮箱。";
    }

    public async ValueTask DisposeAsync()
    {
        await gate.WaitAsync();
        try { await ResetConnection(false); } finally { gate.Release(); }
    }
}
