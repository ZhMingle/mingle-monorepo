# PWA 图标生成指南

## 当前状态

项目已经包含一个占位符 SVG 图标 `icon.svg`，可以正常工作。但为了更好的用户体验，建议生成真实的 PNG 图标。

## 快速生成图标（推荐）

### 方法 1：使用在线工具

1. 访问 [PWA Asset Generator](https://progressier.com/pwa-icons-generator)
2. 上传你的 logo 或图标（建议 512x512 PNG）
3. 下载生成的图标包
4. 将以下文件放到 `public/` 目录：
   - `icon-192.png`
   - `icon-512.png`
   - `apple-touch-icon.png` (180x180)

### 方法 2：使用 PWA Asset Generator CLI

```bash
# 安装工具
npm install -g pwa-asset-generator

# 在项目根目录运行（假设你有一个 logo.svg）
pwa-asset-generator logo.svg public/ --icon-only --favicon
```

### 方法 3：手动创建

使用 Figma/Photoshop/Sketch 创建以下尺寸的 PNG 图标：

- `icon-192.png` - 192x192px
- `icon-512.png` - 512x512px
- `apple-touch-icon.png` - 180x180px

**设计建议：**

- 使用简单清晰的图标
- 主题色：#16a34a (绿色)
- 背景色：#ffffff (白色) 或透明
- 确保图标在小尺寸下清晰可见

## 图标放置位置

所有图标文件应放在 `public/` 目录下：

```
public/
├── icon-192.png
├── icon-512.png
├── apple-touch-icon.png
└── icon.svg (当前占位符)
```

## 配置已完成

`vite.config.js` 已经配置好图标路径：

- 192x192 图标用于标准 PWA
- 512x512 图标用于高分辨率设备
- maskable 图标支持 Android 自适应图标

## 测试 PWA

1. 构建项目：

   ```bash
   npm run build
   ```

2. 预览构建结果：

   ```bash
   npm run preview
   ```

3. 在浏览器中打开，尝试安装 PWA（查找"添加到主屏幕"选项）

## 验证清单

- [ ] 生成并放置 icon-192.png
- [ ] 生成并放置 icon-512.png
- [ ] 生成并放置 apple-touch-icon.png
- [ ] 在移动设备上测试安装
- [ ] 验证图标在主屏幕上显示正确
