/**
 * 监控中间件
 * 使用Prometheus收集指标
 */

const promClient = require('prom-client');

// 创建Registry
const register = new promClient.Registry();

// 添加默认指标(内存、CPU等)
promClient.collectDefaultMetrics({ register });

// HTTP请求计数器
const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// HTTP请求耗时直方图
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10], // 10ms, 50ms, 100ms, ...
  registers: [register]
});

// 活跃订单数
const activeOrdersGauge = new promClient.Gauge({
  name: 'active_orders_total',
  help: 'Number of active orders',
  registers: [register]
});

// 可用房间数
const availableRoomsGauge = new promClient.Gauge({
  name: 'available_rooms_total',
  help: 'Number of available rooms',
  registers: [register]
});

// 数据库查询耗时
const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['query_type'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register]
});

// WebSocket连接数
const wsConnectionsGauge = new promClient.Gauge({
  name: 'websocket_connections_total',
  help: 'Number of active WebSocket connections',
  registers: [register]
});

/**
 * 监控中间件
 */
const monitoringMiddleware = (req, res, next) => {
  const start = Date.now();

  // 响应结束时记录指标
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // 转换为秒
    const route = req.route?.path || req.path;
    const statusCode = res.statusCode;

    // 记录请求计数
    httpRequestCounter.labels(req.method, route, statusCode).inc();

    // 记录请求耗时
    httpRequestDuration.labels(req.method, route, statusCode).observe(duration);
  });

  next();
};

/**
 * 更新业务指标
 */
const updateBusinessMetrics = async () => {
  try {
    const { db } = require('../database');

    // 活跃订单数
    const activeOrders = db.prepare(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE status IN ('confirmed', 'checked_in')
    `).get();
    activeOrdersGauge.set(activeOrders.count);

    // 可用房间数
    const availableRooms = db.prepare(`
      SELECT COUNT(*) as count 
      FROM rooms 
      WHERE status = 'available'
    `).get();
    availableRoomsGauge.set(availableRooms.count);

  } catch (err) {
    console.error('更新业务指标失败:', err);
  }
};

// 每分钟更新一次业务指标
setInterval(updateBusinessMetrics, 60000);

// 立即执行一次
updateBusinessMetrics();

/**
 * 记录数据库查询耗时
 */
const recordDbQuery = (queryType, duration) => {
  dbQueryDuration.labels(queryType).observe(duration / 1000); // 转换为秒
};

/**
 * 更新WebSocket连接数
 */
const updateWsConnections = (count) => {
  wsConnectionsGauge.set(count);
};

/**
 * 获取指标
 */
const getMetrics = async () => {
  return await register.metrics();
};

/**
 * 健康检查
 */
const healthCheck = async () => {
  const health = {
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {}
  };

  try {
    // 数据库检查
    const { db } = require('../database');
    db.prepare('SELECT 1').get();
    health.checks.database = { status: 'ok' };
  } catch (err) {
    health.checks.database = { status: 'error', error: err.message };
    health.status = 'degraded';
  }

  // Redis检查(如果启用)
  try {
    const cacheService = require('../services/CacheService');
    if (cacheService.isConnected) {
      health.checks.redis = { status: 'ok' };
    } else {
      health.checks.redis = { status: 'unavailable' };
    }
  } catch (err) {
    health.checks.redis = { status: 'error', error: err.message };
  }

  return health;
};

module.exports = {
  monitoringMiddleware,
  getMetrics,
  healthCheck,
  recordDbQuery,
  updateWsConnections,
  register
};
