namespace Mailroom;

// One visitor owns one adapter. Switching providers cannot mix mail or undo state.
internal sealed class MailboxService(OAuthClient oauth, Func<IMailService>? imap = null, Func<IMailService>? api = null) : IMailService
{
    private readonly SemaphoreSlim gate = new(1, 1);
    private IMailService current = (imap ?? (() => new MailService()))();
    private async Task<MailState> Use(Func<IMailService, Task<MailState>> action)
    {
        await gate.WaitAsync(); try { return await action(current); } finally { gate.Release(); }
    }
    public Task<MailState> State() => Use(s => s.State());
    public Task<MailState> Refresh(int limit, CancellationToken ct) => Use(s => s.Refresh(limit, ct));
    public Task<MailState> Disconnect(CancellationToken ct) => Use(s => s.Disconnect(ct));
    public Task<MailState> Move(MoveRequest request, CancellationToken ct) => Use(s => s.Move(request, ct));
    public Task<MailState> Undo(UndoRequest request, CancellationToken ct) => Use(s => s.Undo(request, ct));
    public Task<MailState> Classify(ClassifyRequest request, CancellationToken ct) => Use(s => s.Classify(request, ct));
    public Task<MailState> Connect(ConnectRequest request, CancellationToken ct) => Switch((imap ?? (() => new MailService()))(), s => s.Connect(request, ct));
    public Task<MailState> ConnectOAuth(OAuthGrant grant, int limit, CancellationToken ct) => Switch((api ?? (() => new ApiMailService(oauth)))(), s => s.ConnectOAuth(grant, limit, ct));
    private async Task<MailState> Switch(IMailService next, Func<IMailService, Task<MailState>> connect)
    {
        await gate.WaitAsync();
        try { var state = await connect(next); await current.DisposeAsync(); current = next; return state; }
        catch { await next.DisposeAsync(); throw; }
        finally { gate.Release(); }
    }
    public async ValueTask DisposeAsync() { await gate.WaitAsync(); try { await current.DisposeAsync(); } finally { gate.Release(); } }
}
