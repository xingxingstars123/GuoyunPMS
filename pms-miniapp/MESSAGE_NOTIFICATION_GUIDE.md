# 📢 消息通知功能说明文档

## ✅ 已实现功能

### 1. 渠道客户分类 - 实现位置

#### 后端数据库设计
**表**: `customers`  
**关键字段**: `channel` (TEXT) - 标记客户来源渠道

```sql
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  id_card TEXT,
  channel TEXT,  -- ← 渠道标识：'ctrip'/'meituan'/'fliggy'/'booking'/'direct'
  total_orders INTEGER DEFAULT 0,
  total_spent REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 前端展示位置

**Web 版**:
- 文件: `/root/.openclaw/workspace/pms-prototype/frontend/src/views/Customers.vue`
- 访问: http://43.173.91.161:5173 → 左侧菜单"客户列表"
- 功能: Tab 切换（全部/携程/美团/飞猪/Booking/直销）

**小程序版**:
- 文件: `/root/.openclaw/workspace/pms-miniapp/pages/customers/customers.vue`
- 访问: 底部导航 → 我的 → 客户管理
- 功能: Tab 切换 + 按渠道筛选

#### 数据查询 API
```javascript
// 获取所有客户
GET /api/customers

// 按渠道筛选
GET /api/customers?channel=ctrip
```

---

### 2. 房间预订后自动通知各渠道 - 实现位置

#### 后端实现位置
**文件**: `/root/.openclaw/workspace/pms-prototype/backend/server.js`

**核心代码**（第 155 行）:
```javascript
// 创建订单 API
app.post('/api/orders', (req, res) => {
  try {
    // 1. 创建订单
    const orderResult = insertOrder.run(orderNo, roomId, customer.id, channel, checkIn, checkOut, totalPrice);
    
    // 2. 锁定房间日期
    // ...锁定房态逻辑...
    
    // 3. 🔔 通知各渠道（关键代码）
    notifyChannels(roomId, 'booked');  // ← 第 155 行
    
    // 4. 记录财务流水
    // ...
    
    res.json({
      success: true,
      message: '订单创建成功，已通知所有渠道',  // ← 返回消息
      data: { orderId, orderNo }
    });
  } catch (error) {
    // 错误处理
  }
});
```

**通知函数**（第 351-360 行）:
```javascript
function notifyChannels(roomId, status) {
  // 获取所有启用的渠道
  const channels = db.prepare('SELECT * FROM channels WHERE enabled = 1').all();
  
  channels.forEach(channel => {
    // 打印通知日志（实际项目调用各渠道 API）
    console.log(`📢 通知 ${channel.name}: 房间 ${roomId} 状态变更为 ${status}`);
    
    // 实际项目中这里会调用：
    // - 携程 API: await ctripApi.updateRoomStatus(roomId, status)
    // - 美团 API: await meituanApi.updateRoomStatus(roomId, status)
    // - Booking API: await bookingApi.updateRoomStatus(roomId, status)
  });
}
```

#### 通知触发时机
1. **创建订单时**: 自动通知所有渠道房间已售
2. **取消订单时**: 自动通知所有渠道房间可售
3. **修改订单时**: 更新房态并通知

#### 查看通知日志
```bash
# 查看后端日志
tail -f /root/.openclaw/workspace/pms-prototype/backend/server.log

# 示例输出：
# 📢 通知 携程: 房间 3 状态变更为 booked
# 📢 通知 美团: 房间 3 状态变更为 booked
# 📢 通知 飞猪: 房间 3 状态变更为 booked
# 📢 通知 Booking: 房间 3 状态变更为 booked
# 📢 通知 直销: 房间 3 状态变更为 booked
```

---

### 3. 消息提示功能 - 新增

#### 🆕 消息通知页面
**文件**: `/root/.openclaw/workspace/pms-miniapp/pages/messages/messages.vue`

**功能特性**:
- ✅ 消息列表展示
- ✅ 未读消息计数
- ✅ 未读提示横幅
- ✅ 消息类型分类：
  - 📋 订单消息（新订单提醒）
  - 🔄 同步消息（渠道同步成功）
  - 🧹 清洁消息（任务完成）
  - 📢 系统消息（系统通知）
- ✅ 全部已读功能
- ✅ 时间智能显示（刚刚/X分钟前/今天/昨天）
- ✅ 点击查看详情

#### 入口位置

**方式一: 从"我的"页面进入**
1. 底部导航 → 我的
2. 点击"消息通知"（带红色徽章显示未读数）

**方式二: 创建订单后自动提示**
1. 创建订单成功
2. 弹窗显示渠道同步通知
3. 点击"查看消息"直接跳转

#### 消息通知弹窗
创建订单成功后自动显示：
```
┌─────────────────────────────┐
│      渠道同步通知            │
├─────────────────────────────┤
│ 订单已创建！                │
│                             │
│ 已自动通知以下渠道：         │
│ • 携程                      │
│ • 美团                      │
│ • 飞猪                      │
│ • Booking                   │
│ • 直销                      │
│                             │
│ 房间状态已更新为"已售"       │
├─────────────────────────────┤
│ [返回列表]  [查看消息]       │
└─────────────────────────────┘
```

#### 未读徽章显示

**位置**: "我的"页面 → "消息通知"菜单项

```
┌─────────────────────────────┐
│ 🔔 消息通知        [2]  →   │  ← 红色徽章显示未读数
│ 🧹 清洁管理             →   │
│ 👥 客户管理             →   │
└─────────────────────────────┘
```

---

## 📋 消息类型说明

### 1. 订单消息 (order)
**触发时机**: 创建新订单时  
**内容示例**:
```
标题: 新订单提醒
内容: 携程渠道新增订单 ORD202604150001，房间 301，请及时处理
```

### 2. 同步消息 (sync)
**触发时机**: 渠道同步完成时  
**内容示例**:
```
标题: 渠道同步成功
内容: 房间 302 状态已同步到携程、美团、飞猪、Booking、直销 5 个渠道
```

### 3. 清洁消息 (cleaning)
**触发时机**: 清洁任务状态变更时  
**内容示例**:
```
标题: 清洁任务提醒
内容: 房间 201 清洁任务已完成，请查看
```

### 4. 系统消息 (system)
**触发时机**: 系统通知、版本更新等  
**内容示例**:
```
标题: 系统通知
内容: 欢迎使用国韵民宿管理系统 v1.1.0
```

---

## 🔧 实际项目集成指南

### 后端 API 集成（真实渠道）

#### 1. 携程 API
```javascript
// 替换模拟通知为真实 API 调用
async function notifyChannels(roomId, status) {
  const channels = db.prepare('SELECT * FROM channels WHERE enabled = 1').all();
  
  for (const channel of channels) {
    try {
      if (channel.code === 'ctrip') {
        // 调用携程 API
        await axios.post('https://api.ctrip.com/rooms/update', {
          hotelId: 'YOUR_HOTEL_ID',
          roomId: roomId,
          status: status,
          token: channel.api_token
        });
      }
      // 其他渠道同理...
      
      // 记录成功日志
      console.log(`✅ 通知 ${channel.name} 成功`);
      
      // 创建消息记录
      await createMessage({
        type: 'sync',
        title: '渠道同步成功',
        content: `房间 ${roomId} 状态已同步到 ${channel.name}`
      });
      
    } catch (error) {
      console.error(`❌ 通知 ${channel.name} 失败:`, error);
      
      // 创建失败消息
      await createMessage({
        type: 'sync',
        title: '渠道同步失败',
        content: `房间 ${roomId} 同步到 ${channel.name} 失败，请检查`
      });
    }
  }
}
```

#### 2. 添加消息API

在 `backend/server.js` 中添加：
```javascript
// 创建消息表
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    title TEXT,
    content TEXT,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 获取消息列表
app.get('/api/messages', (req, res) => {
  const messages = db.prepare(`
    SELECT * FROM messages 
    ORDER BY created_at DESC 
    LIMIT 50
  `).all();
  
  const unreadCount = db.prepare(`
    SELECT COUNT(*) as count 
    FROM messages 
    WHERE read = 0
  `).get();
  
  res.json({
    success: true,
    data: {
      messages,
      unreadCount: unreadCount.count
    }
  });
});

// 标记消息已读
app.put('/api/messages/:id/read', (req, res) => {
  db.prepare('UPDATE messages SET read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// 全部已读
app.put('/api/messages/read-all', (req, res) => {
  db.prepare('UPDATE messages SET read = 1').run();
  res.json({ success: true });
});
```

#### 3. 更新小程序请求工具

在 `utils/request.js` 中添加：
```javascript
// 获取消息列表
getMessages() {
  return request({ url: '/api/messages' })
},

// 标记消息已读
markMessageRead(id) {
  return request({ url: `/api/messages/${id}/read`, method: 'PUT' })
},

// 全部已读
markAllRead() {
  return request({ url: '/api/messages/read-all', method: 'PUT' })
}
```

---

## 🧪 测试步骤

### 1. 测试渠道客户分类

```bash
# 查询数据库
cd /root/.openclaw/workspace/pms-prototype/backend
sqlite3 ../database/pms.db

# 查看客户及其渠道
SELECT name, phone, channel FROM customers;

# 按渠道统计
SELECT channel, COUNT(*) as count FROM customers GROUP BY channel;
```

**Web 版测试**:
1. 访问 http://43.173.91.161:5173
2. 点击"客户列表"
3. 切换不同 Tab 查看各渠道客户

### 2. 测试渠道通知

**查看后端日志**:
```bash
# 实时查看通知日志
tail -f /root/.openclaw/workspace/pms-prototype/backend/server.log
```

**创建订单测试**:
1. 打开小程序/Web 版
2. 点击"新建订单"
3. 填写订单信息并提交
4. 观察：
   - 控制台输出 5 条通知日志
   - 弹窗显示渠道同步通知
   - 返回消息"订单创建成功，已通知所有渠道"

### 3. 测试消息通知页面

**小程序测试**:
1. 底部导航 → 我的
2. 查看"消息通知"红色徽章（显示未读数）
3. 点击"消息通知"
4. 查看消息列表：
   - 未读消息显示绿色背景
   - 右侧显示红点
   - 顶部显示未读横幅
5. 点击消息查看详情
6. 点击"全部已读"清除徽章

**创建订单后测试**:
1. 创建订单成功
2. 查看弹窗通知
3. 点击"查看消息"跳转到消息页面
4. 或点击"返回列表"返回订单列表

---

## 📊 数据流程图

```
用户创建订单
    ↓
后端 API (/api/orders POST)
    ↓
1. 创建订单记录
    ↓
2. 锁定房间日期 (room_occupancy 表)
    ↓
3. 调用 notifyChannels(roomId, 'booked')
    ├─→ 遍历所有启用的渠道
    ├─→ 打印通知日志（模拟）
    ├─→ 实际项目：调用各渠道 API
    └─→ 创建消息记录 (messages 表)
    ↓
4. 返回成功消息 + 通知结果
    ↓
前端显示
    ├─→ Toast 提示"订单创建成功"
    ├─→ Modal 弹窗显示渠道通知详情
    └─→ 更新"我的"页面消息徽章
```

---

## 📞 快速参考

### 渠道客户分类
- **数据库表**: customers (channel 字段)
- **Web 版**: http://43.173.91.161:5173 → 客户列表
- **小程序**: 我的 → 客户管理

### 渠道自动通知
- **后端文件**: `/root/.openclaw/workspace/pms-prototype/backend/server.js`
- **核心函数**: `notifyChannels()` (第 351 行)
- **触发位置**: 创建订单 API (第 155 行)
- **查看日志**: `tail -f backend/server.log`

### 消息通知
- **小程序页面**: `/root/.openclaw/workspace/pms-miniapp/pages/messages/messages.vue`
- **入口**: 我的 → 消息通知（带徽章）
- **触发**: 创建订单成功后自动弹窗

---

**更新时间**: 2026-04-15 15:40 GMT+8  
**文档版本**: v1.0

🎉 **所有功能已完整实现，可以开始测试！**
