# 🏨 PMS 原型系统 - 智能公寓管理

基于你提供的 UI 界面开发的完整功能原型系统。

## ✨ 核心功能

### 1. 多渠道客户管理 ✅
- ✅ 区分不同渠道的客户（携程、美团、飞猪、Booking、直销）
- ✅ 支持多渠道同时推广
- ✅ 客户列表按渠道分类展示

### 2. 自动渠道通知 ✅
- ✅ 房间预订后自动通知所有渠道
- ✅ 实时更新房态到各渠道（模拟）
- ✅ 防止超售

### 3. 财务报表与数据分析 ✅
- ✅ 月度收入统计
- ✅ 渠道收入对比（饼图）
- ✅ 每日收入趋势（折线图）
- ✅ 平均客单价分析

### 4. 入住与清洁管理 ✅
- ✅ 每日入住信息统计
- ✅ 客房清洁任务分配
- ✅ 清洁状态实时跟踪
- ✅ 任务完成记录

## 🚀 快速启动

### 方式一：一键启动（推荐）

```bash
cd /root/.openclaw/workspace/pms-prototype
chmod +x start.sh
./start.sh
```

### 方式二：手动启动

```bash
# 1. 启动后端
cd backend
npm install
node server.js

# 2. 启动前端（新终端）
cd frontend
npm install
npm run dev
```

## 📱 访问地址

- **前端界面**: http://localhost:5173
- **后端 API**: http://localhost:3100

## 🎯 系统截图对照

原型系统完全基于你提供的 UI 界面设计，包含：

1. ✅ **首页** - 顶部蓝色渐变统计卡片 + 房态统计条 + 功能模块网格
2. ✅ **订单管理** - 渠道筛选 + 订单列表 + 新建订单
3. ✅ **房态日历** - 日期范围选择 + 房间占用情况
4. ✅ **客户列表** - 按渠道分类展示（携程/美团/直销等）
5. ✅ **财务统计** - 月度收入 + 渠道对比图表 + 趋势分析
6. ✅ **清洁管理** - 任务列表 + 状态跟踪

## 🗂 项目结构

```
pms-prototype/
├── backend/                # 后端服务
│   ├── server.js          # Express 服务器
│   ├── database.js        # SQLite 数据库
│   └── package.json
├── frontend/              # 前端界面
│   ├── src/
│   │   ├── views/         # 页面组件
│   │   │   ├── Dashboard.vue      # 首页
│   │   │   ├── Orders.vue         # 订单管理
│   │   │   ├── RoomCalendar.vue   # 房态日历
│   │   │   ├── Customers.vue      # 客户列表
│   │   │   ├── Finance.vue        # 财务统计
│   │   │   └── Cleaning.vue       # 清洁管理
│   │   ├── App.vue        # 根组件
│   │   ├── main.js        # 入口文件
│   │   └── router.js      # 路由配置
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── database/              # SQLite 数据库文件
│   └── pms.db            # 自动生成
├── start.sh              # 一键启动脚本
└── README.md             # 本文件
```

## 🔧 技术栈

### 后端
- **Node.js** + Express - 轻量级 Web 框架
- **SQLite** (better-sqlite3) - 零配置数据库
- **CORS** - 跨域支持
- **dayjs** - 日期处理

### 前端
- **Vue 3** - 渐进式框架
- **Element Plus** - UI 组件库
- **Vue Router** - 路由管理
- **Axios** - HTTP 客户端
- **ECharts** - 数据可视化
- **Vite** - 构建工具

## 📊 数据库设计

系统包含以下核心表：

1. **properties** - 房源表
2. **rooms** - 房间表
3. **customers** - 客户表
4. **orders** - 订单表
5. **room_occupancy** - 房态表
6. **cleaning_tasks** - 清洁任务表
7. **financial_records** - 财务记录表
8. **channels** - 渠道配置表

初始化时自动创建默认数据：
- 1 个房源（观芦民宿）
- 11 个房间
- 5 个渠道（携程、美团、飞猪、Booking、直销）
- 5 个模拟订单

## 🎨 UI 风格

- **主色调**: 蓝色渐变 (#4A90E2 → #357ABD)
- **卡片**: 圆角阴影设计
- **图标**: Element Plus Icons
- **布局**: 侧边栏 + 主内容区
- **响应式**: 适配不同屏幕尺寸

## 📝 API 接口

### 首页统计
```
GET /api/dashboard/stats
```

### 订单管理
```
GET  /api/orders           # 订单列表
POST /api/orders           # 创建订单
```

### 房态日历
```
GET /api/rooms/calendar    # 房态数据
```

### 客户管理
```
GET /api/customers         # 客户列表（支持渠道筛选）
```

### 财务统计
```
GET /api/finance/monthly   # 月度财务数据
```

### 清洁管理
```
GET  /api/cleaning/tasks   # 任务列表
POST /api/cleaning/tasks   # 创建任务
PUT  /api/cleaning/tasks/:id  # 更新状态
```

### 渠道列表
```
GET /api/channels          # 渠道配置
```

## 🎯 核心特性说明

### 1. 多渠道管理

系统内置 5 个渠道：
- 携程（commission_rate: 15%）
- 美团（commission_rate: 12%）
- 飞猪（commission_rate: 10%）
- Booking（commission_rate: 18%）
- 直销（commission_rate: 0%）

每个订单都关联到具体渠道，客户列表按渠道分类展示。

### 2. 自动通知机制

当创建订单时，系统会：
1. 锁定指定日期的房间
2. 更新 `room_occupancy` 表
3. 调用 `notifyChannels()` 函数通知所有渠道（当前为模拟，实际项目中调用各渠道 API）
4. 记录财务流水

### 3. 财务报表

- **月度统计**: 总收入、订单数、平均客单价
- **渠道对比**: 饼图展示各渠道收入占比
- **每日趋势**: 折线图展示收入走势

### 4. 清洁管理

- 支持创建清洁任务并分配负责人
- 三种状态：待清洁、清洁中、已完成
- 记录计划时间和完成时间

## 🚧 已知限制（原型版本）

1. **无用户认证** - 原型版未实现登录功能
2. **渠道通知模拟** - 实际项目需对接各渠道 API
3. **无权限控制** - 所有用户可执行所有操作
4. **无数据加密** - 敏感信息未加密存储
5. **单机部署** - 未实现分布式部署

## 🔜 扩展建议

如需投入生产使用，建议补充：

1. **安全加固**
   - JWT 用户认证
   - 数据加密存储
   - SQL 注入防护

2. **高级功能**
   - 公安联网系统
   - 智能定价算法
   - 移动端 APP

3. **生产环境**
   - 切换到 PostgreSQL/MySQL
   - Redis 缓存
   - Nginx 反向代理
   - Docker 容器化

## 📚 使用教程

### 创建订单流程

1. 点击**订单管理**
2. 点击**新建订单**按钮
3. 填写表单：
   - 选择房间
   - 输入客户信息
   - 选择渠道
   - 选择入住/退房日期
   - 输入金额
4. 点击**创建订单**

✅ 系统会自动：
- 检查房间可用性
- 锁定指定日期
- 通知所有渠道
- 记录财务流水

### 查看财务报表

1. 点击**财务统计**
2. 选择月份
3. 查看：
   - 总收入
   - 渠道收入对比（饼图）
   - 每日收入趋势（折线图）

### 管理清洁任务

1. 点击**清洁管理**
2. 点击**新建任务**
3. 分配房间和负责人
4. 清洁人员可更新状态：
   - **开始清洁** → 清洁中
   - **完成** → 已完成

## 🐛 故障排查

### 端口占用
```bash
# 检查端口占用
lsof -i :3100  # 后端
lsof -i :5173  # 前端

# 杀死进程
kill -9 <PID>
```

### 数据库问题
```bash
# 重置数据库
rm database/pms.db
node backend/server.js  # 重新初始化
```

### 依赖安装失败
```bash
# 清除缓存
rm -rf backend/node_modules frontend/node_modules
npm cache clean --force

# 重新安装
cd backend && npm install
cd ../frontend && npm install
```

## 📞 技术支持

如有问题或需要定制化开发，请联系技术团队。

## 📄 许可证

MIT License - 可自由使用和修改

---

**开发时间**: 2026-04-15  
**版本**: 1.0.0 (原型版)  
**基于**: 你提供的 UI 界面设计

🎉 祝使用愉快！
