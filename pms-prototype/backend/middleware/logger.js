/**
 * 日志中间件
 */

const dayjs = require('dayjs');

/**
 * 请求日志中间件
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // 捕获原始的 res.json
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    console.log(
      `[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ` +
      `${req.method} ${req.url} ` +
      `${res.statusCode} ` +
      `${duration}ms`
    );
    
    return originalJson(data);
  };
  
  next();
}

/**
 * 错误日志
 */
function logError(error, context = '') {
  console.error(
    `[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ` +
    `ERROR ${context}: ${error.message}`,
    error.stack
  );
}

module.exports = {
  requestLogger,
  logError
};
