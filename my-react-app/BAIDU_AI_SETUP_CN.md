# 百度 AI 车牌识别集成指南

本文档介绍如何在 Vercel 上配置和使用百度 AI 车牌识别功能。

## 📋 概述

项目已集成百度 AI OCR API，用于自动识别车牌号码。支持两种运行模式：

1. **模拟模式**（默认）：使用模拟数据，无需 API 密钥
2. **真实模式**：调用百度 AI API，需要配置密钥

## 🚀 快速开始（模拟模式）

如果你只是想体验功能，直接运行即可：

```bash
npm install
npm run dev
```

系统会使用模拟的车牌识别结果，无需任何配置。

## 🔑 配置真实 API（Vercel 部署）

### 第一步：获取百度 AI 密钥

1. 访问 [百度智能云控制台](https://console.bce.baidu.com/ai/)
2. 如果没有账号，先注册并登录
3. 进入"产品服务" -> "人工智能" -> "文字识别"
4. 创建一个新应用或使用现有应用
5. 在应用详情页面找到：
   - **API Key**
   - **Secret Key**

### 第二步：在 Vercel 配置环境变量

1. 登录 [Vercel](https://vercel.com/)
2. 进入你的项目
3. 点击 "Settings"
4. 点击 "Environment Variables"
5. 添加以下环境变量：

```
Name: BAIDU_API_KEY
Value: 你的API_Key

Name: BAIDU_SECRET_KEY
Value: 你的Secret_Key

Name: VITE_USE_MOCK_DATA
Value: false
```

**重要**：将 `VITE_USE_MOCK_DATA` 设置为 `false` 以启用真实 API。

### 第三步：重新部署

在 Vercel 点击 "Deployments" → 选择最新部署 → "Redeploy"

或者推送一个新提交：

```bash
git commit --allow-empty -m "Enable Baidu AI OCR"
git push
```

访问你的网站，现在车牌识别功能使用的是真实的百度 AI API！

## 🎯 使用方法

1. 打开应用，进入"洗车记录"页面
2. 点击"📷 拍照识别车牌"按钮
   - 允许浏览器访问摄像头
   - 对准车牌拍照
3. 或者点击"📁 上传图片"上传现有照片
4. 系统会自动识别车牌号
5. 填写服务记录并保存

## 🔒 安全注意事项

### ⚠️ 重要：保护你的 API 密钥

1. **永远不要**将 `.env` 文件提交到 Git
2. `.env` 文件已添加到 `.gitignore` 中
3. 不要在代码中硬编码 API 密钥
4. 不要将密钥分享给他人
5. 如果密钥泄露，立即在百度控制台重置

### Vercel Serverless Functions 架构

```
浏览器 → Vercel Serverless Function → 百度 AI API
```

- **安全性**：API 密钥保存在 Vercel 环境变量中，不暴露给浏览器
- **无 CORS 问题**：API 路由在同一域名下
- **自动扩展**：Vercel 自动处理流量
- **完全免费**：个人项目免费使用

## 📂 文件结构

```
my-react-app/
├── .env                              # 前端环境变量（不提交）
├── .gitignore                        # 包含 .env
├── api/                              # Vercel Serverless Functions
│   ├── baidu-token.js                # 获取百度 Access Token
│   └── baidu-ocr.js                  # 车牌识别 API
├── src/
│   ├── services/
│   │   └── licensePlateService.js   # 车牌识别服务
│   └── pages/
│       └── carwash/
│           └── CarWashPage.jsx      # 车牌识别页面
```

## 🐛 常见问题

### 1. "Server configuration error" 错误

**原因**：Vercel 环境变量未配置

**解决**：

- 检查 Vercel Settings → Environment Variables
- 确认 `BAIDU_API_KEY` 和 `BAIDU_SECRET_KEY` 已设置
- 重新部署项目

### 2. 车牌识别失败

**可能原因**：

- API 密钥错误
- 网络连接问题
- 图片质量太差
- 百度 API 配额用完

**解决**：

- 检查浏览器控制台错误信息
- 验证 API 密钥是否正确
- 使用清晰的车牌照片
- 检查百度账户配额

### 3. 本地开发时如何测试 API？

**方法 1**：使用模拟数据（推荐）

```env
# .env
VITE_USE_MOCK_DATA=true
```

**方法 2**：使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 本地运行（会自动运行 Serverless Functions）
vercel dev
```

### 4. 摄像头无法访问

**原因**：

- 浏览器未授予摄像头权限
- 网站未使用 HTTPS（生产环境）

**解决**：

- 点击浏览器地址栏的权限图标，允许摄像头访问
- 开发环境使用 `localhost` 即可
- 生产环境需要 HTTPS（Vercel 自动提供）

## 💡 开发提示

### 切换模式

**开发测试**（使用模拟数据）：

```env
# .env
VITE_USE_MOCK_DATA=true
```

**生产环境**（使用真实 API）：

在 Vercel 环境变量中设置：

```
VITE_USE_MOCK_DATA=false
```

### 修改模拟数据

编辑 `src/services/licensePlateService.js`：

```js
simulateRecognition() {
  const mockPlates = [
    '京A12345',  // 添加你想要的车牌号
    '沪B67890',
    // ...
  ];
  // ...
}
```

## 📊 API 配额说明

百度 AI OCR API 有以下限制：

- **免费额度**：每天 50,000 次（根据百度政策可能变化）
- **并发限制**：QPS 限制（每秒请求次数）
- **图片大小**：建议 < 4MB

查看配额使用情况：[百度智能云控制台](https://console.bce.baidu.com/ai/)

## 🔄 代码结构

### 前端服务层

```javascript
// src/services/licensePlateService.js
class LicensePlateService {
  async recognizeLicensePlate(imageBase64) {
    // 1. 检查是否使用模拟模式
    // 2. 调用 Vercel Serverless Function
    // 3. 处理响应并返回结果
    // 4. 错误时回退到模拟模式
  }
}
```

### Vercel Serverless Functions

```javascript
// api/baidu-token.js
export default async function handler(req, res) {
  // 从环境变量读取密钥
  // 调用百度 API 获取 access_token
  // 返回给前端
}

// api/baidu-ocr.js
export default async function handler(req, res) {
  // 接收图片 base64
  // 调用百度车牌识别 API
  // 返回识别结果
}
```

## 📚 相关文档

- [百度 AI 文档](https://ai.baidu.com/ai-doc/OCR/zk3h7xz52)
- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - Vercel 部署指南
- [Vercel Serverless Functions](https://vercel.com/docs/functions)

## ✅ 检查清单

配置完成后，检查以下项目：

- [ ] 已获取百度 AI API Key 和 Secret Key
- [ ] 已在 Vercel 配置环境变量
- [ ] 已设置 `VITE_USE_MOCK_DATA=false`
- [ ] 已重新部署项目
- [ ] 前端可以成功调用车牌识别

## 🎉 完成！

现在你的应用已经完全集成了百度 AI 车牌识别功能！

如有问题，请查看：

- 浏览器控制台错误信息
- Vercel 部署日志（Functions 标签页）
- 百度智能云控制台的 API 调用记录

## 💰 费用说明

### Vercel（前端 + API）

- **免费额度**：
  - 100 GB 带宽/月
  - 100 GB-Hours Serverless Function 执行时间
- **适合**：几乎所有个人项目

### 百度 AI

- **免费额度**：每天 50,000 次 OCR 调用
- **适合**：开发测试和小型应用

对于个人项目，完全可以免费使用！🎉
