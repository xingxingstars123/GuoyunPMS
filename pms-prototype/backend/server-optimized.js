/**
 * 优化后的PMS后端服务器
 * - 分层架构: Controller → Service → Model
 * - 统一错误处理
 * - 请求日志
 * - 参数验证
 * - 性能优化
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDatabase } = require('./database');

// 中间件
const { requestLogger } = require('./middleware/logger');
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');
const { validators } = require('./middleware/validator');

// 服务层
const OrderService = require('./services/OrderService');
const RoomService = require('./services/RoomService');

const app = express();
const PORT = process.env.PORT || 3100;

// ============ 全局中间件 ============

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
app.use(requestLogger);

// 安全头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 初始化数据库
initDatabase();

// ============ API 路由 ============

/**
 * 健康检查
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

/**
 * 首页统计数据
 */
app.get('/api/dashboard/stats', asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const stats = OrderService.getStatistics(today);
  const rooms = RoomService.getAllRooms();
  
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  
  res.json({
    success: true,
    data: {
      revenue: stats.revenue,
      availableRooms,
      roomStatus: stats.statusDistribution
    }
  });
}));

/**
 * 订单管理 - 列表
 */
app.get('/api/orders', asyncHandler(async (req, res) => {
  const orders = OrderService.getOrders(req.query);
  
  res.json({
    success: true,
    count: orders.length,
    data: orders
  });
}));

/**
 * 订单管理 - 详情
 */
app.get('/api/orders/:id', asyncHandler(async (req, res) => {
  const order = OrderService.getOrderById(req.params.id);
  
  res.json({
    success: true,
    data: order
  });
}));

/**
 * 订单管理 - 创建订单
 */
app.post('/api/orders', asyncHandler(async (req, res) => {
  const result = OrderService.createOrder(req.body);
  
  res.json({
    success: true,
    message: '订单创建成功',
    data: result
  });
}));

/**
 * 订单管理 - 更新状态
 */
app.put('/api/orders/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  const result = OrderService.updateOrderStatus(req.params.id, status);
  
  res.json({
    success: true,
    message: '订单状态已更新',
    data: result
  });
}));

/**
 * 房态日历
 */
app.get('/api/rooms/calendar', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const calendar = RoomService.getCalendar(startDate, endDate);
  
  res.json({
    success: true,
    data: calendar
  });
}));

/**
 * 可用房间查询
 */
app.get('/api/rooms/available', asyncHandler(async (req, res) => {
  const { checkIn, checkOut } = req.query;
  
  if (!checkIn || !checkOut) {
    return res.status(400).json({
      success: false,
      message: '请提供checkIn和checkOut参数'
    });
  }
  
  const rooms = RoomService.getAvailableRooms(checkIn, checkOut);
  
  res.json({
    success: true,
    count: rooms.length,
    data: rooms
  });
}));

/**
 * 房间利用率统计
 */
app.get('/api/rooms/utilization', asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const stats = RoomService.getRoomUtilization(Number(days));
  
  res.json({
    success: true,
    data: stats
  });
}));

/**
 * 客户列表
 */
app.get('/api/customers', asyncHandler(async (req, res) => {
  const { db } = require('./database');
  const { channel, limit = 100 } = req.query;
  
  let sql = 'SELECT * FROM customers';
  const params = [];
  
  if (channel) {
    sql += ' WHERE channel = ?';
    params.push(channel);
  }
  
  sql += ' ORDER BY total_spent DESC LIMIT ?';
  params.push(Number(limit));
  
  const customers = db.prepare(sql).all(...params);
  
  res.json({
    success: true,
    count: customers.length,
    data: customers
  });
}));

/**
 * 客户价值视图
 */
app.get('/api/customers/value', asyncHandler(async (req, res) => {
  const { db } = require('./database');
  
  const customers = db.prepare('SELECT * FROM v_customer_value ORDER BY total_spent DESC LIMIT 50').all();
  
  res.json({
    success: true,
    data: customers
  });
}));

/**
 * 财务报表 - 渠道统计
 */
app.get('/api/finance/channels', asyncHandler(async (req, res) => {
  const { db } = require('./database');
  
  const stats = db.prepare('SELECT * FROM v_channel_performance').all();
  
  res.json({
    success: true,
    data: stats
  });
}));

/**
 * 财务报表 - 每日收入趋势
 */
app.get('/api/finance/daily', asyncHandler(async (req, res) => {
  const { db } = require('./database');
  const { days = 30 } = req.query;
  
  const dayjs = require('dayjs');
  const startDate = dayjs().subtract(Number(days), 'day').format('YYYY-MM-DD');
  
  const trend = db.prepare(`
    SELECT 
      date,
      SUM(order_count) as total_orders,
      SUM(total_revenue) as total_revenue,
      AVG(avg_order_value) as avg_order_value
    FROM v_daily_revenue
    WHERE date >= ?
    GROUP BY date
    ORDER BY date
  `).all(startDate);
  
  res.json({
    success: true,
    data: trend
  });
}));

/**
 * 清洁任务 - 列表
 */
app.get('/api/cleaning/tasks', asyncHandler(async (req, res) => {
  const { db } = require('./database');
  const { status, date } = req.query;
  
  let sql = `
    SELECT 
      ct.*,
      r.room_number,
      r.room_type
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
  
  sql += ' ORDER BY ct.scheduled_time DESC LIMIT 100';
  
  const tasks = db.prepare(sql).all(...params);
  
  res.json({
    success: true,
    count: tasks.length,
    data: tasks
  });
}));

/**
 * 清洁任务 - 创建
 */
app.post('/api/cleaning/tasks', asyncHandler(async (req, res) => {
  const { db } = require('./database');
  const { roomId, assignedTo, scheduledTime, notes } = req.body;
  
  const result = db.prepare(`
    INSERT INTO cleaning_tasks (room_id, assigned_to, scheduled_time, notes, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(roomId, assignedTo, scheduledTime, notes || '');
  
  res.json({
    success: true,
    message: '清洁任务已创建',
    data: { taskId: result.lastInsertRowid }
  });
}));

/**
 * 清洁任务 - 更新状态
 */
app.put('/api/cleaning/tasks/:id', asyncHandler(async (req, res) => {
  const { db } = require('./database');
  const dayjs = require('dayjs');
  const { id } = req.params;
  const { status } = req.body;
  
  const completedTime = status === 'completed' ? dayjs().format('YYYY-MM-DD HH:mm:ss') : null;
  
  db.prepare(`
    UPDATE cleaning_tasks
    SET status = ?, completed_time = ?
    WHERE id = ?
  `).run(status, completedTime, id);
  
  res.json({
    success: true,
    message: '任务状态已更新'
  });
}));

/**
 * 渠道列表
 */
app.get('/api/channels', asyncHandler(async (req, res) => {
  const { db } = require('./database');
  
  const channels = db.prepare('SELECT * FROM channels WHERE enabled = 1 ORDER BY name').all();
  
  res.json({
    success: true,
    data: channels
  });
}));

// ============ 错误处理 ============

// 404
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// ============ 启动服务器 ============

const server = app.listen(PORT, () => {
  console.log('\n🚀 PMS 后端服务已启动 (优化版)');
  console.log(`📡 API 地址: http://localhost:${PORT}`);
  console.log(`📊 数据库: SQLite (./database/pms.db)`);
  console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 内存: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  console.log('');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('\n⏹️  收到SIGTERM信号,正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

module.exports = app;
