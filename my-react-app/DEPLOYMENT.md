# 🚀 完整部署指南（真实 AI 功能）

本指南帮助你部署带有真实百度 AI 车牌识别功能的完整应用。

## 📋 部署架构

```
前端 (Vercel)  →  后端 (Railway)  →  百度 AI API
```

## 第一步：部署后端到 Railway

### 1. 准备后端代码

确保你的 `server/` 目录结构正确：
```
server/
├── index.js
├── package.json
└── .env (本地测试用，不会被部署)
```

### 2. 在 Railway 上创建项目

1. 访问 [Railway.app](https://railway.app/)
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 选择 "Deploy from GitHub repo"
5. 选择你的仓库
6. Railway 会自动检测到 Node.js 项目

### 3. 配置 Railway 环境变量

在 Railway 项目中：
- 点击你的服务
- 进入 "Variables" 标签
- 添加以下环境变量：

```
BAIDU_API_KEY=你的百度_API_Key
BAIDU_SECRET_KEY=你的百度_Secret_Key
PORT=3001
NODE_ENV=production
```

### 4. 配置 Railway 启动命令

在 Railway 的 Settings 中：
- **Root Directory**: `server`
- **Start Command**: `node index.js`

### 5. 部署

Railway 会自动部署。部署成功后，你会得到一个 URL，类似：
```
https://your-project.up.railway.app
```

**记下这个 URL！**

---

## 第二步：配置 Vercel 前端

### 1. 在 Vercel 配置环境变量

进入你的 Vercel 项目：
1. 点击 "Settings"
2. 点击 "Environment Variables"
3. 添加以下变量：

```
Name: VITE_BACKEND_URL
Value: https://your-project.up.railway.app

Name: VITE_USE_MOCK_DATA
Value: false
```

### 2. 重新部署

- 在 Vercel 点击 "Deployments"
- 点击最新的部署旁边的 "..." 菜单
- 选择 "Redeploy"

或者推送一个新的提交到 GitHub，Vercel 会自动重新部署。

---

## 第三步：测试

1. 访问你的 Vercel 网站
2. 进入车牌识别页面
3. 上传一张车牌图片或拍照
4. 系统应该能识别出真实的车牌号

---

## 🎯 Railway 替代方案

如果你不想用 Railway，这里是其他选项：

### Render.com

**优点**：免费层，简单易用
**步骤**：
1. 注册 [Render.com](https://render.com/)
2. New → Web Service
3. 连接 GitHub 仓库
4. Root Directory: `server`
5. Build Command: `npm install`
6. Start Command: `node index.js`
7. 添加环境变量

### Fly.io

**优点**：性能好，免费额度
**步骤**：
```bash
cd server
flyctl launch
flyctl secrets set BAIDU_API_KEY=你的百度_API_Key
flyctl secrets set BAIDU_SECRET_KEY=你的百度_Secret_Key
flyctl deploy
```

---

## 🔧 故障排查

### 后端无法访问

1. 检查 Railway 日志：
   - Railway 项目 → 点击服务 → Deployments → 查看日志
   
2. 确认环境变量已设置：
   - Variables 标签 → 确认所有变量都在

3. 测试后端健康检查：
   ```
   访问：https://your-project.up.railway.app/health
   应该返回：{"status":"ok","message":"Backend server is running"}
   ```

### 前端无法调用后端

1. 检查 Vercel 环境变量：
   - Settings → Environment Variables
   - 确认 `VITE_BACKEND_URL` 正确
   - 确认 `VITE_USE_MOCK_DATA=false`

2. 查看浏览器控制台错误

3. 确认后端允许 CORS：
   - 我们的 `server/index.js` 已经配置了 `cors()`

### API 调用失败

1. 检查百度 API 配额：
   - 访问 [百度智能云控制台](https://console.bce.baidu.com/ai/)
   - 查看 API 调用次数

2. 验证 API Key：
   - 确认 Railway 中的 API Key 正确
   - 尝试在百度控制台重置密钥

---

## 📊 费用说明

### Railway
- **免费额度**：每月 $5 credit（约 500 小时运行时间）
- **超出后**：按使用量付费
- **适合**：小型项目、个人项目

### Render
- **免费层**：每月 750 小时
- **限制**：15分钟无活动后休眠
- **适合**：演示项目

### Vercel (前端)
- **免费额度**：100 GB 带宽/月
- **适合**：几乎所有个人项目

---

## 🔐 安全建议

1. **定期检查 API 使用量**
   - 设置百度云的预算提醒
   
2. **保护你的密钥**
   - 永远不要提交 `.env` 文件
   - 使用平台的环境变量功能
   
3. **监控后端日志**
   - 定期检查 Railway 日志
   - 关注异常的 API 调用

---

## 📝 快速配置清单

### 后端（Railway）
- [ ] 创建 Railway 项目
- [ ] 连接 GitHub 仓库
- [ ] 设置 Root Directory 为 `server`
- [ ] 配置环境变量（3个）
- [ ] 部署成功
- [ ] 获取后端 URL
- [ ] 测试 `/health` 端点

### 前端（Vercel）
- [ ] 添加 `VITE_BACKEND_URL` 环境变量
- [ ] 添加 `VITE_USE_MOCK_DATA=false`
- [ ] 重新部署
- [ ] 测试车牌识别功能

---

## 🎉 完成！

配置完成后，你的应用就能使用真实的百度 AI 车牌识别功能了！

如有问题，检查：
1. Railway 后端日志
2. Vercel 构建日志
3. 浏览器控制台错误
4. 百度 API 配额使用情况

