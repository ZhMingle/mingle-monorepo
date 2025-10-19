# 🚀 Vercel 一键部署指南（无需独立后端）

## ✨ 好消息！

**你不需要部署独立的后端服务器！**

Vercel 支持 Serverless Functions，可以在同一个项目中处理 API 请求。

## 📂 项目结构

```
my-react-app/
├── api/                    # Vercel Serverless Functions
│   ├── baidu-token.js     # 获取百度 API Token
│   └── baidu-ocr.js       # 车牌识别 OCR
├── src/                    # React 前端代码
└── ...
```

## 🎯 部署步骤

### 步骤 1：推送代码到 GitHub

```bash
git add .
git commit -m "Add Vercel Serverless Functions for Baidu AI"
git push
```

### 步骤 2：在 Vercel 配置环境变量

1. 登录 [Vercel](https://vercel.com/)
2. 进入你的项目
3. 点击 "Settings"
4. 点击 "Environment Variables"
5. 添加以下三个变量：

```
Name: BAIDU_API_KEY
Value: 你的百度_API_Key（从百度控制台获取）

Name: BAIDU_SECRET_KEY
Value: 你的百度_Secret_Key（从百度控制台获取）

Name: VITE_USE_MOCK_DATA
Value: false
```

### 步骤 3：重新部署

在 Vercel 点击 "Deployments" → 选择最新部署 → "Redeploy"

或者推送一个新提交：

```bash
git commit --allow-empty -m "Trigger redeploy with API functions"
git push
```

### 步骤 4：测试

访问你的网站，车牌识别功能现在使用真实的百度 AI！

---

## 🎉 完成！

现在你的应用：

- ✅ 前端部署在 Vercel
- ✅ API 函数也在 Vercel（同一个项目）
- ✅ 无需管理独立的后端服务器
- ✅ 完全免费

---

## 🔧 工作原理

### 前端调用：

```javascript
// 自动使用同域名下的 API 路由
fetch('/api/baidu-token', { method: 'POST' })
fetch('/api/baidu-ocr', { method: 'POST', body: ... })
```

### Vercel 处理：

```
你的网站.vercel.app/          → React 前端
你的网站.vercel.app/api/baidu-token  → Serverless Function
你的网站.vercel.app/api/baidu-ocr    → Serverless Function
```

---

## 🆚 对比：Vercel vs 独立后端

### Vercel Serverless Functions（推荐）✅

- ✅ 无需管理服务器
- ✅ 自动扩展
- ✅ 同域名，无 CORS 问题
- ✅ 完全免费
- ✅ 部署简单

### 独立后端服务器（Railway/Render）

- 需要管理两个部署
- 可能有费用
- 需要配置 CORS
- 更复杂

---

## 💡 本地开发

在本地开发时，Vercel CLI 会自动运行 API 函数：

```bash
# 安装 Vercel CLI（可选）
npm i -g vercel

# 运行本地开发服务器
vercel dev
```

或者继续使用 `npm run dev` + 模拟数据：

```
VITE_USE_MOCK_DATA=true
```

---

## ❓ 常见问题

### Q: API 函数有使用限制吗？

Vercel 免费计划：

- 100 GB 带宽/月
- 100 GB-Hours 函数执行时间
- 对个人项目完全够用

### Q: 如何查看 API 函数日志？

1. Vercel 项目 → Functions
2. 点击函数名称
3. 查看实时日志和调用次数

### Q: 可以使用自定义域名吗？

可以！在 Vercel Settings → Domains 添加你的域名。

---

## 🔐 安全说明

✅ API Key 存储在 Vercel 环境变量中  
✅ 不会暴露给前端  
✅ 不会被提交到 Git  
✅ 只有 Serverless Functions 可以访问

---

## 📝 总结

使用 Vercel Serverless Functions：

- **前端 + 后端 = 一个项目**
- **一次部署，全部完成**
- **无需额外配置**

完美的解决方案！🎉
