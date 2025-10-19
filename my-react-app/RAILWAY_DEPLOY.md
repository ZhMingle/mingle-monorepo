# 🚂 Railway 快速部署指南

## 5 分钟部署后端

### 步骤 1：推送代码到 GitHub

确保你的最新代码已经推送到 GitHub：

```bash
git add .
git commit -m "Add backend server for Baidu AI OCR"
git push
```

### 步骤 2：在 Railway 创建项目

1. 访问 [railway.app](https://railway.app/)
2. 点击 "Login" → 使用 GitHub 登录
3. 点击 "New Project"
4. 选择 "Deploy from GitHub repo"
5. 选择你的仓库：`learn-react/my-react-app`
6. Railway 会自动开始部署

### 步骤 3：配置环境变量

部署完成后：

1. 点击你的服务（service）
2. 点击 "Variables" 标签
3. 点击 "New Variable"，依次添加：

```
BAIDU_API_KEY
你的百度_API_Key

BAIDU_SECRET_KEY
你的百度_Secret_Key

PORT
3001
```

4. 点击 "Deploy" 按钮重新部署

### 步骤 4：获取后端 URL

1. 在 Railway 项目中点击 "Settings"
2. 找到 "Domains" 部分
3. 点击 "Generate Domain"
4. 会生成一个类似这样的 URL：
   ```
   https://your-project-production.up.railway.app
   ```
5. **复制这个 URL！**

### 步骤 5：测试后端

在浏览器访问：
```
https://your-project-production.up.railway.app/health
```

应该看到：
```json
{"status":"ok","message":"Backend server is running"}
```

✅ 如果看到这个，后端部署成功！

---

## 配置 Vercel 前端

### 1. 登录 Vercel

访问 [vercel.com](https://vercel.com/)，找到你的项目

### 2. 添加环境变量

1. 进入你的项目
2. 点击 "Settings"
3. 点击 "Environment Variables"
4. 添加两个变量：

**变量 1：**
```
Name: VITE_BACKEND_URL
Value: https://your-project-production.up.railway.app
```
（注意：替换成你的 Railway URL）

**变量 2：**
```
Name: VITE_USE_MOCK_DATA
Value: false
```

### 3. 重新部署

有两种方式：

**方式 1：在 Vercel 界面**
1. 点击 "Deployments"
2. 找到最新的部署
3. 点击右侧 "..." 菜单
4. 选择 "Redeploy"

**方式 2：推送代码**
```bash
git commit --allow-empty -m "Trigger Vercel redeploy"
git push
```

---

## 🎯 完成！测试功能

1. 访问你的 Vercel 网站
2. 进入车牌识别页面（`/carwash`）
3. 上传一张车牌图片或拍照
4. 等待几秒
5. 应该能看到真实的 AI 识别结果！

---

## ❓ 常见问题

### Q: Railway 说找不到启动命令

**解决方案：**
1. 在 Railway 项目中点击 "Settings"
2. 找到 "Deploy" 部分
3. 设置：
   - **Root Directory**: `server`
   - **Start Command**: `npm start`

### Q: 后端返回 500 错误

**检查：**
1. Railway → Deployments → 查看日志
2. 确认环境变量都设置了
3. 检查 API Key 是否正确

### Q: 前端无法连接后端

**检查：**
1. 浏览器控制台是否有 CORS 错误
2. Vercel 环境变量是否正确设置
3. Railway URL 是否正确（不要有多余的斜杠）

### Q: Railway 免费额度够用吗？

**答案：**
- Railway 每月提供 $5 免费额度
- 约等于 500 小时运行时间
- 对于个人项目完全够用
- 可以设置使用限额防止超支

---

## 📊 监控和维护

### 查看 Railway 日志

1. Railway 项目 → Deployments
2. 点击最新的部署
3. 查看实时日志

### 查看 API 使用情况

访问 [百度智能云控制台](https://console.bce.baidu.com/ai/)
- 查看 API 调用次数
- 监控配额使用

---

## 🔄 更新部署

当你修改后端代码后：

```bash
git add server/
git commit -m "Update backend"
git push
```

Railway 会自动检测并重新部署！

---

## 💡 提示

- Railway 部署通常需要 2-3 分钟
- 第一次冷启动可能需要 10-15 秒
- 可以在 Railway 设置中配置自定义域名
- 建议启用 Railway 的通知功能，部署失败时会收到邮件

---

## 🎉 享受真实的 AI 车牌识别！

现在你的应用已经完全部署，可以使用真实的百度 AI 进行车牌识别了！

