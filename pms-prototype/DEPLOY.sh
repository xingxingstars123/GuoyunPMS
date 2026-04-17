#!/bin/bash

# 国韵民宿PMS - 快速部署脚本
# 用途: 一键部署3个新功能(数据可视化/智能推荐/Excel导出)

echo "🚀 开始部署PMS系统新功能..."
echo ""

# 1. 检查Node.js环境
echo "📦 检查运行环境..."
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js,请先安装Node.js"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js版本: $NODE_VERSION"
echo ""

# 2. 安装后端依赖
echo "📦 安装后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ 依赖已安装"
fi
echo ""

# 3. 检查数据库
echo "🗄️  检查数据库..."
if [ ! -f "database/pms.db" ]; then
    echo "⚠️  数据库不存在,将在启动时自动创建"
else
    echo "✅ 数据库已存在"
fi
echo ""

# 4. 启动后端服务
echo "🚀 启动后端服务..."
pkill -f "node.*server.js" 2>/dev/null
nohup node server.js > ../logs/server.log 2>&1 &
SERVER_PID=$!
echo "✅ 后端服务已启动 (PID: $SERVER_PID)"
echo "📡 API地址: http://localhost:3100"
echo ""

# 5. 等待服务启动
echo "⏳ 等待服务就绪..."
sleep 3

# 6. 健康检查
echo "🔍 执行健康检查..."
HEALTH_CHECK=$(curl -s http://localhost:3100/api/channels | grep -o '"success":true')
if [ -n "$HEALTH_CHECK" ]; then
    echo "✅ 服务健康检查通过"
else
    echo "❌ 服务启动失败,请检查日志: logs/server.log"
    exit 1
fi
echo ""

# 7. 测试新功能API
echo "🧪 测试新增功能..."

echo "  📊 测试数据可视化API..."
curl -s http://localhost:3100/api/dashboard/revenue-trend?days=7 > /dev/null
if [ $? -eq 0 ]; then
    echo "    ✅ 营收趋势API正常"
else
    echo "    ❌ 营收趋势API异常"
fi

curl -s http://localhost:3100/api/dashboard/channel-distribution > /dev/null
if [ $? -eq 0 ]; then
    echo "    ✅ 渠道分布API正常"
else
    echo "    ❌ 渠道分布API异常"
fi

echo "  🤖 测试智能推荐API..."
curl -s -X POST http://localhost:3100/api/rooms/recommend \
    -H "Content-Type: application/json" \
    -d '{"checkIn":"2026-04-20","checkOut":"2026-04-22"}' > /dev/null
if [ $? -eq 0 ]; then
    echo "    ✅ 智能推荐API正常"
else
    echo "    ❌ 智能推荐API异常"
fi

echo "  📥 测试Excel导出API..."
curl -s "http://localhost:3100/api/export/orders" -o /tmp/test.xlsx
if [ -f /tmp/test.xlsx ]; then
    echo "    ✅ 订单导出API正常"
    rm /tmp/test.xlsx
else
    echo "    ❌ 订单导出API异常"
fi

echo ""
echo "🎉 部署完成!"
echo ""
echo "📚 功能说明:"
echo "  1. 数据可视化仪表盘 - 营收趋势/房型占比/渠道分布"
echo "  2. 智能房间推荐 - 基于多维度评分的智能推荐算法"
echo "  3. Excel数据导出 - 订单/财务数据一键导出"
echo ""
echo "📖 详细文档: FEATURES.md"
echo "🔗 API文档: http://localhost:3100"
echo "📊 服务状态: ps aux | grep server.js"
echo "📝 服务日志: tail -f logs/server.log"
echo ""
