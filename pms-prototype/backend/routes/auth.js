/**
 * 认证路由
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * 公开路由 (无需认证)
 */

// 用户登录
router.post('/login', asyncHandler(AuthController.login));

// 刷新token
router.post('/refresh', asyncHandler(AuthController.refreshToken));

/**
 * 需要认证的路由
 */

// 获取当前用户信息
router.get('/me', authMiddleware, asyncHandler(AuthController.getCurrentUser));

// 修改密码
router.post('/change-password', authMiddleware, asyncHandler(AuthController.changePassword));

/**
 * 管理员路由
 */

// 注册新用户 (仅管理员)
router.post(
  '/register',
  authMiddleware,
  authorize('users.create'),
  asyncHandler(AuthController.register)
);

// 列出所有用户 (仅管理员)
router.get(
  '/users',
  authMiddleware,
  authorize('users.read'),
  asyncHandler(AuthController.listUsers)
);

// 更新用户角色 (仅管理员)
router.put(
  '/users/:id/role',
  authMiddleware,
  authorize('users.update'),
  asyncHandler(AuthController.updateUserRole)
);

// 重置用户密码 (仅管理员)
router.post(
  '/users/:id/reset-password',
  authMiddleware,
  authorize('users.update'),
  asyncHandler(AuthController.resetPassword)
);

// 删除用户 (仅管理员)
router.delete(
  '/users/:id',
  authMiddleware,
  authorize('users.delete'),
  asyncHandler(AuthController.deleteUser)
);

module.exports = router;
