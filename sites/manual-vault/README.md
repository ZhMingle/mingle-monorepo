# 知物 · 说明书管家

一个私有的电子产品说明书库。把音箱、键盘、智能家居等设备的说明书拍下来，保留原图，并把功能和设置整理成带来源的操作指南。

## 已实现

- 产品档案：名称、品牌、准确型号、分类、备注、收藏、编辑和删除。
- 多张照片上传、拖放选择；支持 JPEG / PNG / WebP，每张最多 12 MiB。按原始字节保存到 R2，记录 SHA-256，可放大和下载原文件。
- OpenAI 视觉识别：逐页转录、摘要、功能、操作步骤、注意事项。蓝牙配对、恢复出厂、音响串联、模式切换分别整理。
- 每项功能、操作都有原文引用和对应照片。服务端验证引用能在识别文本中找到；完整性和实际识别准确率仍需对照照片核对，不能保证 AI 百分百正确。
- 搜索设备名称、型号、备注、识别原文与常见操作意图；识别产品或类别限定词，避免把键盘与音箱的步骤混在一起。搜索不会调用模型生成未知答案。
- 手动修正识别原文、按修正后原文重新整理、标记已核对。修改原文或重新识别会撤销旧核对状态。
- 原图先落库，整理失败可重试；区分超时、网络故障、额度不足与请求频率限制。同一页使用数据库锁避免重复并发分析。
- ChatGPT 登录、按用户 ID 隔离资料、请求来源检查。桌面和手机自适应布局，示例数据仅在内存中浏览，明确标记为虚构。

## 本地运行

Node.js >= 22.13（运行 TypeScript 单元测试建议 Node.js 24）。安装：`npm ci`。

环境文件使用已忽略的 `.dev.vars`，服务端密钥名为 `OPENAI_API_KEY`；可选 `OPENAI_MODEL`，默认 `gpt-4.1-mini`。通过 OpenAI Developers 的安全配置流程创建密钥，不要把密钥放进代码、前端配置、Git 或聊天。

云端也支持 `OPENAI_KEY_ENVELOPE`：由安全配置流程返回的 RSA-OAEP/SHA-256 密文和对应私钥 JWK 组成，整个 JSON **必须作为一个 Sites secret 保存**，只能在服务端解包。它用于避免部署编排中的明文密钥输出；它本身拥有完整密钥权限，必须像 API key 一样保护。通常自行部署时直接设置 `OPENAI_API_KEY` 即可。

首次运行需要生成构建配置并应用本地迁移：

```sh
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_fantastic_zaran.sql
npm run dev -- --port 4332 --hostname 127.0.0.1
```

访问终端输出的本地地址，点击登录。仅 loopback 开发预览使用 starter 的模拟身份；生产环境由 Sites 完成真实认证。本地 D1/R2 与生产数据完全分开。

## 验证

```sh
npm run check
npm test
npm run test:smoke
```

`test:smoke` 需要正在运行的 loopback 开发服务（默认端口 4332，可设置 `PREVIEW_URL`）。检查认证、伪造身份拒绝、来源保护、上传格式、原图字节与下载、编辑、原文修正失效和删除清理；只创建虚构测试资料，在 finally 中删除。设置 `LIVE_AI=1` 时额外进行一次真实、可能计费的读图调用。没有 API 余额时，记录明确的失败状态，不把它当成识别成功。

单元测试覆盖引用验证、缺失信息、图片字节检查、产品校验、检索隔离、余额与频率错误分类，以及服务端密钥解包。

## 发布

部署配置在 `.openai/hosting.json`；D1 绑定 `DB`，R2 绑定 `BUCKET`。通过 Sites 技能构建、保存源版本并发布；生产密钥通过 Sites secret 配置，不能写入 manifest 或客户端构建。迁移 SQL 和 Drizzle 元数据必须随源代码提交，由 Sites 发布流程应用。

源码在此 monorepo 中维护；`.sites-checkout/` 仅用于发布副本，不提交。生产地址：https://mingle-manual-vault.minglezhang7.chatgpt.site（仅在部署成功后可用）。

## 当前边界

- 首版按页整理；跨页才完整的操作会要求补拍相邻页，不拼凑步骤。
- 暂不接收 PDF 或 HEIC；先转换为支持的图片格式。
- AI 仅使用当前上传页，不搜索互联网；原图会发送给 OpenAI 进行分析。
- 2026-11-23 的真实调用确认所选 API 项目返回 `credit_balance_exhausted`。归档功能已验证，成功读图仍需恢复 API 余额后验证。可在 [API 账单](https://platform.openai.com/settings/organization/billing/)查看额度；简单文本实验可考虑 `gpt-6-luna`，本应用的视觉模型另由 `OPENAI_MODEL` 指定。

API 接入依据：[图片输入](https://developers.openai.com/api/docs/guides/images-vision)、[结构化输出](https://developers.openai.com/api/docs/guides/structured-outputs)。
