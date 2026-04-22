/**
 * PricingService 单元测试
 */

const PricingService = require('../../../services/PricingService');

// Mock better-sqlite3
jest.mock('better-sqlite3', () => {
  return jest.fn().mockImplementation(() => {
    const mockDb = {
      prepare: jest.fn(),
      close: jest.fn()
    };
    return mockDb;
  });
});

describe('PricingService', () => {
  let pricingService;
  let mockDb;

  beforeEach(() => {
    // 重置模块
    jest.clearAllMocks();
    
    // 创建服务实例
    pricingService = new PricingService();
    mockDb = pricingService.db;
  });

  describe('calculateSmartPrice', () => {
    beforeEach(() => {
      // Mock database queries
      mockDb.prepare.mockImplementation((sql) => {
        if (sql.includes('SELECT base_price FROM rooms')) {
          return {
            get: jest.fn().mockReturnValue({ base_price: 300 })
          };
        }
        if (sql.includes('SELECT COUNT(*) as count FROM rooms')) {
          return {
            get: jest.fn().mockReturnValue({ count: 10 })
          };
        }
        if (sql.includes('SELECT COUNT(*) as count FROM orders')) {
          return {
            get: jest.fn().mockReturnValue({ count: 5 }) // 50% occupancy
          };
        }
        return { get: jest.fn(), all: jest.fn() };
      });
    });

    it('应该计算工作日基础价格', () => {
      const result = pricingService.calculateSmartPrice(1, '2026-04-27', 7); // Monday

      expect(result).toHaveProperty('roomId', 1);
      expect(result).toHaveProperty('date', '2026-04-27');
      expect(result).toHaveProperty('basePrice', 300);
      expect(result).toHaveProperty('finalPrice');
      expect(result.isWeekend).toBe(false);
      expect(result.isHoliday).toBe(false);
    });

    it('应该在周末提高价格', () => {
      const result = pricingService.calculateSmartPrice(1, '2026-04-25', 7); // Saturday

      expect(result.isWeekend).toBe(true);
      expect(result.multiplier).toBeGreaterThan(1.0);
      expect(result.finalPrice).toBeGreaterThan(result.basePrice);
    });

    it('应该在节假日大幅提高价格', () => {
      const result = pricingService.calculateSmartPrice(1, '2026-10-01', 7); // 国庆节

      expect(result.isHoliday).toBe(true);
      expect(result.multiplier).toBeGreaterThanOrEqual(1.5);
      expect(result.finalPrice).toBeGreaterThan(result.basePrice * 1.4);
    });

    it('应该在高入住率时提高价格', () => {
      // Mock 高入住率 (9/10 = 90%)
      mockDb.prepare.mockImplementation((sql) => {
        if (sql.includes('SELECT base_price FROM rooms')) {
          return {
            get: jest.fn().mockReturnValue({ base_price: 300 })
          };
        }
        if (sql.includes('SELECT COUNT(*) as count FROM rooms')) {
          return {
            get: jest.fn().mockReturnValue({ count: 10 })
          };
        }
        if (sql.includes('SELECT COUNT(*) as count FROM orders')) {
          return {
            get: jest.fn().mockReturnValue({ count: 9 }) // 90% occupancy
          };
        }
        return { get: jest.fn(), all: jest.fn() };
      });

      const result = pricingService.calculateSmartPrice(1, '2026-04-27', 7);

      expect(result.occupancy).toBeGreaterThanOrEqual(80);
      expect(result.multiplier).toBeGreaterThanOrEqual(1.3);
    });

    it('应该在低入住率时降低价格', () => {
      // Mock 低入住率 (1/10 = 10%)
      mockDb.prepare.mockImplementation((sql) => {
        if (sql.includes('SELECT base_price FROM rooms')) {
          return {
            get: jest.fn().mockReturnValue({ base_price: 300 })
          };
        }
        if (sql.includes('SELECT COUNT(*) as count FROM rooms')) {
          return {
            get: jest.fn().mockReturnValue({ count: 10 })
          };
        }
        if (sql.includes('SELECT COUNT(*) as count FROM orders')) {
          return {
            get: jest.fn().mockReturnValue({ count: 1 }) // 10% occupancy
          };
        }
        return { get: jest.fn(), all: jest.fn() };
      });

      const result = pricingService.calculateSmartPrice(1, '2026-04-27', 7);

      expect(result.occupancy).toBeLessThan(30);
      expect(result.multiplier).toBeLessThan(1.0);
      expect(result.finalPrice).toBeLessThan(result.basePrice);
    });

    it('应该在最后一刻预订时降低价格', () => {
      const result = pricingService.calculateSmartPrice(1, '2026-04-27', 0); // 当天预订

      expect(result.bookingType).toBe('lastMinute');
      expect(result.multiplier).toBeLessThan(1.0);
    });

    it('应该处理数据库错误并返回默认价格', () => {
      // Mock database error
      mockDb.prepare.mockImplementation(() => {
        return {
          get: jest.fn().mockImplementation(() => {
            throw new Error('Database error');
          })
        };
      });

      const result = pricingService.calculateSmartPrice(1, '2026-04-27', 7);

      expect(result.finalPrice).toBe(200); // config.basePrice
      expect(result).toHaveProperty('error');
    });
  });

  describe('calculateFuturePrices', () => {
    beforeEach(() => {
      // Mock database queries
      mockDb.prepare.mockImplementation((sql) => {
        if (sql.includes('SELECT base_price FROM rooms')) {
          return {
            get: jest.fn().mockReturnValue({ base_price: 300 })
          };
        }
        if (sql.includes('SELECT COUNT(*) as count FROM rooms')) {
          return {
            get: jest.fn().mockReturnValue({ count: 10 })
          };
        }
        if (sql.includes('SELECT COUNT(*) as count FROM orders')) {
          return {
            get: jest.fn().mockReturnValue({ count: 5 })
          };
        }
        return { get: jest.fn(), all: jest.fn() };
      });
    });

    it('应该计算未来30天的价格', () => {
      const prices = pricingService.calculateFuturePrices(1, 30);

      expect(prices).toHaveLength(30);
      expect(prices[0]).toHaveProperty('date');
      expect(prices[0]).toHaveProperty('finalPrice');
    });

    it('应该计算未来7天的价格', () => {
      const prices = pricingService.calculateFuturePrices(1, 7);

      expect(prices).toHaveLength(7);
    });

    it('每天的价格应该包含完整信息', () => {
      const prices = pricingService.calculateFuturePrices(1, 5);

      prices.forEach(price => {
        expect(price).toHaveProperty('roomId');
        expect(price).toHaveProperty('date');
        expect(price).toHaveProperty('basePrice');
        expect(price).toHaveProperty('finalPrice');
        expect(price).toHaveProperty('occupancy');
        expect(price).toHaveProperty('multiplier');
      });
    });
  });

  describe('_isWeekend', () => {
    it('应该正确识别周六', () => {
      expect(pricingService._isWeekend('2026-04-25')).toBe(true); // Saturday
    });

    it('应该正确识别周日', () => {
      expect(pricingService._isWeekend('2026-04-26')).toBe(true); // Sunday
    });

    it('应该正确识别工作日', () => {
      expect(pricingService._isWeekend('2026-04-27')).toBe(false); // Monday
      expect(pricingService._isWeekend('2026-04-28')).toBe(false); // Tuesday
    });
  });

  describe('_isHoliday', () => {
    it('应该正确识别国庆节', () => {
      expect(pricingService._isHoliday('2026-10-01')).toBe(true);
    });

    it('应该正确识别元旦', () => {
      expect(pricingService._isHoliday('2026-01-01')).toBe(true);
    });

    it('应该正确识别普通日期', () => {
      expect(pricingService._isHoliday('2026-04-27')).toBe(false);
    });
  });

  describe('_getBookingType', () => {
    it('应该识别早鸟预订 (>=30天)', () => {
      expect(pricingService._getBookingType(30)).toBe('earlyBird');
      expect(pricingService._getBookingType(60)).toBe('earlyBird');
    });

    it('应该识别标准预订 (7-29天)', () => {
      expect(pricingService._getBookingType(7)).toBe('standard');
      expect(pricingService._getBookingType(15)).toBe('standard');
    });

    it('应该识别最后一刻预订 (<7天)', () => {
      expect(pricingService._getBookingType(0)).toBe('lastMinute');
      expect(pricingService._getBookingType(3)).toBe('lastMinute');
    });
  });

  describe('getHistoricalTrend', () => {
    it('应该返回历史价格趋势', () => {
      const mockTrend = [
        { date: '2026-04-20', avg_daily_price: 280, bookings: 5 },
        { date: '2026-04-19', avg_daily_price: 300, bookings: 3 }
      ];

      mockDb.prepare.mockReturnValue({
        all: jest.fn().mockReturnValue(mockTrend)
      });

      const trend = pricingService.getHistoricalTrend(1, 30);

      expect(trend).toEqual(mockTrend);
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('AVG(total_price'));
    });

    it('应该处理数据库错误', () => {
      mockDb.prepare.mockReturnValue({
        all: jest.fn().mockImplementation(() => {
          throw new Error('Database error');
        })
      });

      const trend = pricingService.getHistoricalTrend(1, 30);

      expect(trend).toEqual([]);
    });
  });

  describe('recommendPrice', () => {
    beforeEach(() => {
      // Mock calculateSmartPrice
      jest.spyOn(pricingService, 'calculateSmartPrice').mockReturnValue({
        finalPrice: 350,
        basePrice: 300,
        occupancy: 50
      });

      // Mock _getHistoricalAveragePrice
      jest.spyOn(pricingService, '_getHistoricalAveragePrice').mockReturnValue(320);

      // Mock _getCompetitorAveragePrice
      jest.spyOn(pricingService, '_getCompetitorAveragePrice').mockReturnValue(340);
    });

    it('应该综合多种因素推荐价格', () => {
      const result = pricingService.recommendPrice(1, '2026-04-27');

      expect(result).toHaveProperty('recommended');
      expect(result).toHaveProperty('smartPrice', 350);
      expect(result).toHaveProperty('historicalAvg', 320);
      expect(result).toHaveProperty('competitorAvg', 340);
      expect(result).toHaveProperty('confidence');

      // 推荐价格应该是各价格的平均值左右
      expect(result.recommended).toBeGreaterThan(300);
      expect(result.recommended).toBeLessThan(370);
    });

    it('应该计算置信度', () => {
      const result = pricingService.recommendPrice(1, '2026-04-27');

      expect(['low', 'medium', 'high']).toContain(result.confidence);
    });

    it('应该处理错误情况', () => {
      jest.spyOn(pricingService, 'calculateSmartPrice').mockImplementation(() => {
        throw new Error('Calculation error');
      });

      const result = pricingService.recommendPrice(1, '2026-04-27');

      expect(result.recommended).toBe(200); // 默认基础价格
      expect(result).toHaveProperty('error');
    });
  });

  describe('_calculateConfidence', () => {
    it('应该在价格一致时返回高置信度', () => {
      const prices = [300, 305, 310];
      const confidence = pricingService._calculateConfidence(prices);

      expect(confidence).toBe('high');
    });

    it('应该在价格差异大时返回低置信度', () => {
      const prices = [200, 400, 600];
      const confidence = pricingService._calculateConfidence(prices);

      expect(confidence).toBe('low');
    });

    it('应该在只有一个价格时返回低置信度', () => {
      const prices = [300];
      const confidence = pricingService._calculateConfidence(prices);

      expect(confidence).toBe('low');
    });
  });
});
