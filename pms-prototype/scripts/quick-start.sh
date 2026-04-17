#!/bin/bash

# 国韵民宿PMS - 快速启动脚本

echo "🏨 国韵民宿PMS - 快速启动"
echo "================================"
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到Node.js,请先安装"
    exit 1
fi

echo "✅ Node.js版本: $(node -v)"
echo ""

# 切换到backend目录
cd "$(dirname "$0")/../backend" || exit 1

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    echo ""
fi

# 启动服务器
echo "🚀 启动PMS后端服务..."
echo "📡 API地址: http://localhost:3101"
echo "📊 数据库: ../database/pms.db"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "================================"
echo ""

PORT=3101 node server-optimized.js
