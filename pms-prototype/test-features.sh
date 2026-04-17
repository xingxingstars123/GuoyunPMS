#!/bin/bash

# 国韵民宿PMS - 新功能测试脚本
# 用于验证3个新功能是否正常工作

echo "🧪 开始测试新增功能..."
echo ""

BASE_URL="http://localhost:3100"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
PASS=0
FAIL=0

# 测试函数
test_api() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    
    echo -n "  测试 $name ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        if echo "$body" | grep -q '"success":true'; then
            echo -e "${GREEN}✓ 通过${NC}"
            ((PASS++))
            return 0
        else
            echo -e "${RED}✗ 失败 (返回错误)${NC}"
            echo "    响应: $body" | head -c 100
            ((FAIL++))
            return 1
        fi
    else
        echo -e "${RED}✗ 失败 (HTTP $http_code)${NC}"
        ((FAIL++))
        return 1
    fi
}

# 1. 测试数据可视化API
echo "📊 1. 数据可视化API测试"
test_api "营收趋势(7天)" "GET" "/api/dashboard/revenue-trend?days=7"
test_api "营收趋势(30天)" "GET" "/api/dashboard/revenue-trend?days=30"
test_api "房型统计" "GET" "/api/dashboard/room-type-stats"
test_api "渠道分布" "GET" "/api/dashboard/channel-distribution"
echo ""

# 2. 测试智能推荐API
echo "🤖 2. 智能推荐API测试"
test_api "基础推荐" "POST" "/api/rooms/recommend" \
    '{"checkIn":"2026-04-20","checkOut":"2026-04-22"}'

test_api "带价格筛选" "POST" "/api/rooms/recommend" \
    '{"checkIn":"2026-04-20","checkOut":"2026-04-22","maxPrice":500}'

test_api "带楼层偏好" "POST" "/api/rooms/recommend" \
    '{"checkIn":"2026-04-20","checkOut":"2026-04-22","floor":"high"}'

test_api "完整条件" "POST" "/api/rooms/recommend" \
    '{"checkIn":"2026-04-20","checkOut":"2026-04-22","roomType":"大床房","maxPrice":500,"floor":"high"}'
echo ""

# 3. 测试导出API
echo "📥 3. Excel导出API测试"
echo -n "  测试 订单导出 ... "
curl -s "$BASE_URL/api/export/orders" -o /tmp/test_orders.xlsx
if [ -f /tmp/test_orders.xlsx ] && [ $(stat -f%z /tmp/test_orders.xlsx 2>/dev/null || stat -c%s /tmp/test_orders.xlsx) -gt 1000 ]; then
    echo -e "${GREEN}✓ 通过${NC}"
    ((PASS++))
    rm /tmp/test_orders.xlsx
else
    echo -e "${RED}✗ 失败${NC}"
    ((FAIL++))
fi

echo -n "  测试 财务导出 ... "
curl -s "$BASE_URL/api/export/finance?year=2026&month=4" -o /tmp/test_finance.xlsx
if [ -f /tmp/test_finance.xlsx ] && [ $(stat -f%z /tmp/test_finance.xlsx 2>/dev/null || stat -c%s /tmp/test_finance.xlsx) -gt 1000 ]; then
    echo -e "${GREEN}✓ 通过${NC}"
    ((PASS++))
    rm /tmp/test_finance.xlsx
else
    echo -e "${RED}✗ 失败${NC}"
    ((FAIL++))
fi

echo -n "  测试 带筛选的订单导出 ... "
curl -s "$BASE_URL/api/export/orders?startDate=2026-04-01&endDate=2026-04-30&channel=ctrip" -o /tmp/test_filtered.xlsx
if [ -f /tmp/test_filtered.xlsx ]; then
    echo -e "${GREEN}✓ 通过${NC}"
    ((PASS++))
    rm /tmp/test_filtered.xlsx
else
    echo -e "${RED}✗ 失败${NC}"
    ((FAIL++))
fi
echo ""

# 4. 测试原有API(确保未破坏)
echo "✅ 4. 原有功能回归测试"
test_api "首页统计" "GET" "/api/dashboard/stats"
test_api "订单列表" "GET" "/api/orders"
test_api "渠道列表" "GET" "/api/channels"
test_api "房态日历" "GET" "/api/rooms/calendar"
echo ""

# 5. 性能测试
echo "⚡ 5. 性能测试"
echo -n "  推荐API响应时间 ... "
start=$(date +%s%N)
curl -s -X POST "$BASE_URL/api/rooms/recommend" \
    -H "Content-Type: application/json" \
    -d '{"checkIn":"2026-04-20","checkOut":"2026-04-22"}' > /dev/null
end=$(date +%s%N)
duration=$(( (end - start) / 1000000 ))

if [ $duration -lt 500 ]; then
    echo -e "${GREEN}✓ ${duration}ms (优秀)${NC}"
    ((PASS++))
elif [ $duration -lt 1000 ]; then
    echo -e "${YELLOW}⚠ ${duration}ms (良好)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ ${duration}ms (较慢)${NC}"
    ((FAIL++))
fi
echo ""

# 总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 测试结果汇总"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TOTAL=$((PASS + FAIL))
echo "  总测试数: $TOTAL"
echo -e "  通过: ${GREEN}$PASS${NC}"
echo -e "  失败: ${RED}$FAIL${NC}"

if [ $FAIL -eq 0 ]; then
    echo -e "\n${GREEN}🎉 所有测试通过!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ 有 $FAIL 个测试失败${NC}"
    exit 1
fi
