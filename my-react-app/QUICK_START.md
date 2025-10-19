# 🚀 快速入门指南

## 5 分钟快速体验

### 方式 1：模拟模式（推荐新手）

无需任何配置，直接运行：

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 打开浏览器访问
# http://localhost:5173
```

✅ 车牌识别功能会使用模拟数据，无需 API Key。

---

## 完整功能设置（Vercel 部署）

### 前提条件

- 百度 AI 账号和 API Key（[获取方法](https://console.bce.baidu.com/ai/)）
- GitHub 账号
- Vercel 账号（使用 GitHub 登录即可）

### 步骤 1：部署到 Vercel

```bash
# 1. 推送代码到 GitHub
git add .
git commit -m "Deploy to Vercel"
git push

# 2. 访问 vercel.com 并导入你的 GitHub 仓库
# Vercel 会自动检测 Vite 项目并部署
```

### 步骤 2：配置环境变量

在 Vercel 项目设置中：

1. 点击 "Settings" → "Environment Variables"
2. 添加以下变量：

```
BAIDU_API_KEY = 你的百度API_Key
BAIDU_SECRET_KEY = 你的百度Secret_Key
VITE_USE_MOCK_DATA = false
```

### 步骤 3：重新部署

- 点击 "Deployments" → "Redeploy"
- 或推送新的代码提交自动触发部署

访问你的 Vercel 网站 URL，车牌识别功能现在使用真实 AI！

---

## 本地开发（推荐模拟模式）

### 开发时使用模拟数据

```bash
# 直接运行，无需任何配置
npm run dev
```

### 或使用 Vercel CLI 测试 Serverless Functions

```bash
# 安装 Vercel CLI
npm i -g vercel

# 在项目根目录运行
vercel dev
```

这会在本地运行 Vercel Functions，但通常模拟模式就足够了。

---

## 📋 可用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
npm run lint         # 运行代码检查
npm run lint:fix     # 自动修复代码问题
npm run format       # 格式化代码
```

---

## 🎯 功能说明

### 车牌识别页面 (`/carwash`)

1. 点击"📷 拍照识别车牌"打开摄像头
2. 或点击"📁 上传图片"选择照片
3. 系统自动识别车牌号
4. 填写服务记录并保存

### 其他页面

- `/feedback` - 反馈系统
- `/sort` - 文章排序

---

## 🔧 环境变量说明

### 本地开发 (`.env` - 可选)

```env
VITE_USE_MOCK_DATA=true    # 使用模拟数据（默认）
```

### Vercel 生产环境（在 Vercel Dashboard 配置）

```
BAIDU_API_KEY=your_api_key
BAIDU_SECRET_KEY=your_secret_key
VITE_USE_MOCK_DATA=false
```

---

## ❓ 常见问题

### Q1: 如何获取百度 AI 密钥？

访问 [百度智能云控制台](https://console.bce.baidu.com/ai/)，创建应用后即可获得。

### Q2: 可以不配置 API 就使用吗？

可以！默认使用模拟数据，所有功能都能体验。

### Q3: 本地开发需要配置 API 吗？

不需要！本地开发推荐使用模拟模式：

- 无需配置
- 无需网络请求
- 开发体验更快

### Q4: Vercel 部署是免费的吗？

是的！Vercel 免费计划包括：

- 无限部署
- Serverless Functions
- 自动 HTTPS
- 适合个人项目

---

## 📚 更多文档

- [README.md](./README.md) - 完整项目说明
- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - Vercel 详细部署指南
- [BAIDU_AI_SETUP_CN.md](./BAIDU_AI_SETUP_CN.md) - 百度 AI 详细配置
- [CHANGES_SUMMARY.md](./CHANGES_SUMMARY.md) - 最近更改说明

---

## ✅ 验证安装

运行以下检查确保一切正常：

```bash
# 检查 Node.js 版本（推荐 18+）
node --version

# 检查依赖是否安装
ls node_modules

# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
# 应该能看到应用正常运行
```

---

## 🎉 开始使用！

- **本地开发**：直接 `npm run dev`，使用模拟数据
- **生产部署**：推送到 GitHub，在 Vercel 配置 API 密钥

配置完成后，享受你的 React 学习之旅！

有问题？查看完整文档或检查浏览器控制台的错误信息。
