# PWA 配置指南

## 概述

本项目已完整配置为 PWA (Progressive Web App)，支持离线访问、添加到主屏幕等功能。

## 已配置功能

### ✅ 核心功能

- **离线支持**：使用 Service Worker 缓存资源，支持离线访问
- **可安装**：用户可以将应用添加到手机主屏幕
- **自动更新**：检测到新版本时自动更新
- **跨平台**：支持 iOS Safari、Android Chrome、桌面浏览器

### ✅ 已完成配置

1. **Service Worker** (`src/sw.js`)
   - 使用 Workbox 预缓存策略
   - 自动缓存所有构建资源
   - 支持离线访问

2. **Web App Manifest** (`vite.config.js`)
   - 应用名称：洗车管理系统
   - 主题色：#16a34a (绿色)
   - 显示模式：standalone (全屏应用)
   - 图标配置（SVG + PNG）

3. **HTML Meta 标签** (`index.html`)
   - iOS Safari PWA 支持
   - Android Chrome PWA 支持
   - 主题色和描述信息

4. **构建配置** (`vite.config.js`)
   - vite-plugin-pwa 插件配置
   - 使用 injectManifest 策略
   - 自动注册 Service Worker

## 图标文件

### 当前状态

- ✅ `public/icon.svg` - SVG 占位符图标（已创建）
- ⚠️ `public/icon-192.png` - 需要生成
- ⚠️ `public/icon-512.png` - 需要生成
- ⚠️ `public/apple-touch-icon.png` - 需要生成

### 如何生成图标

详见 `public/ICON-GENERATION-GUIDE.md` 文件。

**快速方法：使用在线工具**

1. 访问 https://progressier.com/pwa-icons-generator
2. 上传你的 logo (推荐 512x512 PNG)
3. 下载生成的图标包
4. 将文件放到 `public/` 目录

## 本地开发测试

### 1. 构建项目

```bash
npm run build
```

### 2. 预览构建结果

```bash
npm run preview
```

### 3. 访问应用

在浏览器中打开显示的 URL（通常是 http://localhost:4173）

### 4. 测试 PWA 功能

**Chrome DevTools:**

1. 打开开发者工具
2. 切换到 "Application" 标签
3. 查看：
   - Manifest：检查应用清单配置
   - Service Workers：查看 SW 注册状态
   - Storage：查看缓存内容

**测试安装：**

1. Chrome：地址栏会显示安装图标
2. 移动设备：浏览器菜单中选择"添加到主屏幕"

## 部署到生产环境

### Vercel 部署

```bash
# 部署到 Vercel
vercel --prod
```

PWA 在 HTTPS 环境下自动启用（Vercel 默认提供 HTTPS）。

### 其他平台

确保：

1. ✅ 使用 HTTPS（PWA 必须）
2. ✅ 正确配置 MIME 类型
3. ✅ Service Worker 可访问

## 验证 PWA

### 使用 Lighthouse

1. 打开 Chrome DevTools
2. 切换到 "Lighthouse" 标签
3. 选择 "Progressive Web App"
4. 点击 "Generate report"

**目标评分：**

- PWA 徽章：✅
- 可安装性：✅
- PWA 优化得分：90+

### 检查清单

- [ ] Manifest 配置正确
- [ ] Service Worker 注册成功
- [ ] 图标文件完整（192, 512, Apple）
- [ ] HTTPS 部署
- [ ] 离线功能正常
- [ ] 可以安装到主屏幕
- [ ] Lighthouse PWA 得分 > 90

## 常见问题

### Q: Service Worker 没有注册？

**A:** 检查以下几点：

1. 确保在生产构建模式（`npm run build && npm run preview`）
2. Service Worker 在开发模式下默认禁用（`devOptions.enabled: false`）
3. 必须使用 HTTPS 或 localhost

### Q: 更新不生效？

**A:** Service Worker 缓存问题：

1. Chrome DevTools → Application → Service Workers
2. 点击 "Unregister" 注销旧的 SW
3. 清除缓存：Application → Storage → Clear site data
4. 刷新页面

### Q: iOS 上无法安装？

**A:** iOS 安装步骤：

1. 使用 Safari 浏览器（不是 Chrome）
2. 点击分享按钮
3. 选择"添加到主屏幕"
4. 确保有 `apple-touch-icon.png` 文件

### Q: 图标显示不正确？

**A:**

1. 确保图标文件在 `public/` 目录
2. 文件名必须匹配配置（icon-192.png, icon-512.png）
3. 清除浏览器缓存并重新安装
4. 检查 manifest.webmanifest 是否正确生成

## Service Worker 策略

当前使用 **injectManifest** 策略：

```javascript
// src/sw.js
import { precacheAndRoute } from 'workbox-precaching';

// 预缓存所有构建资源
precacheAndRoute(self.__WB_MANIFEST);

// 立即激活
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});
```

**缓存的资源：**

- HTML 文件
- JavaScript bundles
- CSS 文件
- 图片和图标
- 字体文件

## 高级配置

### 自定义缓存策略

如需更复杂的缓存策略（如网络优先、仅缓存等），可以修改 `src/sw.js`：

```javascript
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';

// API 请求：网络优先
registerRoute(({ url }) => url.pathname.startsWith('/api/'), new NetworkFirst());

// 图片：缓存优先
registerRoute(({ request }) => request.destination === 'image', new CacheFirst());
```

### 禁用 PWA（如需要）

在 `vite.config.js` 中注释掉 PWA 插件：

```javascript
plugins: [
  react(),
  // VitePWA({ ... })
];
```

## 参考资源

- [vite-plugin-pwa 文档](https://vite-plugin-pwa.netlify.app/)
- [Workbox 文档](https://developers.google.com/web/tools/workbox)
- [PWA 检查清单](https://web.dev/pwa-checklist/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

## 技术栈

- **构建工具**：Vite
- **PWA 插件**：vite-plugin-pwa
- **Service Worker**：Workbox
- **策略**：injectManifest（自定义 SW）

---

**配置完成时间**：2025-10-21  
**维护者**：开发团队
