# 拾邮 Mailroom · 通用网页版

打开一个 HTTPS 链接，选择邮箱并连接自己的账号，即可分类、筛选及整理邮件。使用者无需下载程序、配置开发者项目或部署服务器。网站维护者统一部署一次后端。

通过 Railway 独立服务部署，原 Sites 网站保留原有 Gmail 功能。运行状态以 Railway 部署和 /health 检查为准。1.1.0 加入 Gmail／Outlook 官方授权与 API 整理；110 项检查使用本地协议及 HTTP 替身，不等同于真实服务商账户实测。官方登录只在维护者配置完整后开放。

## 支持范围

| 邮箱 | 连接方式 |
| --- | --- |
| QQ / Foxmail | 内置 imap.qq.com:993，邮箱地址＋授权码 |
| 网易 163 / 126 | 内置对应 IMAP 地址，邮箱地址＋客户端授权码 |
| Gmail | Google 官方登录＋Gmail API；需维护者先统一配置应用；保留应用专用密码 IMAP 备用入口 |
| Outlook / Hotmail / Microsoft 365 | Microsoft 官方登录＋Graph API；需维护者统一配置应用；组织账号可能受管理员策略限制 |
| 其他邮箱 | 公网 IMAP 服务器，993/TLS 或 143/STARTTLS，且允许客户端密码或授权码认证 |

QQ／网易的 IMAP 连接仍需邮箱授权码。Gmail／Outlook 官方登录不要求使用者生成应用专用密码、配置开发者项目或密钥。通用 IMAP 接入不意味着支持所有服务商，账号策略、网络和服务商风控仍可能限制连接。

QQ、网易用户第一次需要在自己的邮箱设置中启用 IMAP 并生成授权码。授权码应在网页里输入，不需要发给网站维护者或聊天助手。

- QQ：[腾讯官方连接说明](https://cloud.tencent.com/document/product/1270/55456)
- 163：[官方客户端授权码指引](https://consumer.huawei.com/cn/support/content/zh-cn15872099/)
- Gmail：[Google 应用专用密码说明](https://support.google.com/accounts/answer/185833?hl=zh-Hans)

## 功能及会话

- 读取最近 100 / 500 / 1000 封收件箱邮件的发件人、主题、日期及未读状态；不扫描所有文件夹，不下载原文和附件，不标记为已读。
- 分类为促销、订阅、通知、账单凭证和个人往来。Payslip、工资单、工资条优先归入账单凭证；可手动修正。
- 搜索、排序、仅未读、30 天前筛选、全选当前结果、批量移入已删除文件夹、恢复和撤销上次操作。
- 不自动删除，不提供永久删除。只有用户明确选择后才移动邮件。没有可追踪移动能力或找不到已删除文件夹时，仍可读取分类，移动功能关闭。
- 每个浏览器会话都有独立的连接、邮件数据及操作历史。其他浏览器用户不能读取或操作这些数据。同一浏览器的标签页共享会话。
- 凭证和邮件信息会通过 HTTPS 传送到拾邮服务器；服务端通过验证证书的 TLS 连接邮箱。仅在内存处理，不写入数据库或请求日志。
- 主动断开、20 分钟无操作或最长 8 小时后释放连接并移除会话数据。服务重启也会清空；下次使用需要重新连接。20 分钟到期后的清理任务最多延迟约 1 分钟。
- 官方授权使用一次性 state、PKCE 和独立的浏览器回调证明 Cookie，绑定发起授权的访客；邮箱会话 Cookie 保持 SameSite=Strict。令牌只存在服务器内存，过期时在当前会话内刷新；不保存到浏览器、数据库或应用日志。取消新的授权保留原连接。
- Gmail API／Graph 只读取邮件元数据，Gmail 使用标签变更，Graph 移动后跟踪新邮件 ID。刷新不改变已读状态，不提供发送或永久删除接口。移动结果不确定时停止连接，不重试写操作。隐私说明位于 `/privacy.html`。
- 本次垃圾箱和撤销记录随会话结束清空，已移动的邮件仍在真实邮箱内。网络中断导致移动结果无法确认时，停止连接并提示核对，不自动重试写操作。

## 本地开发

需要 .NET SDK 10（仅开发及构建需要；网站使用者不需要）。如果 .dotnet/dotnet.exe 存在，build.ps1 会优先使用这个项目内的 SDK。

```powershell
./build.ps1
$env:MAILROOM_ALLOW_HTTP='1'
$env:PORT='4350'
dotnet publish/Mailroom.dll
```

浏览器打开 http://127.0.0.1:4350/ 。项目内 SDK 可用 ./.dotnet/dotnet.exe 替换 dotnet。

## Railway 部署

1. 将本目录作为服务源码根目录，使用 Dockerfile 构建。单仓库部署时设置服务 Root Directory 为 /mailroom-web。
2. 在服务设置中选择 Dockerfile 构建、设置 /health 健康检查（60 秒），保留单个运行实例。容器会读取平台 PORT，默认 8080。
3. 生成公网 HTTPS 域名。可将 PUBLIC_ORIGIN 设置为这个完整 HTTPS origin；不要在生产设置 MAILROOM_ALLOW_HTTP。
4. 保持一个运行实例：连接和会话仅存内存，不需要数据库或磁盘卷，多实例需要另行实现共享会话路由。
5. 验证平台能访问 IMAP 993/143，再由账号本人在网页输入授权码，验证真实登录、读取和移动。此步骤尚未在真实 QQ/网易账号上验证。
6. 只需向使用者分享最终的 HTTPS 链接。

网站通过安全 cookie 和每个会话的随机请求令牌授权，拒绝跨站写请求；有连接频率和会话容量限制。自定义 IMAP 会校验并固定公共 IP，拒绝内网、回环和云元数据地址；不支持任意端口、明文或忽略证书验证。

## 官方登录的站点配置（维护者只需做一次）

生产站点为 `https://mailroom-production-e4ae.up.railway.app`。保持 `PUBLIC_ORIGIN` 为该精确 HTTPS origin。朋友只需打开链接、选择邮箱并同意服务商授权。

Google：复用已有 Google Cloud 项目，启用 Gmail API。OAuth 客户端类型为「Web 应用」，注册回调 `https://mailroom-production-e4ae.up.railway.app/oauth/callback/google`。在 Railway 设置 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`，不要提交到仓库。申请 `https://www.googleapis.com/auth/gmail.modify`，不申请完整 IMAP 权限。隐私页填本站 `/privacy.html`。测试阶段将朋友的 Gmail 加入该项目的测试用户；面向公众的限制性权限需要按 Google 要求完成验证，不能承诺任意账号立即可用。

Microsoft：在 Entra 注册 Web 应用，支持组织目录和个人 Microsoft 账号，注册回调 `https://mailroom-production-e4ae.up.railway.app/oauth/callback/microsoft`。添加 Microsoft Graph 的委托权限 `User.Read`、`Mail.ReadWrite`，使用 `offline_access` 续期；不申请应用级邮箱权限或发信权限。在 Railway 设置 `MICROSOFT_CLIENT_ID`、`MICROSOFT_CLIENT_SECRET`。组织管理员仍可能限制员工授权。

只有服务商的应用配置和一次本人登录实测完成后，才将其对外称为可用。没有客户端配置时页面显示「官方登录尚未开放」，原来的 QQ／网易／IMAP 与演示功能仍可使用。

官方文档：[Google Web OAuth](https://developers.google.com/identity/protocols/oauth2/web-server)、[Gmail 权限](https://developers.google.com/workspace/gmail/api/auth/scopes)、[Microsoft 授权码流程](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow)、[Graph 移动邮件](https://learn.microsoft.com/en-us/graph/api/message-move?view=graph-rest-1.0)。

## 验证

```powershell
dotnet run --project tests/Mailroom.Tests.csproj -c Release
```

检查包括分类、访客隔离、会话过期、跨站请求、输入及网络地址校验，并用本地 IMAP 协议服务器驱动真实 MailKit，验证读取、UID 映射、单封及批量移动/撤销、无 MOVE 扩展时的定向移动和网络中断不重试。协议测试不连接真实邮箱，不代替服务商实测。

浏览器已验证连接表单、演示列表、工资单分类、移动及撤销。演示数据不会访问真实账号。

## 实现

.NET 10 / ASP.NET Core，MailKit 4.18.2。Web/ 是无构建依赖的中文页面；后端只在运行时处理访客自己的数据。构建本地缓存、运行时和发布目录均不进入源代码。
