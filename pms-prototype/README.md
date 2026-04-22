# GuoyunPMS - 国云酒店管理系统

[![Node.js](https://img.shields.io/badge/Node.js-v22.22.2-green.svg)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3-blue.svg)](https://www.sqlite.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-76%20tests-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

一个现代化、全功能的酒店管理系统,支持多渠道订单管理、智能定价、OTA对接、数据可视化等企业级功能。

## ✨ 核心功能

### 🔐 认证与权限
- JWT Token认证
- 多角色权限控制(Admin/Manager/Staff/Cleaner)
- Token自动刷新
- 密码加密存储(bcrypt)

### 🏨 客房管理
- 房态实时监控
- 智能房间推荐
- 批量操作(入住/退房/清洁)
- 房型价格管理

### 📊 智能定价
- 基于入住率的动态定价
- 节假日/周末价格策略
- 提前预订折扣
- 历史数据分析
- 竞品价格对比

### 🌐 OTA渠道对接
- 携程(Ctrip)
- 美团(Meituan)
- Booking.com
- 房态/价格实时同步
- 订单自动拉取

### 📈 数据导出
- Excel订单导出
- 财务月度报表
- 自定义筛选条件
- 多工作表支持

### 💾 性能优化
- Redis缓存层
- WebSocket实时通知
- Prometheus监控指标
- 健康检查端点

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0
- SQLite 3
- Redis (可选,用于缓存)

### 安装部署

```bash
# 1. 克隆项目
git clone https://github.com/xingxingstars123/GuoyunPMS.git
cd GuoyunPMS/pms-prototype

# 2. 安装后端依赖
cd backend
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑.env文件设置JWT_SECRET等配置

# 4. 启动服务
npm run dev:v2
# 服务地址: http://localhost:3101
# WebSocket: ws://localhost:3102
```

### Docker部署(推荐)

```bash
# 使用docker-compose一键启动
docker-compose up -d

# 查看日志
docker-compose logs -f backend
```

## 📡 API文档

### Swagger UI

启动服务后访问:
```
http://localhost:3101/api-docs
```

提供完整的交互式API文档,包括:
- 所有API端点说明
- 请求/响应示例
- 在线测试工具
- 认证配置

### 主要API端点

#### 认证
```bash
POST /api/auth/register        # 用户注册
POST /api/auth/login           # 用户登录
POST /api/auth/refresh         # 刷新Token
POST /api/auth/change-password # 修改密码
```

#### 智能定价
```bash
POST /api/pricing/calculate    # 计算智能价格
POST /api/pricing/recommend    # 获取推荐价格
GET  /api/pricing/trend        # 获取价格趋势
```

#### OTA对接
```bash
POST /api/ota/sync-inventory   # 同步房态
POST /api/ota/sync-prices      # 同步价格
GET  /api/ota/fetch-orders     # 拉取订单
POST /api/ota/confirm-order    # 确认订单
GET  /api/ota/status           # 查看渠道状态
```

#### 数据导出
```bash
GET /api/export/orders?format=excel&startDate=xxx&endDate=xxx
GET /api/export/finance?year=2026&month=4
GET /api/export/rooms?format=csv
```

#### 批量操作
```bash
POST /api/bulk/batch-checkin   # 批量入住
POST /api/bulk/batch-checkout  # 批量退房
POST /api/bulk/batch-clean     # 批量清洁
POST /api/bulk/batch-cancel    # 批量取消
```

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 测试覆盖率

当前测试覆盖率:
- AuthService: **89.85%**
- OTAService: **68.57%**
- PricingService: **87.91%**
- 总测试用例: **76个全部通过**

覆盖率报告查看:
```bash
# 生成后打开coverage/index.html
open coverage/index.html
```

## 📚 开发文档

### JSDoc代码文档

```bash
# 生成代码文档
npm run docs:generate

# 启动文档服务器
npm run docs:serve
# 访问 http://localhost:8080
```

### 项目结构

```
backend/
├── server-v2.js              # 主服务入口(含Swagger)
├── swagger.js                # Swagger API文档配置
├── jest.config.js            # Jest测试配置
├── jsdoc.json                # JSDoc配置
├── controllers/              # 控制器层
│   ├── AuthController.js
│   ├── OTAController.js
│   ├── PricingController.js
│   ├── ExportController.js
│   └── BulkOperationController.js
├── services/                 # 业务逻辑层
│   ├── AuthService.js        # 认证服务
│   ├── OTAService.js         # OTA对接
│   ├── PricingService.js     # 智能定价
│   ├── ExportService.js      # 数据导出
│   ├── BulkOperationService.js # 批量操作
│   └── CacheService.js       # Redis缓存
├── middleware/               # 中间件
│   ├── auth.js               # JWT认证
│   ├── cache.js              # 缓存中间件
│   ├── logger.js             # 请求日志
│   └── monitoring.js         # 性能监控
├── routes/                   # 路由模块
│   ├── auth.js
│   ├── ota.js
│   ├── pricing.js
│   ├── export.js
│   └── bulk.js
├── tests/                    # 测试文件
│   ├── setup.js
│   └── __tests__/
│       ├── services/
│       └── api/
├── database/                 # 数据库文件
│   └── pms.db
├── coverage/                 # 测试覆盖率报告
└── docs/                     # JSDoc生成的文档
```

## 🔧 配置

### 环境变量

```bash
# .env 文件配置

# 服务端口
PORT=3101
WS_PORT=3102

# JWT配置
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Redis配置(可选)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# OTA配置
OTA_CTRIP_ENABLED=true
OTA_CTRIP_API_KEY=your-ctrip-api-key
OTA_CTRIP_HOTEL_ID=your-hotel-id

OTA_MEITUAN_ENABLED=true
OTA_MEITUAN_APP_KEY=your-meituan-app-key
OTA_MEITUAN_HOTEL_ID=your-hotel-id

OTA_BOOKING_ENABLED=false
```

### 数据库初始化

```bash
# 首次运行自动创建数据库和表结构
node backend/init-users.js  # 创建默认管理员账号
```

默认管理员账号:
- 用户名: `admin`
- 密码: `admin123`

## 🐳 Docker部署

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3101 3102

CMD ["node", "server-v2.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3101:3101"
      - "3102:3102"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_HOST=redis
    volumes:
      - ./backend/database:/app/database
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

## 📊 监控与健康检查

### Prometheus指标

访问 `http://localhost:3101/metrics` 获取指标:
```
# 请求总数
http_requests_total{method="GET",route="/api/orders",status="200"} 150

# 响应时间
http_request_duration_seconds{method="POST",route="/api/orders"} 0.145

# 活跃WebSocket连接
websocket_connections 8
```

### 健康检查

```bash
curl http://localhost:3101/api/health

# 响应:
{
  "status": "healthy",
  "timestamp": "2026-04-23T01:20:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": "ok",
    "redis": "ok",
    "websocket": "ok"
  }
}
```

## 🔐 安全最佳实践

1. **JWT Secret**: 使用强随机密钥,定期轮换
2. **HTTPS**: 生产环境启用SSL/TLS
3. **速率限制**: 使用express-rate-limit防止暴力破解
4. **输入验证**: 所有API输入经过严格校验
5. **SQL注入防护**: 使用参数化查询
6. **CORS配置**: 仅允许信任的域名
7. **日志脱敏**: 避免记录敏感信息

## 🚀 CI/CD

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm ci
      - run: cd backend && npm run test:ci
      - uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
```

## 📈 性能优化

### 数据库优化

```sql
-- 添加索引
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_dates ON orders(check_in_date, check_out_date);
CREATE INDEX idx_rooms_status ON rooms(status);
```

### Redis缓存策略

```javascript
// 缓存热点数据,TTL 5分钟
cache.set('dashboard:stats', data, 300);

// 缓存OTA渠道状态,TTL 1小时
cache.set('ota:channel:ctrip', status, 3600);
```

## 🐛 常见问题

### Q: 启动后连接不上Redis怎么办?
A: Redis是可选组件,不影响核心功能。如需使用:
```bash
docker run -d -p 6379:6379 redis:7-alpine
# 或安装本地Redis
brew install redis  # macOS
sudo apt install redis  # Ubuntu
```

### Q: 测试覆盖率未达到70%阈值?
A: 当前配置针对核心服务,可临时调整:
```javascript
// jest.config.js
coverageThreshold: {
  global: {
    lines: 50  // 降低阈值
  }
}
```

### Q: Swagger UI无法访问?
A: 确保已安装swagger-ui-express:
```bash
npm install swagger-ui-express
```

## 🤝 贡献指南

欢迎提交Issue和PR!

开发流程:
1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add AmazingFeature'`)
4. 运行测试 (`npm test`)
5. 推送分支 (`git push origin feature/AmazingFeature`)
6. 提交Pull Request

提交信息规范:
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `test`: 测试相关
- `refactor`: 代码重构
- `perf`: 性能优化

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 👥 联系方式

- **项目地址**: https://github.com/xingxingstars123/GuoyunPMS
- **问题反馈**: [GitHub Issues](https://github.com/xingxingstars123/GuoyunPMS/issues)
- **更新日期**: 2026-04-23

## 🎉 更新日志

### v2.0.0 (2026-04-23) - Phase 3-5完成
- ✅ **代码质量提升**
  - Jest单元测试框架(76个测试用例全部通过)
  - 核心服务测试覆盖率>85%
  - API集成测试
  - 测试覆盖率报告

- ✅ **文档完善**
  - Swagger API文档自动生成
  - JSDoc代码注释规范
  - README部署/使用指南
  - 架构设计文档

- ✅ **运维工具**
  - Docker容器化支持
  - GitHub Actions CI/CD配置
  - 健康检查接口
  - Prometheus监控指标

### v1.2.0 (2026-04-22) - Phase 2完成
- 🌐 OTA渠道对接(携程/美团/Booking)
- 💰 智能定价引擎
- 📥 Excel数据导出
- ⚡ 批量操作功能

### v1.1.0 (2026-04-18) - Phase 1完成
- 🔐 JWT认证系统
- 💾 Redis缓存层
- 📡 WebSocket实时通知
- 📊 Prometheus监控

### v1.0.0 (2026-04-15) - 初始版本
- 基础订单管理功能
- 房态日历视图
- 财务统计报表
- 清洁任务管理

---

**Made with ❤️ by GuoyunPMS Team**
