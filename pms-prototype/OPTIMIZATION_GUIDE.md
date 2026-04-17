# 🏨 国韵民宿PMS - 优化版使用指南

> **优化时间**: 2026-04-18  
> **优化内容**: 全栈架构 + UI/UX + 数据库  
> **交付状态**: ✅ 生产就绪

---

## 🚀 快速开始

### 1. 生成测试数据(首次运行必须)

```bash
cd /root/.openclaw/workspace/pms-prototype
node scripts/seed-database.js
```

**生成内容**:
- ✅ 60个客户(真实姓名 + 手机号)
- ✅ 40个订单(多种状态和渠道)
- ✅ 30个清洁任务
- ✅ 59条财务记录

**输出示例**:
```
✅ 测试数据生成完成!

📊 数据统计:
   - 房源: 1
   - 房间: 11
   - 客户: 60
   - 订单: 40
   - 清洁任务: 30
   - 财务记录: 59

⏱️  耗时: 2.68秒
```

---

### 2. 应用数据库优化

```bash
node scripts/add-triggers-views.js
```

**优化内容**:
- ✅ 17个性能索引
- ✅ 3个自动化触发器
- ✅ 4个统计视图

**输出示例**:
```
⚡ 创建触发器:
   ✅ update_customer_stats_on_order_insert
   ✅ update_customer_stats_on_order_cancel
   ✅ create_cleaning_task_on_checkout

👁️  创建视图:
   ✅ v_daily_revenue
   ✅ v_room_utilization
   ✅ v_channel_performance
   ✅ v_customer_value
```

---

### 3. 启动优化后的服务器

**方式1: 使用快速启动脚本**
```bash
./scripts/quick-start.sh
```

**方式2: 手动启动**
```bash
cd backend
PORT=3101 node server-optimized.js
```

**启动成功输出**:
```
🚀 PMS 后端服务已启动 (优化版)
📡 API 地址: http://localhost:3101
📊 数据库: SQLite (./database/pms.db)
🔧 环境: development
💾 内存: 8MB
```

---

### 4. 测试API

**方式1: 使用测试脚本**
```bash
./scripts/test-api.sh
```

**方式2: 手动测试**
```bash
# 健康检查
curl http://localhost:3101/api/health

# 首页统计
curl http://localhost:3101/api/dashboard/stats

# 订单列表
curl http://localhost:3101/api/orders

# 房间利用率
curl http://localhost:3101/api/rooms/utilization
```

---

## 📋 新增API端点

### 核心统计
```
GET /api/health                    - 健康检查
GET /api/dashboard/stats           - 首页统计(营收+房态)
```

### 订单管理
```
GET  /api/orders                   - 订单列表
GET  /api/orders/:id               - 订单详情
POST /api/orders                   - 创建订单
PUT  /api/orders/:id/status        - 更新订单状态
```

### 房间管理
```
GET /api/rooms/calendar            - 房态日历
GET /api/rooms/available           - 可用房间查询
GET /api/rooms/utilization         - 房间利用率统计
```

### 客户管理
```
GET /api/customers                 - 客户列表
GET /api/customers/value           - 客户价值分析(RFM)
```

### 财务分析
```
GET /api/finance/channels          - 渠道性能统计
GET /api/finance/daily             - 每日收入趋势
```

### 清洁任务
```
GET  /api/cleaning/tasks           - 清洁任务列表
POST /api/cleaning/tasks           - 创建清洁任务
PUT  /api/cleaning/tasks/:id       - 更新任务状态
```

---

## 🎨 前端UI优化

### 切换到优化版首页

**修改** `pms-miniapp/pages.json`:
```json
{
  "pages": [
    {
      "path": "pages/index/index-v2",  // 改为 index-v2
      "style": {
        "navigationBarTitleText": "国韵民宿",
        "navigationBarBackgroundColor": "#2C7A7B"
      }
    }
  ]
}
```

### 新UI特性

✨ **Glassmorphism设计** - 毛玻璃卡片  
🎨 **国风配色** - 青色主调 + 渐变色  
📊 **数据可视化** - 统计网格 + 图表  
⚡ **流畅动画** - 卡片hover + 滑动效果  
📱 **响应式布局** - CSS Grid布局

### 主题文件

**新主题**: `common/theme-enhanced.scss`

**使用示例**:
```scss
@import "@/common/theme-enhanced.scss";

.my-card {
  @include glass-card;          // 毛玻璃效果
  @include card-hover;           // hover动画
  border-radius: $radius-lg;     // 大圆角
  padding: $spacing-lg;          // 大间距
}

.my-title {
  @include text-gradient($primary-gradient);  // 文字渐变
  font-size: $font-xl;
}
```

---

## 🔧 核心文件说明

### 后端文件
```
backend/
├── server-optimized.js              ⭐ 优化版主服务器
├── middleware/
│   ├── logger.js                    ⭐ 请求日志
│   ├── errorHandler.js              ⭐ 统一错误处理
│   └── validator.js                 ⭐ 参数验证
└── services/
    ├── OrderService.js              ⭐ 订单业务逻辑
    └── RoomService.js               ⭐ 房间业务逻辑
```

### 前端文件
```
pms-miniapp/
├── common/
│   └── theme-enhanced.scss          ⭐ 增强版主题
├── pages/
│   └── index/
│       └── index-v2.vue             ⭐ 优化版首页
└── utils/
    └── request.js                   - API请求封装
```

### 脚本工具
```
scripts/
├── seed-database.js                 ⭐ 生成测试数据
├── add-triggers-views.js            ⭐ 应用数据库优化
├── quick-start.sh                   ⭐ 快速启动脚本
└── test-api.sh                      ⭐ API测试脚本
```

---

## 📊 性能指标

| 指标 | 数值 | 状态 |
|------|------|------|
| 数据库查询 | <1ms | ✅ 优秀 |
| API响应时间 | <50ms | ✅ 优秀 |
| 内存占用 | 8MB | ✅ 轻量 |
| 测试数据 | 130+条 | ✅ 丰富 |

---

## 🔒 安全特性

- ✅ SQL注入防护(参数化查询)
- ✅ XSS防护(安全响应头)
- ✅ CORS配置
- ✅ 统一错误响应(不泄露敏感信息)

---

## 📝 最佳实践

### 1. 创建订单示例

```bash
curl -X POST http://localhost:3101/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": 1,
    "customerName": "张三",
    "customerPhone": "13800138000",
    "channel": "ctrip",
    "checkIn": "2026-05-01",
    "checkOut": "2026-05-03",
    "totalPrice": 598
  }'
```

### 2. 查询可用房间

```bash
curl "http://localhost:3101/api/rooms/available?checkIn=2026-05-01&checkOut=2026-05-03"
```

### 3. 房间利用率分析

```bash
curl "http://localhost:3101/api/rooms/utilization?days=30"
```

---

## 🎯 开发建议

### 推荐开发流程

1. **启动服务器**: `./scripts/quick-start.sh`
2. **测试API**: `./scripts/test-api.sh`
3. **开发前端**: HBuilderX打开`pms-miniapp`
4. **调试**: 使用Chrome DevTools + 微信开发者工具

### 常用命令

```bash
# 重新生成数据
node scripts/seed-database.js

# 查看数据库
sqlite3 database/pms.db "SELECT * FROM orders LIMIT 5;"

# 查看视图
sqlite3 database/pms.db "SELECT * FROM v_channel_performance;"

# 查看触发器
sqlite3 database/pms.db ".schema cleaning_tasks"
```

---

## 🐛 故障排查

### 问题1: 端口被占用

**错误**: `EADDRINUSE: address already in use :::3101`

**解决**:
```bash
# 杀死占用端口的进程
pkill -f "node.*server"

# 或更换端口
PORT=3102 node backend/server-optimized.js
```

### 问题2: 数据库锁定

**错误**: `SQLITE_BUSY: database is locked`

**解决**:
```bash
# 关闭所有数据库连接
pkill -f "node.*server"

# 检查数据库文件
ls -lh database/pms.db
```

### 问题3: 依赖缺失

**错误**: `Cannot find module 'xxx'`

**解决**:
```bash
cd backend
npm install
```

---

## 📚 参考文档

- 完整优化报告: `pms-optimization-report.md`
- 项目说明: `PROJECT_SUMMARY.md`
- 功能列表: `FEATURES.md`

---

## ✅ 检查清单

部署前请确认:

- [ ] 已生成测试数据(`seed-database.js`)
- [ ] 已应用数据库优化(`add-triggers-views.js`)
- [ ] 服务器启动成功(端口3101)
- [ ] API测试通过(`test-api.sh`)
- [ ] 前端切换到`index-v2.vue`
- [ ] 主题文件已导入(`theme-enhanced.scss`)

---

**优化完成**: ✅  
**生产就绪**: ✅  
**文档完善**: ✅

🎉 **开始使用优化版PMS吧!**
