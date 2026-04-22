# GuoyunPMS 架构设计文档

## 系统架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Layer                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  H5 App  │  │  小程序   │  │  后台管理  │  │ OTA平台  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS/WebSocket
┌──────────────────────┴──────────────────────────────────────────┐
│                        API Gateway                               │
│                   (Express.js + Middleware)                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐          │
│  │  Auth   │  │  Rate   │  │ Logger  │  │  CORS    │          │
│  │  JWT    │  │ Limiter │  │  日志   │  │  跨域    │          │
│  └─────────┘  └─────────┘  └─────────┘  └──────────┘          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────────┐
│                      Business Layer                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   Auth   │  │   Room   │  │  Order   │  │   OTA    │        │
│  │  Service │  │ Service  │  │ Service  │  │ Service  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Pricing  │  │  Export  │  │   Bulk   │  │  Cache   │        │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────────┐
│                       Data Layer                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ SQLite   │  │  Redis   │  │   File   │  │ External │        │
│  │  主数据库 │  │   缓存   │  │  System  │  │   API    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## 技术栈

### 后端技术
- **Node.js 18+** - 运行时环境
- **Express.js 4.x** - Web框架
- **SQLite 3** - 主数据库
- **better-sqlite3** - 同步数据库驱动
- **Redis 7** - 缓存层(可选)
- **JWT** - 身份认证
- **bcrypt** - 密码加密
- **WebSocket (ws)** - 实时通信

### 开发工具
- **Jest** - 单元测试框架
- **Swagger** - API文档生成
- **JSDoc** - 代码文档
- **Prometheus** - 监控指标
- **Docker** - 容器化部署

## 核心模块设计

### 1. 认证模块 (Auth Module)

```javascript
/**
 * 功能:
 * - 用户注册/登录
 * - JWT Token生成/验证
 * - 密码加密存储
 * - Token自动刷新
 * - 多角色权限控制
 */

// 流程图
User Request
    ↓
[Login/Register]
    ↓
AuthService.login()
    ↓
bcrypt.compare(password) → 验证密码
    ↓
jwt.sign(payload) → 生成Token
    ↓
Return { token, user }
```

**数据模型:**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('ADMIN', 'MANAGER', 'STAFF', 'CLEANER')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);
```

### 2. 智能定价模块 (Pricing Module)

```javascript
/**
 * 多维度定价算法:
 * 1. 基础价格 (basePrice)
 * 2. 入住率系数 (occupancyRate)
 *    - <30%: 0.8折
 *    - 30-80%: 原价
 *    - >80%: 1.3倍
 * 3. 周末/节假日系数 (weekend/holiday)
 *    - 周末: 1.2倍
 *    - 节假日: 1.5倍
 * 4. 预订提前期系数 (advanceBooking)
 *    - 早鸟(30天前): 0.9折
 *    - 最后一刻(1天内): 0.7折
 */

// 计算公式
finalPrice = basePrice × occupancyMultiplier × weekendMultiplier 
             × holidayMultiplier × advanceMultiplier
```

**价格计算流程:**
```
calculateSmartPrice(roomId, date, advanceDays)
    ↓
1. 获取房间基础价格 (database)
    ↓
2. 计算当日入住率 (bookedRooms / totalRooms)
    ↓
3. 判断是否周末/节假日 (date.getDay() / holidayList)
    ↓
4. 应用多个价格系数
    ↓
5. 返回最终价格 + 计算依据
```

### 3. OTA对接模块 (OTA Integration Module)

```javascript
/**
 * 支持平台:
 * - 携程 (Ctrip)
 * - 美团 (Meituan)
 * - Booking.com
 *
 * 核心功能:
 * - 房态同步 (Inventory Sync)
 * - 价格同步 (Price Sync)
 * - 订单拉取 (Order Fetch)
 * - 订单确认 (Order Confirm)
 */

// 同步流程
PMS System
    ↓
[房态/价格变更]
    ↓
OTAService.syncInventory(channel, data)
    ↓
API签名/加密
    ↓
HTTP POST → OTA平台API
    ↓
响应解析 + 错误处理
    ↓
记录同步日志
```

**渠道配置:**
```javascript
{
  ctrip: {
    enabled: true,
    apiUrl: 'https://api.ctrip.com',
    hotelId: 'xxx',
    apiKey: 'xxx',
    apiSecret: 'xxx'
  },
  meituan: { /*...*/ },
  booking: { /*...*/ }
}
```

### 4. 批量操作模块 (Bulk Operations Module)

```javascript
/**
 * 批量操作类型:
 * - 批量入住 (Batch Check-in)
 * - 批量退房 (Batch Check-out)
 * - 批量清洁 (Batch Clean)
 * - 批量取消 (Batch Cancel)
 *
 * 特性:
 * - 事务处理(部分成功/部分失败)
 * - 错误收集
 * - 进度追踪
 * - WebSocket实时通知
 */

// 处理流程
bulkOperation(orderIds, action)
    ↓
for each orderId:
    ↓
    try {
      executeAction(orderId)
      results.push({ orderId, success: true })
    } catch (error) {
      results.push({ orderId, success: false, error })
    }
    ↓
    wsService.notify(progress) → 实时推送进度
    ↓
return { processed, succeeded, failed, results }
```

### 5. 缓存模块 (Cache Module)

```javascript
/**
 * 缓存策略:
 * - 热点数据: 仪表盘统计 (TTL 5分钟)
 * - OTA状态: 渠道状态 (TTL 1小时)
 * - 房态数据: 可售房间列表 (TTL 10分钟)
 *
 * 缓存失效:
 * - 主动失效: 数据变更时清除相关缓存
 * - 被动失效: TTL到期自动过期
 * - 降级策略: Redis不可用时直接查数据库
 */

// 缓存中间件
cacheMiddleware(key, ttl)
    ↓
cache.get(key)
    ↓
if (cached && !expired) {
    return cached
} else {
    data = await fetchFromDatabase()
    cache.set(key, data, ttl)
    return data
}
```

### 6. 监控模块 (Monitoring Module)

```javascript
/**
 * 监控指标 (Prometheus):
 * - http_requests_total (请求总数)
 * - http_request_duration_seconds (响应时间)
 * - websocket_connections (WebSocket连接数)
 * - cache_hits_total (缓存命中数)
 * - database_queries_total (数据库查询数)
 *
 * 健康检查:
 * - 数据库连接
 * - Redis连接
 * - WebSocket服务
 * - 磁盘空间
 */

// 监控中间件
monitoringMiddleware(req, res, next)
    ↓
startTime = Date.now()
    ↓
next() → 执行业务逻辑
    ↓
duration = Date.now() - startTime
    ↓
metrics.httpRequestDuration.observe(duration)
metrics.httpRequestsTotal.inc({ method, route, status })
```

## 数据库设计

### ER图

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  users   │         │  rooms   │         │  orders  │
├──────────┤         ├──────────┤         ├──────────┤
│ id (PK)  │         │ id (PK)  │    ┌───>│ id (PK)  │
│ username │         │ room_num │    │    │ room_id (FK)
│ password │         │ room_type│<───┘    │ guest_name
│ role     │         │ status   │         │ check_in
│ created  │         │ price    │         │ check_out
└──────────┘         └──────────┘         │ status   │
                                           └──────────┘
```

### 索引优化

```sql
-- 高频查询字段索引
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_dates ON orders(check_in_date, check_out_date);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_users_username ON users(username);

-- 复合索引
CREATE INDEX idx_orders_room_dates ON orders(room_id, check_in_date, check_out_date);
```

## 安全设计

### 1. 认证安全

```javascript
/**
 * JWT Token结构:
 * Header:  { alg: 'HS256', typ: 'JWT' }
 * Payload: { id, username, role, exp }
 * Signature: HMACSHA256(base64(header) + '.' + base64(payload), secret)
 *
 * 安全措施:
 * - Secret密钥≥32字节随机字符串
 * - Token有效期7天,支持刷新
 * - 敏感操作(删除用户)需二次验证
 */
```

### 2. 密码安全

```javascript
/**
 * bcrypt密码加密:
 * - Salt Rounds: 12 (2^12次哈希运算)
 * - 自动加盐,每次生成不同哈希值
 * - 验证时间约100ms,防止暴力破解
 */

// 密码存储
passwordHash = await bcrypt.hash(plainPassword, 12);
// 密码验证
isValid = await bcrypt.compare(inputPassword, storedHash);
```

### 3. API安全

```javascript
/**
 * 防护措施:
 * - CORS限制: 仅允许信任域名
 * - Rate Limiting: 每IP每分钟100请求
 * - SQL注入防护: 参数化查询
 * - XSS防护: 输入转义
 * - CSRF防护: Token验证
 */

// 速率限制示例
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 100, // 最多100请求
  message: '请求过于频繁,请稍后再试'
});
```

## 性能优化

### 1. 数据库优化

- **索引**: 为高频查询字段添加索引
- **批量插入**: 使用事务批量写入
- **查询优化**: 避免SELECT *,只查询需要的字段
- **连接池**: 复用数据库连接

### 2. 缓存策略

```javascript
/**
 * 缓存分层:
 * L1: 内存缓存 (Node.js Map) - 热点数据
 * L2: Redis缓存 - 共享数据
 * L3: 数据库 - 持久化数据
 *
 * 缓存更新策略:
 * - Write-Through: 写入时同步更新缓存
 * - Cache-Aside: 失效时从数据库重新加载
 */
```

### 3. 异步处理

```javascript
/**
 * 异步任务:
 * - Excel导出 (大数据集)
 * - OTA同步 (批量更新)
 * - 批量操作 (多订单处理)
 *
 * 实现方式:
 * - 任务队列 (可选: Bull + Redis)
 * - WebSocket通知任务进度
 * - 后台定时任务
 */
```

## 部署架构

### 单机部署 (Small Scale)

```
┌──────────────────────────────────────┐
│       Server (Single Instance)       │
│  ┌────────────────────────────────┐  │
│  │  Node.js App (PM2)             │  │
│  │  - Port 3101 (HTTP)            │  │
│  │  - Port 3102 (WebSocket)       │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  SQLite Database               │  │
│  │  /app/database/pms.db          │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  Redis (Optional)              │  │
│  │  Port 6379                     │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### 高可用部署 (Large Scale)

```
                    ┌─────────────┐
                    │ Load Balancer│
                    │   (Nginx)    │
                    └──────┬───────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                  │                  │
   ┌────┴────┐        ┌────┴────┐       ┌────┴────┐
   │ Node.js │        │ Node.js │       │ Node.js │
   │ App #1  │        │ App #2  │       │ App #3  │
   └─────────┘        └─────────┘       └─────────┘
        │                  │                  │
        └──────────────────┴──────────────────┘
                           │
                    ┌──────┴───────┐
                    │  PostgreSQL  │
                    │  (Replica)   │
                    └──────────────┘
                           │
                    ┌──────┴───────┐
                    │ Redis Cluster│
                    │  (3 nodes)   │
                    └──────────────┘
```

## 扩展性设计

### 水平扩展

- **无状态设计**: Session存储在Redis,支持多实例部署
- **数据库读写分离**: 主库写入,从库读取
- **缓存分片**: Redis Cluster分布式部署
- **负载均衡**: Nginx轮询/最少连接/IP Hash

### 垂直扩展

- **数据库迁移**: SQLite → PostgreSQL/MySQL
- **消息队列**: Bull/RabbitMQ异步任务处理
- **微服务拆分**: 按业务域拆分独立服务
- **服务网格**: Istio/Linkerd服务治理

## 监控与日志

### 监控指标

```
系统监控:
- CPU使用率
- 内存使用率
- 磁盘I/O
- 网络流量

应用监控:
- API响应时间 (P50/P95/P99)
- 请求成功率
- 错误率
- WebSocket连接数
- 缓存命中率
- 数据库查询耗时
```

### 日志收集

```javascript
/**
 * 日志分级:
 * - ERROR: 错误日志(需要立即处理)
 * - WARN: 警告日志(需要关注)
 * - INFO: 信息日志(正常业务)
 * - DEBUG: 调试日志(开发环境)
 *
 * 日志格式:
 * {
 *   timestamp: '2026-04-23T01:20:00Z',
 *   level: 'INFO',
 *   module: 'AuthService',
 *   message: 'User login successful',
 *   userId: 123,
 *   ip: '192.168.1.1'
 * }
 */
```

## 总结

GuoyunPMS采用**分层架构 + 模块化设计**,具备以下特点:

1. **高可用**: Redis缓存 + 健康检查 + 降级策略
2. **可扩展**: 无状态设计支持水平扩展
3. **高性能**: 多层缓存 + 数据库索引优化
4. **安全可靠**: JWT认证 + 权限控制 + 审计日志
5. **易维护**: 模块化代码 + 完善文档 + 自动化测试

适用场景: 中小型酒店、连锁民宿、公寓管理等场景。

---

**文档版本**: v2.0.0  
**更新日期**: 2026-04-23
