/**
 * JWT认证中间件
 * 用于保护需要认证的API端点
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * 认证中间件
 * 验证请求头中的JWT token
 */
const authMiddleware = (req, res, next) => {
  try {
    // 从Authorization header获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: '未登录',
        code: 'NO_TOKEN'
      });
    }

    // 检查格式: Bearer <token>
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Token格式错误',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    const token = parts[1];

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 将用户信息附加到请求对象
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token无效',
        code: 'INVALID_TOKEN'
      });
    } else if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token已过期',
        code: 'TOKEN_EXPIRED'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: '认证失败',
        code: 'AUTH_ERROR'
      });
    }
  }
};

/**
 * 角色权限定义
 */
const PERMISSIONS = {
  ADMIN: ['*'], // 所有权限
  MANAGER: [
    'orders.*',
    'rooms.*',
    'customers.*',
    'cleaning.*',
    'finance.read'
  ],
  STAFF: [
    'orders.read',
    'rooms.read',
    'cleaning.*',
    'customers.read'
  ],
  CLEANER: [
    'cleaning.read',
    'cleaning.update'
  ]
};

// 管理员特殊权限检查
const isAdminPermission = (permission) => {
  return permission.startsWith('users.');
};

/**
 * 权限检查中间件
 * @param {string} permission - 需要的权限,如 'orders.create'
 */
const authorize = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '未登录',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userRole = req.user.role;
    const rolePermissions = PERMISSIONS[userRole] || [];

    // 管理员特殊权限（users.*）仅限ADMIN
    if (isAdminPermission(permission)) {
      if (userRole !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: '仅管理员可执行此操作',
          code: 'ADMIN_ONLY',
          required: permission
        });
      }
      return next();
    }

    // 检查是否有通配符权限
    if (rolePermissions.includes('*')) {
      return next();
    }

    // 检查具体权限
    const [resource, action] = permission.split('.');
    const hasPermission = rolePermissions.some(p => {
      if (p === permission) return true; // 完全匹配
      if (p === `${resource}.*`) return true; // 资源通配符
      return false;
    });

    if (hasPermission) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: '无权限执行此操作',
        code: 'FORBIDDEN',
        required: permission,
        userRole: userRole
      });
    }
  };
};

/**
 * 可选认证中间件
 * 如果有token则验证,没有token也允许通过
 * 用于既可以公开访问,也可以认证后获得更多信息的API
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    req.user = null;
    return next();
  }

  try {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      };
    }
  } catch (err) {
    // 忽略错误,继续处理
    req.user = null;
  }

  next();
};

module.exports = {
  authMiddleware,
  authorize,
  optionalAuth,
  PERMISSIONS
};
