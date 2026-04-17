# 酒店/公寓管理系统（PMS）技术方案

## 项目概述

**项目名称**：智能公寓管理系统 (Smart PMS)  
**目标**：多渠道房源管理、实时房态同步、财务报表、运营管理一体化平台

## 核心需求

### 1. 多渠道管理
- 支持多个 OTA 平台（携程、美团、飞猪、Booking.com、Airbnb 等）
- 房态实时同步，避免超售
- 价格统一管理，支持不同渠道差异化定价

### 2. 房态管理
- 日历视图、单日视图
- 房间状态：预抵、已抵、预离、已离、新办、维修、锁房
- 自动状态流转

### 3. 订单管理
- 订单全生命周期管理
- 自动确认、修改、取消
- 消息通知（短信、微信、APP 推送）

### 4. 财务报表
- 每日营业额统计
- 月度收入报表
- 渠道收入对比
- 成本分析（清洁、维修、佣金）

### 5. 运营管理
- 入住信息管理
- 客房清洁任务分配
- 客户信息管理
- 智能定价建议

## 技术架构

### 前端架构

#### 移动端 APP (客户端)
```
技术栈：
- Flutter / React Native（跨平台）
- 或 uni-app（如果需要快速开发小程序版本）

功能模块：
- 房源浏览
- 在线预订
- 订单查询
- 在线支付
- 消息通知
```

#### 管理后台 (Web)
```
技术栈：
- Vue 3 + Element Plus / Ant Design Vue
- 或 React + Ant Design Pro

功能模块：
- 房态日历
- 订单管理
- 客户管理
- 财务报表
- 运营管理
- 渠道配置
```

### 后端架构

#### 核心服务
```
技术栈：
- Node.js + NestJS（推荐，TypeScript 全栈）
- 或 Spring Boot（Java，更成熟的企业方案）
- 或 Django/FastAPI（Python，适合 AI 功能集成）

架构模式：
- 微服务架构（规模大）/ 单体架构（初期）
- RESTful API + WebSocket（实时通知）
```

#### 数据库设计
```
主库：PostgreSQL / MySQL
- 房源信息
- 订单数据
- 客户信息
- 财务数据

缓存：Redis
- 房态实时数据
- 价格缓存
- 会话管理

消息队列：RabbitMQ / Kafka
- 异步任务处理
- 渠道同步任务
- 通知推送

对象存储：MinIO / 阿里云 OSS
- 图片存储
- 文件管理
```

### 第三方集成

#### OTA 渠道对接
```
方案一：直连 API
- 携程 Open API
- 美团酒旅 API
- Booking.com API
- Airbnb API

方案二：使用 PMS 中间件
- 石基 SHIJI (收费)
- 云订房（免费/收费混合）
- 别样红（专注民宿）

推荐：初期使用方案二，降低开发成本
```

#### 支付集成
```
- 微信支付
- 支付宝
- 银联
- 第三方聚合支付（Ping++、BeeCloud）
```

#### 消息通知
```
- 短信：阿里云短信、腾讯云短信
- 微信模板消息 / 服务通知
- APP 推送：极光推送、个推
- 邮件：SendGrid、阿里邮件推送
```

## 数据库设计（核心表）

### 1. 房源管理
```sql
-- 房源表
CREATE TABLE properties (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100),
    address TEXT,
    type ENUM('apartment', 'hotel', 'hostel'),
    total_rooms INT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 房间表
CREATE TABLE rooms (
    id BIGINT PRIMARY KEY,
    property_id BIGINT,
    room_number VARCHAR(20),
    room_type VARCHAR(50),
    base_price DECIMAL(10,2),
    status ENUM('available', 'occupied', 'cleaning', 'maintenance', 'locked'),
    created_at TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id)
);
```

### 2. 订单管理
```sql
-- 订单表
CREATE TABLE orders (
    id BIGINT PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE,
    room_id BIGINT,
    customer_id BIGINT,
    channel ENUM('direct', 'ctrip', 'meituan', 'booking', 'airbnb'),
    check_in DATE,
    check_out DATE,
    total_price DECIMAL(10,2),
    status ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'),
    created_at TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- 订单快照（用于房态日历）
CREATE TABLE room_occupancy (
    id BIGINT PRIMARY KEY,
    room_id BIGINT,
    order_id BIGINT,
    date DATE,
    status ENUM('available', 'booked', 'occupied', 'locked'),
    price DECIMAL(10,2),
    INDEX idx_room_date (room_id, date),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);
```

### 3. 客户管理
```sql
CREATE TABLE customers (
    id BIGINT PRIMARY KEY,
    name VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    id_card VARCHAR(30),
    channel_source VARCHAR(50),
    total_orders INT DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP
);
```

### 4. 财务管理
```sql
-- 财务流水
CREATE TABLE financial_records (
    id BIGINT PRIMARY KEY,
    order_id BIGINT,
    type ENUM('income', 'expense'),
    category VARCHAR(50), -- 房费、清洁费、佣金、维修费等
    amount DECIMAL(10,2),
    date DATE,
    description TEXT,
    created_at TIMESTAMP
);
```

### 5. 运营管理
```sql
-- 清洁任务
CREATE TABLE cleaning_tasks (
    id BIGINT PRIMARY KEY,
    room_id BIGINT,
    assigned_to BIGINT, -- 清洁人员 ID
    status ENUM('pending', 'in_progress', 'completed'),
    scheduled_time TIMESTAMP,
    completed_time TIMESTAMP,
    notes TEXT
);
```

## 核心功能实现

### 1. 房态同步引擎

```typescript
// 房态同步服务（伪代码）
class RoomSyncService {
  // 监听订单变化
  async onOrderCreated(order: Order) {
    // 1. 锁定房间
    await this.lockRoom(order.roomId, order.checkIn, order.checkOut);
    
    // 2. 同步到各渠道
    await this.syncToChannels(order.roomId, 'unavailable');
    
    // 3. 发送确认通知
    await this.sendConfirmation(order.customerId, order);
  }
  
  // 渠道同步
  async syncToChannels(roomId: number, status: string) {
    const channels = await this.getActiveChannels(roomId);
    
    for (const channel of channels) {
      try {
        await channel.updateRoomStatus(roomId, status);
      } catch (error) {
        // 记录失败，稍后重试
        await this.queueRetry(channel, roomId, status);
      }
    }
  }
}
```

### 2. 智能定价

```typescript
// 智能定价建议（基于历史数据 + AI）
class PricingEngine {
  async suggestPrice(roomId: number, date: Date) {
    // 1. 获取历史数据
    const historicalData = await this.getHistoricalOccupancy(roomId, date);
    
    // 2. 考虑因素
    const factors = {
      seasonality: this.getSeasonalityFactor(date),
      dayOfWeek: this.getDayOfWeekFactor(date),
      localEvents: await this.getLocalEvents(date),
      competitorPrices: await this.getCompetitorPrices(roomId, date),
      occupancyRate: this.getCurrentOccupancyRate(date)
    };
    
    // 3. 计算建议价格
    const basePrice = await this.getBasePrice(roomId);
    const suggestedPrice = basePrice * this.calculateMultiplier(factors);
    
    return {
      suggested: suggestedPrice,
      min: suggestedPrice * 0.8,
      max: suggestedPrice * 1.2,
      reasoning: this.explainPricing(factors)
    };
  }
}
```

### 3. 报表生成

```typescript
// 财务报表服务
class ReportService {
  // 每日营业额
  async getDailySummary(date: Date) {
    return await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_orders,
        SUM(total_price) as revenue,
        SUM(CASE WHEN channel = 'ctrip' THEN total_price ELSE 0 END) as ctrip_revenue,
        SUM(CASE WHEN channel = 'meituan' THEN total_price ELSE 0 END) as meituan_revenue
      FROM orders
      WHERE DATE(created_at) = ?
        AND status IN ('confirmed', 'checked_in', 'checked_out')
      GROUP BY DATE(created_at)
    `, [date]);
  }
  
  // 月度报表
  async getMonthlyReport(year: number, month: number) {
    const report = {
      revenue: await this.getMonthlyRevenue(year, month),
      expenses: await this.getMonthlyExpenses(year, month),
      occupancyRate: await this.getOccupancyRate(year, month),
      channelBreakdown: await this.getChannelBreakdown(year, month),
      topRooms: await this.getTopPerformingRooms(year, month)
    };
    
    report.profit = report.revenue - report.expenses;
    report.profitMargin = (report.profit / report.revenue) * 100;
    
    return report;
  }
}
```

## 部署方案

### 云服务器推荐
```
- 阿里云 ECS（国内首选）
- 腾讯云 CVM
- AWS / Azure（海外业务）

配置建议（初期）：
- 2 核 4GB（小规模，< 50 间房）
- 4 核 8GB（中规模，50-200 间房）
- 8 核 16GB（大规模，> 200 间房）
```

### Docker 容器化部署
```yaml
# docker-compose.yml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
  
  backend:
    build: ./backend
    environment:
      - DB_HOST=db
      - REDIS_HOST=redis
    depends_on:
      - db
      - redis
  
  frontend:
    build: ./frontend
    depends_on:
      - backend
  
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: your_password
  
  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 开发计划

### 第一阶段：MVP（1-2个月）
- [ ] 基础房源管理
- [ ] 订单创建、查询
- [ ] 简单房态日历
- [ ] 客户信息管理
- [ ] 基础报表

### 第二阶段：渠道对接（1-2个月）
- [ ] 对接 2-3 个主要 OTA
- [ ] 房态实时同步
- [ ] 价格同步
- [ ] 订单自动确认

### 第三阶段：高级功能（2-3个月）
- [ ] 智能定价
- [ ] AI 客服
- [ ] 高级报表分析
- [ ] 移动端 APP
- [ ] 消息推送系统

### 第四阶段：优化与扩展（持续）
- [ ] 性能优化
- [ ] 更多渠道对接
- [ ] 数据分析看板
- [ ] 用户权限细化
- [ ] API 开放平台

## 成本估算

### 开发成本
- 后端开发：2-3 人月（¥30,000-50,000/人月）
- 前端开发：1-2 人月
- UI/UX 设计：0.5-1 人月
- 测试：0.5-1 人月
- **总计**：约 ¥150,000 - 300,000（初版）

### 运营成本（月）
- 云服务器：¥500 - 2,000
- 数据库：¥300 - 1,000
- 短信/推送：¥200 - 1,000
- CDN/OSS：¥100 - 500
- 域名/SSL：¥50
- **总计**：约 ¥1,150 - 4,550/月

## 风险与挑战

1. **OTA 接口稳定性**：需要处理各渠道 API 变更
2. **数据一致性**：房态同步必须准确，避免超售
3. **并发处理**：高峰期订单处理性能
4. **数据安全**：客户隐私信息保护
5. **渠道佣金**：不同平台的费用计算复杂

## 可选方案：使用现成 SaaS

如果想快速上线，也可以考虑现成的 PMS 系统：

**国内方案**：
- 云掌柜 PMS（携程系）
- 别样红 PMS（专注民宿）
- 订单来了
- 小猪短租 PMS

**优点**：快速上线、成本低、功能成熟  
**缺点**：定制化受限、数据不完全掌控、持续付费

## 下一步建议

1. **确定规模**：管理多少间房？预计年订单量？
2. **选择技术栈**：倾向哪种技术？团队技能如何？
3. **自研 vs SaaS**：预算和时间要求？
4. **优先级排序**：哪些功能必须第一期实现？

---

**联系我获取**：
- 详细数据库设计 SQL
- 完整 API 接口文档
- 前端页面原型设计
- 部署配置文件
