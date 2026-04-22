/**
 * 认证控制器
 * 处理用户登录、注册等认证相关请求
 */

const AuthService = require('../services/AuthService');

class AuthController {
  /**
   * 用户登录
   * POST /api/auth/login
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: '用户名和密码不能为空'
        });
      }

      const result = await AuthService.login(username, password);

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      res.status(401).json({
        success: false,
        error: err.message
      });
    }
  }

  /**
   * 用户注册
   * POST /api/auth/register
   * 需要管理员权限
   */
  static async register(req, res) {
    try {
      const { username, password, role } = req.body;

      const user = await AuthService.register(username, password, role);

      res.status(201).json({
        success: true,
        data: user
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  }

  /**
   * 获取当前用户信息
   * GET /api/auth/me
   */
  static async getCurrentUser(req, res) {
    try {
      const user = await AuthService.getUserInfo(req.user.id);

      res.json({
        success: true,
        data: user
      });
    } catch (err) {
      res.status(404).json({
        success: false,
        error: err.message
      });
    }
  }

  /**
   * 修改密码
   * POST /api/auth/change-password
   */
  static async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: '旧密码和新密码不能为空'
        });
      }

      await AuthService.changePassword(req.user.id, oldPassword, newPassword);

      res.json({
        success: true,
        message: '密码修改成功'
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  }

  /**
   * 刷新token
   * POST /api/auth/refresh
   */
  static async refreshToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token不能为空'
        });
      }

      const result = await AuthService.refreshToken(token);

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      res.status(401).json({
        success: false,
        error: err.message
      });
    }
  }

  /**
   * 列出所有用户
   * GET /api/auth/users
   * 需要管理员权限
   */
  static async listUsers(req, res) {
    try {
      const users = await AuthService.listUsers();

      res.json({
        success: true,
        data: users
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }

  /**
   * 更新用户角色
   * PUT /api/auth/users/:id/role
   * 需要管理员权限
   */
  static async updateUserRole(req, res) {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({
          success: false,
          error: '角色不能为空'
        });
      }

      await AuthService.updateUserRole(userId, role);

      res.json({
        success: true,
        message: '角色更新成功'
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  }

  /**
   * 重置用户密码
   * POST /api/auth/users/:id/reset-password
   * 需要管理员权限
   */
  static async resetPassword(req, res) {
    try {
      const userId = parseInt(req.params.id);
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          error: '新密码不能为空'
        });
      }

      await AuthService.resetPassword(userId, newPassword);

      res.json({
        success: true,
        message: '密码重置成功'
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  }

  /**
   * 删除用户
   * DELETE /api/auth/users/:id
   * 需要管理员权限
   */
  static async deleteUser(req, res) {
    try {
      const userId = parseInt(req.params.id);

      // 不能删除自己
      if (userId === req.user.id) {
        return res.status(400).json({
          success: false,
          error: '不能删除自己的账户'
        });
      }

      await AuthService.deleteUser(userId);

      res.json({
        success: true,
        message: '用户删除成功'
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  }
}

module.exports = AuthController;
