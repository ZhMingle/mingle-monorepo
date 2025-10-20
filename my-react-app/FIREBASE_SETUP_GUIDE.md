# 🔥 Firebase 设置指南

## 📋 目录

- [创建 Firebase 项目](#创建-firebase-项目)
- [配置 Firestore 数据库](#配置-firestore-数据库)
- [获取配置信息](#获取配置信息)
- [配置环境变量](#配置环境变量)
- [测试连接](#测试连接)

## 🚀 创建 Firebase 项目

### 第一步：访问 Firebase Console

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 点击 "创建项目" 或 "Add project"

### 第二步：创建项目

1. **项目名称：** 输入 `car-wash-records`（或你喜欢的名字）
2. **Google Analytics：** 选择是否启用（建议启用）
3. **分析账户：** 选择默认账户或创建新账户
4. 点击 "创建项目"

### 第三步：等待项目创建完成

## 🗄️ 配置 Firestore 数据库

### 第一步：启用 Firestore

1. 在 Firebase Console 中，点击左侧菜单的 "Firestore Database"
2. 点击 "创建数据库"
3. **安全规则：** 选择 "测试模式"（开发阶段）
4. **位置：** 选择离你最近的区域（如 `asia-southeast1`）

### 第二步：设置安全规则（重要！）

在 Firestore 的 "规则" 标签中，设置为：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 允许读写 carWashRecords 集合
    match /carWashRecords/{document} {
      allow read, write: if true; // 开发阶段允许所有读写
    }
  }
}
```

⚠️ **注意：** 这是开发阶段的规则，生产环境需要更严格的安全规则！

## 🔑 获取配置信息

### 第一步：添加 Web 应用

1. 在 Firebase Console 中，点击项目设置（齿轮图标）
2. 滚动到 "我的应用" 部分
3. 点击 "添加应用" 图标，选择 Web 应用（</> 图标）
4. **应用昵称：** 输入 `Car Wash Web App`
5. **Firebase Hosting：** 选择是否设置（可选）
6. 点击 "注册应用"

### 第二步：复制配置

你会看到一个配置对象，类似这样：

```javascript
const firebaseConfig = {
  apiKey: 'AIzaSyC...',
  authDomain: 'your-project-id.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project-id.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef...',
};
```

## 🌍 配置环境变量

### 第一步：复制环境变量模板

```bash
cp firebase.env.example .env.local
```

### 第二步：编辑环境变量文件

编辑 `.env.local` 文件，填入你的 Firebase 配置：

```bash
# Firebase 配置
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef...

# 百度 AI API 配置（保留原有的）
BAIDU_API_KEY=your_api_key_here
BAIDU_SECRET_KEY=your_secret_key_here

# 开发环境配置
VITE_USE_MOCK_DATA=false
```

### 第三步：配置 Vercel 环境变量（生产环境）

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 "Settings" → "Environment Variables"
4. 添加所有 Firebase 配置变量

## 🧪 测试连接

### 第一步：启动开发服务器

```bash
npm run dev
```

### 第二步：测试功能

1. 打开浏览器访问 `https://localhost:5173`
2. 进入洗车管理页面
3. 填写一条测试记录并保存
4. 检查浏览器控制台是否有成功日志

### 第三步：验证数据

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 进入你的项目
3. 点击 "Firestore Database"
4. 查看 `carWashRecords` 集合是否有新数据

## 🔄 数据迁移

当你第一次配置 Firebase 后：

1. **自动迁移：** 应用会自动检测并迁移 localStorage 中的数据
2. **迁移日志：** 在浏览器控制台查看迁移进度
3. **验证迁移：** 检查 Firestore 中是否有你的历史数据

## 🚨 故障排除

### 问题 1：Firebase 配置错误

**错误信息：** `Firebase: Error (auth/invalid-api-key)`

**解决方案：**

1. 检查 `.env.local` 文件中的 API Key 是否正确
2. 确保环境变量名称以 `VITE_` 开头
3. 重启开发服务器

### 问题 2：Firestore 权限错误

**错误信息：** `FirebaseError: Missing or insufficient permissions`

**解决方案：**

1. 检查 Firestore 安全规则
2. 确保规则允许读写 `carWashRecords` 集合
3. 在开发阶段可以使用宽松的规则

### 问题 3：网络连接问题

**错误信息：** `FirebaseError: Failed to get document`

**解决方案：**

1. 检查网络连接
2. 确保 Firebase 项目配置正确
3. 检查浏览器控制台的具体错误信息

## 📊 Firebase vs localStorage 对比

| 特性           | localStorage  | Firebase        |
| -------------- | ------------- | --------------- |
| **离线使用**   | ✅ 完全离线   | ⚠️ 需要网络连接 |
| **多设备同步** | ❌ 单设备     | ✅ 多设备同步   |
| **数据备份**   | ❌ 无自动备份 | ✅ 自动备份     |
| **数据容量**   | ⚠️ 5-10MB     | ✅ 无限制       |
| **实时更新**   | ❌ 无         | ✅ 实时同步     |
| **安全性**     | ⚠️ 本地存储   | ✅ 云端安全     |
| **成本**       | ✅ 免费       | ⚠️ 免费额度     |

## 🎉 完成！

配置完成后，你的洗车管理系统将：

- ✅ 自动将数据保存到 Firebase
- ✅ 支持多设备数据同步
- ✅ 自动备份所有记录
- ✅ 实时数据更新
- ✅ 更大的存储容量

## 📚 相关文档

- [Firebase 官方文档](https://firebase.google.com/docs)
- [Firestore 文档](https://firebase.google.com/docs/firestore)
- [Vite 环境变量](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel 环境变量](https://vercel.com/docs/concepts/projects/environment-variables)

## 🆘 需要帮助？

如果遇到问题，请：

1. 检查浏览器控制台的错误信息
2. 确认 Firebase 项目配置正确
3. 验证环境变量是否设置
4. 查看 Firebase Console 中的数据

祝你使用愉快！🚀
