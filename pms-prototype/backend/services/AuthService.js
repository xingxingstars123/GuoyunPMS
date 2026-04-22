/**
 * 认证服务
 * 处理用户注册、登录、密码管理等
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database');
require('dotenv').config();

const SALT_ROUNDS = 12; // bcrypt加密强度

class AuthService {
  /**
   * 用户注册
   */
  static async register(username, password, role = 'STAFF') {
    // 验证输入
    if (!username || !password) {
      throw new Error('用户名和密码不能为空');
    }

    if (password.length < 6) {
      throw new Error('密码长度至少6位');
    }

    // 检查用户名是否已存在
    const existing = await db.get(
      'SELECT id FROM users WHERE username = ?',
      username
    );

    if (existing) {
      throw new Error('用户名已存在');
    }

    // 密码哈希
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 创建用户
    const result = await db.run(
      `INSERT INTO users (username, password_hash, role, created_at) 
       VALUES (?, ?, ?, datetime('now'))`,
      username,
      passwordHash,
      role
    );

    return {
      id: result.lastID,
      username,
      role,
      created_at: new Date().toISOString()
    };
  }

  /**
   * 用户登录
   */
  static async login(username, password) {
    // 查询用户
    const user = await db.get(
      'SELECT * FROM users WHERE username = ?',
      username
    );

    if (!user) {
      throw new Error('用户名或密码错误');
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('用户名或密码错误');
    }

    // 更新最后登录时间
    await db.run(
      'UPDATE users SET last_login = datetime(\'now\') WHERE id = ?',
      user.id
    );

    // 生成JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        created_at: user.created_at,
        last_login: new Date().toISOString()
      }
    };
  }

  /**
   * 修改密码
   */
  static async changePassword(userId, oldPassword, newPassword) {
    if (newPassword.length < 6) {
      throw new Error('新密码长度至少6位');
    }

    // 获取用户
    const user = await db.get(
      'SELECT * FROM users WHERE id = ?',
      userId
    );

    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证旧密码
    const isValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValid) {
      throw new Error('原密码错误');
    }

    // 生成新密码哈希
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // 更新密码
    await db.run(
      'UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?',
      newPasswordHash,
      userId
    );

    return { success: true };
  }

  /**
   * 重置密码 (管理员功能)
   */
  static async resetPassword(userId, newPassword) {
    if (newPassword.length < 6) {
      throw new Error('新密码长度至少6位');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await db.run(
      'UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?',
      passwordHash,
      userId
    );

    return { success: true };
  }

  /**
   * 验证token
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new Error('Token无效或已过期');
    }
  }

  /**
   * 刷新token
   */
  static async refreshToken(oldToken) {
    try {
      const decoded = jwt.verify(oldToken, process.env.JWT_SECRET, {
        ignoreExpiration: true // 允许过期token
      });

      // 检查用户是否仍然存在
      const user = await db.get(
        'SELECT * FROM users WHERE id = ?',
        decoded.id
      );

      if (!user) {
        throw new Error('用户不存在');
      }

      // 生成新token
      const newToken = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role
        },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
      );

      return { token: newToken };
    } catch (err) {
      throw new Error('Token刷新失败');
    }
  }

  /**
   * 获取用户信息
   */
  static async getUserInfo(userId) {
    const user = await db.get(
      'SELECT id, username, role, created_at, last_login FROM users WHERE id = ?',
      userId
    );

    if (!user) {
      throw new Error('用户不存在');
    }

    return user;
  }

  /**
   * 列出所有用户 (管理员功能)
   */
  static async listUsers() {
    const users = await db.all(
      'SELECT id, username, role, created_at, last_login FROM users ORDER BY created_at DESC'
    );

    return users;
  }

  /**
   * 更新用户角色 (管理员功能)
   */
  static async updateUserRole(userId, newRole) {
    const validRoles = ['ADMIN', 'MANAGER', 'STAFF', 'CLEANER'];
    
    if (!validRoles.includes(newRole)) {
      throw new Error('无效的角色');
    }

    await db.run(
      'UPDATE users SET role = ?, updated_at = datetime(\'now\') WHERE id = ?',
      newRole,
      userId
    );

    return { success: true };
  }

  /**
   * 删除用户 (管理员功能)
   */
  static async deleteUser(userId) {
    // 不允许删除最后一个管理员
    const adminCount = await db.get(
      'SELECT COUNT(*) as count FROM users WHERE role = \'ADMIN\''
    );

    const user = await db.get(
      'SELECT role FROM users WHERE id = ?',
      userId
    );

    if (user && user.role === 'ADMIN' && adminCount.count <= 1) {
      throw new Error('不能删除最后一个管理员');
    }

    await db.run('DELETE FROM users WHERE id = ?', userId);

    return { success: true };
  }
}

module.exports = AuthService;
