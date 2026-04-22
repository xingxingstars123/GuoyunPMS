/**
 * AuthService 单元测试
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock dependencies first
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

// Mock database module
const mockDb = {
  get: jest.fn(),
  run: jest.fn(),
  all: jest.fn()
};

jest.mock('../../../database', () => mockDb);

// Import after mocks
const AuthService = require('../../../services/AuthService');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      // Arrange
      const username = 'testuser';
      const password = 'password123';
      const role = 'STAFF';

      mockDb.get.mockResolvedValue(null); // 用户不存在
      bcrypt.hash.mockResolvedValue('hashed_password');
      mockDb.run.mockResolvedValue({ lastID: 1 });

      // Act
      const result = await AuthService.register(username, password, role);

      // Assert
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('username', username);
      expect(result).toHaveProperty('role', role);
      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT id FROM users WHERE username = ?',
        username
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });

    it('应该拒绝注册已存在的用户名', async () => {
      // Arrange
      mockDb.get.mockResolvedValue({ id: 1 });

      // Act & Assert
      await expect(
        AuthService.register('existinguser', 'password123')
      ).rejects.toThrow('用户名已存在');
    });

    it('应该拒绝空用户名或密码', async () => {
      await expect(AuthService.register('', 'password')).rejects.toThrow(
        '用户名和密码不能为空'
      );
      await expect(AuthService.register('user', '')).rejects.toThrow(
        '用户名和密码不能为空'
      );
    });

    it('应该拒绝长度小于6位的密码', async () => {
      mockDb.get.mockResolvedValue(null);

      await expect(AuthService.register('user', '12345')).rejects.toThrow(
        '密码长度至少6位'
      );
    });
  });

  describe('login', () => {
    it('应该成功登录并返回token', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'testuser',
        password_hash: 'hashed_password',
        role: 'STAFF',
        created_at: '2024-01-01'
      };

      mockDb.get.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      mockDb.run.mockResolvedValue({});
      jwt.sign.mockReturnValue('mock_token');

      // Act
      const result = await AuthService.login('testuser', 'password123');

      // Assert
      expect(result).toHaveProperty('token', 'mock_token');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id', 1);
      expect(result.user).toHaveProperty('username', 'testuser');
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET last_login'),
        1
      );
    });

    it('应该拒绝不存在的用户名', async () => {
      mockDb.get.mockResolvedValue(null);

      await expect(AuthService.login('nonexistent', 'password')).rejects.toThrow(
        '用户名或密码错误'
      );
    });

    it('应该拒绝错误的密码', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password_hash: 'hashed_password'
      };

      mockDb.get.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(AuthService.login('testuser', 'wrongpassword')).rejects.toThrow(
        '用户名或密码错误'
      );
    });
  });

  describe('changePassword', () => {
    it('应该成功修改密码', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'testuser',
        password_hash: 'old_hashed_password'
      };

      mockDb.get.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('new_hashed_password');
      mockDb.run.mockResolvedValue({});

      // Act
      const result = await AuthService.changePassword(1, 'oldpassword', 'newpassword123');

      // Assert
      expect(result).toEqual({ success: true });
      expect(bcrypt.compare).toHaveBeenCalledWith('oldpassword', 'old_hashed_password');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 12);
    });

    it('应该拒绝错误的旧密码', async () => {
      const mockUser = {
        id: 1,
        password_hash: 'hashed_password'
      };

      mockDb.get.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        AuthService.changePassword(1, 'wrongold', 'newpass123')
      ).rejects.toThrow('原密码错误');
    });

    it('应该拒绝长度不足的新密码', async () => {
      await expect(
        AuthService.changePassword(1, 'oldpass', '12345')
      ).rejects.toThrow('新密码长度至少6位');
    });

    it('应该拒绝不存在的用户', async () => {
      mockDb.get.mockResolvedValue(null);

      await expect(
        AuthService.changePassword(999, 'oldpass', 'newpass123')
      ).rejects.toThrow('用户不存在');
    });
  });

  describe('verifyToken', () => {
    it('应该成功验证有效token', () => {
      const mockDecoded = { id: 1, username: 'testuser', role: 'STAFF' };
      jwt.verify.mockReturnValue(mockDecoded);

      const result = AuthService.verifyToken('valid_token');

      expect(result).toEqual(mockDecoded);
      expect(jwt.verify).toHaveBeenCalledWith('valid_token', process.env.JWT_SECRET);
    });

    it('应该拒绝无效token', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      expect(() => AuthService.verifyToken('invalid_token')).toThrow(
        'Token无效或已过期'
      );
    });
  });

  describe('refreshToken', () => {
    it('应该成功刷新token', async () => {
      const mockDecoded = { id: 1, username: 'testuser', role: 'STAFF' };
      const mockUser = {
        id: 1,
        username: 'testuser',
        role: 'STAFF'
      };

      jwt.verify.mockReturnValue(mockDecoded);
      mockDb.get.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('new_token');

      const result = await AuthService.refreshToken('old_token');

      expect(result).toEqual({ token: 'new_token' });
      expect(jwt.verify).toHaveBeenCalledWith(
        'old_token',
        process.env.JWT_SECRET,
        { ignoreExpiration: true }
      );
    });

    it('应该拒绝已删除用户的token', async () => {
      const mockDecoded = { id: 999 };
      jwt.verify.mockReturnValue(mockDecoded);
      mockDb.get.mockResolvedValue(null);

      await expect(AuthService.refreshToken('old_token')).rejects.toThrow(
        'Token刷新失败'
      );
    });
  });

  describe('getUserInfo', () => {
    it('应该返回用户信息', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        role: 'STAFF',
        created_at: '2024-01-01',
        last_login: '2024-01-02'
      };

      mockDb.get.mockResolvedValue(mockUser);

      const result = await AuthService.getUserInfo(1);

      expect(result).toEqual(mockUser);
    });

    it('应该拒绝不存在的用户', async () => {
      mockDb.get.mockResolvedValue(null);

      await expect(AuthService.getUserInfo(999)).rejects.toThrow('用户不存在');
    });
  });

  describe('updateUserRole', () => {
    it('应该成功更新用户角色', async () => {
      mockDb.run.mockResolvedValue({});

      const result = await AuthService.updateUserRole(1, 'MANAGER');

      expect(result).toEqual({ success: true });
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET role'),
        'MANAGER',
        1
      );
    });

    it('应该拒绝无效角色', async () => {
      await expect(AuthService.updateUserRole(1, 'INVALID_ROLE')).rejects.toThrow(
        '无效的角色'
      );
    });
  });

  describe('deleteUser', () => {
    it('应该成功删除非管理员用户', async () => {
      mockDb.get
        .mockResolvedValueOnce({ count: 2 }) // adminCount
        .mockResolvedValueOnce({ role: 'STAFF' }); // user
      mockDb.run.mockResolvedValue({});

      const result = await AuthService.deleteUser(1);

      expect(result).toEqual({ success: true });
      expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM users WHERE id = ?', 1);
    });

    it('应该拒绝删除最后一个管理员', async () => {
      mockDb.get
        .mockResolvedValueOnce({ count: 1 }) // adminCount
        .mockResolvedValueOnce({ role: 'ADMIN' }); // user

      await expect(AuthService.deleteUser(1)).rejects.toThrow(
        '不能删除最后一个管理员'
      );
    });
  });
});
