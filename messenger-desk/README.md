# 小店收件箱 · Mingle's Choice

独立于 Clarity 的本机 Messenger 客服服务。Node.js 24，无第三方依赖。初始为**只预览，不发送**。

已录入用户提供的手机支架、台灯、感应灯、键盘、鼠标、音响，价格约 $10–150，支持自取和邮寄。币种、具体产品单价、库存、自取地址、邮费和时间仍未知。AI 不得把总价格范围当成某件商品的报价。

## 当前接入状态

- Meta 应用：Shop Inbox Assistant，ID `29500712936179888`。
- 已在 Meta 后台看到连接主页 Mingle's Choice，实际 Page ID `1366169483255561`。用户提供的个人样式主页链接 ID 与 API Page ID 不同，发送使用后台显示的 Page ID。
- 尚未取得或配置 Page Access Token、App Secret。运行中的工作台已按 Meta 后台显示配置 Graph API v27.0。
- 2026-11-08：已建立仅公开消息接收端口的临时 Cloudflare HTTPS 隧道，并由 Meta 的 Verify and save 完成 Webhook 地址验证。临时地址和校验值保留在本机配置及 Meta 后台，不写入源码。
- 尚未订阅消息，未完成真实 Messenger 消息收发测试；本机真实 AI 测试已完成，均未发送到 Facebook。
- 应用未发布。普通客人访问需要按 Meta 后台要求完成应用审核；开发阶段只验证管理员/开发者/测试用户的消息。

## 本地使用

运行 `Start.bat`，打开 `http://127.0.0.1:4331/`。设置里补齐店铺资料。测试消息调用本机已登录的 Codex，使用已有账户额度；失败会显示错误，不生成假的 AI 回复。可用 `CODEX_BIN` 指定可执行文件。服务器未启动时不接收或处理消息，当前本机版本不是全天候托管服务。

工作台支持咨询、计划到店、仅打招呼、人工处理、已成交分类，手动确认成交、暂停单个对话、归档、备注、搜索和导出。归档只改变本地列表，不删除或归档 Facebook 中的聊天。只有店主可以确认成交。AI 判定计划购买不等于实际购买。历史聊天通过手动粘贴整理，不尝试读取个人账号的全部聊天。

## 官方接入步骤

1. 使用 HTTPS 反向代理或隧道**仅公开 4332 端口的 `/webhook`**。4331 是私人本机管理端口，不得公开。当前不自动购买服务器、域名或第三方客服服务。临时隧道只用于接入验证，长期运行需要固定地址和持续在线的部署。
2. 在本机设置里填写 Meta 应用支持的 Graph API 版本、App Secret、Page Access Token。后台生成凭证和主页授权由店主本人确认。不要把凭证粘贴到聊天、代码、提交记录或截图里。
3. 将公开 `/webhook` URL 和设置里的 Verify Token 填进 Meta 的 Callback URL/Verify token，点击 Verify and save。
4. 为**该主页**订阅 `messages`。目前不需要广告、通话、支付或营销消息权限。
5. 先让应用测试用户给主页发消息，确认本机出现真实消息及回复预览。
6. 核对内容后再启用自动回复，并用预先确认的测试消息验证发送。正式接待普通客户前，完成 Meta 要求的审核和发布。

## 可靠性与限制

- 接收端先校验原始请求体的 HMAC-SHA256 签名，再保存和确认接收；拒绝其他主页、自己发送的回声及未来时间戳。
- SQLite 持久保存消息和任务，以消息 ID 去重。AI 不持有发送令牌，只收到商品资料和最近对话。
- 管理界面同源校验，消息端口不提供管理接口和密钥。密钥存于忽略提交的 `data/secrets.json`，客户数据存于 `data/inbox.sqlite`。请保护本机账号和整个 data 目录。
- 使用 `messaging_type: RESPONSE`，只发送给最近 24 小时内有新消息的真实主页客人。导入和测试对话永不发送。没有自动营销追发或超时标签规避。
- 发出请求后结果不明时不自动重发，避免重复回复；需要到 Messenger 核对。无法在第三方 API 不提供幂等发送的情况下承诺严格 exactly-once。
- 图片、语音等附件当前交给人工。人工直接在 Messenger 回答前，需在工作台暂停该客人自动回复；当前不订阅 message_echoes 来判断人工接管。
- 本机版本支持手机窄屏布局，但当前未提供手机跨设备访问。正式远程管理需要独立的登录鉴权和 HTTPS 管理入口。

## 检查

`node --test tests/*.test.mjs`

`node verify-ai.mjs` 使用本机已登录 Codex 的额度，对虚拟商品询问生成真实回复并验证需要确认未知价格；不向 Facebook 发送。

测试使用独立临时数据库、伪造的 Meta 签名和注入的 AI/发送函数，不向真实客人发送消息。

依据：[Meta Messenger Send API](https://www.postman.com/meta/messenger-platform-api/documentation/iyp204x/messenger-platform-api?entity=folder-22794852-528c6dc8-ac00-4415-a5dc-b40e095e3cda)、[Codex 非交互模式](https://learn.chatgpt.com/docs/non-interactive-mode)。
