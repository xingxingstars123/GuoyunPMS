/**
 * 房间服务层
 */

const { db } = require('../database');
const dayjs = require('dayjs');

class RoomService {
  /**
   * 获取所有房间
   */
  static getAllRooms() {
    return db.prepare(`
      SELECT * FROM rooms ORDER BY room_number
    `).all();
  }
  
  /**
   * 获取房态日历
   */
  static getCalendar(startDate = null, endDate = null) {
    const start = startDate || dayjs().format('YYYY-MM-DD');
    const end = endDate || dayjs().add(30, 'day').format('YYYY-MM-DD');
    
    const rooms = this.getAllRooms();
    
    const occupancy = db.prepare(`
      SELECT 
        ro.*,
        o.order_no,
        o.status as order_status,
        c.name as customer_name
      FROM room_occupancy ro
      LEFT JOIN orders o ON ro.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE ro.date >= ? AND ro.date <= ?
      ORDER BY ro.date
    `).all(start, end);
    
    // 按房间组装数据
    const calendar = rooms.map(room => {
      const roomOccupancy = occupancy.filter(o => o.room_id === room.id);
      
      // 按日期分组
      const dateMap = {};
      roomOccupancy.forEach(occ => {
        dateMap[occ.date] = {
          status: occ.status,
          price: occ.price,
          orderNo: occ.order_no,
          orderStatus: occ.order_status,
          customerName: occ.customer_name
        };
      });
      
      return {
        ...room,
        occupancy: dateMap,
        dates: roomOccupancy.map(o => o.date)
      };
    });
    
    return {
      startDate: start,
      endDate: end,
      rooms: calendar
    };
  }
  
  /**
   * 获取可用房间
   */
  static getAvailableRooms(checkIn, checkOut) {
    const bookedRooms = db.prepare(`
      SELECT DISTINCT room_id
      FROM room_occupancy
      WHERE date >= ? AND date < ? AND status != 'available'
    `).all(checkIn, checkOut).map(r => r.room_id);
    
    if (bookedRooms.length === 0) {
      return this.getAllRooms();
    }
    
    return db.prepare(`
      SELECT * FROM rooms
      WHERE id NOT IN (${bookedRooms.join(',')})
      ORDER BY base_price
    `).all();
  }
  
  /**
   * 获取房间利用率统计
   */
  static getRoomUtilization(days = 30) {
    const startDate = dayjs().subtract(days, 'day').format('YYYY-MM-DD');
    const endDate = dayjs().format('YYYY-MM-DD');
    
    return db.prepare(`
      SELECT 
        r.id,
        r.room_number,
        r.room_type,
        COUNT(DISTINCT ro.date) as booked_days,
        ? as total_days,
        CAST(COUNT(DISTINCT ro.date) AS FLOAT) / ? * 100 as utilization_rate
      FROM rooms r
      LEFT JOIN room_occupancy ro ON r.id = ro.room_id
        AND ro.date >= ? AND ro.date < ?
        AND ro.status = 'booked'
      GROUP BY r.id
      ORDER BY utilization_rate DESC
    `).all(days, days, startDate, endDate);
  }
}

module.exports = RoomService;
