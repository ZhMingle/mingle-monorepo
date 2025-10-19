# 百度 AI 车牌识别集成指南

本文档介绍如何配置和使用百度 AI 车牌识别功能。

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

## 🔑 配置真实 API（完整功能）

### 第一步：获取百度 AI 密钥

1. 访问 [百度智能云控制台](https://console.bce.baidu.com/ai/)
2. 如果没有账号，先注册并登录
3. 进入"产品服务" -> "人工智能" -> "文字识别"
4. 创建一个新应用或使用现有应用
5. 在应用详情页面找到：
   - **API Key**
   - **Secret Key**

### 第二步：配置后端环境变量

在 `server/` 目录下创建 `.env` 文件：

```bash
cd server
touch .env
```

编辑 `.env` 文件，填入你的密钥：

```env
BAIDU_API_KEY=你的API_Key
BAIDU_SECRET_KEY=你的Secret_Key
PORT=3001
```

安装后端依赖：

```bash
npm install
```

### 第三步：配置前端环境变量

在项目根目录创建 `.env` 文件：

```bash
cd ..
touch .env
```

编辑 `.env` 文件：

```env
VITE_BACKEND_URL=http://localhost:3001
VITE_USE_MOCK_DATA=false
```

**重要**：将 `VITE_USE_MOCK_DATA` 设置为 `false` 以启用真实 API。

### 第四步：启动服务

需要同时运行前端和后端：

**终端 1 - 启动后端服务器：**

```bash
cd server
npm run dev
```

你应该看到：

```
🚀 Backend proxy server running on http://localhost:3001
```

**终端 2 - 启动前端：**

```bash
npm run dev
```

访问 `http://localhost:5173`，现在车牌识别功能使用的是真实的百度 AI API！

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

### 为什么需要后端代理？

```
浏览器 → 后端代理服务器 → 百度 AI API
```

- **安全性**：API 密钥保存在服务器端，不暴露给浏览器
- **CORS**：避免跨域请求问题
- **令牌管理**：后端缓存访问令牌（有效期 30 天）

## 📂 文件结构

```
my-react-app/
├── .env                              # 前端环境变量（不提交）
├── .gitignore                        # 包含 .env
├── src/
│   ├── services/
│   │   └── licensePlateService.js   # 车牌识别服务
│   └── pages/
│       └── carwash/
│           └── CarWashPage.jsx      # 车牌识别页面
└── server/
    ├── .env                         # 后端环境变量（不提交）
    ├── index.js                     # Express 代理服务器
    └── package.json                 # 后端依赖
```

## 🐛 常见问题

### 1. "Server configuration error" 错误

**原因**：后端环境变量未配置

**解决**：

- 检查 `server/.env` 文件是否存在
- 确认 `BAIDU_API_KEY` 和 `BAIDU_SECRET_KEY` 已设置
- 重启后端服务器

### 2. 车牌识别失败

**可能原因**：

- API 密钥错误
- 网络连接问题
- 图片质量太差
- 百度 API 配额用完

**解决**：

- 检查控制台错误信息
- 验证 API 密钥是否正确
- 使用清晰的车牌照片
- 检查百度账户配额

### 3. CORS 错误

**原因**：后端服务器未运行

**解决**：

- 确保后端服务器在运行（`cd server && npm run dev`）
- 检查 `VITE_BACKEND_URL` 是否正确（默认：`http://localhost:3001`）

### 4. 摄像头无法访问

**原因**：

- 浏览器未授予摄像头权限
- 网站未使用 HTTPS（生产环境）

**解决**：

- 点击浏览器地址栏的权限图标，允许摄像头访问
- 开发环境使用 `localhost` 即可
- 生产环境需要 HTTPS

## 💡 开发提示

### 切换模式

**开发测试**（使用模拟数据）：

```env
# .env
VITE_USE_MOCK_DATA=true
```

**生产环境**（使用真实 API）：

```env
# .env
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
    // 2. 调用后端代理 API
    // 3. 处理响应并返回结果
    // 4. 错误时回退到模拟模式
  }
}
```

### 后端代理

```javascript
// server/index.js
app.post('/api/baidu/token', async (req, res) => {
  // 从环境变量读取密钥
  // 调用百度 API 获取 access_token
  // 返回给前端
});

app.post('/api/baidu/ocr', async (req, res) => {
  // 接收图片 base64
  // 调用百度车牌识别 API
  // 返回识别结果
});
```

## 📚 相关文档

- [百度 AI 文档](https://ai.baidu.com/ai-doc/OCR/zk3h7xz52)
- [ENV_SETUP.md](./ENV_SETUP.md) - 英文版环境配置指南
- [server/README.md](./server/README.md) - 后端服务器文档

## ✅ 检查清单

配置完成后，检查以下项目：

- [ ] 已获取百度 AI API Key 和 Secret Key
- [ ] 已创建 `server/.env` 并填入密钥
- [ ] 已创建项目根目录 `.env` 并配置
- [ ] 后端依赖已安装（`cd server && npm install`）
- [ ] 后端服务器运行正常
- [ ] 前端可以成功调用车牌识别

## 🎉 完成！

现在你的应用已经完全集成了百度 AI 车牌识别功能！

如有问题，请查看：

- 浏览器控制台错误信息
- 后端服务器日志
- 百度智能云控制台的 API 调用记录
