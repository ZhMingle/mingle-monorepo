using System.Security.Cryptography;

namespace Mailroom;

internal sealed class SessionStore : IAsyncDisposable
{
    private readonly object sync = new();
    private readonly Dictionary<string, Entry> entries = [];
    private readonly Func<IMailService> factory;
    private readonly TimeProvider clock;
    private readonly int capacity;
    public SessionStore(TimeProvider? clock = null, Func<IMailService>? factory = null, int capacity = 100)
    {
        this.clock = clock ?? TimeProvider.System;
        this.factory = factory ?? (() => new MailService());
        this.capacity = capacity;
    }
    internal sealed class Entry(string id, IMailService service, DateTimeOffset now)
    {
        public string Id { get; } = id;
        public string Token { get; } = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        public IMailService Service { get; } = service;
        public DateTimeOffset Created { get; } = now;
        public DateTimeOffset LastUsed { get; set; } = now;
        public int Active { get; set; }
    }
    public sealed class Lease : IDisposable
    {
        private SessionStore? owner;
        internal Entry Entry { get; }
        public IMailService Service => Entry.Service;
        internal Lease(SessionStore owner, Entry entry) { this.owner = owner; Entry = entry; }
        public void Dispose()
        {
            var store = Interlocked.Exchange(ref owner, null);
            if (store == null) return;
            lock (store.sync) { Entry.Active--; Entry.LastUsed = store.clock.GetUtcNow(); }
        }
    }
    private bool Expired(Entry entry, DateTimeOffset now) => now - entry.LastUsed > TimeSpan.FromMinutes(20) || now - entry.Created > TimeSpan.FromHours(8);
    public Lease? Acquire(string? id, bool create)
    {
        lock (sync)
        {
            var now = clock.GetUtcNow();
            if (id != null && entries.TryGetValue(id, out var current) && !Expired(current, now)) { current.Active++; current.LastUsed = now; return new(this, current); }
            if (!create) return null;
            if (entries.Count >= capacity) throw new UserError("当前使用人数较多，请稍后再试。");
            var entry = new Entry(Convert.ToHexString(RandomNumberGenerator.GetBytes(32)), factory(), now) { Active = 1 };
            entries.Add(entry.Id, entry);
            return new(this, entry);
        }
    }
    public async Task Cleanup()
    {
        Entry[] expired;
        lock (sync)
        {
            var now = clock.GetUtcNow();
            expired = entries.Values.Where(e => e.Active == 0 && Expired(e, now)).ToArray();
            foreach (var item in expired) entries.Remove(item.Id);
        }
        foreach (var item in expired) await item.Service.DisposeAsync();
    }
    public async ValueTask DisposeAsync()
    {
        Entry[] all;
        lock (sync) { all = entries.Values.ToArray(); entries.Clear(); }
        foreach (var entry in all) await entry.Service.DisposeAsync();
    }
}

internal sealed class SessionCleanup(SessionStore sessions) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
        try { while (await timer.WaitForNextTickAsync(stoppingToken)) await sessions.Cleanup(); }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
    }
}
