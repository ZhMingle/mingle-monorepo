# 🔐 安全警告和最佳实践

## ⚠️ 重要：保护你的 API 密钥

### 绝不要做的事情

❌ **不要**在代码中硬编码 API 密钥  
❌ **不要**将 `.env` 文件提交到 Git  
❌ **不要**在文档中写真实的密钥  
❌ **不要**在公开的 Issue 或 PR 中分享密钥  
❌ **不要**将密钥发送到聊天工具或邮件

### 正确的做法

✅ **使用环境变量**存储密钥  
✅ **将 `.env` 添加到 `.gitignore`**  
✅ **在平台环境变量中配置**（Vercel/Railway）  
✅ **定期轮换密钥**  
✅ **监控 API 使用情况**

---

## 🔒 你的密钥安全吗？

### 检查清单

- [ ] `.env` 文件在 `.gitignore` 中
- [ ] Git 历史中没有 `.env` 文件
- [ ] 代码中没有硬编码密钥
- [ ] 文档中使用占位符，不是真实密钥
- [ ] 已在百度控制台设置使用限额

---

## 🚨 如果密钥已经泄露

如果你的 API 密钥已经被提交到 Git 或公开，请立即：

### 1. 重置密钥

1. 访问 [百度智能云控制台](https://console.bce.baidu.com/ai/)
2. 找到你的应用
3. 重置 API Key 和 Secret Key
4. 获取新的密钥

### 2. 更新配置

**本地开发：**
```bash
# 更新 server/.env
BAIDU_API_KEY=新的API_Key
BAIDU_SECRET_KEY=新的Secret_Key
```

**Vercel 部署：**
1. Settings → Environment Variables
2. 编辑 `BAIDU_API_KEY` 和 `BAIDU_SECRET_KEY`
3. 重新部署

### 3. 清理 Git 历史（如果密钥在 Git 中）

⚠️ **警告：这会改写 Git 历史！**

```bash
# 从 Git 历史中移除敏感文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch server/.env .env" \
  --prune-empty --tag-name-filter cat -- --all

# 强制推送（谨慎操作）
git push origin --force --all
```

---

## 📝 正确的文件结构

### `.env` 文件（本地开发）

```env
# ✅ 正确：使用真实密钥
BAIDU_API_KEY=你的真实密钥
BAIDU_SECRET_KEY=你的真实密钥
```

❗ **这个文件应该：**
- 只存在于本地
- 在 `.gitignore` 中
- 永远不提交到 Git

### `.env.example` 文件（可以提交）

```env
# ✅ 正确：使用占位符
BAIDU_API_KEY=your_api_key_here
BAIDU_SECRET_KEY=your_secret_key_here
```

❗ **这个文件可以：**
- 提交到 Git
- 作为模板给其他开发者

---

## 🛡️ 平台配置

### Vercel 环境变量

在 Vercel 网站上配置，**不是**在代码中：

```
Settings → Environment Variables → Add
```

优点：
- ✅ 密钥存储在 Vercel 服务器
- ✅ 不会出现在代码库中
- ✅ 可以按环境配置（Development/Production）

### Railway 环境变量

在 Railway 网站上配置：

```
Project → Variables → New Variable
```

优点：
- ✅ 加密存储
- ✅ 自动注入到应用
- ✅ 可以随时更新

---

## 🔍 监控和审计

### 1. 设置使用限额

在百度智能云控制台：
- 设置每日调用次数限制
- 设置费用预警
- 启用异常检测

### 2. 定期检查日志

**Vercel：**
```
Functions → 查看调用日志
```

**Railway：**
```
Deployments → 查看日志
```

### 3. 监控 API 使用

定期检查：
- API 调用次数
- 失败率
- 响应时间
- 异常流量

---

## 💡 最佳实践总结

### 开发环境

```bash
# .env (不提交)
BAIDU_API_KEY=dev_key_xxx
BAIDU_SECRET_KEY=dev_secret_xxx
VITE_USE_MOCK_DATA=false
```

### 生产环境

- 在 Vercel/Railway 配置环境变量
- 使用生产密钥
- 启用监控和告警
- 设置使用限额

### 团队协作

- 使用 `.env.example` 作为模板
- 在团队文档中说明如何获取密钥
- 每个开发者使用自己的测试密钥
- 生产密钥只有部署平台知道

---

## 📚 相关资源

- [百度智能云安全最佳实践](https://cloud.baidu.com/doc/Reference/s/9jwvz2egb)
- [Vercel 环境变量文档](https://vercel.com/docs/projects/environment-variables)
- [Git 敏感信息清理工具](https://rtyley.github.io/bfg-repo-cleaner/)

---

## ✅ 记住

**你的 API 密钥 = 你的钱** 💰

保护好它们就像保护银行密码一样重要！

