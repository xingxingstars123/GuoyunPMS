/**
 * 智能定价服务
 * 功能: 动态调价/价格日历/策略管理
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database/pms.db');

class PricingService {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
  }
  
  /**
   * 计算最终价格
   */
  async calculatePrice(roomId, checkInDate, checkOutDate) {
    return new Promise(async (resolve, reject) => {
      try {
        const basePrice = await this.getBasePrice(roomId);
        const days = this.getDaysBetween(checkInDate, checkOutDate);
        const strategy = await this.getActiveStrategy();
        
        let totalPrice = 0;
        
        for (let i = 0; i < days; i++) {
          const date = this.addDays(checkInDate, i);
          const multipliers = await this.getMultipliers(date, strategy);
          const dayPrice = basePrice * this.applyMultipliers(multipliers);
          totalPrice += dayPrice;
        }
        
        // 提前预订折扣
        const earlyDiscount = this.getEarlyBookingDiscount(checkInDate, strategy);
        totalPrice *= (1 - earlyDiscount);
        
        // 连住折扣
        const stayDiscount = this.getStayDiscount(days, strategy);
        totalPrice *= (1 - stayDiscount);
        
        resolve(Math.round(totalPrice));
      } catch (err) {
        reject(err);
      }
    });
  }
  
  /**
   * 获取房间基准价
   */
  getBasePrice(roomId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT price FROM rooms WHERE id = ?', [roomId], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.price : 0);
      });
    });
  }
  
  /**
   * 获取活跃策略
   */
  getActiveStrategy() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM pricing_strategies WHERE is_active = 1', (err, row) => {
        if (err) reject(err);
        else resolve(row || {
          holiday_multiplier: 1.0,
          weekend_multiplier: 1.0,
          high_season_multiplier: 1.0,
          low_season_multiplier: 1.0,
          occupancy_high_multiplier: 1.0,
          occupancy_low_multiplier: 1.0,
          early_booking_7days_discount: 0,
          early_booking_30days_discount: 0,
          stay_3days_discount: 0,
          stay_7days_discount: 0
        });
      });
    });
  }
  
  /**
   * 获取价格系数
   */
  async getMultipliers(date, strategy) {
    const isHoliday = this.isHoliday(date);
    const isWeekend = this.isWeekend(date);
    const season = this.getSeason(date);
    
    return {
      holiday: isHoliday ? strategy.holiday_multiplier : 1.0,
      weekend: isWeekend ? strategy.weekend_multiplier : 1.0,
      season: season === 'high' ? strategy.high_season_multiplier : 
              season === 'low' ? strategy.low_season_multiplier : 1.0
    };
  }
  
  /**
   * 应用系数
   */
  applyMultipliers(multipliers) {
    return Object.values(multipliers).reduce((acc, val) => acc * val, 1.0);
  }
  
  /**
   * 获取提前预订折扣
   */
  getEarlyBookingDiscount(checkInDate, strategy) {
    const daysAhead = this.getDaysBetween(new Date(), checkInDate);
    if (daysAhead >= 30) return strategy.early_booking_30days_discount || 0;
    if (daysAhead >= 7) return strategy.early_booking_7days_discount || 0;
    return 0;
  }
  
  /**
   * 获取连住折扣
   */
  getStayDiscount(days, strategy) {
    if (days >= 7) return strategy.stay_7days_discount || 0;
    if (days >= 3) return strategy.stay_3days_discount || 0;
    return 0;
  }
  
  /**
   * 生成价格日历
   */
  async generatePriceCalendar(roomId, days = 30) {
    const calendar = [];
    const basePrice = await this.getBasePrice(roomId);
    const strategy = await this.getActiveStrategy();
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = this.addDays(today, i);
      const dateStr = this.formatDate(date);
      const nextDay = this.addDays(date, 1);
      const price = await this.calculatePrice(roomId, dateStr, this.formatDate(nextDay));
      
      calendar.push({
        date: dateStr,
        basePrice,
        finalPrice: price,
        isHoliday: this.isHoliday(date),
        isWeekend: this.isWeekend(date)
      });
    }
    
    return calendar;
  }
  
  // ============ 工具方法 ============
  
  isHoliday(date) {
    // 简化版:国庆/春节/五一
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    
    return (month === 10 && day <= 7) ||       // 国庆
           (month === 5 && day <= 3) ||         // 五一
           (month === 1 && day <= 7);           // 春节(简化)
  }
  
  isWeekend(date) {
    const d = new Date(date);
    const dayOfWeek = d.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }
  
  getSeason(date) {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    
    // 旺季: 7-8月(暑假) + 10月(国庆) + 1-2月(春节)
    if ([7, 8, 10, 1, 2].includes(month)) return 'high';
    
    // 淡季: 3-4月 + 11-12月
    if ([3, 4, 11, 12].includes(month)) return 'low';
    
    return 'normal';
  }
  
  getDaysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  
  formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

module.exports = PricingService;
