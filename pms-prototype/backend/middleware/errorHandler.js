/**
 * 统一错误处理中间件
 */

const { logError } = require('./logger');

/**
 * 错误码定义
 */
const ErrorCodes = {
  // 客户端错误 4xx
  INVALID_PARAMS: { code: 400, message: '参数错误' },
  UNAUTHORIZED: { code: 401, message: '未授权' },
  FORBIDDEN: { code: 403, message: '禁止访问' },
  NOT_FOUND: { code: 404, message: '资源不存在' },
  CONFLICT: { code: 409, message: '资源冲突' },
  
  // 业务错误 4xx
  ROOM_NOT_AVAILABLE: { code: 410, message: '房间不可用' },
  ORDER_CANCELLED: { code: 411, message: '订单已取消' },
  INSUFFICIENT_PERMISSION: { code: 412, message: '权限不足' },
  
  // 服务器错误 5xx
  INTERNAL_ERROR: { code: 500, message: '服务器内部错误' },
  DATABASE_ERROR: { code: 501, message: '数据库错误' },
  EXTERNAL_API_ERROR: { code: 502, message: '外部API错误' }
};

/**
 * 业务错误类
 */
class BusinessError extends Error {
  constructor(errorCode, message = null) {
    super(message || errorCode.message);
    this.code = errorCode.code;
    this.errorCode = errorCode;
  }
}

/**
 * 错误处理中间件
 */
function errorHandler(err, req, res, next) {
  logError(err, req.url);
  
  // 业务错误
  if (err instanceof BusinessError) {
    return res.status(err.code >= 500 ? 500 : 400).json({
      success: false,
      code: err.code,
      message: err.message,
      path: req.url
    });
  }
  
  // SQLite错误
  if (err.code && err.code.startsWith('SQLITE_')) {
    return res.status(500).json({
      success: false,
      code: 501,
      message: '数据库操作失败',
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  // 其他错误
  res.status(500).json({
    success: false,
    code: 500,
    message: '服务器内部错误',
    detail: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}

/**
 * 404处理
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    code: 404,
    message: '接口不存在',
    path: req.url
  });
}

/**
 * 异步路由包装器(自动捕获错误)
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  ErrorCodes,
  BusinessError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};
