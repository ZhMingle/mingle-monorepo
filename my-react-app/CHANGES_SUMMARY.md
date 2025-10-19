# 项目架构说明

## 📝 当前架构

本项目采用 **Vercel Serverless Functions** 架构，实现前端和后端一体化部署。

## 🏗️ 架构设计

### 部署方案

```
Vercel 部署
├── 前端（React + Vite）
└── Serverless Functions（API 端点）
    ├── /api/baidu-token - 获取百度 Access Token
    └── /api/baidu-ocr - 车牌识别 OCR
```

### 工作流程

```
用户请求 → Vercel → Serverless Function → 百度 AI API → 返回结果
```

## 🔐 安全性设计

### 环境变量管理

**开发环境：**

- 使用模拟数据（默认）
- 无需配置 API 密钥
- 快速开发体验

**生产环境（Vercel）：**

- API 密钥存储在 Vercel Dashboard
- 环境变量：
  - `BAIDU_API_KEY`
  - `BAIDU_SECRET_KEY`
  - `VITE_USE_MOCK_DATA=false`

### 安全优势

- ✅ API 密钥仅存储在 Vercel 服务器端
- ✅ 前端代码不包含敏感信息
- ✅ Serverless Functions 自动处理请求
- ✅ 同域名部署，无 CORS 问题
- ✅ `.env` 文件已添加到 `.gitignore`

## 📂 项目结构

```
my-react-app/
├── .env                              # 本地环境变量（可选）
├── .gitignore                        # 包含 .env
│
├── api/                              # Vercel Serverless Functions
│   ├── baidu-token.js               # 获取百度 Access Token
│   └── baidu-ocr.js                 # 车牌识别 API
│
├── src/
│   ├── services/
│   │   └── licensePlateService.js   # 车牌识别服务（前端）
│   └── pages/
│       └── carwash/
│           └── CarWashPage.jsx      # 车牌识别页面
│
├── VERCEL_DEPLOY.md                 # Vercel 部署指南
├── BAIDU_AI_SETUP_CN.md            # 百度 AI 配置指南
└── README.md                        # 项目说明
```

## 🎯 使用模式

### 模式 1：本地开发（模拟数据）

```bash
npm install
npm run dev
```

- ✅ 无需配置
- ✅ 使用模拟车牌数据
- ✅ 快速开发

### 模式 2：Vercel 部署（真实 API）

```bash
# 1. 推送代码到 GitHub
git push

# 2. 在 Vercel 配置环境变量
# 3. 部署完成
```

- ✅ 真实 AI 识别
- ✅ 自动扩展
- ✅ 免费使用

## 🔄 从其他架构迁移

### 如果之前使用独立后端（Express）

**旧架构：**

```
前端 (Vite) + 后端 (Express) + 百度 API
```

**新架构：**

```
Vercel (前端 + Serverless Functions) + 百度 API
```

**迁移步骤：**

1. ✅ 删除 `server/` 目录（已完成）
2. ✅ 使用 `api/` 目录中的 Serverless Functions
3. ✅ 在 Vercel 配置环境变量
4. ✅ 部署到 Vercel

## 📊 架构对比

| 特性           | 独立后端     | Vercel Serverless |
| -------------- | ------------ | ----------------- |
| **部署复杂度** | 需要两个服务 | 一键部署          |
| **CORS**       | 需要配置     | 无需配置          |
| **扩展性**     | 手动管理     | 自动扩展          |
| **费用**       | 可能收费     | 免费额度          |
| **维护**       | 需要维护     | 零维护            |
| **安全性**     | 手动管理     | 自动管理          |

## ⚠️ 重要提示

### 环境变量

**不要提交 `.env` 文件！**

- `.env` 已添加到 `.gitignore`
- 生产环境使用 Vercel Dashboard 管理
- 本地开发使用模拟模式（无需配置）

### API 密钥管理

1. **获取密钥**：[百度智能云控制台](https://console.bce.baidu.com/ai/)
2. **配置密钥**：Vercel Dashboard → Settings → Environment Variables
3. **重新部署**：触发重新部署使配置生效

## 📚 相关文档

- **[VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)** - Vercel 详细部署指南
- **[BAIDU_AI_SETUP_CN.md](./BAIDU_AI_SETUP_CN.md)** - 百度 AI 配置（中文）
- **[QUICK_START.md](./QUICK_START.md)** - 快速入门指南
- **[ENV_SETUP.md](./ENV_SETUP.md)** - 环境变量配置

## ✅ 快速检查清单

### 本地开发

- [ ] 运行 `npm install`
- [ ] 运行 `npm run dev`
- [ ] 访问 `http://localhost:5173`
- [ ] 测试车牌识别（模拟模式）

### Vercel 部署

- [ ] 代码已推送到 GitHub
- [ ] 在 Vercel 导入仓库
- [ ] 配置环境变量（3个）
- [ ] 部署成功
- [ ] 测试真实 AI 识别

## 🔗 有用的链接

- [Vercel Dashboard](https://vercel.com/dashboard)
- [百度智能云控制台](https://console.bce.baidu.com/ai/)
- [Vercel Serverless Functions 文档](https://vercel.com/docs/functions)
- [Vite 环境变量文档](https://vitejs.dev/guide/env-and-mode.html)

---

**最后更新**: 2025-10-19  
**当前架构**: Vercel Serverless Functions  
**推荐用途**: 个人项目、学习项目、小型应用
