/**
 * 认证API集成测试
 * 简化版本:直接测试AuthController逻辑
 */

const AuthService = require('../../../services/AuthService');
const AuthController = require('../../../controllers/AuthController');

// Mock AuthService
jest.mock('../../../services/AuthService');

describe('Auth API Integration Tests', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Express request and response objects
    mockReq = {
      body: {},
      user: { id: 1, username: 'testuser', role: 'STAFF' },
      headers: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      mockReq.body = {
        username: 'newuser',
        password: 'password123',
        role: 'STAFF'
      };

      AuthService.register.mockResolvedValue({
        id: 1,
        username: 'newuser',
        role: 'STAFF',
        created_at: '2026-04-22T00:00:00.000Z'
      });

      await AuthController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ username: 'newuser' })
        })
      );
    });

    it('应该处理注册错误', async () => {
      mockReq.body = {
        username: 'existinguser',
        password: 'password123'
      };

      AuthService.register.mockRejectedValue(new Error('用户名已存在'));

      await AuthController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: '用户名已存在'
        })
      );
    });
  });

  describe('login', () => {
    it('应该成功登录并返回token', async () => {
      mockReq.body = {
        username: 'testuser',
        password: 'password123'
      };

      AuthService.login.mockResolvedValue({
        token: 'mock_jwt_token',
        user: {
          id: 1,
          username: 'testuser',
          role: 'STAFF'
        }
      });

      await AuthController.login(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ token: 'mock_jwt_token' })
        })
      );
    });

    it('应该拒绝错误的凭据', async () => {
      mockReq.body = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      AuthService.login.mockRejectedValue(new Error('用户名或密码错误'));

      await AuthController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('changePassword', () => {
    it('应该成功修改密码', async () => {
      mockReq.body = {
        oldPassword: 'oldpass123',
        newPassword: 'newpass123'
      };

      AuthService.changePassword.mockResolvedValue({ success: true });

      await AuthController.changePassword(mockReq, mockRes);

      expect(AuthService.changePassword).toHaveBeenCalledWith(
        1,
        'oldpass123',
        'newpass123'
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    it('应该拒绝错误的旧密码', async () => {
      mockReq.body = {
        oldPassword: 'wrongold',
        newPassword: 'newpass123'
      };

      AuthService.changePassword.mockRejectedValue(new Error('原密码错误'));

      await AuthController.changePassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('refreshToken', () => {
    it('应该成功刷新token', async () => {
      mockReq.body = {
        token: 'old_mock_token'
      };

      AuthService.refreshToken.mockResolvedValue({
        token: 'new_mock_token'
      });

      await AuthController.refreshToken(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ token: 'new_mock_token' })
        })
      );
    });

    it('应该拒绝无效token', async () => {
      mockReq.body = {
        token: 'invalid_token'
      };

      AuthService.refreshToken.mockRejectedValue(new Error('Token无效或已过期'));

      await AuthController.refreshToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('getCurrentUser', () => {
    it('应该返回当前用户信息', async () => {
      AuthService.getUserInfo.mockResolvedValue({
        id: 1,
        username: 'testuser',
        role: 'STAFF',
        created_at: '2024-01-01',
        last_login: '2024-01-02'
      });

      await AuthController.getCurrentUser(mockReq, mockRes);

      expect(AuthService.getUserInfo).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });
});
