# 🚀 本地开发环境快速设置

## 📋 在本地调用百度文字识别服务

### 第一步：配置环境变量

1. **复制环境变量模板：**

```bash
cp env.example .env.local
```

2. **编辑 `.env.local` 文件，填入你的百度 API 密钥：**

```bash
# 百度 AI API 配置
BAIDU_API_KEY=你的API_KEY
BAIDU_SECRET_KEY=你的SECRET_KEY

# 开发环境配置 - 设为 false 使用真实 API
VITE_USE_MOCK_DATA=false
```

> 💡 如何获取 API 密钥？查看 `BAIDU_AI_SETUP_CN.md`

### 第二步：启动开发环境

**选择以下任一方式：**

#### 方式 A：一键启动（推荐 ⭐）

```bash
./dev-with-api.sh
```

这个脚本会自动启动：

- Vercel Dev Server（处理 API 请求）：`http://localhost:3000`
- Vite Dev Server（前端）：`https://localhost:5173`

#### 方式 B：手动启动（更灵活）

**终端 1 - 启动 API 服务器：**

```bash
vercel dev --listen 3000
```

**终端 2 - 启动前端服务器：**

```bash
npm run dev
```

### 第三步：测试

1. **打开浏览器访问：** `https://localhost:5173`

2. **进入洗车管理页面**

3. **点击"拍照"或"上传"按钮**，选择一张车牌图片

4. **查看控制台日志**，你会看到：
   ```
   🔍 开始识别车牌...
   ✅ Token 获取成功
   📷 正在调用百度 OCR API...
   ✅ 识别成功: ABC123
   ```

## 🔍 工作原理

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   浏览器    │ ------> │ Vite Proxy   │ ------> │ Vercel Dev  │
│             │ /api/*  │ :5173        │         │ :3000       │
└─────────────┘         └──────────────┘         └──────┬──────┘
                                                          │
                                                          │ API 调用
                                                          ↓
                                                   ┌─────────────┐
                                                   │  百度 AI    │
                                                   │  OCR API    │
                                                   └─────────────┘
```

**流程说明：**

1. 前端代码调用 `/api/baidu-token`
2. Vite 代理将请求转发到 `http://localhost:3000/api/baidu-token`
3. Vercel Dev 执行 `api/baidu-token.js` 这个 Serverless Function
4. Serverless Function 从环境变量读取 API 密钥，调用百度 API
5. 返回 access token 给前端
6. 前端使用 token 调用 OCR 识别

## 📝 常用命令

```bash
# 查看 Vercel Dev 运行状态
ps aux | grep vercel

# 查看 API 日志
tail -f .dev-logs/vercel.log

# 重启开发环境（如果遇到问题）
pkill -f "vercel dev"
pkill -f "vite"
./dev-with-api.sh

# 只启动前端（不需要 API）
npm run dev
```

## 🐛 常见问题

### Q1: 提示"Failed to get access token"

**可能原因：**

- `.env.local` 文件不存在或配置错误
- API 密钥错误
- Vercel Dev Server 未启动

**解决方法：**

```bash
# 1. 检查环境变量文件
cat .env.local

# 2. 确保 Vercel Dev 正在运行
ps aux | grep "vercel dev"

# 3. 重启服务
./dev-with-api.sh
```

### Q2: 端口 3000 已被占用

**解决方法：**

```bash
# 查找占用进程
lsof -i :3000

# 杀死进程（替换 PID）
kill -9 <PID>

# 或使用其他端口
vercel dev --listen 3001

# 同时修改 vite.config.js 中的 proxy target
```

### Q3: 环境变量不生效

**原因：** Vercel Dev 需要重启才能读取新的环境变量

**解决方法：**

```bash
# 1. 停止 Vercel Dev
pkill -f "vercel dev"

# 2. 重新启动
vercel dev --listen 3000
```

### Q4: 识别结果不准确

**原因：** 可能是图片质量或车牌类型问题

**调试方法：**

1. 打开浏览器控制台
2. 查看详细的 API 响应
3. 尝试不同的图片
4. 查看 `licensePlateService.js` 中的过滤逻辑

## 🎯 快速测试 API

不想启动整个前端？可以用 curl 直接测试：

```bash
# 1. 启动 Vercel Dev
vercel dev --listen 3000

# 2. 测试获取 token
curl -X POST http://localhost:3000/api/baidu-token \
  -H "Content-Type: application/json"

# 输出示例：
# {"access_token":"24.xxx.xxx","expires_in":2592000}
```

## 📚 更多资源

- **完整开发指南：** `DEV_GUIDE.md`
- **百度 API 配置：** `BAIDU_AI_SETUP_CN.md`
- **项目快速开始：** `QUICK_START.md`

## 🎉 开始开发！

现在你可以：

- ✅ 在本地测试车牌识别功能
- ✅ 调试前端和后端代码
- ✅ 查看详细的 API 调用日志
- ✅ 快速迭代和测试

有问题随时查看文档或控制台日志！
