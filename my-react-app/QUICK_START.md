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

## 完整功能设置（使用真实百度 AI）

### 前提条件
- 百度 AI 账号和 API Key（[获取方法](https://console.bce.baidu.com/ai/)）

### 步骤 1：配置后端

```bash
# 1. 进入 server 目录
cd server

# 2. 创建环境变量文件
touch .env

# 3. 编辑 .env 文件，添加你的百度 AI 密钥
# BAIDU_API_KEY=你的API_Key
# BAIDU_SECRET_KEY=你的Secret_Key
# PORT=3001

# 4. 安装依赖
npm install

# 或者从项目根目录运行：
# npm run server:install
```

### 步骤 2：配置前端

```bash
# 1. 返回项目根目录
cd ..

# 2. 创建环境变量文件
touch .env

# 3. 编辑 .env 文件
# VITE_BACKEND_URL=http://localhost:3001
# VITE_USE_MOCK_DATA=false
```

### 步骤 3：运行应用

需要两个终端窗口：

**终端 1 - 后端服务器：**
```bash
npm run server
```

看到这个表示成功：
```
🚀 Backend proxy server running on http://localhost:3001
```

**终端 2 - 前端应用：**
```bash
npm run dev
```

访问：`http://localhost:5173`

---

## 📋 可用命令

### 前端命令
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
npm run lint         # 运行代码检查
```

### 后端命令
```bash
npm run server              # 启动后端服务器
npm run server:install      # 安装后端依赖
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

### 前端 (`.env`)
```env
VITE_BACKEND_URL=http://localhost:3001    # 后端 API 地址
VITE_USE_MOCK_DATA=true                   # true=模拟数据, false=真实API
```

### 后端 (`server/.env`)
```env
BAIDU_API_KEY=your_api_key                # 百度 AI API Key
BAIDU_SECRET_KEY=your_secret_key          # 百度 AI Secret Key
PORT=3001                                  # 服务器端口
```

---

## ❓ 常见问题

### Q1: 如何获取百度 AI 密钥？
访问 [百度智能云控制台](https://console.bce.baidu.com/ai/)，创建应用后即可获得。

### Q2: 可以不配置 API 就使用吗？
可以！默认使用模拟数据，所有功能都能体验。

### Q3: 后端服务器是必须的吗？
- 模拟模式：不需要
- 真实 API：需要（用于代理百度 AI 请求，避免 CORS 问题）

### Q4: 环境变量文件找不到？
`.env` 文件需要手动创建，它们被 `.gitignore` 忽略，不会被提交到 Git。

---

## 📚 更多文档

- [README.md](./README.md) - 完整项目说明
- [BAIDU_AI_SETUP_CN.md](./BAIDU_AI_SETUP_CN.md) - 百度 AI 详细配置
- [ENV_SETUP.md](./ENV_SETUP.md) - 环境变量配置（英文）
- [CHANGES_SUMMARY.md](./CHANGES_SUMMARY.md) - 最近更改说明

---

## ✅ 验证安装

运行以下检查确保一切正常：

```bash
# 检查 Node.js 版本（推荐 18+）
node --version

# 检查依赖是否安装
ls node_modules

# 检查后端依赖
ls server/node_modules

# 检查环境变量文件（如果使用真实 API）
cat .env
cat server/.env
```

---

## 🎉 开始使用！

配置完成后，享受你的 React 学习之旅！

有问题？查看完整文档或检查浏览器控制台的错误信息。

