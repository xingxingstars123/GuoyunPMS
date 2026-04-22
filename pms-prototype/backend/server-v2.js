/**
 * PMS后端服务器 v2.0
 * 
 * 新增功能:
 * - JWT认证 + 权限控制
 * - Redis缓存
 * - WebSocket实时通知
 * - Prometheus监控
 * - PostgreSQL支持
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// 数据库
const { initDatabase } = require('./database');

// 中间件
const { requestLogger } = require('./middleware/logger');
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');
const { authMiddleware, authorize } = require('./middleware/auth');
const { cacheMiddleware, invalidateCache } = require('./middleware/cache');
const { monitoringMiddleware, getMetrics, healthCheck } = require('./middleware/monitoring');

// 服务
const OrderService = require('./services/OrderService');
const RoomService = require('./services/RoomService');
const cacheService = require('./services/CacheService');
const { wsService, notifyAdmins } = require('./services/WebSocketService');

// 路由
const authRoutes = require('./routes/auth');
const otaRoutes = require('./routes/ota');
const pricingRoutes = require('./routes/pricing');
const exportRoutes = require('./routes/export');
const bulkRoutes = require('./routes/bulk');

const app = express();
const PORT = process.env.PORT || 3101;
const WS_PORT = process.env.WS_PORT || 3102;

// ============ 初始化 ============

// 连接Redis (可选,失败不影响启动)
cacheService.connect().catch(err => {
  console.warn('⚠️  Redis未启用:', err.message);
});

// 初始化数据库
initDatabase();

// 启动WebSocket服务
wsService.start(WS_PORT);

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

// 监控指标收集
app.use(monitoringMiddleware);

// 安全头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ============ 公开API ============

/**
 * 健康检查
 */
app.get('/api/health', asyncHandler(async (req, res) => {
  const health = await healthCheck();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
}));

/**
 * Prometheus指标
 */
app.get('/metrics', asyncHandler(async (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(await getMetrics());
}));

/**
 * 认证路由
 */
app.use('/api/auth', authRoutes);

/**
 * Phase 2 高级功能路由
 */
app.use('/api/ota', otaRoutes);           // OTA渠道对接
app.use('/api/pricing', pricingRoutes);   // 智能定价
app.use('/api/export', exportRoutes);     // 数据导出
app.use('/api/bulk', bulkRoutes);         // 批量操作

// ============ 需要认证的API ============

/**
 * 首页统计 (缓存60秒)
 */
app.get('/api/dashboard/stats', 
  authMiddleware,
  cacheMiddleware('dashboard:stats', 60),
  asyncHandler(async (req, res) => {
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
  })
);

/**
 * 订单列表 (缓存30秒)
 */
app.get('/api/orders',
  authMiddleware,
  cacheMiddleware(req => `orders:list:${JSON.stringify(req.query)}`, 30),
  asyncHandler(async (req, res) => {
    const orders = OrderService.getOrders(req.query);
    
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  })
);

/**
 * 订单详情
 */
app.get('/api/orders/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const order = OrderService.getOrderById(req.params.id);
    
    res.json({
      success: true,
      data: order
    });
  })
);

/**
 * 创建订单 (需要MANAGER/ADMIN权限)
 */
app.post('/api/orders',
  authMiddleware,
  authorize('orders.create'),
  asyncHandler(async (req, res) => {
    const result = OrderService.createOrder(req.body);
    
    // 使缓存失效
    await invalidateCache('dashboard:*');
    await invalidateCache('orders:*');
    
    // 通知管理员
    notifyAdmins('new_order', {
      orderId: result.orderId,
      customerName: req.body.customerName,
      totalPrice: req.body.totalPrice
    });
    
    res.json({
      success: true,
      message: '订单创建成功',
      data: result
    });
  })
);

/**
 * 更新订单状态
 */
app.put('/api/orders/:id/status',
  authMiddleware,
  authorize('orders.update'),
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const result = OrderService.updateOrderStatus(req.params.id, status);
    
    // 使缓存失效
    await invalidateCache('dashboard:*');
    await invalidateCache('orders:*');
    
    res.json({
      success: true,
      message: '订单状态已更新',
      data: result
    });
  })
);

/**
 * 房态日历
 */
app.get('/api/rooms/calendar',
  authMiddleware,
  cacheMiddleware(req => `calendar:${req.query.startDate}-${req.query.endDate}`, 300),
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const calendar = RoomService.getCalendar(startDate, endDate);
    
    res.json({
      success: true,
      data: calendar
    });
  })
);

/**
 * 可用房间查询
 */
app.get('/api/rooms/available',
  authMiddleware,
  asyncHandler(async (req, res) => {
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
  })
);

/**
 * 房间利用率统计
 */
app.get('/api/rooms/utilization',
  authMiddleware,
  cacheMiddleware('rooms:utilization', 3600),
  asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;
    const stats = RoomService.getRoomUtilization(Number(days));
    
    res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * 客户列表
 */
app.get('/api/customers',
  authMiddleware,
  cacheMiddleware(req => `customers:${req.query.channel || 'all'}`, 600),
  asyncHandler(async (req, res) => {
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
  })
);

/**
 * 财务报表 - 渠道统计
 */
app.get('/api/finance/channels',
  authMiddleware,
  authorize('finance.read'),
  cacheMiddleware('finance:channels', 3600),
  asyncHandler(async (req, res) => {
    const { db } = require('./database');
    const stats = db.prepare('SELECT * FROM v_channel_performance').all();
    
    res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * 财务报表 - 每日收入趋势
 */
app.get('/api/finance/daily',
  authMiddleware,
  authorize('finance.read'),
  cacheMiddleware(req => `finance:daily:${req.query.days || 30}`, 3600),
  asyncHandler(async (req, res) => {
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
  })
);

/**
 * 清洁任务列表
 */
app.get('/api/cleaning/tasks',
  authMiddleware,
  asyncHandler(async (req, res) => {
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
  })
);

/**
 * 创建清洁任务
 */
app.post('/api/cleaning/tasks',
  authMiddleware,
  authorize('cleaning.create'),
  asyncHandler(async (req, res) => {
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
  })
);

/**
 * 更新清洁任务状态
 */
app.put('/api/cleaning/tasks/:id',
  authMiddleware,
  authorize('cleaning.update'),
  asyncHandler(async (req, res) => {
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
  })
);

// ============ 错误处理 ============

app.use(notFoundHandler);
app.use(errorHandler);

// ============ 启动服务器 ============

const server = app.listen(PORT, () => {
  console.log('\n🚀 PMS 后端服务已启动 v2.0');
  console.log(`📡 HTTP API: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${WS_PORT}`);
  console.log(`📊 数据库: SQLite (./database/pms.db)`);
  console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 内存: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  console.log(`🔐 JWT认证: ${process.env.JWT_SECRET ? '已启用' : '⚠️ 未配置'}`);
  console.log(`⚡ Redis缓存: ${cacheService.isConnected ? '已连接' : '未启用'}`);
  console.log(`📈 监控: http://localhost:${PORT}/metrics`);
  console.log('');
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('\n⏹️  收到SIGTERM信号,正在关闭服务器...');
  
  server.close(() => {
    console.log('✅ HTTP服务器已关闭');
  });
  
  wsService.close();
  await cacheService.disconnect();
  
  process.exit(0);
});

module.exports = app;
