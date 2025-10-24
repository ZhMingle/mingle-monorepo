#!/bin/bash

# 手机调试连接测试脚本

echo "📱 手机调试连接测试"
echo "===================="

# 获取本地IP地址
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "🌐 本地IP地址: $LOCAL_IP"

# 检查开发服务器状态
echo ""
echo "🔍 检查开发服务器状态..."
if lsof -i :5173 > /dev/null 2>&1; then
    echo "✅ 开发服务器正在运行 (端口 5173)"
    echo "📱 手机访问地址: http://$LOCAL_IP:5173"
else
    echo "❌ 开发服务器未运行"
    echo "💡 请运行: npm run dev -- --host"
    exit 1
fi

# 测试网络连接
echo ""
echo "🌐 测试网络连接..."
if ping -c 1 $LOCAL_IP > /dev/null 2>&1; then
    echo "✅ 网络连接正常"
else
    echo "❌ 网络连接失败"
fi

# 检查防火墙状态
echo ""
echo "🔥 检查防火墙状态..."
if sudo pfctl -s rules | grep -q "block"; then
    echo "⚠️  防火墙可能阻止连接"
    echo "💡 尝试临时关闭防火墙: sudo pfctl -d"
else
    echo "✅ 防火墙状态正常"
fi

echo ""
echo "📋 手机调试步骤:"
echo "1. 确保手机和电脑连接同一WiFi"
echo "2. 在手机浏览器中访问: http://$LOCAL_IP:5173"
echo "3. 打开浏览器开发者工具查看控制台"
echo "4. 检查顶部安全区域调试信息"

echo ""
echo "🧪 测试页面:"
echo "http://$LOCAL_IP:5173/tests/test-top-safe-area.html"

echo ""
echo "🔧 如果无法访问，尝试:"
echo "- 检查防火墙设置"
echo "- 重启开发服务器: npm run dev -- --host"
echo "- 尝试其他端口: npm run dev -- --port 3000 --host"
