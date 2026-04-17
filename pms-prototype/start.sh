#!/bin/bash

echo "🚀 启动 PMS 原型系统..."
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，请先安装: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo ""

# 安装后端依赖
echo "📦 安装后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..

# 安装前端依赖
echo "📦 安装前端依赖..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..

echo ""
echo "🎉 依赖安装完成！"
echo ""

# 启动后端
echo "🔧 启动后端服务 (端口 3100)..."
cd backend
node server.js &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端
echo "🎨 启动前端开发服务器 (端口 5173)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ 系统启动完成！"
echo ""
echo "📡 后端 API: http://localhost:3100"
echo "🌐 前端界面: http://localhost:5173"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

# 等待中断信号
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

wait
