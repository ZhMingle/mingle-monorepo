# 拾邮 Mailroom

无构建依赖的中文邮件整理网页。`dist` 为完整静态输出。

功能：分类卡片、发件人/主题/摘要搜索、未读/30天前过滤、排序、当前结果全选、批量垃圾箱、撤销、恢复和手动分类。演示模式不会触及真实邮箱。

真实 Gmail 接入：在 Google Cloud 启用 Gmail API，配置 Web OAuth 客户端及部署域名的 JavaScript 来源。测试应用添加测试用户。在页面「邮箱连接与设置」输入 Client ID 后授权。使用 gmail.modify 权限，最多加载最新 1000 封收件箱邮件；令牌保存在当前标签页的 sessionStorage（有过期校验，断开时清除），Client ID 可存在 localStorage。使用官方 Google Identity Services 与 Gmail REST API，无邮件内容存储服务器。仅 Gmail，暂不支持 Outlook/IMAP、后台定时同步、超过 1000 封的整箱扫描或跨会话分类。

删除调用 batchModify 加 TRASH 移除 INBOX；撤销移除 TRASH，尽量保持原有标签。垃圾箱仅显示本次会话移入的邮件，恢复后重新同步可刷新收件箱标签。不提供永久删除。

本地预览：`python -m http.server 4340 --directory dist`。
