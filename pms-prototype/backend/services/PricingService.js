/**
 * 智能定价引擎
 * 基于历史数据、入住率、节假日等因素自动调整价格
 */

const Database = require('better-sqlite3');
const path = require('path');

class PricingService {
  constructor() {
    this.db = new Database(path.join(__dirname, '../database/pms.db'));
    
    // 定价策略配置
    this.config = {
      // 基础价格系数
      basePrice: 200, // 默认基础价格
      
      // 入住率阈值
      occupancyThresholds: {
        low: 30,      // 低入住率 <30%
        medium: 60,   // 中等入住率 30-60%
        high: 80      // 高入住率 >80%
      },
      
      // 价格调整系数
      priceMultipliers: {
        lowOccupancy: 0.8,    // 低入住率: -20%
        mediumOccupancy: 1.0, // 中等入住率: 基准价
        highOccupancy: 1.3,   // 高入住率: +30%
        weekend: 1.2,         // 周末: +20%
        holiday: 1.5,         // 节假日: +50%
        lastMinute: 0.7       // 最后一刻: -30%
      },
      
      // 预订提前期
      advanceBookingDays: {
        earlyBird: 30,    // 早鸟优惠: 提前30天
        standard: 7,      // 标准预订: 提前7天
        lastMinute: 1     // 最后一刻: 1天内
      }
    };
  }

  /**
   * 计算智能价格
   * @param {number} roomId - 房间ID
   * @param {string} date - 日期 (YYYY-MM-DD)
   * @param {number} advanceDays - 提前预订天数
   */
  calculateSmartPrice(roomId, date, advanceDays = 7) {
    try {
      // 1. 获取房间基础价格
      const room = this.db.prepare('SELECT base_price FROM rooms WHERE id = ?').get(roomId);
      let basePrice = room?.base_price || this.config.basePrice;

      // 2. 计算当日入住率
      const occupancy = this._calculateOccupancy(date);

      // 3. 判断是否周末/节假日
      const isWeekend = this._isWeekend(date);
      const isHoliday = this._isHoliday(date);

      // 4. 判断预订类型
      const bookingType = this._getBookingType(advanceDays);

      // 5. 计算价格系数
      let multiplier = 1.0;

      // 入住率系数
      if (occupancy < this.config.occupancyThresholds.low) {
        multiplier *= this.config.priceMultipliers.lowOccupancy;
      } else if (occupancy >= this.config.occupancyThresholds.high) {
        multiplier *= this.config.priceMultipliers.highOccupancy;
      } else {
        multiplier *= this.config.priceMultipliers.mediumOccupancy;
      }

      // 周末系数
      if (isWeekend) {
        multiplier *= this.config.priceMultipliers.weekend;
      }

      // 节假日系数
      if (isHoliday) {
        multiplier *= this.config.priceMultipliers.holiday;
      }

      // 预订提前期系数
      if (bookingType === 'lastMinute') {
        multiplier *= this.config.priceMultipliers.lastMinute;
      }

      // 6. 计算最终价格
      const finalPrice = Math.round(basePrice * multiplier);

      return {
        roomId,
        date,
        basePrice,
        occupancy,
        isWeekend,
        isHoliday,
        bookingType,
        multiplier: Math.round(multiplier * 100) / 100,
        finalPrice,
        factors: {
          occupancyRate: `${occupancy}%`,
          weekend: isWeekend ? '+20%' : '0%',
          holiday: isHoliday ? '+50%' : '0%',
          advanceBooking: bookingType === 'lastMinute' ? '-30%' : '0%'
        }
      };
    } catch (error) {
      console.error('[Pricing] Calculate smart price failed:', error.message);
      return {
        roomId,
        date,
        finalPrice: this.config.basePrice,
        error: error.message
      };
    }
  }

  /**
   * 批量计算未来N天的价格
   * @param {number} roomId - 房间ID
   * @param {number} days - 天数
   */
  calculateFuturePrices(roomId, days = 30) {
    const prices = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const price = this.calculateSmartPrice(roomId, dateStr, i);
      prices.push(price);
    }

    return prices;
  }

  /**
   * 计算指定日期的入住率
   * @param {string} date - 日期 (YYYY-MM-DD)
   */
  _calculateOccupancy(date) {
    try {
      // 获取总房间数
      const totalRooms = this.db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;

      // 获取已预订房间数
      const bookedRooms = this.db.prepare(`
        SELECT COUNT(*) as count FROM orders
        WHERE status IN ('confirmed', 'checked_in')
          AND check_in_date <= ?
          AND check_out_date > ?
      `).get(date, date).count;

      return totalRooms > 0 ? Math.round((bookedRooms / totalRooms) * 100) : 0;
    } catch (error) {
      console.error('[Pricing] Calculate occupancy failed:', error.message);
      return 50; // 默认50%
    }
  }

  /**
   * 判断是否周末
   * @param {string} date - 日期 (YYYY-MM-DD)
   */
  _isWeekend(date) {
    const d = new Date(date);
    const day = d.getDay();
    return day === 0 || day === 6; // 0=Sunday, 6=Saturday
  }

  /**
   * 判断是否节假日
   * @param {string} date - 日期 (YYYY-MM-DD)
   */
  _isHoliday(date) {
    // TODO: 接入节假日API或配置节假日列表
    // 示例: 中国法定节假日
    const holidays = [
      '2026-01-01', // 元旦
      '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-02-21', // 春节
      '2026-04-04', '2026-04-05', '2026-04-06', // 清明节
      '2026-05-01', '2026-05-02', '2026-05-03', // 劳动节
      '2026-06-22', '2026-06-23', '2026-06-24', // 端午节
      '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', // 国庆节
      '2026-10-05', '2026-10-06', '2026-10-07'
    ];

    return holidays.includes(date);
  }

  /**
   * 判断预订类型 (提前预订/标准/最后一刻)
   * @param {number} advanceDays - 提前天数
   */
  _getBookingType(advanceDays) {
    if (advanceDays >= this.config.advanceBookingDays.earlyBird) {
      return 'earlyBird';
    } else if (advanceDays >= this.config.advanceBookingDays.standard) {
      return 'standard';
    } else {
      return 'lastMinute';
    }
  }

  /**
   * 获取历史价格趋势
   * @param {number} roomId - 房间ID
   * @param {number} days - 过去天数
   */
  getHistoricalTrend(roomId, days = 30) {
    try {
      const results = this.db.prepare(`
        SELECT 
          DATE(created_at) as date,
          AVG(total_price / (julianday(check_out_date) - julianday(check_in_date))) as avg_daily_price,
          COUNT(*) as bookings
        FROM orders
        WHERE room_id = ?
          AND status IN ('confirmed', 'checked_in', 'checked_out')
          AND created_at >= datetime('now', '-' || ? || ' days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `).all(roomId, days);

      return results;
    } catch (error) {
      console.error('[Pricing] Get historical trend failed:', error.message);
      return [];
    }
  }

  /**
   * 推荐最佳价格 (基于历史数据和竞品分析)
   * @param {number} roomId - 房间ID
   * @param {string} date - 日期
   */
  recommendPrice(roomId, date) {
    try {
      // 1. 获取智能定价
      const smartPrice = this.calculateSmartPrice(roomId, date);

      // 2. 获取历史同期价格
      const historicalAvg = this._getHistoricalAveragePrice(roomId, date);

      // 3. 获取竞品价格 (TODO: 接入竞品数据源)
      const competitorAvg = this._getCompetitorAveragePrice(roomId, date);

      // 4. 综合推荐
      const prices = [smartPrice.finalPrice, historicalAvg, competitorAvg].filter(p => p > 0);
      const recommendedPrice = prices.length > 0 
        ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        : smartPrice.finalPrice;

      return {
        recommended: recommendedPrice,
        smartPrice: smartPrice.finalPrice,
        historicalAvg,
        competitorAvg,
        confidence: this._calculateConfidence(prices)
      };
    } catch (error) {
      console.error('[Pricing] Recommend price failed:', error.message);
      return {
        recommended: this.config.basePrice,
        error: error.message
      };
    }
  }

  _getHistoricalAveragePrice(roomId, date) {
    try {
      // 获取去年同期价格
      const lastYear = new Date(date);
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      const lastYearDate = lastYear.toISOString().split('T')[0];

      const result = this.db.prepare(`
        SELECT AVG(total_price / (julianday(check_out_date) - julianday(check_in_date))) as avg_price
        FROM orders
        WHERE room_id = ?
          AND DATE(check_in_date) = ?
          AND status IN ('confirmed', 'checked_in', 'checked_out')
      `).get(roomId, lastYearDate);

      return result?.avg_price ? Math.round(result.avg_price) : 0;
    } catch (error) {
      return 0;
    }
  }

  _getCompetitorAveragePrice(roomId, date) {
    // TODO: 接入携程/美团/Booking等平台的竞品价格API
    // 目前返回0表示无数据
    return 0;
  }

  _calculateConfidence(prices) {
    if (prices.length < 2) return 'low';
    
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    
    const cv = stdDev / avg; // 变异系数
    
    if (cv < 0.1) return 'high';
    if (cv < 0.2) return 'medium';
    return 'low';
  }
}

module.exports = PricingService;
