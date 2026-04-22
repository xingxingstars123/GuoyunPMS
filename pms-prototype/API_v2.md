# PMS系统 API文档 v2.0

## Phase 2 新增功能 (2026-04-22)

### 1. OTA渠道对接 API

**Base URL**: `/api/ota`

**权限要求**: MANAGER 或 ADMIN

#### 1.1 获取渠道状态
```
GET /api/ota/status
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "ctrip": {
      "enabled": true,
      "configured": true
    },
    "meituan": {
      "enabled": false,
      "configured": false
    },
    "booking": {
      "enabled": true,
      "configured": true
    }
  }
}
```

#### 1.2 同步房态到OTA
```
POST /api/ota/sync/inventory
```

**请求体**:
```json
{
  "channel": "ctrip",
  "rooms": [
    {
      "room_number": "101",
      "date": "2026-05-01",
      "status": "available"
    }
  ]
}
```

#### 1.3 同步价格到OTA
```
POST /api/ota/sync/prices
```

**请求体**:
```json
{
  "channel": "meituan",
  "prices": [
    {
      "room_id": 1,
      "date": "2026-05-01",
      "price": 299
    }
  ]
}
```

#### 1.4 拉取OTA订单
```
GET /api/ota/orders?channel=booking&startDate=2026-04-01&endDate=2026-04-30
```

#### 1.5 确认OTA订单
```
POST /api/ota/orders/:orderId/confirm
```

**请求体**:
```json
{
  "channel": "ctrip"
}
```

---

### 2. 智能定价 API

**Base URL**: `/api/pricing`

**权限要求**: MANAGER 或 ADMIN

#### 2.1 计算智能价格
```
POST /api/pricing/calculate
```

**请求体**:
```json
{
  "roomId": 1,
  "date": "2026-05-01",
  "advanceDays": 7
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "roomId": 1,
    "date": "2026-05-01",
    "basePrice": 200,
    "occupancy": 75,
    "isWeekend": false,
    "isHoliday": false,
    "bookingType": "standard",
    "multiplier": 1.3,
    "finalPrice": 260,
    "factors": {
      "occupancyRate": "75%",
      "weekend": "0%",
      "holiday": "0%",
      "advanceBooking": "0%"
    }
  }
}
```

#### 2.2 获取未来价格
```
GET /api/pricing/future/:roomId?days=30
```

**响应**: 返回未来N天的价格列表

#### 2.3 获取历史价格趋势
```
GET /api/pricing/trend/:roomId?days=30
```

**响应**: 返回过去N天的价格趋势数据

#### 2.4 推荐最佳价格
```
POST /api/pricing/recommend
```

**请求体**:
```json
{
  "roomId": 1,
  "date": "2026-05-01"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "recommended": 275,
    "smartPrice": 260,
    "historicalAvg": 280,
    "competitorAvg": 285,
    "confidence": "high"
  }
}
```

---

### 3. 数据导出 API

**Base URL**: `/api/export`

**权限要求**: MANAGER 或 ADMIN

#### 3.1 导出订单数据
```
POST /api/export/orders
```

**请求体**:
```json
{
  "filters": {
    "startDate": "2026-04-01",
    "endDate": "2026-04-30",
    "status": "confirmed"
  },
  "format": "excel"
}
```

**响应**:
```json
{
  "success": true,
  "filepath": "/path/to/orders_1714000000.xlsx",
  "filename": "orders_1714000000.xlsx",
  "rows": 150,
  "downloadUrl": "/api/export/download/orders_1714000000.xlsx"
}
```

#### 3.2 导出财务报表
```
POST /api/export/financial
```

**请求体**:
```json
{
  "startDate": "2026-04-01",
  "endDate": "2026-04-30",
  "format": "csv"
}
```

#### 3.3 导出入住率报表
```
POST /api/export/occupancy
```

**请求体**:
```json
{
  "startDate": "2026-04-01",
  "endDate": "2026-04-30",
  "format": "excel"
}
```

#### 3.4 导出清洁任务报表
```
POST /api/export/cleaning
```

**请求体**:
```json
{
  "startDate": "2026-04-01",
  "endDate": "2026-04-30",
  "format": "excel"
}
```

#### 3.5 获取导出文件列表
```
GET /api/export/files
```

#### 3.6 下载导出文件
```
GET /api/export/download/:filename
```

#### 3.7 删除导出文件
```
DELETE /api/export/files/:filename
```

---

### 4. 批量操作 API

**Base URL**: `/api/bulk`

**权限要求**: MANAGER 或 ADMIN

#### 4.1 批量更新房间状态
```
POST /api/bulk/rooms/status
```

**请求体**:
```json
{
  "roomIds": [1, 2, 3, 4, 5],
  "status": "maintenance"
}
```

**响应**:
```json
{
  "success": true,
  "affected": 5,
  "status": "maintenance",
  "roomIds": [1, 2, 3, 4, 5]
}
```

#### 4.2 批量更新房间价格
```
POST /api/bulk/rooms/prices
```

**请求体**:
```json
{
  "updates": [
    { "roomId": 1, "basePrice": 250 },
    { "roomId": 2, "basePrice": 280 },
    { "roomId": 3, "basePrice": 300 }
  ]
}
```

#### 4.3 批量更新房间属性
```
POST /api/bulk/rooms/attributes
```

**请求体**:
```json
{
  "updates": [
    {
      "roomId": 1,
      "fields": {
        "room_type": "deluxe",
        "base_price": 350
      }
    }
  ]
}
```

#### 4.4 批量导入房间
```
POST /api/bulk/rooms/import
```

**请求体**:
```json
{
  "rooms": [
    {
      "propertyId": 1,
      "roomNumber": "201",
      "roomType": "standard",
      "basePrice": 200
    },
    {
      "propertyId": 1,
      "roomNumber": "202",
      "roomType": "deluxe",
      "basePrice": 300
    }
  ]
}
```

**响应**:
```json
{
  "success": true,
  "imported": 2,
  "failed": 0,
  "details": [
    { "roomNumber": "201", "roomId": 10, "success": true },
    { "roomNumber": "202", "roomId": 11, "success": true }
  ]
}
```

#### 4.5 批量创建清洁任务
```
POST /api/bulk/cleaning/create
```

**请求体**:
```json
{
  "roomIds": [1, 2, 3],
  "taskConfig": {
    "taskType": "daily",
    "priority": "high",
    "scheduledTime": "2026-04-23 09:00:00",
    "assignedTo": "cleaner01"
  }
}
```

#### 4.6 批量更新清洁任务状态
```
POST /api/bulk/cleaning/status
```

**请求体**:
```json
{
  "taskIds": [1, 2, 3],
  "status": "completed"
}
```

#### 4.7 批量更新订单状态
```
POST /api/bulk/orders/status
```

**请求体**:
```json
{
  "orderIds": [10, 11, 12],
  "status": "confirmed"
}
```

#### 4.8 批量分配房间
```
POST /api/bulk/orders/assign
```

**请求体**:
```json
{
  "orderIds": [20, 21, 22]
}
```

**响应**:
```json
{
  "success": true,
  "assigned": 3,
  "failed": 0,
  "details": [
    { "orderId": 20, "roomId": 5, "success": true },
    { "orderId": 21, "roomId": 6, "success": true },
    { "orderId": 22, "roomId": 7, "success": true }
  ]
}
```

#### 4.9 批量导入订单
```
POST /api/bulk/orders/import
```

**请求体**:
```json
{
  "orders": [
    {
      "orderNumber": "ORD20260422001",
      "guestName": "张三",
      "guestPhone": "13800138000",
      "guestEmail": "zhangsan@example.com",
      "roomId": 1,
      "checkInDate": "2026-05-01",
      "checkOutDate": "2026-05-03",
      "totalPrice": 600,
      "status": "confirmed",
      "paymentStatus": "paid"
    }
  ]
}
```

#### 4.10 批量删除订单 (软删除)
```
DELETE /api/bulk/orders
```

**请求体**:
```json
{
  "orderIds": [30, 31, 32]
}
```

---

## 认证说明

所有Phase 2 API都需要JWT认证,在请求头中携带Token:

```
Authorization: Bearer <your-jwt-token>
```

获取Token:
```
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}
```

---

## 错误处理

统一错误响应格式:
```json
{
  "success": false,
  "error": "错误描述"
}
```

常见HTTP状态码:
- `200` - 成功
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 无权限
- `404` - 资源不存在
- `500` - 服务器错误

---

## 性能优化

1. **缓存策略**: 所有GET请求自动缓存(可配置)
2. **批量操作**: 使用事务保证原子性
3. **分页支持**: 大数据量查询建议使用分页
4. **监控指标**: 访问 `/metrics` 查看Prometheus指标

---

## 下一步计划

- [ ] Swagger文档自动生成
- [ ] GraphQL支持
- [ ] Webhook事件通知
- [ ] 审计日志
- [ ] API限流
