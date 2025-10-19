# 百度 AI 车牌识别集成 - 变更总结

## 📝 更改概述

将原本硬编码的 API Key 改为使用环境变量，并完善了百度 AI 车牌识别服务的集成。

## 🔐 主要改进

### 1. 安全性提升

- ✅ 移除硬编码的 API Key 和 Secret Key
- ✅ 使用环境变量管理敏感信息
- ✅ 更新 `.gitignore` 防止 `.env` 文件被提交
- ✅ API 密钥仅保存在服务器端

### 2. 代码重构

#### 前端 (`src/services/licensePlateService.js`)

**修改前：**

```javascript
const BAIDU_API_KEY = 'xxx'; // 硬编码（不安全）
const BAIDU_SECRET_KEY = 'xxx'; // 硬编码（不安全）
```

**修改后：**

```javascript
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';
// API 密钥通过后端管理，前端不再需要
```

**改进：**

- 使用环境变量控制模拟/真实 API 模式
- 移除前端硬编码的密钥
- 完善错误处理和回退机制

#### 后端 (`server/index.js`)

**修改前：**

```javascript
// 从请求体接收密钥（不安全）
const { apiKey, secretKey } = req.body;
```

**修改后：**

```javascript
import dotenv from 'dotenv';
dotenv.config();

const BAIDU_API_KEY = process.env.BAIDU_API_KEY;
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY;
```

**改进：**

- 从环境变量读取密钥
- 添加密钥验证和错误提示
- 更好的错误处理

### 3. 新增文件

#### 配置文件

1. **`server/.env`** (需手动创建)

   ```env
   BAIDU_API_KEY=your_key_here
   BAIDU_SECRET_KEY=your_secret_here
   PORT=3001
   ```

2. **`.env`** (项目根目录，需手动创建)
   ```env
   VITE_BACKEND_URL=http://localhost:3001
   VITE_USE_MOCK_DATA=true
   ```

#### 文档文件

1. **`ENV_SETUP.md`** - 英文环境变量配置指南
2. **`BAIDU_AI_SETUP_CN.md`** - 中文百度 AI 配置指南
3. **`server/README.md`** - 后端服务器文档
4. **`CHANGES_SUMMARY.md`** - 本文件

### 4. 更新文件

#### `.gitignore`

新增：

```gitignore
# Environment variables
.env
.env.local
.env.*.local
server/.env
```

#### `server/package.json`

新增依赖：

```json
"dotenv": "^16.3.1"
```

#### `README.md`

- ✅ 更新项目特性说明
- ✅ 添加车牌识别功能介绍
- ✅ 完善技术栈说明
- ✅ 添加环境变量配置步骤
- ✅ 新增安全性和 API 集成章节
- ✅ 更新学习要点

## 📂 完整文件结构

```
my-react-app/
├── .env                              # 前端环境变量（需创建，不提交）
├── .env.example                      # 前端环境变量模板（被 ignore 阻止）
├── .gitignore                        # 已更新，包含 .env
├── README.md                         # 已更新，包含完整说明
├── ENV_SETUP.md                      # 新增：环境变量配置指南（英文）
├── BAIDU_AI_SETUP_CN.md             # 新增：百度 AI 配置指南（中文）
├── CHANGES_SUMMARY.md                # 新增：本变更总结
│
├── src/
│   ├── services/
│   │   └── licensePlateService.js   # 已更新：移除硬编码密钥
│   └── pages/
│       └── carwash/
│           └── CarWashPage.jsx      # 已更新：改进 API 调用
│
└── server/                           # 后端代理服务器
    ├── .env                         # 后端环境变量（需创建，不提交）
    ├── .env.example                 # 后端环境变量模板（被 ignore 阻止）
    ├── index.js                     # 已更新：使用环境变量
    ├── package.json                 # 已更新：添加 dotenv
    └── README.md                    # 新增：后端服务器文档
```

## 🔄 迁移步骤

如果你之前使用硬编码的版本，请按以下步骤迁移：

### 步骤 1：备份现有密钥

如果你之前在代码中有密钥，先记录下来。

### 步骤 2：创建环境变量文件

**后端：**

```bash
cd server
touch .env
```

编辑 `server/.env`：

```env
BAIDU_API_KEY=你之前的API_Key
BAIDU_SECRET_KEY=你之前的Secret_Key
PORT=3001
```

**前端：**

```bash
cd ..
touch .env
```

编辑 `.env`：

```env
VITE_BACKEND_URL=http://localhost:3001
VITE_USE_MOCK_DATA=false  # 如果想使用真实 API
```

### 步骤 3：安装后端依赖

```bash
cd server
npm install
```

### 步骤 4：测试

1. 启动后端：`cd server && npm run dev`
2. 启动前端：`npm run dev`
3. 测试车牌识别功能

## ⚠️ 重要提示

### 现有用户注意事项：

1. **不要提交 `.env` 文件**
   - `.env` 文件已添加到 `.gitignore`
   - 如果之前误提交了包含密钥的代码，需要：
     - 在百度控制台重置密钥
     - 从 Git 历史中移除敏感信息

2. **环境变量命名**
   - 前端：必须以 `VITE_` 开头（Vite 要求）
   - 后端：可以任意命名

3. **开发 vs 生产**
   - 开发：可以使用 `VITE_USE_MOCK_DATA=true` 模拟数据
   - 生产：设置为 `false` 使用真实 API

## 🎯 使用场景

### 场景 1：快速体验（无需 API）

```bash
npm install
npm run dev
```

自动使用模拟数据。

### 场景 2：完整功能（需要 API）

```bash
# 配置 .env 文件
cd server && npm install && npm run dev  # 终端 1
npm run dev                               # 终端 2
```

### 场景 3：生产部署

- 在服务器上设置环境变量
- 不要将 `.env` 文件部署到服务器
- 使用平台提供的环境变量管理（如 Heroku Config Vars, Vercel Environment Variables）

## 📊 对比总结

| 项目         | 修改前                | 修改后             |
| ------------ | --------------------- | ------------------ |
| API Key 存储 | 硬编码在代码中        | 环境变量           |
| 安全性       | ❌ 低（密钥暴露）     | ✅ 高（服务器端）  |
| 灵活性       | ❌ 需修改代码切换     | ✅ 修改环境变量    |
| 版本控制     | ❌ 密钥可能被提交     | ✅ .gitignore 保护 |
| 部署         | ❌ 每个环境需修改代码 | ✅ 使用环境变量    |
| 文档         | ❌ 缺少配置说明       | ✅ 完整文档        |

## ✅ 验证清单

完成迁移后，请检查：

- [ ] `server/.env` 文件已创建并包含正确的密钥
- [ ] 项目根目录 `.env` 文件已创建
- [ ] `.gitignore` 包含 `.env` 和 `server/.env`
- [ ] Git 状态中没有 `.env` 文件
- [ ] 后端服务器可以正常启动
- [ ] 车牌识别功能正常工作
- [ ] 控制台没有 API 密钥相关的警告

## 🔗 相关链接

- [百度智能云控制台](https://console.bce.baidu.com/ai/)
- [百度 OCR API 文档](https://ai.baidu.com/ai-doc/OCR/zk3h7xz52)
- [Vite 环境变量文档](https://vitejs.dev/guide/env-and-mode.html)
- [dotenv 文档](https://github.com/motdotla/dotenv)

## 📞 支持

如果遇到问题：

1. 查看 `BAIDU_AI_SETUP_CN.md` 中的常见问题部分
2. 检查浏览器控制台和后端日志
3. 验证环境变量是否正确设置

---

**变更日期**: 2025-10-19
**变更类型**: 安全性改进 + 功能完善
**影响范围**: 车牌识别功能、环境变量管理、文档
