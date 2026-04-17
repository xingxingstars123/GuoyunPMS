const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dayjs = require('dayjs');
const { db, initDatabase } = require('./database');
const RecommendationService = require('./services/RecommendationService');
const ExportService = require('./services/ExportService');

const app = express();
const PORT = 3100;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 初始化数据库
initDatabase();

// ============ API 路由 ============

// 1. 首页统计数据
app.get('/api/dashboard/stats', (req, res) => {
  const today = dayjs().format('YYYY-MM-DD');
  
  // 当日营业额
  const revenue = db.prepare(`
    SELECT COALESCE(SUM(total_price), 0) as total
    FROM orders
    WHERE DATE(created_at) = ? AND status != 'cancelled'
  `).get(today);
  
  // 可售房间
  const availableRooms = db.prepare(`
    SELECT COUNT(*) as count
    FROM rooms
    WHERE status = 'available'
  `).get();
  
  // 房态统计
  const roomStats = db.prepare(`
    SELECT
      SUM(CASE WHEN status = 'pre_arrival' THEN 1 ELSE 0 END) as pre_arrival,
      SUM(CASE WHEN status = 'checked_in' THEN 1 ELSE 0 END) as checked_in,
      SUM(CASE WHEN status = 'pre_departure' THEN 1 ELSE 0 END) as pre_departure,
      SUM(CASE WHEN status = 'checked_out' THEN 1 ELSE 0 END) as checked_out,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
    FROM orders
    WHERE DATE(check_in) = ? OR DATE(check_out) = ?
  `).get(today, today);
  
  res.json({
    revenue: revenue.total,
    availableRooms: availableRooms.count,
    roomStatus: {
      preArrival: roomStats.pre_arrival || 0,
      checkedIn: roomStats.checked_in || 0,
      preDeparture: roomStats.pre_departure || 0,
      checkedOut: roomStats.checked_out || 0,
      pending: roomStats.pending || 0
    }
  });
});

// 2. 订单管理 - 列表
app.get('/api/orders', (req, res) => {
  const { channel, status, date } = req.query;
  
  let sql = `
    SELECT 
      o.*,
      c.name as customer_name,
      c.phone as customer_phone,
      c.channel as customer_channel,
      r.room_number
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN rooms r ON o.room_id = r.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (channel) {
    sql += ' AND o.channel = ?';
    params.push(channel);
  }
  
  if (status) {
    sql += ' AND o.status = ?';
    params.push(status);
  }
  
  if (date) {
    sql += ' AND DATE(o.check_in) = ?';
    params.push(date);
  }
  
  sql += ' ORDER BY o.created_at DESC LIMIT 50';
  
  const orders = db.prepare(sql).all(...params);
  
  res.json({
    success: true,
    data: orders
  });
});

// 3. 订单管理 - 创建订单
app.post('/api/orders', (req, res) => {
  const { roomId, customerName, customerPhone, channel, checkIn, checkOut, totalPrice } = req.body;
  
  try {
    // 检查房间可用性
    const roomCheck = db.prepare(`
      SELECT * FROM room_occupancy
      WHERE room_id = ? AND date BETWEEN ? AND ? AND status != 'available'
    `).all(roomId, checkIn, checkOut);
    
    if (roomCheck.length > 0) {
      return res.status(400).json({ success: false, message: '房间已被预订' });
    }
    
    // 创建或获取客户
    let customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(customerPhone);
    
    if (!customer) {
      const insertCustomer = db.prepare('INSERT INTO customers (name, phone, channel) VALUES (?, ?, ?)');
      const result = insertCustomer.run(customerName, customerPhone, channel);
      customer = { id: result.lastInsertRowid };
    }
    
    // 创建订单
    const orderNo = `ORD${Date.now()}`;
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_no, room_id, customer_id, channel, check_in, check_out, total_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')
    `);
    
    const orderResult = insertOrder.run(orderNo, roomId, customer.id, channel, checkIn, checkOut, totalPrice);
    
    // 锁定房间
    const startDate = dayjs(checkIn);
    const endDate = dayjs(checkOut);
    let currentDate = startDate;
    
    const insertOccupancy = db.prepare(`
      INSERT INTO room_occupancy (room_id, order_id, date, status, price)
      VALUES (?, ?, ?, 'booked', ?)
    `);
    
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
      insertOccupancy.run(roomId, orderResult.lastInsertRowid, currentDate.format('YYYY-MM-DD'), totalPrice / endDate.diff(startDate, 'day'));
      currentDate = currentDate.add(1, 'day');
    }
    
    // 通知各渠道（模拟）
    notifyChannels(roomId, 'booked');
    
    // 记录财务
    db.prepare(`
      INSERT INTO financial_records (order_id, type, category, amount, date, description)
      VALUES (?, 'income', 'room_fee', ?, ?, ?)
    `).run(orderResult.lastInsertRowid, totalPrice, checkIn, `订单 ${orderNo} 房费收入`);
    
    res.json({
      success: true,
      message: '订单创建成功，已通知所有渠道',
      data: { orderId: orderResult.lastInsertRowid, orderNo }
    });
    
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. 房态日历
app.get('/api/rooms/calendar', (req, res) => {
  const { startDate, endDate } = req.query;
  
  const rooms = db.prepare('SELECT * FROM rooms ORDER BY room_number').all();
  
  const occupancy = db.prepare(`
    SELECT * FROM room_occupancy
    WHERE date BETWEEN ? AND ?
    ORDER BY date
  `).all(startDate || dayjs().format('YYYY-MM-DD'), endDate || dayjs().add(30, 'day').format('YYYY-MM-DD'));
  
  // 组装数据
  const calendar = rooms.map(room => {
    const dates = occupancy.filter(o => o.room_id === room.id);
    return {
      ...room,
      occupancy: dates
    };
  });
  
  res.json({ success: true, data: calendar });
});

// 5. 客户列表（按渠道分类）
app.get('/api/customers', (req, res) => {
  const { channel } = req.query;
  
  let sql = 'SELECT * FROM customers';
  const params = [];
  
  if (channel) {
    sql += ' WHERE channel = ?';
    params.push(channel);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT 100';
  
  const customers = db.prepare(sql).all(...params);
  
  // 按渠道分组
  const grouped = customers.reduce((acc, customer) => {
    if (!acc[customer.channel]) {
      acc[customer.channel] = [];
    }
    acc[customer.channel].push(customer);
    return acc;
  }, {});
  
  res.json({ success: true, data: { all: customers, grouped } });
});

// 6. 财务报表 - 月度统计
app.get('/api/finance/monthly', (req, res) => {
  const { year, month } = req.query;
  const currentYear = year || dayjs().year();
  const currentMonth = month || dayjs().month() + 1;
  
  // 总收入
  const revenue = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM financial_records
    WHERE type = 'income'
      AND strftime('%Y', date) = ?
      AND strftime('%m', date) = ?
  `).get(String(currentYear), String(currentMonth).padStart(2, '0'));
  
  // 按渠道统计
  const channelStats = db.prepare(`
    SELECT 
      o.channel,
      COUNT(*) as order_count,
      SUM(o.total_price) as revenue
    FROM orders o
    WHERE strftime('%Y-%m', o.check_in) = ?
      AND o.status != 'cancelled'
    GROUP BY o.channel
  `).all(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
  
  // 每日趋势
  const dailyTrend = db.prepare(`
    SELECT 
      DATE(check_in) as date,
      COUNT(*) as order_count,
      SUM(total_price) as revenue
    FROM orders
    WHERE strftime('%Y-%m', check_in) = ?
      AND status != 'cancelled'
    GROUP BY DATE(check_in)
    ORDER BY date
  `).all(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
  
  res.json({
    success: true,
    data: {
      totalRevenue: revenue.total,
      channelStats,
      dailyTrend
    }
  });
});

// 📊 新增: 数据可视化 - 营收趋势(最近7天)
app.get('/api/dashboard/revenue-trend', (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const endDate = dayjs();
  const startDate = endDate.subtract(days - 1, 'day');
  
  const trend = [];
  for (let i = 0; i < days; i++) {
    const date = startDate.add(i, 'day').format('YYYY-MM-DD');
    const revenue = db.prepare(`
      SELECT COALESCE(SUM(total_price), 0) as total
      FROM orders
      WHERE DATE(check_in) = ? AND status != 'cancelled'
    `).get(date);
    
    trend.push({
      date,
      revenue: revenue.total
    });
  }
  
  res.json({ success: true, data: trend });
});

// 📊 新增: 数据可视化 - 房型占比
app.get('/api/dashboard/room-type-stats', (req, res) => {
  const stats = db.prepare(`
    SELECT 
      r.room_type,
      COUNT(DISTINCT r.id) as room_count,
      COUNT(o.id) as order_count,
      COALESCE(SUM(o.total_price), 0) as revenue
    FROM rooms r
    LEFT JOIN orders o ON r.id = o.room_id AND o.status != 'cancelled'
    GROUP BY r.room_type
    ORDER BY revenue DESC
  `).all();
  
  res.json({ success: true, data: stats });
});

// 📊 新增: 数据可视化 - 渠道分布
app.get('/api/dashboard/channel-distribution', (req, res) => {
  const distribution = db.prepare(`
    SELECT 
      channel,
      COUNT(*) as order_count,
      COALESCE(SUM(total_price), 0) as revenue
    FROM orders
    WHERE status != 'cancelled'
      AND DATE(created_at) >= DATE('now', '-30 day')
    GROUP BY channel
    ORDER BY revenue DESC
  `).all();
  
  res.json({ success: true, data: distribution });
});

// 7. 清洁任务管理
app.get('/api/cleaning/tasks', (req, res) => {
  const { status, date } = req.query;
  
  let sql = `
    SELECT 
      ct.*,
      r.room_number
    FROM cleaning_tasks ct
    LEFT JOIN rooms r ON ct.room_id = r.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (status) {
    sql += ' AND ct.status = ?';
    params.push(status);
  }
  
  if (date) {
    sql += ' AND DATE(ct.scheduled_time) = ?';
    params.push(date);
  }
  
  sql += ' ORDER BY ct.scheduled_time';
  
  const tasks = db.prepare(sql).all(...params);
  
  res.json({ success: true, data: tasks });
});

// 8. 创建清洁任务
app.post('/api/cleaning/tasks', (req, res) => {
  const { roomId, assignedTo, scheduledTime, notes } = req.body;
  
  const insert = db.prepare(`
    INSERT INTO cleaning_tasks (room_id, assigned_to, scheduled_time, notes, status)
    VALUES (?, ?, ?, ?, 'pending')
  `);
  
  const result = insert.run(roomId, assignedTo, scheduledTime, notes);
  
  res.json({
    success: true,
    message: '清洁任务已创建',
    data: { taskId: result.lastInsertRowid }
  });
});

// 9. 更新清洁任务状态
app.put('/api/cleaning/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const update = db.prepare(`
    UPDATE cleaning_tasks
    SET status = ?, completed_time = ?
    WHERE id = ?
  `);
  
  update.run(status, status === 'completed' ? dayjs().format('YYYY-MM-DD HH:mm:ss') : null, id);
  
  res.json({ success: true, message: '任务状态已更新' });
});

// 10. 渠道列表
app.get('/api/channels', (req, res) => {
  const channels = db.prepare('SELECT * FROM channels WHERE enabled = 1').all();
  res.json({ success: true, data: channels });
});

// 🤖 新增: 智能房间推荐
app.post('/api/rooms/recommend', (req, res) => {
  try {
    const recommendations = RecommendationService.recommendRooms(req.body);
    
    res.json({
      success: true,
      message: `为您推荐 ${recommendations.length} 个房间`,
      data: recommendations
    });
  } catch (error) {
    console.error('房间推荐失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🤖 新增: 记录推荐选择(用于优化算法)
app.post('/api/rooms/recommend/feedback', (req, res) => {
  const { customerId, roomId, recommended, selected } = req.body;
  
  try {
    RecommendationService.logRecommendation(customerId, roomId, recommended, selected);
    res.json({ success: true, message: '反馈已记录' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 💾 新增: 导出订单为Excel
app.get('/api/export/orders', (req, res) => {
  try {
    const buffer = ExportService.exportOrders(req.query);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="orders_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('导出订单失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 💾 新增: 导出财务数据为Excel
app.get('/api/export/finance', (req, res) => {
  try {
    const buffer = ExportService.exportFinance(req.query);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="finance_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('导出财务数据失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ 辅助函数 ============

function notifyChannels(roomId, status) {
  // 模拟通知各渠道
  const channels = db.prepare('SELECT * FROM channels WHERE enabled = 1').all();
  
  channels.forEach(channel => {
    console.log(`📢 通知 ${channel.name}: 房间 ${roomId} 状态变更为 ${status}`);
    // 实际项目中这里会调用各渠道的 API
  });
}

// ============ 启动服务器 ============

app.listen(PORT, () => {
  console.log(`\n🚀 PMS 后端服务已启动`);
  console.log(`📡 API 地址: http://localhost:${PORT}`);
  console.log(`📊 数据库: SQLite (./database/pms.db)\n`);
});
