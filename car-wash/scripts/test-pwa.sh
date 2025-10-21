#!/bin/bash

# PWA 配置测试脚本

echo "🔍 检查 PWA 配置..."
echo ""

# 检查依赖
echo "1️⃣ 检查依赖包..."
if npm list workbox-precaching >/dev/null 2>&1; then
    echo "   ✅ workbox-precaching 已安装"
else
    echo "   ❌ workbox-precaching 未安装"
fi

if npm list vite-plugin-pwa >/dev/null 2>&1; then
    echo "   ✅ vite-plugin-pwa 已安装"
else
    echo "   ❌ vite-plugin-pwa 未安装"
fi

echo ""

# 检查文件
echo "2️⃣ 检查必要文件..."

files=(
    "src/sw.js:Service Worker"
    "public/icon.svg:SVG图标"
    "index.html:HTML入口"
    "vite.config.js:Vite配置"
)

for item in "${files[@]}"; do
    IFS=':' read -r file desc <<< "$item"
    if [ -f "$file" ]; then
        echo "   ✅ $desc ($file)"
    else
        echo "   ❌ $desc ($file) 缺失"
    fi
done

echo ""

# 检查图标文件
echo "3️⃣ 检查图标文件..."
icon_files=(
    "public/icon-192.png:192x192 PNG图标"
    "public/icon-512.png:512x512 PNG图标"
    "public/apple-touch-icon.png:Apple触摸图标"
)

missing_icons=false
for item in "${icon_files[@]}"; do
    IFS=':' read -r file desc <<< "$item"
    if [ -f "$file" ]; then
        echo "   ✅ $desc"
    else
        echo "   ⚠️  $desc (可选，但推荐)"
        missing_icons=true
    fi
done

if [ "$missing_icons" = true ]; then
    echo ""
    echo "   💡 提示: 查看 public/ICON-GENERATION-GUIDE.md 了解如何生成图标"
fi

echo ""

# 检查配置
echo "4️⃣ 检查配置内容..."

if grep -q "VitePWA" vite.config.js; then
    echo "   ✅ Vite配置中包含PWA插件"
else
    echo "   ❌ Vite配置中未找到PWA插件"
fi

if grep -q "theme-color" index.html; then
    echo "   ✅ HTML包含PWA meta标签"
else
    echo "   ❌ HTML缺少PWA meta标签"
fi

if grep -q "precacheAndRoute" src/sw.js; then
    echo "   ✅ Service Worker配置正确"
else
    echo "   ❌ Service Worker配置有问题"
fi

echo ""
echo "5️⃣ 测试构建..."
echo "   开始构建..."

if npm run build >/dev/null 2>&1; then
    echo "   ✅ 构建成功"
    
    # 检查生成的文件
    if [ -f "dist/manifest.webmanifest" ]; then
        echo "   ✅ manifest.webmanifest 已生成"
    else
        echo "   ❌ manifest.webmanifest 未生成"
    fi
    
    if [ -f "dist/registerSW.js" ]; then
        echo "   ✅ Service Worker 注册脚本已生成"
    else
        echo "   ❌ Service Worker 注册脚本未生成"
    fi
else
    echo "   ❌ 构建失败，请检查错误信息"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 测试完成！"
echo ""
echo "📝 下一步："
echo "   1. 如有缺失的图标，运行: 查看 public/ICON-GENERATION-GUIDE.md"
echo "   2. 启动预览: npm run preview"
echo "   3. 在浏览器中测试 PWA 安装"
echo "   4. 使用 Chrome DevTools 的 Lighthouse 检查 PWA 评分"
echo ""
echo "📚 详细文档: docs/PWA-GUIDE.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

