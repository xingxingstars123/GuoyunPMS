/**
 * 订单服务层
 * 分离业务逻辑
 */

const { db } = require('../database');
const dayjs = require('dayjs');
const { BusinessError, ErrorCodes } = require('../middleware/errorHandler');

class OrderService {
  /**
   * 获取订单列表
   */
  static getOrders(filters = {}) {
    const { channel, status, date, limit = 50, offset = 0 } = filters;
    
    let sql = `
      SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.channel as customer_channel,
        r.room_number,
        r.room_type
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN rooms r ON o.room_id = r.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (channel) {
      sql += ' AND o.channel = ?';
      params.push(channel);
    }
    
    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }
    
    if (date) {
      sql += ' AND DATE(o.check_in) = ?';
      params.push(date);
    }
    
    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    return db.prepare(sql).all(...params);
  }
  
  /**
   * 获取单个订单详情
   */
  static getOrderById(orderId) {
    const order = db.prepare(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.id_card as customer_id_card,
        r.room_number,
        r.room_type,
        r.base_price
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN rooms r ON o.room_id = r.id
      WHERE o.id = ?
    `).get(orderId);
    
    if (!order) {
      throw new BusinessError(ErrorCodes.NOT_FOUND, '订单不存在');
    }
    
    return order;
  }
  
  /**
   * 创建订单
   */
  static createOrder(orderData) {
    const { roomId, customerName, customerPhone, channel, checkIn, checkOut, totalPrice } = orderData;
    
    // 1. 验证日期
    if (dayjs(checkOut).isBefore(checkIn) || dayjs(checkOut).isSame(checkIn)) {
      throw new BusinessError(ErrorCodes.INVALID_PARAMS, '退房日期必须晚于入住日期');
    }
    
    // 2. 检查房间存在性
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    if (!room) {
      throw new BusinessError(ErrorCodes.NOT_FOUND, '房间不存在');
    }
    
    // 3. 检查房间可用性
    const conflict = db.prepare(`
      SELECT COUNT(*) as count
      FROM room_occupancy
      WHERE room_id = ? 
        AND date >= ? 
        AND date < ? 
        AND status != 'available'
    `).get(roomId, checkIn, checkOut);
    
    if (conflict.count > 0) {
      throw new BusinessError(ErrorCodes.ROOM_NOT_AVAILABLE, '房间在所选日期已被预订');
    }
    
    // 4. 创建或获取客户
    let customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(customerPhone);
    
    if (!customer) {
      const insertCustomer = db.prepare(
        'INSERT INTO customers (name, phone, channel, total_orders, total_spent) VALUES (?, ?, ?, 0, 0)'
      );
      const result = insertCustomer.run(customerName, customerPhone, channel);
      customer = { id: result.lastInsertRowid };
    }
    
    // 5. 生成订单号
    const orderNo = `ORD${dayjs().format('YYYYMMDDHHmmss')}${Math.floor(Math.random() * 1000)}`;
    
    // 6. 创建订单(使用事务)
    const transaction = db.transaction(() => {
      // 插入订单
      const insertOrder = db.prepare(`
        INSERT INTO orders (order_no, room_id, customer_id, channel, check_in, check_out, total_price, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')
      `);
      
      const orderResult = insertOrder.run(
        orderNo, roomId, customer.id, channel, checkIn, checkOut, totalPrice
      );
      
      const orderId = orderResult.lastInsertRowid;
      
      // 锁定房间
      const nights = dayjs(checkOut).diff(dayjs(checkIn), 'day');
      const pricePerNight = totalPrice / nights;
      
      const insertOccupancy = db.prepare(`
        INSERT INTO room_occupancy (room_id, order_id, date, status, price)
        VALUES (?, ?, ?, 'booked', ?)
      `);
      
      let currentDate = dayjs(checkIn);
      const endDate = dayjs(checkOut);
      
      while (currentDate.isBefore(endDate)) {
        insertOccupancy.run(roomId, orderId, currentDate.format('YYYY-MM-DD'), pricePerNight);
        currentDate = currentDate.add(1, 'day');
      }
      
      // 记录财务收入
      db.prepare(`
        INSERT INTO financial_records (order_id, type, category, amount, date, description)
        VALUES (?, 'income', 'room_fee', ?, ?, ?)
      `).run(orderId, totalPrice, checkIn, `订单 ${orderNo} 房费收入`);
      
      // 如果有佣金,记录成本
      const channelInfo = db.prepare('SELECT commission_rate FROM channels WHERE code = ?').get(channel);
      if (channelInfo && channelInfo.commission_rate > 0) {
        const commission = totalPrice * channelInfo.commission_rate;
        db.prepare(`
          INSERT INTO financial_records (order_id, type, category, amount, date, description)
          VALUES (?, 'expense', 'commission', ?, ?, ?)
        `).run(orderId, commission, checkIn, `订单 ${orderNo} 渠道佣金`);
      }
      
      return { orderId, orderNo };
    });
    
    return transaction();
  }
  
  /**
   * 更新订单状态
   */
  static updateOrderStatus(orderId, newStatus) {
    const validStatuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];
    
    if (!validStatuses.includes(newStatus)) {
      throw new BusinessError(ErrorCodes.INVALID_PARAMS, '无效的订单状态');
    }
    
    const order = this.getOrderById(orderId);
    
    // 更新订单状态
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(newStatus, orderId);
    
    // 如果是取消订单,释放房间
    if (newStatus === 'cancelled') {
      db.prepare('DELETE FROM room_occupancy WHERE order_id = ?').run(orderId);
    }
    
    return { orderId, oldStatus: order.status, newStatus };
  }
  
  /**
   * 获取订单统计
   */
  static getStatistics(date = null) {
    const targetDate = date || dayjs().format('YYYY-MM-DD');
    
    // 当日营收
    const revenue = db.prepare(`
      SELECT COALESCE(SUM(total_price), 0) as total
      FROM orders
      WHERE DATE(check_in) = ? AND status NOT IN ('cancelled', 'pending')
    `).get(targetDate);
    
    // 订单状态分布
    const statusStats = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE DATE(check_in) = ?
      GROUP BY status
    `).all(targetDate);
    
    return {
      date: targetDate,
      revenue: revenue.total,
      statusDistribution: statusStats.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {})
    };
  }
}

module.exports = OrderService;
