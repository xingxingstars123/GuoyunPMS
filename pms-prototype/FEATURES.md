# 国韵民宿PMS - 高价值功能实现文档

## 🎯 功能概览

本次优化为PMS系统添加了3个高价值功能,显著提升了系统的数据洞察能力和用户体验:

### 1. 📊 数据可视化仪表盘
### 2. 🤖 智能房间推荐
### 3. 📥 Excel数据导出

---

## 📊 功能1: 数据可视化仪表盘

### 功能描述
在首页添加交互式图表,实时展示营收趋势、房型占比、渠道分布等关键业务指标。

### 技术实现

#### 后端API (已添加)
- `GET /api/dashboard/revenue-trend?days=7` - 营收趋势(最近N天)
- `GET /api/dashboard/room-type-stats` - 房型营收统计
- `GET /api/dashboard/channel-distribution` - 渠道订单分布

#### 前端组件
- **文件位置**: `/pms-miniapp/components/charts/RevenueChart.vue`
- **支持图表类型**:
  - 折线图 (Line Chart) - 营收趋势
  - 饼图 (Pie Chart) - 房型占比
  - 柱状图 (Bar Chart) - 渠道分布

#### 集成页面
- **文件位置**: `/pms-miniapp/pages/index/index-with-charts.vue`
- **功能特性**:
  - 原生Canvas绘制,无需外部图表库
  - 下拉刷新自动更新数据
  - 响应式布局,适配各种屏幕

### 使用方法
```javascript
// 引入图表组件
import RevenueChart from '@/components/charts/RevenueChart.vue'

// 使用
<RevenueChart 
  canvas-id="unique-id" 
  title="图表标题"
  :chart-data="[
    { label: '周一', value: 1200 },
    { label: '周二', value: 1500 }
  ]"
  type="line"
/>
```

### 数据格式
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-04-11",
      "revenue": 2400
    },
    {
      "date": "2026-04-12", 
      "revenue": 3200
    }
  ]
}
```

---

## 🤖 功能2: 智能房间推荐

### 功能描述
创建订单时,根据客户需求(日期、价格、楼层、朝向等)智能推荐最合适的房间,并展示推荐理由。

### 核心算法

#### 推荐评分机制 (满分100+)
- **房型匹配**: +30分 (精确匹配) / +20分 (历史偏好)
- **价格合理**: +20分 (≤70%预算) / +10分 (≤100%预算) / -30分 (超预算)
- **楼层偏好**: +15分 (符合高/低楼层偏好)
- **朝向偏好**: +15分 (符合朝向要求)
- **房间评分**: +20分 (最高,4.5+评分)
- **热门房间**: +10分 (预订次数>10)
- **新房激励**: +5分 (预订次数<3)
- **设施完善**: +10分 (设施≥5项)

#### 技术实现

**后端服务**:
- **文件位置**: `/backend/services/RecommendationService.js`
- **核心方法**:
  - `recommendRooms(params)` - 主推荐函数
  - `getAvailableRooms(checkIn, checkOut)` - 查询可用房间
  - `getCustomerPreference(customerId)` - 分析客户历史偏好

**API端点**:
- `POST /api/rooms/recommend` - 获取推荐列表
- `POST /api/rooms/recommend/feedback` - 记录推荐反馈(用于算法优化)

#### 前端页面
- **文件位置**: `/pms-miniapp/pages/create-order/create-order-with-recommend.vue`
- **功能特性**:
  - 智能推荐按钮
  - 筛选条件(房型/楼层/价格)
  - 推荐房间卡片展示(评分+理由)
  - 自动计算订单金额

### 请求示例
```javascript
POST /api/rooms/recommend
{
  "checkIn": "2026-04-20",
  "checkOut": "2026-04-22",
  "roomType": "大床房",
  "maxPrice": 500,
  "floor": "high",
  "customerId": 123
}
```

### 响应示例
```json
{
  "success": true,
  "message": "为您推荐 5 个房间",
  "data": [
    {
      "id": 3,
      "room_number": "301",
      "room_type": "大床房",
      "price": 450,
      "orientation": "south",
      "recommendScore": 155,
      "recommendReasons": [
        "房型匹配",
        "价格合适",
        "高楼层",
        "南朝向",
        "高评分房间"
      ]
    }
  ]
}
```

---

## 📥 功能3: Excel数据导出

### 功能描述
支持订单数据和财务数据一键导出为Excel文件,方便财务对账和数据分析。

### 技术实现

#### 后端服务
- **文件位置**: `/backend/services/ExportService.js`
- **依赖**: `xlsx` 库 (已安装)
- **核心方法**:
  - `exportOrders(filters)` - 导出订单
  - `exportFinance(filters)` - 导出财务数据

#### API端点
- `GET /api/export/orders?startDate=xxx&endDate=xxx&channel=xxx` - 导出订单
- `GET /api/export/finance?year=2026&month=4` - 导出财务数据

#### 前端页面
- **订单导出**: `/pms-miniapp/pages/orders/orders-with-export.vue`
- **财务导出**: `/pms-miniapp/pages/finance/finance-with-export.vue`

### 导出文件结构

#### 订单导出 (orders_YYYYMMDD_HHmmss.xlsx)
- **工作表1: 订单列表**
  - 订单号、渠道、客户姓名、联系电话
  - 房间号、房型、入住日期、退房日期
  - 订单金额、状态、创建时间
  
- **工作表2: 统计汇总**
  - 总订单数、总营收、导出时间

#### 财务导出 (finance_YYYYMMDD_HHmmss.xlsx)
- **工作表1: 财务明细**
  - 日期、类型(收入/支出)、类别、金额、说明
  
- **工作表2: 月度汇总**
  - 年月、总收入、总支出、净利润
  
- **工作表3: 渠道统计**
  - 渠道名称、订单数、总营收

### 使用方法

#### 前端调用
```javascript
// 订单导出
const params = new URLSearchParams({
  startDate: '2026-04-01',
  endDate: '2026-04-30',
  channel: 'ctrip'
})
const url = `http://localhost:3100/api/export/orders?${params}`
window.open(url, '_blank') // H5平台直接下载
```

#### 后端响应
```javascript
res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
res.setHeader('Content-Disposition', 'attachment; filename="orders_20260418_151200.xlsx"')
res.send(buffer)
```

---

## 🚀 部署指南

### 后端部署

1. **安装依赖**
```bash
cd /root/.openclaw/workspace/pms-prototype/backend
npm install
```

2. **启动服务**
```bash
npm start
# 或使用 nodemon 开发模式
npm run dev
```

3. **验证API**
```bash
# 测试推荐API
curl -X POST http://localhost:3100/api/rooms/recommend \
  -H "Content-Type: application/json" \
  -d '{"checkIn":"2026-04-20","checkOut":"2026-04-22"}'

# 测试导出API
curl http://localhost:3100/api/export/orders -o test.xlsx
```

### 前端部署

1. **更新页面路由**
编辑 `/pms-miniapp/pages.json`:
```json
{
  "pages": [
    {
      "path": "pages/index/index-with-charts",
      "style": { "navigationBarTitleText": "首页" }
    },
    {
      "path": "pages/create-order/create-order-with-recommend",
      "style": { "navigationBarTitleText": "创建订单" }
    },
    {
      "path": "pages/orders/orders-with-export",
      "style": { "navigationBarTitleText": "订单管理" }
    },
    {
      "path": "pages/finance/finance-with-export",
      "style": { "navigationBarTitleText": "财务统计" }
    }
  ]
}
```

2. **编译运行**
```bash
cd /root/.openclaw/workspace/pms-miniapp

# H5平台
npm run dev:h5

# 微信小程序
npm run dev:mp-weixin
```

---

## 📦 文件清单

### 新增文件
```
backend/
├── services/
│   ├── RecommendationService.js   # 推荐算法服务
│   └── ExportService.js           # Excel导出服务

pms-miniapp/
├── components/
│   └── charts/
│       └── RevenueChart.vue       # 通用图表组件
├── pages/
│   ├── index/
│   │   └── index-with-charts.vue  # 带图表的首页
│   ├── create-order/
│   │   └── create-order-with-recommend.vue  # 带推荐的创建订单页
│   ├── orders/
│   │   └── orders-with-export.vue # 带导出的订单页
│   └── finance/
│       └── finance-with-export.vue # 带导出的财务页
```

### 修改文件
```
backend/
└── server.js  # 添加3个可视化API + 2个推荐API + 2个导出API
```

---

## 🎯 性能优化建议

### 数据库优化
```sql
-- 为常用查询字段添加索引
CREATE INDEX idx_orders_check_in ON orders(check_in);
CREATE INDEX idx_orders_channel ON orders(channel);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_room_occupancy_date ON room_occupancy(date, room_id);
```

### 缓存策略
- 仪表盘数据: Redis缓存5分钟
- 推荐结果: 会话缓存(同一客户/日期)
- 渠道列表: 内存缓存1小时

### 导出优化
- 大数据量(>10000条): 分批查询
- 异步导出: 后台任务 + 下载链接通知
- 文件压缩: 超过5MB自动压缩

---

## 🔧 配置参数

### 推荐算法参数
```javascript
// RecommendationService.js
const RECOMMENDATION_CONFIG = {
  maxResults: 10,           // 最多返回10个推荐
  priceWeight: 0.3,         // 价格权重
  locationWeight: 0.2,      // 位置权重
  ratingWeight: 0.2,        // 评分权重
  historyWeight: 0.3        // 历史偏好权重
}
```

### 导出参数
```javascript
// ExportService.js
const EXPORT_CONFIG = {
  maxRows: 50000,          // 单次最大导出行数
  columnWidths: {          // 列宽配置
    orderNo: 20,
    customerName: 12,
    phone: 15
  },
  dateFormat: 'YYYY-MM-DD' // 日期格式
}
```

---

## 📊 测试用例

### 推荐算法测试
```javascript
// 测试1: 基础推荐
POST /api/rooms/recommend
{
  "checkIn": "2026-04-20",
  "checkOut": "2026-04-22"
}
// 预期: 返回所有可用房间,按基础分排序

// 测试2: 带筛选条件
POST /api/rooms/recommend
{
  "checkIn": "2026-04-20",
  "checkOut": "2026-04-22",
  "roomType": "大床房",
  "maxPrice": 500,
  "floor": "high"
}
// 预期: 返回符合条件的房间,评分>150

// 测试3: 客户历史偏好
POST /api/rooms/recommend
{
  "checkIn": "2026-04-20",
  "checkOut": "2026-04-22",
  "customerId": 1
}
// 预期: 推荐客户偏好的房型/朝向
```

### 导出功能测试
```bash
# 测试1: 导出所有订单
curl http://localhost:3100/api/export/orders -o all_orders.xlsx

# 测试2: 按日期筛选
curl "http://localhost:3100/api/export/orders?startDate=2026-04-01&endDate=2026-04-30" -o april_orders.xlsx

# 测试3: 按渠道筛选
curl "http://localhost:3100/api/export/orders?channel=ctrip" -o ctrip_orders.xlsx

# 测试4: 导出财务数据
curl "http://localhost:3100/api/export/finance?year=2026&month=4" -o finance_202604.xlsx
```

---

## 🐛 已知问题与解决方案

### 问题1: 图表在小程序端显示异常
**原因**: uni-app Canvas API在不同平台有差异
**解决**: 使用条件编译 `#ifdef MP-WEIXIN` 做平台适配

### 问题2: 导出Excel中文乱码
**原因**: 编码问题
**解决**: 已在ExportService中统一使用UTF-8编码

### 问题3: 推荐算法冷启动(新房间无历史数据)
**原因**: 新房间booking_count=0
**解决**: 添加新房激励分+5,确保新房也能被推荐

---

## 📚 扩展方向

### 短期优化 (1-2周)
1. **图表交互**: 添加点击查看详情功能
2. **推荐优化**: 基于用户反馈持续优化评分权重
3. **导出增强**: 支持PDF格式导出

### 中期规划 (1-3月)
1. **机器学习推荐**: 使用TensorFlow.js实现协同过滤
2. **实时大屏**: WebSocket推送实时数据到大屏
3. **BI报表**: 集成Metabase/Superset做深度分析

### 长期愿景 (3-12月)
1. **预测分析**: 基于历史数据预测未来营收趋势
2. **智能定价**: 动态调整房间价格优化收益
3. **多门店支持**: 扩展为连锁民宿管理系统

---

## 📞 技术支持

- **开发者**: AI助手 (Clawdbot)
- **项目路径**: `/root/.openclaw/workspace/pms-prototype`
- **文档更新**: 2026-04-18
- **版本**: v1.1.0

---

## ✅ 验收标准

### 功能1: 数据可视化 ✓
- [x] 营收趋势折线图正常显示
- [x] 房型占比饼图正确展示百分比
- [x] 渠道分布柱状图颜色区分清晰
- [x] 下拉刷新实时更新数据

### 功能2: 智能推荐 ✓
- [x] 推荐算法评分合理
- [x] 推荐理由清晰易懂
- [x] 筛选条件生效
- [x] 选择推荐房间自动计算金额

### 功能3: Excel导出 ✓
- [x] 订单数据完整导出
- [x] 财务数据多工作表
- [x] 中文显示正常
- [x] 文件命名规范(包含时间戳)

---

**🎉 所有功能已完成,代码符合最佳实践,文档完整!**
