# 🚀 开发环境指南

## 📋 目录

- [快速开始](#快速开始)
- [开发模式说明](#开发模式说明)
- [API 调用配置](#api-调用配置)
- [环境变量配置](#环境变量配置)
- [常见问题](#常见问题)

## 🎯 快速开始

### 方式 1：完整开发环境（推荐）

同时启动前端和 API 服务：

```bash
# 使用脚本启动
./dev-with-api.sh

# 或使用 npm 命令
npm run dev:full
```

这会同时启动：

- ✅ Vite Dev Server（前端）：`https://localhost:5173`
- ✅ Vercel Dev Server（API）：`http://localhost:3000`

### 方式 2：分别启动（手动控制）

**终端 1 - 启动 API 服务：**

```bash
npm run dev:api
# 或
vercel dev --listen 3000
```

**终端 2 - 启动前端服务：**

```bash
npm run dev
```

### 方式 3：仅前端开发（代理到生产环境）

如果你不需要在本地运行 API，可以直接代理到生产环境。

修改 `vite.config.js`：

```javascript
proxy: {
  '/api': {
    target: 'https://car-washing-two.vercel.app',
    changeOrigin: true,
    secure: true,
  },
}
```

然后运行：

```bash
npm run dev
```

## 📦 开发模式说明

### 1. 完整开发模式（推荐用于开发新功能）

**特点：**

- ✅ 前端和后端都在本地运行
- ✅ 可以调试 Serverless Functions
- ✅ 支持热重载
- ✅ 完全离线开发

**使用场景：**

- 开发新的 API 功能
- 调试 Serverless Functions
- 需要修改后端逻辑

**启动命令：**

```bash
./dev-with-api.sh
```

### 2. 前端开发模式（推荐用于 UI 开发）

**特点：**

- ✅ 仅启动前端
- ✅ API 请求代理到生产环境
- ✅ 快速启动
- ✅ 适合纯前端开发

**使用场景：**

- 开发前端界面
- 调整样式和布局
- API 不需要修改

**启动命令：**

```bash
npm run dev
```

## 🔧 API 调用配置

### Vite 代理配置

在 `vite.config.js` 中已配置：

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',  // 本地 Vercel Dev Server
      changeOrigin: true,
      secure: false,
    },
  },
}
```

### 前端 API 调用示例

```javascript
// 自动使用代理，无需修改代码
const response = await fetch('/api/baidu-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
});
```

在开发环境中：

- 请求 `/api/baidu-token` → 代理到 `http://localhost:3000/api/baidu-token`

在生产环境中：

- 请求 `/api/baidu-token` → 直接访问 Vercel Serverless Function

## 🌍 环境变量配置

### 本地开发环境变量

创建 `.env.local` 文件（已在 `.gitignore` 中）：

```bash
# 百度 AI API 配置
BAIDU_API_KEY=your_api_key_here
BAIDU_SECRET_KEY=your_secret_key_here

# 开发环境配置
VITE_USE_MOCK_DATA=false
```

### Vercel 生产环境变量

在 Vercel Dashboard 中配置：

1. 进入项目设置
2. 选择 "Environment Variables"
3. 添加以下变量：
   - `BAIDU_API_KEY`
   - `BAIDU_SECRET_KEY`
   - `VITE_USE_MOCK_DATA` (设为 `false`)

## 📝 开发工作流

### 典型开发流程

1. **启动开发环境**

   ```bash
   ./dev-with-api.sh
   ```

2. **修改代码**
   - 前端代码：`src/` 目录，自动热重载
   - API 代码：`api/` 目录，Vercel Dev 自动重载

3. **测试功能**
   - 打开浏览器：`https://localhost:5173`
   - 打开控制台查看日志
   - 测试 API 调用

4. **提交代码**

   ```bash
   git add .
   git commit -m "fix: your changes"
   git push
   ```

5. **自动部署**
   - Vercel 自动检测 push 并部署
   - 部署完成后测试生产环境

## ❓ 常见问题

### Q1: API 调用失败，显示 404

**原因：** Vercel Dev Server 未启动

**解决：**

```bash
# 检查 3000 端口是否被占用
lsof -i :3000

# 重新启动完整开发环境
./dev-with-api.sh
```

### Q2: 环境变量未生效

**原因：** 环境变量文件未正确配置

**解决：**

1. 确保 `.env.local` 文件存在
2. 变量名称正确（`BAIDU_API_KEY`, `BAIDU_SECRET_KEY`）
3. 重启开发服务器

```bash
# 检查环境变量
cat .env.local

# 重启服务
./dev-with-api.sh
```

### Q3: HTTPS 证书错误

**原因：** 本地 HTTPS 证书未信任

**解决：**

```bash
# 重新生成证书
brew install mkcert
mkcert -install
mkcert localhost 127.0.0.1
```

### Q4: 代理不工作

**原因：** Vite 代理配置问题

**检查：**

1. `vite.config.js` 中的代理配置是否正确
2. Vercel Dev Server 是否在 3000 端口运行
3. 重启 Vite 服务器

### Q5: 想要使用生产环境的 API

**解决：**

修改 `vite.config.js`：

```javascript
proxy: {
  '/api': {
    target: 'https://car-washing-two.vercel.app',
    changeOrigin: true,
    secure: true,
  },
}
```

然后只运行：

```bash
npm run dev
```

## 🔍 调试技巧

### 1. 查看 API 日志

Vercel Dev Server 的日志会显示在终端或 `.dev-logs/vercel.log`：

```bash
# 实时查看日志
tail -f .dev-logs/vercel.log
```

### 2. 浏览器开发者工具

- **Network 标签**：查看 API 请求和响应
- **Console 标签**：查看前端日志
- **Application 标签**：查看 localStorage 数据

### 3. 使用 curl 测试 API

```bash
# 测试获取 token
curl -X POST http://localhost:3000/api/baidu-token \
  -H "Content-Type: application/json"

# 测试车牌识别（需要 base64 图片）
curl -X POST http://localhost:3000/api/baidu-ocr \
  -H "Content-Type: application/json" \
  -d '{"image":"your_base64_image","accessToken":"your_token"}'
```

## 📚 相关文档

- [Vite 配置文档](https://vitejs.dev/config/)
- [Vercel CLI 文档](https://vercel.com/docs/cli)
- [百度 AI API 文档](https://ai.baidu.com/ai-doc)

## 🎉 开发愉快！

如有问题，请查看项目的其他文档：

- `README.md` - 项目概述
- `QUICK_START.md` - 快速开始指南
- `BAIDU_AI_SETUP_CN.md` - 百度 AI 配置指南
