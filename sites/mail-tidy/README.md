# 拾邮 Mailroom

无构建依赖的中文邮件整理网页。`dist` 为完整静态输出。

功能：分类卡片、发件人/主题/摘要搜索、未读/30天前过滤、排序、当前结果全选、批量垃圾箱、撤销、恢复和手动分类。演示模式不会触及真实邮箱。

真实 Gmail 接入：在 Google Cloud 启用 Gmail API，配置 Web OAuth 客户端及部署域名的 JavaScript 来源。测试应用添加测试用户。在页面「邮箱连接与设置」输入 Client ID 后授权。使用 gmail.modify 权限，首次读取最近最多 1000 封收件箱邮件。使用官方 Google Identity Services 与 Gmail REST API，无邮件内容存储服务器。仅 Gmail，暂不支持 Outlook/IMAP、后台定时同步或超过 1000 封的整箱扫描。

此浏览器按 Gmail 邮箱地址分别保存邮件摘要、分类、手动分类、跟踪的垃圾箱记录、上次成功整理时间与 Gmail historyId。再次打开先恢复结果，再通过 history.list 只读取新增和变化的邮件，也会核对已读、归档、删除等变化。邮件和检查点一次性写入；读取或保存失败保留原快照与检查点。首次扫描采用扫描前的检查点，避免漏掉扫描期间到达的新邮件。变化记录过期（HTTP 404）时重新核对最近 1000 封；设置中也可主动重新核对，以补齐加载范围内因移出邮件而留下的空位。

Google 短期访问令牌和到期时间保存在本地并做过期校验；有效期内重新打开会恢复连接，过期后需要点击重新授权，但整理进度继续保留。旧版标签页 sessionStorage 会话会迁移到本地。断开连接清除令牌并撤销当前授权，保留整理记录；「清除此设备的邮箱记录」清除当前账号快照及本地连接。清除浏览器数据、换浏览器或设备后需重新整理。

删除调用 batchModify 加 TRASH 移除 INBOX；撤销移除 TRASH，尽量保持原有标签。垃圾箱只跟踪本地已加载邮件的垃圾箱状态，不扫描完整 Gmail 垃圾箱。不提供永久删除。

本地预览：`python -m http.server 4340 --directory dist`。

本地验证：`node verify-sync.cjs`、`node verify-loading.cjs`、`node verify-classification.cjs`、`node verify-session.cjs`。全部使用本地替身，不访问真实邮箱。
