# 🚀 PWA 快速参考

## ⚡ 快速命令

```bash
# 测试 PWA 配置
npm run pwa:test

# 构建 + 预览
npm run build && npm run preview

# 生成图标（需要 canvas）
npm run pwa:icons
```

## 📁 关键文件

```
├── vite.config.js          # PWA 插件配置
├── src/sw.js               # Service Worker
├── index.html              # PWA meta 标签
└── public/
    ├── icon.svg            # ✅ SVG 图标
    ├── icon-192.png        # ⚠️ 需要生成
    ├── icon-512.png        # ⚠️ 需要生成
    └── apple-touch-icon.png # ⚠️ 需要生成
```

## 🎨 生成图标（3种方法）

### 1. 在线工具（最简单）

https://progressier.com/pwa-icons-generator

### 2. 自动脚本

```bash
npm install canvas --save-dev
npm run pwa:icons
```

### 3. 手动创建

- 192x192px → icon-192.png
- 512x512px → icon-512.png
- 180x180px → apple-touch-icon.png

## 🧪 测试步骤

1. **构建**

   ```bash
   npm run build
   npm run preview
   ```

2. **浏览器测试**
   - 打开 http://localhost:4173
   - DevTools → Application 标签
   - 检查 Manifest / Service Workers

3. **移动设备**
   - Android: 菜单 → "添加到主屏幕"
   - iOS: 分享 → "添加到主屏幕"

4. **Lighthouse**
   - DevTools → Lighthouse
   - 选择 "Progressive Web App"
   - 生成报告（目标 90+）

## ✅ 配置检查清单

- [x] Workbox 依赖已安装
- [x] Service Worker 配置完成
- [x] Manifest 配置完成
- [x] HTML meta 标签已添加
- [x] SVG 图标已创建
- [ ] PNG 图标已生成（推荐）
- [ ] 在移动设备上测试
- [ ] Lighthouse PWA 评分 > 90

## 🐛 故障排除

| 问题         | 解决方案                               |
| ------------ | -------------------------------------- |
| SW 未注册    | 使用生产构建 (`npm run build`)         |
| 更新不生效   | DevTools → Unregister SW + 清除缓存    |
| iOS 无法安装 | 必须使用 Safari，检查 apple-touch-icon |
| 图标不显示   | 检查文件名和路径，清除缓存             |

## 📚 详细文档

- 📖 [完整指南](docs/PWA-GUIDE.md)
- 🎨 [图标指南](public/ICON-GENERATION-GUIDE.md)
- 📱 [快速开始](PWA-README.md)

## 🚀 部署

```bash
# Vercel
vercel --prod

# 其他平台
# 确保使用 HTTPS
```

---

**当前状态**: ✅ 核心配置完成 | ⚠️ 需生成 PNG 图标
