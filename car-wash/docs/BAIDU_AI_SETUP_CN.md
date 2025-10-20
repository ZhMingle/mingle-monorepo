```markdown
# 百度 AI 车牌识别集成指南

本档案介绍如何在 Vercel 上配置和使用百度 AI 车牌识别功能。

## 📋 概述

项目已集成百度 AI OCR API，用于自动识别车牌号码。支持两种运行模式：

1. **模拟模式**（默认）：使用模拟数据，无需 API 密钥
2. **真实模式**：调用百度 AI API，需要配置密钥

## 🚀 快速开始（模拟模式）

如果你只是想体验功能，直接运行：

```bash
npm install
npm run dev
```

系统会使用模拟的车牌识别结果，无需任何配置。

## 🔒 配置真实 API（Vercel 部署）

### 第一步：获取百度 AI 密钥

1. 访问百度 AI 控制台
2. 创建或选择已有应用
3. 获取 API Key 和 Secret Key

### 第二步：在 Vercel 配置环境变量

添加以下变量：

```
BAIDU_API_KEY
BAIDU_SECRET_KEY
VITE_USE_MOCK_DATA=false
```

确保 `VITE_USE_MOCK_DATA` 的值为小写的 `false`。

### 第三步：重新部署

在 Vercel Dashboard 中触发 Redeploy，或推送一个空提交：

```bash
git commit --allow-empty -m "Enable Baidu AI OCR"
git push
```

更多使用和调试细节请参考仓库内其它文档。
```
