/**
 * OTAService 单元测试
 */

const OTAService = require('../../../services/OTAService');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('OTAService', () => {
  let otaService;

  beforeEach(() => {
    // 设置测试环境变量
    process.env.OTA_CTRIP_ENABLED = 'true';
    process.env.OTA_CTRIP_API_URL = 'https://api.ctrip.com';
    process.env.OTA_CTRIP_HOTEL_ID = 'test_hotel_123';
    process.env.OTA_CTRIP_API_KEY = 'test_api_key';
    process.env.OTA_CTRIP_API_SECRET = 'test_api_secret';

    process.env.OTA_MEITUAN_ENABLED = 'true';
    process.env.OTA_MEITUAN_APP_KEY = 'test_app_key';
    process.env.OTA_MEITUAN_HOTEL_ID = 'test_hotel_456';

    process.env.OTA_BOOKING_ENABLED = 'false'; // 测试禁用的渠道

    otaService = new OTAService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // 清理环境变量
    delete process.env.OTA_CTRIP_ENABLED;
    delete process.env.OTA_CTRIP_API_URL;
    delete process.env.OTA_CTRIP_HOTEL_ID;
    delete process.env.OTA_CTRIP_API_KEY;
    delete process.env.OTA_MEITUAN_ENABLED;
    delete process.env.OTA_BOOKING_ENABLED;
  });

  describe('constructor', () => {
    it('应该正确加载配置', () => {
      expect(otaService.config.ctrip.enabled).toBe(true);
      expect(otaService.config.ctrip.hotelId).toBe('test_hotel_123');
      expect(otaService.config.meituan.enabled).toBe(true);
      expect(otaService.config.booking.enabled).toBe(false);
    });
  });

  describe('syncRoomInventory', () => {
    const mockRooms = [
      { room_number: '101', status: 'available', date: '2024-01-01' },
      { room_number: '102', status: 'occupied', date: '2024-01-01' }
    ];

    it('应该成功同步携程房态', async () => {
      const result = await otaService.syncRoomInventory('ctrip', mockRooms);

      expect(result.success).toBe(true);
      expect(result.channel).toBe('ctrip');
      expect(result.synced).toBe(2);
    });

    it('应该成功同步美团房态', async () => {
      const result = await otaService.syncRoomInventory('meituan', mockRooms);

      expect(result.success).toBe(true);
      expect(result.channel).toBe('meituan');
      expect(result.synced).toBe(2);
    });

    it('应该拒绝未启用的渠道', async () => {
      const result = await otaService.syncRoomInventory('booking', mockRooms);

      expect(result.success).toBe(false);
      expect(result.error).toBe('booking not enabled');
    });

    it('应该拒绝未知渠道', async () => {
      const result = await otaService.syncRoomInventory('unknown', mockRooms);

      expect(result.success).toBe(false);
      // 未知渠道会被当作未启用渠道处理
      expect(result.error).toBe('unknown not enabled');
    });

    it('应该处理同步错误', async () => {
      // Mock一个抛出错误的情况
      const errorService = new OTAService();
      errorService._syncCtripInventory = jest.fn().mockRejectedValue(
        new Error('API connection failed')
      );

      const result = await errorService.syncRoomInventory('ctrip', mockRooms);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API connection failed');
    });
  });

  describe('syncRoomPrices', () => {
    const mockPrices = [
      { room_id: 1, date: '2024-01-01', price: 299 },
      { room_id: 2, date: '2024-01-01', price: 399 }
    ];

    it('应该成功同步携程价格', async () => {
      const result = await otaService.syncRoomPrices('ctrip', mockPrices);

      expect(result.success).toBe(true);
      expect(result.channel).toBe('ctrip');
      expect(result.synced).toBe(2);
    });

    it('应该成功同步美团价格', async () => {
      const result = await otaService.syncRoomPrices('meituan', mockPrices);

      expect(result.success).toBe(true);
      expect(result.channel).toBe('meituan');
    });

    it('应该拒绝未启用的渠道', async () => {
      const result = await otaService.syncRoomPrices('booking', mockPrices);

      expect(result.success).toBe(false);
      expect(result.error).toBe('booking not enabled');
    });
  });

  describe('fetchOrders', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    it('应该成功拉取携程订单', async () => {
      const result = await otaService.fetchOrders('ctrip', startDate, endDate);

      expect(result.success).toBe(true);
      expect(result.channel).toBe('ctrip');
      expect(Array.isArray(result.orders)).toBe(true);
    });

    it('应该成功拉取美团订单', async () => {
      const result = await otaService.fetchOrders('meituan', startDate, endDate);

      expect(result.success).toBe(true);
      expect(result.channel).toBe('meituan');
    });

    it('应该拒绝未启用的渠道', async () => {
      const result = await otaService.fetchOrders('booking', startDate, endDate);

      expect(result.success).toBe(false);
      expect(result.error).toBe('booking not enabled');
      expect(result.orders).toEqual([]);
    });
  });

  describe('confirmOrder', () => {
    const mockOrderId = 'ORD123456';

    it('应该成功确认携程订单', async () => {
      const result = await otaService.confirmOrder('ctrip', mockOrderId);

      expect(result.success).toBe(true);
      expect(result.channel).toBe('ctrip');
      expect(result.orderId).toBe(mockOrderId);
    });

    it('应该成功确认美团订单', async () => {
      const result = await otaService.confirmOrder('meituan', mockOrderId);

      expect(result.success).toBe(true);
      expect(result.channel).toBe('meituan');
    });

    it('应该拒绝未启用的渠道', async () => {
      const result = await otaService.confirmOrder('booking', mockOrderId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('booking not enabled');
    });
  });

  describe('getChannelStatus', () => {
    it('应该返回所有渠道的状态', () => {
      const status = otaService.getChannelStatus();

      expect(status).toHaveProperty('ctrip');
      expect(status).toHaveProperty('meituan');
      expect(status).toHaveProperty('booking');

      expect(status.ctrip.enabled).toBe(true);
      expect(status.ctrip.configured).toBe(true);

      expect(status.meituan.enabled).toBe(true);
      expect(status.meituan.configured).toBe(true);

      expect(status.booking.enabled).toBe(false);
    });

    it('应该检测未配置的渠道', () => {
      // 创建未配置API key的服务
      delete process.env.OTA_CTRIP_API_KEY;
      const unconfiguredService = new OTAService();

      const status = unconfiguredService.getChannelStatus();

      expect(status.ctrip.enabled).toBe(true); // 仍然启用
      expect(status.ctrip.configured).toBe(false); // 但未配置完整
    });
  });

  describe('API调用工具方法', () => {
    it('_ctripApiCall应该正确构造请求', async () => {
      const mockResponse = { data: { success: true } };
      axios.post.mockResolvedValue(mockResponse);

      const result = await otaService._ctripApiCall('/test', { data: 'test' });

      expect(axios.post).toHaveBeenCalledWith(
        'https://api.ctrip.com/test',
        { data: 'test' },
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Hotel-Id': 'test_hotel_123',
            'X-API-Key': 'test_api_key'
          })
        })
      );
      expect(result).toEqual({ success: true });
    });

    it('_meituanApiCall应该正确构造请求', async () => {
      const mockResponse = { data: { success: true } };
      axios.post.mockResolvedValue(mockResponse);

      await otaService._meituanApiCall('/test', { data: 'test' });

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('meituan'),
        { data: 'test' },
        expect.objectContaining({
          headers: expect.objectContaining({
            'App-Key': 'test_app_key'
          })
        })
      );
    });
  });
});
