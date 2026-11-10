using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;
using MailKit.Net.Imap;
using MailKit.Security;
using Mailroom;

// An entirely local IMAP fixture. It never reaches a real mailbox or accepts user credentials.
internal sealed class ImapFixture(bool supportsMove = true, bool dropMove = false, bool supportsUidPlus = true) : IAsyncDisposable
{
    private readonly TcpListener listener = new(IPAddress.Loopback, 0);
    private readonly CancellationTokenSource stop = new(TimeSpan.FromSeconds(20));
    private Task? server;
    public List<string> Commands { get; } = [];
    public async Task<ImapClient> Open(ConnectionSettings _, CancellationToken ct)
    {
        listener.Start();
        server = Serve();
        var client = new ImapClient { Timeout = 5000 };
        await client.ConnectAsync("127.0.0.1", ((IPEndPoint)listener.LocalEndpoint).Port, SecureSocketOptions.None, ct);
        return client;
    }
    private async Task Serve()
    {
        try
        {
            using var tcp = await listener.AcceptTcpClientAsync(stop.Token);
            using var stream = tcp.GetStream();
            using var read = new StreamReader(stream, Encoding.ASCII);
            using var write = new StreamWriter(stream, new UTF8Encoding(false)) { NewLine = "\r\n", AutoFlush = true };
            string caps = "IMAP4rev1" + (supportsUidPlus ? " UIDPLUS" : "") + (supportsMove ? " MOVE" : "");
            await write.WriteLineAsync("* OK [CAPABILITY " + caps + "] fixture");
            string selected = "INBOX";
            var inbox = new List<uint> { 1, 2 };
            var trash = new List<uint>();
            uint nextInbox = 3, nextTrash = 101;
            string? line;
            while ((line = await read.ReadLineAsync(stop.Token)) != null)
            {
                Commands.Add(line);
                var space = line.IndexOf(' ');
                var tag = line[..space];
                var command = line[(space + 1)..];
                var current = selected == "INBOX" ? inbox : trash;
                if (command.StartsWith("CAPABILITY")) await write.WriteLineAsync("* CAPABILITY " + caps);
                else if (command.StartsWith("LOGIN")) { }
                else if (command.StartsWith("LIST"))
                {
                    if (command.EndsWith("\"\"")) await write.WriteLineAsync("* LIST (\\Noselect) \"/\" \"\"");
                    else { await write.WriteLineAsync("* LIST (\\HasNoChildren) \"/\" \"INBOX\""); await write.WriteLineAsync("* LIST (\\HasNoChildren \\Trash) \"/\" \"Trash\""); }
                }
                else if (command.StartsWith("SELECT") || command.StartsWith("EXAMINE"))
                {
                    selected = command.Contains("Trash") ? "Trash" : "INBOX";
                    current = selected == "INBOX" ? inbox : trash;
                    await write.WriteLineAsync("* FLAGS (\\Seen \\Deleted)");
                    await write.WriteLineAsync("* " + current.Count + " EXISTS");
                    await write.WriteLineAsync("* 0 RECENT");
                    await write.WriteLineAsync("* OK [UIDVALIDITY " + (selected == "INBOX" ? 1 : 2) + "] valid");
                    await write.WriteLineAsync("* OK [UIDNEXT " + (selected == "INBOX" ? nextInbox : nextTrash) + "] next");
                    await write.WriteLineAsync(tag + " OK [" + (command.StartsWith("SELECT") ? "READ-WRITE" : "READ-ONLY") + "] selected");
                    continue;
                }
                else if (command.StartsWith("FETCH"))
                {
                    for (int i = 0; i < current.Count; i++)
                    {
                        var subject = current[i] == 1 ? "Payslip for May 2026" : "Weekly payroll newsletter";
                        var envelope = "(\"Fri, 1 May 2026 12:00:00 +0000\" \"" + subject + "\" ((\"Payroll\" NIL \"pay\" \"example.com\")) NIL NIL ((NIL NIL \"alice\" \"example.com\")) NIL NIL NIL \"<" + current[i] + "@example.com>\")";
                        await write.WriteAsync("* " + (i + 1) + " FETCH (UID " + current[i] + " FLAGS () INTERNALDATE \"01-May-2026 12:00:00 +0000\" ENVELOPE " + envelope + " BODY[HEADER.FIELDS (LIST-UNSUBSCRIBE)] {2}\r\n\r\n)\r\n");
                    }
                    await write.FlushAsync(stop.Token);
                }
                else if (command.Contains("SEARCH"))
                {
                    var match = Regex.Match(command, @"UID (\d+(?::\d+)?(?:,\d+)*)");
                    var ids = match.Success ? Expand(match.Groups[1].Value).Where(current.Contains) : current;
                    await write.WriteLineAsync("* SEARCH " + string.Join(" ", ids));
                }
                else if (command.StartsWith("UID MOVE") || command.StartsWith("UID COPY"))
                {
                    if (dropMove) return;
                    var requested = Expand(command.Split(' ')[2]).ToArray();
                    var destination = selected == "INBOX" ? trash : inbox;
                    var mapped = requested.Select(_ => selected == "INBOX" ? nextTrash++ : nextInbox++).ToArray();
                    destination.AddRange(mapped);
                    if (command.StartsWith("UID MOVE"))
                        foreach (var uid in requested) { var index = current.IndexOf(uid); current.Remove(uid); await write.WriteLineAsync("* " + (index + 1) + " EXPUNGE"); }
                    await write.WriteLineAsync(tag + " OK [COPYUID " + (selected == "INBOX" ? 2 : 1) + " " + string.Join(",", requested) + " " + string.Join(",", mapped) + "] done");
                    continue;
                }
                else if (command.StartsWith("UID STORE")) { }
                else if (command.StartsWith("UID EXPUNGE"))
                {
                    foreach (var uid in Expand(command.Split(' ')[2]))
                    {
                        var index = current.IndexOf(uid);
                        current.Remove(uid);
                        await write.WriteLineAsync("* " + (index + 1) + " EXPUNGE");
                    }
                }
                else if (command.StartsWith("NOOP") || command.StartsWith("UNSELECT")) { }
                else if (command.StartsWith("LOGOUT")) { await write.WriteLineAsync("* BYE"); await write.WriteLineAsync(tag + " OK logout"); return; }
                else { await write.WriteLineAsync(tag + " BAD unexpected command"); continue; }
                await write.WriteLineAsync(tag + " OK done");
            }
        }
        catch (Exception e) when (e is IOException or OperationCanceledException or SocketException) { }
    }
    public async ValueTask DisposeAsync()
    {
        stop.Cancel(); listener.Stop();
        if (server != null) await server;
        stop.Dispose();
    }
    private static IEnumerable<uint> Expand(string set)
    {
        foreach (var part in set.Split(','))
        {
            var bounds = part.Split(':');
            var first = uint.Parse(bounds[0]);
            var last = uint.Parse(bounds[^1]);
            for (uint n = Math.Min(first, last); n <= Math.Max(first, last); n++) yield return n;
        }
    }
}
