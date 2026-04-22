// Jest setup file
// 测试环境设置

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// 设置超时时间
jest.setTimeout(10000);

// Mock console methods to reduce test output noise (optional)
global.console = {
  ...console,
  // log: jest.fn(), // 可选: 在测试时禁用console.log
  // error: jest.fn(),
};
