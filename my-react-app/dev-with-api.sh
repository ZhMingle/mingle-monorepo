#!/bin/bash

# 开发环境启动脚本 - 同时运行 Vite 和 Vercel Dev Server

echo "🚀 启动开发环境..."
echo ""
echo "📦 Vite Dev Server: https://localhost:5173"
echo "🔧 Vercel API Server: http://localhost:3000"
echo ""

# 创建临时目录存储日志
mkdir -p .dev-logs

# 启动 Vercel Dev Server（API）
echo "🔧 启动 Vercel API Server..."
vercel dev --listen 3000 > .dev-logs/vercel.log 2>&1 &
VERCEL_PID=$!

# 等待 Vercel 启动
sleep 3

# 启动 Vite Dev Server（前端）
echo "📦 启动 Vite Dev Server..."
npm run dev

# 清理：当 Vite 停止时，也停止 Vercel
echo ""
echo "🛑 停止开发服务器..."
kill $VERCEL_PID 2>/dev/null

echo "✅ 开发环境已关闭"

