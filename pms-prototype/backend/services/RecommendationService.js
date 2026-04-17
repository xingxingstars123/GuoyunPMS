const { db } = require('../database');

class RecommendationService {
  /**
   * 智能推荐房间
   * @param {Object} params - 推荐参数
   * @param {string} params.checkIn - 入住日期
   * @param {string} params.checkOut - 退房日期
   * @param {string} params.roomType - 房型偏好(可选)
   * @param {number} params.maxPrice - 最高价格(可选)
   * @param {string} params.floor - 楼层偏好(可选): 'low', 'high'
   * @param {string} params.orientation - 朝向偏好(可选): 'south', 'north', 'east', 'west'
   * @param {number} params.customerId - 客户ID(用于历史偏好分析)
   * @returns {Array} 推荐房间列表(按推荐度排序)
   */
  static recommendRooms(params) {
    const { checkIn, checkOut, roomType, maxPrice, floor, orientation, customerId } = params;
    
    // 1. 获取所有可用房间
    const availableRooms = this.getAvailableRooms(checkIn, checkOut);
    
    // 2. 获取客户历史偏好
    const customerPreference = customerId ? this.getCustomerPreference(customerId) : null;
    
    // 3. 计算每个房间的推荐分数
    const scoredRooms = availableRooms.map(room => {
      let score = 100; // 基础分
      const reasons = [];
      
      // 房型匹配 (+30分)
      if (roomType && room.room_type === roomType) {
        score += 30;
        reasons.push('房型匹配');
      } else if (customerPreference && room.room_type === customerPreference.preferredRoomType) {
        score += 20;
        reasons.push('符合历史偏好');
      }
      
      // 价格匹配 (+20分)
      if (maxPrice) {
        if (room.price <= maxPrice * 0.7) {
          score += 20;
          reasons.push('价格优惠');
        } else if (room.price <= maxPrice) {
          score += 10;
          reasons.push('价格合适');
        } else {
          score -= 30; // 超出预算严重扣分
          reasons.push('超出预算');
        }
      }
      
      // 楼层偏好 (+15分)
      const roomFloor = this.extractFloor(room.room_number);
      if (floor === 'high' && roomFloor >= 5) {
        score += 15;
        reasons.push('高楼层');
      } else if (floor === 'low' && roomFloor <= 3) {
        score += 15;
        reasons.push('低楼层');
      }
      
      // 朝向偏好 (+15分)
      if (orientation && room.orientation === orientation) {
        score += 15;
        reasons.push(`${this.getOrientationName(orientation)}朝向`);
      }
      
      // 房间评分历史 (+20分)
      if (room.avg_rating) {
        score += Math.min(room.avg_rating * 4, 20); // 最高5分评价 -> +20分
        if (room.avg_rating >= 4.5) {
          reasons.push('高评分房间');
        }
      }
      
      // 热门房间 (+10分)
      if (room.booking_count > 10) {
        score += 10;
        reasons.push('热门房间');
      }
      
      // 新房间激励 (+5分)
      if (room.booking_count < 3) {
        score += 5;
        reasons.push('新房推荐');
      }
      
      // 设施完善度 (+10分)
      const facilities = room.facilities ? room.facilities.split(',').length : 0;
      if (facilities >= 5) {
        score += 10;
        reasons.push('设施完善');
      }
      
      return {
        ...room,
        recommendScore: Math.max(0, score),
        recommendReasons: reasons
      };
    });
    
    // 4. 按推荐分数排序
    scoredRooms.sort((a, b) => b.recommendScore - a.recommendScore);
    
    // 5. 返回前10个推荐
    return scoredRooms.slice(0, 10);
  }
  
  /**
   * 获取可用房间
   */
  static getAvailableRooms(checkIn, checkOut) {
    // 查询指定日期范围内可用的房间
    const occupiedRoomIds = db.prepare(`
      SELECT DISTINCT room_id
      FROM room_occupancy
      WHERE date BETWEEN ? AND ?
        AND status != 'available'
    `).all(checkIn, checkOut).map(r => r.room_id);
    
    let sql = `
      SELECT 
        r.*,
        COUNT(DISTINCT o.id) as booking_count,
        0 as avg_rating
      FROM rooms r
      LEFT JOIN orders o ON r.id = o.room_id
      WHERE r.status = 'available'
    `;
    
    if (occupiedRoomIds.length > 0) {
      sql += ` AND r.id NOT IN (${occupiedRoomIds.join(',')})`;
    }
    
    sql += ` GROUP BY r.id ORDER BY r.room_number`;
    
    return db.prepare(sql).all();
  }
  
  /**
   * 获取客户历史偏好
   */
  static getCustomerPreference(customerId) {
    // 分析客户历史订单,找出偏好
    const history = db.prepare(`
      SELECT 
        r.room_type,
        r.orientation,
        COUNT(*) as count
      FROM orders o
      LEFT JOIN rooms r ON o.room_id = r.id
      WHERE o.customer_id = ? AND o.status != 'cancelled'
      GROUP BY r.room_type, r.orientation
      ORDER BY count DESC
      LIMIT 1
    `).get(customerId);
    
    return history ? {
      preferredRoomType: history.room_type,
      preferredOrientation: history.orientation
    } : null;
  }
  
  /**
   * 从房间号提取楼层
   */
  static extractFloor(roomNumber) {
    const match = roomNumber.match(/^(\d+)/);
    return match ? parseInt(match[1][0]) : 1;
  }
  
  /**
   * 获取朝向中文名
   */
  static getOrientationName(orientation) {
    const map = {
      south: '南',
      north: '北',
      east: '东',
      west: '西'
    };
    return map[orientation] || orientation;
  }
  
  /**
   * 记录推荐结果(用于优化算法)
   */
  static logRecommendation(customerId, roomId, recommended, selected) {
    // 记录推荐日志,用于后续算法优化
    console.log(`推荐日志: 客户${customerId}, 推荐房间${roomId}, 是否选择:${selected}`);
    // 可以存入数据库进行后续分析
  }
}

module.exports = RecommendationService;
