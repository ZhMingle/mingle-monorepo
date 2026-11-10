using System.Net;
using System.Net.Sockets;

namespace Mailroom;

internal static class NetworkPolicy
{
    public static bool IsPublic(IPAddress address)
    {
        if (address.IsIPv4MappedToIPv6) address = address.MapToIPv4();
        var b = address.GetAddressBytes();
        if (b.Length == 4)
            return !(b[0] is 0 or 10 or 127 || b[0] >= 224 || b[0] == 100 && b[1] is >= 64 and <= 127 || b[0] == 169 && b[1] == 254 || b[0] == 172 && b[1] is >= 16 and <= 31 || b[0] == 192 && (b[1] == 168 || b[1] == 0 || b[1] == 2) || b[0] == 198 && (b[1] is 18 or 19 || b[1] == 51 && b[2] == 100) || b[0] == 203 && b[1] == 0 && b[2] == 113);
        // Permit global unicast only; exclude documentation space and transition ranges.
        return b[0] is >= 0x20 and <= 0x3f && !(b[0] == 0x20 && b[1] == 0x01 && (b[2] == 0x0d && b[3] == 0xb8 || b[2] == 0 || b[2] == 0x10)) && !(b[0] == 0x20 && b[1] == 0x02);
    }

    public static async Task<Socket> Connect(string host, int port, CancellationToken ct)
    {
        if (port is not (143 or 993)) throw new UserError("网页连接仅支持 IMAP 的 993（TLS）或 143（STARTTLS）端口。");
        var addresses = await Dns.GetHostAddressesAsync(host, ct);
        if (addresses.Length == 0 || addresses.Any(a => !IsPublic(a))) throw new UserError("IMAP 地址必须是可从互联网访问的公共邮箱服务器。");
        // Connect to the vetted address, rather than resolving a second time in MailKit.
        foreach (var address in addresses.OrderBy(a => a.AddressFamily == AddressFamily.InterNetwork ? 0 : 1).Take(3))
        {
            var socket = new Socket(address.AddressFamily, SocketType.Stream, ProtocolType.Tcp);
            try
            {
                using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
                timeout.CancelAfter(TimeSpan.FromSeconds(10));
                await socket.ConnectAsync(new IPEndPoint(address, port), timeout.Token);
                return socket;
            }
            catch (Exception ex) when ((ex is SocketException || ex is OperationCanceledException) && !ct.IsCancellationRequested) { socket.Dispose(); }
            catch { socket.Dispose(); throw; }
        }
        throw new UserError("暂时无法连接邮箱服务器，请检查地址、端口及邮箱服务是否开启。");
    }
}
