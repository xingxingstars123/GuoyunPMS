#!/bin/bash

# API测试脚本

BASE_URL="http://localhost:3101"

echo "🧪 PMS API 测试"
echo "================================"
echo "服务器: $BASE_URL"
echo ""

# 测试健康检查
echo "1️⃣  测试健康检查..."
curl -s $BASE_URL/api/health | jq '.' || echo "❌ 失败"
echo ""

# 测试首页统计
echo "2️⃣  测试首页统计..."
curl -s $BASE_URL/api/dashboard/stats | jq '.' || echo "❌ 失败"
echo ""

# 测试订单列表
echo "3️⃣  测试订单列表(前3条)..."
curl -s "$BASE_URL/api/orders?limit=3" | jq '.data[0:3]' || echo "❌ 失败"
echo ""

# 测试房间利用率
echo "4️⃣  测试房间利用率..."
curl -s $BASE_URL/api/rooms/utilization | jq '.data[0:3]' || echo "❌ 失败"
echo ""

# 测试渠道统计
echo "5️⃣  测试渠道统计..."
curl -s $BASE_URL/api/finance/channels | jq '.data[0:3]' || echo "❌ 失败"
echo ""

# 测试客户价值
echo "6️⃣  测试客户价值分析..."
curl -s "$BASE_URL/api/customers/value?limit=3" | jq '.data[0:3]' || echo "❌ 失败"
echo ""

echo "✅ API测试完成!"
echo "================================"
