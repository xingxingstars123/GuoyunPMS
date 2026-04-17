/**
 * 数据库测试数据生成脚本
 * 生成50+客户/30+订单/20+清洁任务的丰富测试数据
 */

const Database = require('../backend/node_modules/better-sqlite3');
const path = require('path');
const dayjs = require('../backend/node_modules/dayjs');

const db = new Database(path.join(__dirname, '../database/pms.db'));

// 中国真实姓名库
const surnames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'];
const givenNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞', '平', '刚', '桂英'];

// 房型配置
const roomTypes = [
  { type: '大床房', basePrice: 299, count: 4 },
  { type: '标准间', basePrice: 259, count: 4 },
  { type: '豪华套房', basePrice: 499, count: 2 },
  { type: '家庭房', basePrice: 399, count: 1 }
];

// 渠道配置
const channels = [
  { name: '携程', code: 'ctrip', rate: 0.15, weight: 30 },
  { name: '美团', code: 'meituan', rate: 0.12, weight: 25 },
  { name: '飞猪', code: 'fliggy', rate: 0.10, weight: 15 },
  { name: 'Booking.com', code: 'booking', rate: 0.18, weight: 10 },
  { name: '爱彼迎', code: 'airbnb', rate: 0.14, weight: 8 },
  { name: '去哪儿', code: 'qunar', rate: 0.13, weight: 5 },
  { name: '小红书', code: 'xiaohongshu', rate: 0.08, weight: 3 },
  { name: '直销', code: 'direct', rate: 0, weight: 4 }
];

// 清洁员工
const cleaners = ['张阿姨', '李师傅', '王小梅', '赵大姐'];

// 工具函数
function randomName() {
  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  const givenName1 = givenNames[Math.floor(Math.random() * givenNames.length)];
  const givenName2 = Math.random() > 0.5 ? givenNames[Math.floor(Math.random() * givenNames.length)] : '';
  return surname + givenName1 + givenName2;
}

function randomPhone() {
  const prefixes = ['138', '139', '188', '186', '159', '158', '152', '150'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  return prefix + suffix;
}

function randomIdCard() {
  const prefix = '31010619';
  const year = String(1970 + Math.floor(Math.random() * 35));
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return prefix + year + month + day + suffix;
}

function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  
  return items[items.length - 1];
}

function randomDate(start, end) {
  const startTime = start.getTime();
  const endTime = end.getTime();
  return new Date(startTime + Math.random() * (endTime - startTime));
}

// 清空现有数据
function clearDatabase() {
  console.log('🗑️  清空现有数据...');
  
  db.exec('DELETE FROM financial_records');
  db.exec('DELETE FROM cleaning_tasks');
  db.exec('DELETE FROM room_occupancy');
  db.exec('DELETE FROM orders');
  db.exec('DELETE FROM customers');
  db.exec('DELETE FROM rooms');
  db.exec('DELETE FROM properties');
  db.exec('DELETE FROM channels');
  
  // 重置自增ID
  db.exec("DELETE FROM sqlite_sequence");
  
  console.log('✅ 数据清空完成');
}

// 插入基础数据
function insertBaseData() {
  console.log('📦 插入基础数据...');
  
  // 插入房源
  const propertyStmt = db.prepare('INSERT INTO properties (name, address, total_rooms) VALUES (?, ?, ?)');
  const propertyId = propertyStmt.run('国韵民宿', '上海市浦东新区陆家嘴环路1000号', 11).lastInsertRowid;
  
  // 插入房间
  const roomStmt = db.prepare('INSERT INTO rooms (property_id, room_number, room_type, base_price, status) VALUES (?, ?, ?, ?, ?)');
  let roomId = 1;
  
  roomTypes.forEach(({ type, basePrice, count }) => {
    for (let i = 0; i < count; i++) {
      const roomNumber = String(roomId).padStart(2, '0') + '01';
      roomStmt.run(propertyId, roomNumber, type, basePrice, 'available');
      roomId++;
    }
  });
  
  // 插入渠道
  const channelStmt = db.prepare('INSERT INTO channels (name, code, enabled, commission_rate) VALUES (?, ?, 1, ?)');
  channels.forEach(({ name, code, rate }) => {
    channelStmt.run(name, code, rate);
  });
  
  console.log(`✅ 基础数据插入完成: 1个房源, ${roomId - 1}个房间, ${channels.length}个渠道`);
}

// 生成客户数据
function generateCustomers(count = 60) {
  console.log(`👥 生成${count}个客户...`);
  
  const customerStmt = db.prepare(`
    INSERT INTO customers (name, phone, id_card, channel, total_orders, total_spent)
    VALUES (?, ?, ?, ?, 0, 0)
  `);
  
  const customerIds = [];
  
  for (let i = 0; i < count; i++) {
    const channel = weightedRandom(channels);
    const result = customerStmt.run(
      randomName(),
      randomPhone(),
      randomIdCard(),
      channel.code
    );
    customerIds.push(result.lastInsertRowid);
  }
  
  console.log(`✅ 已生成${count}个客户`);
  return customerIds;
}

// 生成订单数据
function generateOrders(customerIds, count = 40) {
  console.log(`📋 生成${count}个订单...`);
  
  const orderStmt = db.prepare(`
    INSERT INTO orders (order_no, room_id, customer_id, channel, check_in, check_out, total_price, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const occupancyStmt = db.prepare(`
    INSERT OR IGNORE INTO room_occupancy (room_id, order_id, date, status, price)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const financialStmt = db.prepare(`
    INSERT INTO financial_records (order_id, type, category, amount, date, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const statuses = [
    { status: 'confirmed', weight: 30 },
    { status: 'checked_in', weight: 25 },
    { status: 'checked_out', weight: 20 },
    { status: 'pending', weight: 15 },
    { status: 'cancelled', weight: 10 }
  ];
  
  const orderIds = [];
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1); // 过去2个月
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 28); // 未来1个月
  
  for (let i = 0; i < count; i++) {
    const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
    const roomId = Math.floor(Math.random() * 11) + 1;
    const channel = weightedRandom(channels);
    const status = weightedRandom(statuses).status;
    
    // 生成入住/退房日期
    const checkIn = randomDate(startDate, endDate);
    const nights = Math.floor(Math.random() * 5) + 1; // 1-5晚
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + nights);
    
    // 获取房间价格
    const room = db.prepare('SELECT base_price FROM rooms WHERE id = ?').get(roomId);
    const totalPrice = room.base_price * nights * (1 + Math.random() * 0.3 - 0.15); // ±15% 浮动
    
    const orderNo = `ORD${dayjs(checkIn).format('YYYYMMDD')}${String(i).padStart(4, '0')}`;
    const createdAt = new Date(checkIn);
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 7)); // 提前0-7天下单
    
    // 插入订单
    const result = orderStmt.run(
      orderNo,
      roomId,
      customerId,
      channel.code,
      dayjs(checkIn).format('YYYY-MM-DD'),
      dayjs(checkOut).format('YYYY-MM-DD'),
      Math.round(totalPrice * 100) / 100,
      status,
      dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss')
    );
    
    const orderId = result.lastInsertRowid;
    orderIds.push({ id: orderId, roomId, checkIn, checkOut, status });
    
    // 插入房态数据
    if (status !== 'cancelled') {
      let currentDate = new Date(checkIn);
      while (currentDate < checkOut) {
        occupancyStmt.run(
          roomId,
          orderId,
          dayjs(currentDate).format('YYYY-MM-DD'),
          status === 'checked_out' ? 'available' : 'booked',
          Math.round(totalPrice / nights * 100) / 100
        );
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    // 插入财务记录
    if (status !== 'cancelled' && status !== 'pending') {
      financialStmt.run(
        orderId,
        'income',
        'room_fee',
        Math.round(totalPrice * 100) / 100,
        dayjs(checkIn).format('YYYY-MM-DD'),
        `订单 ${orderNo} 房费收入`
      );
      
      // 添加渠道佣金成本
      if (channel.rate > 0) {
        const commission = totalPrice * channel.rate;
        financialStmt.run(
          orderId,
          'expense',
          'commission',
          Math.round(commission * 100) / 100,
          dayjs(checkIn).format('YYYY-MM-DD'),
          `订单 ${orderNo} ${channel.name}佣金`
        );
      }
    }
  }
  
  console.log(`✅ 已生成${count}个订单`);
  return orderIds;
}

// 生成清洁任务
function generateCleaningTasks(orderIds, count = 30) {
  console.log(`🧹 生成${count}个清洁任务...`);
  
  const taskStmt = db.prepare(`
    INSERT INTO cleaning_tasks (room_id, assigned_to, status, scheduled_time, completed_time, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const taskStatuses = [
    { status: 'pending', weight: 20 },
    { status: 'in_progress', weight: 15 },
    { status: 'completed', weight: 65 }
  ];
  
  const taskTypes = [
    '退房清洁',
    '日常保洁',
    '深度清洁',
    '应急清洁',
    '入住准备'
  ];
  
  for (let i = 0; i < count; i++) {
    const order = orderIds[Math.floor(Math.random() * orderIds.length)];
    const cleaner = cleaners[Math.floor(Math.random() * cleaners.length)];
    const status = weightedRandom(taskStatuses).status;
    const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    
    // 清洁时间通常在退房后
    const scheduledTime = new Date(order.checkOut);
    scheduledTime.setHours(14, 0, 0); // 下午2点
    
    let completedTime = null;
    if (status === 'completed') {
      completedTime = new Date(scheduledTime);
      completedTime.setMinutes(completedTime.getMinutes() + Math.floor(Math.random() * 120) + 30); // 30-150分钟后完成
    }
    
    taskStmt.run(
      order.roomId,
      cleaner,
      status,
      dayjs(scheduledTime).format('YYYY-MM-DD HH:mm:ss'),
      completedTime ? dayjs(completedTime).format('YYYY-MM-DD HH:mm:ss') : null,
      `${taskType} - ${order.status === 'checked_out' ? '退房' : '日常'}清洁`
    );
  }
  
  console.log(`✅ 已生成${count}个清洁任务`);
}

// 更新客户统计
function updateCustomerStats() {
  console.log('📊 更新客户统计...');
  
  db.exec(`
    UPDATE customers
    SET 
      total_orders = (
        SELECT COUNT(*) 
        FROM orders 
        WHERE customer_id = customers.id 
          AND status != 'cancelled'
      ),
      total_spent = (
        SELECT COALESCE(SUM(total_price), 0) 
        FROM orders 
        WHERE customer_id = customers.id 
          AND status != 'cancelled'
      )
  `);
  
  console.log('✅ 客户统计更新完成');
}

// 主执行函数
function main() {
  console.log('\n🚀 开始生成测试数据...\n');
  
  const startTime = Date.now();
  
  try {
    clearDatabase();
    insertBaseData();
    
    const customerIds = generateCustomers(60);
    const orderIds = generateOrders(customerIds, 40);
    generateCleaningTasks(orderIds, 30);
    
    updateCustomerStats();
    
    // 统计信息
    const stats = {
      properties: db.prepare('SELECT COUNT(*) as count FROM properties').get().count,
      rooms: db.prepare('SELECT COUNT(*) as count FROM rooms').get().count,
      customers: db.prepare('SELECT COUNT(*) as count FROM customers').get().count,
      orders: db.prepare('SELECT COUNT(*) as count FROM orders').get().count,
      cleaningTasks: db.prepare('SELECT COUNT(*) as count FROM cleaning_tasks').get().count,
      financialRecords: db.prepare('SELECT COUNT(*) as count FROM financial_records').get().count
    };
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n✅ 测试数据生成完成!');
    console.log('\n📊 数据统计:');
    console.log(`   - 房源: ${stats.properties}`);
    console.log(`   - 房间: ${stats.rooms}`);
    console.log(`   - 客户: ${stats.customers}`);
    console.log(`   - 订单: ${stats.orders}`);
    console.log(`   - 清洁任务: ${stats.cleaningTasks}`);
    console.log(`   - 财务记录: ${stats.financialRecords}`);
    console.log(`\n⏱️  耗时: ${elapsed}秒\n`);
    
  } catch (error) {
    console.error('❌ 生成失败:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { main };
