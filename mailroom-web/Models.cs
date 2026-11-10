using System.Text.RegularExpressions;

namespace Mailroom;

internal sealed record Provider(string Id, string Name, string Host, int Port, string Help, string Tip);
internal static class Providers
{
    public static readonly Provider[] All = [
        new("qq", "QQ / Foxmail", "imap.qq.com", 993, "https://mail.qq.com/", "在 QQ 邮箱设置中开启 IMAP/SMTP 服务，生成授权码。此处填写授权码。"),
        new("163", "网易 163", "imap.163.com", 993, "https://mail.163.com/", "在邮箱设置 → POP3/SMTP/IMAP 中开启 IMAP，并生成客户端授权码。"),
        new("126", "网易 126", "imap.126.com", 993, "https://mail.126.com/", "在邮箱设置中开启 IMAP，并生成客户端授权码。"),
        new("gmail", "Gmail · 应用专用密码", "imap.gmail.com", 993, "https://myaccount.google.com/apppasswords", "需要开启两步验证，并生成应用专用密码。受组织或账号限制无法生成时，此连接方式不可用。"),
        new("custom", "其他 IMAP 邮箱", "", 993, "", "填写邮箱服务商提供的 IMAP 地址，使用授权码或该服务商允许的客户端密码。支持 TLS；暂不支持仅允许 OAuth 登录的邮箱。")
    ];
    public static ConnectionSettings Validate(ConnectRequest request)
    {
        var provider = All.FirstOrDefault(p => p.Id == request.Provider) ?? throw new UserError("请选择支持的邮箱类型。");
        var email = request.Email?.Trim() ?? "";
        if (email.Length > 254 || !System.Net.Mail.MailAddress.TryCreate(email, out var address) || address.Address != email)
            throw new UserError("请输入完整、有效的邮箱地址。");
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length > 1024)
            throw new UserError("请输入邮箱授权码或应用专用密码。");
        var host = provider.Id == "custom" ? request.Host?.Trim() ?? "" : provider.Host;
        var port = provider.Id == "custom" ? request.Port ?? 993 : provider.Port;
        var security = provider.Id == "custom" ? request.Security ?? "ssl" : "ssl";
        if (host.Length > 253 || Uri.CheckHostName(host) == UriHostNameType.Unknown || host.Contains(':') || port is < 1 or > 65535)
            throw new UserError("请检查 IMAP 服务器地址和端口。地址只填主机名，例如 imap.example.com。");
        if (security is not ("ssl" or "starttls")) throw new UserError("请选择 TLS 或 STARTTLS 加密连接。");
        return new(provider.Id, email, request.Password, host, port, security, ValidLimit(request.Limit));
    }
    public static int ValidLimit(int limit) => limit is 100 or 500 or 1000 ? limit : throw new UserError("加载数量请选择 100、500 或 1000 封。");
}

internal sealed record ConnectRequest(string Provider, string Email, string Password, string? Host = null, int? Port = null, string? Security = null, int Limit = 500);
internal sealed record ConnectionSettings(string Provider, string Email, string Password, string Host, int Port, string Security, int Limit);
internal sealed record RefreshRequest(int Limit = 500);
internal sealed record MoveRequest(string[] Ids, bool Trash, string OperationId);
internal sealed record UndoRequest(string OperationId);
internal sealed record ClassifyRequest(string Id, string Category);
internal sealed class UserError(string message) : Exception(message);
internal sealed record MailRow(string Id, string From, string Email, string Subject, string Snippet, long Date, bool Unread, bool Trash, string Cat);
internal sealed record MailState(bool Connected, string Email, string Provider, int Limit, int Total, bool CanTrash, string TrashFolder, string TrashUnavailableReason, IReadOnlyList<MailRow> Mails, bool CanUndo);

internal static partial class Classifier
{
    public static readonly HashSet<string> Categories = ["bill", "promo", "sub", "notice", "personal"];
    [GeneratedRegex(@"账单|发票|收据|付款|机票|工资单|工资条|薪资单|薪酬单|薪水单|receipt|invoice|payment|\bpay[\s-]?slips?\b|\b(?:payroll|salary|earnings)\s+statements?\b", RegexOptions.IgnoreCase)] private static partial Regex Bill();
    [GeneratedRegex(@"促销|优惠|折扣|特惠|\bsale\b|discount|\boffer\b|coupon", RegexOptions.IgnoreCase)] private static partial Regex Promo();
    [GeneratedRegex(@"订阅|周刊|精选|newsletter|digest|weekly", RegexOptions.IgnoreCase)] private static partial Regex Subscription();
    [GeneratedRegex(@"提醒|通知|验证|登录|notification|alert|verify|security", RegexOptions.IgnoreCase)] private static partial Regex Notice();
    public static string Classify(string subject, string from, bool unsubscribe)
    {
        var text = subject + " " + from;
        return Bill().IsMatch(text) ? "bill" : Promo().IsMatch(text) ? "promo" : unsubscribe || Subscription().IsMatch(text) ? "sub" : Notice().IsMatch(text) ? "notice" : "personal";
    }
}

internal interface IMailService : IAsyncDisposable
{
    Task<MailState> State();
    Task<MailState> Connect(ConnectRequest request, CancellationToken ct);
    Task<MailState> Refresh(int limit, CancellationToken ct);
    Task<MailState> Disconnect(CancellationToken ct);
    Task<MailState> Move(MoveRequest request, CancellationToken ct);
    Task<MailState> Undo(UndoRequest request, CancellationToken ct);
    Task<MailState> Classify(ClassifyRequest request, CancellationToken ct);
}
