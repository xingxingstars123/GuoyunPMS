const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../database/pms.db'));

console.log('🎯 开始添加测试数据...\n');

// 测试数据
const testData = {
  rooms: [
    { room_number: '101', room_type: '标准间', price: 288, status: 'available' },
    { room_number: '102', room_type: '标准间', price: 288, status: 'occupied' },
    { room_number: '201', room_type: '大床房', price: 388, status: 'available' },
    { room_number: '202', room_type: '大床房', price: 388, status: 'maintenance' },
    { room_number: '301', room_type: '套房', price: 588, status: 'available' },
    { room_number: '302', room_type: '套房', price: 588, status: 'occupied' },
    { room_number: '303', room_type: '套房', price: 588, status: 'available' },
    { room_number: '401', room_type: '豪华套房', price: 888, status: 'available' }
  ],
  
  customers: [
    { name: '张三', phone: '13800138001', channel: 'ctrip', id_card: '110101199001011234' },
    { name: '李四', phone: '13800138002', channel: 'meituan', id_card: '110101199002021234' },
    { name: '王五', phone: '13800138003', channel: 'fliggy', id_card: '110101199003031234' },
    { name: '赵六', phone: '13800138004', channel: 'booking', id_card: '110101199004041234' },
    { name: '钱七', phone: '13800138005', channel: 'direct', id_card: '110101199005051234' },
    { name: '孙八', phone: '13800138006', channel: 'ctrip', id_card: '110101199006061234' },
    { name: '周九', phone: '13800138007', channel: 'meituan', id_card: '110101199007071234' },
    { name: '吴十', phone: '13800138008', channel: 'fliggy', id_card: '110101199008081234' }
  ],
  
  orders: [
    {
      customer_id: 1,
      room_id: 2,
      check_in_date: '2026-04-17',
      check_out_date: '2026-04-20',
      total_price: 864,
      status: 'checked_in',
      payment_status: 'paid'
    },
    {
      customer_id: 2,
      room_id: 6,
      check_in_date: '2026-04-16',
      check_out_date: '2026-04-19',
      total_price: 1764,
      status: 'checked_in',
      payment_status: 'paid'
    },
    {
      customer_id: 3,
      room_id: 1,
      check_in_date: '2026-04-19',
      check_out_date: '2026-04-21',
      total_price: 576,
      status: 'confirmed',
      payment_status: 'pending'
    },
    {
      customer_id: 4,
      room_id: 3,
      check_in_date: '2026-04-18',
      check_out_date: '2026-04-22',
      total_price: 1552,
      status: 'confirmed',
      payment_status: 'deposit'
    },
    {
      customer_id: 5,
      room_id: 5,
      check_in_date: '2026-04-15',
      check_out_date: '2026-04-18',
      total_price: 1764,
      status: 'checked_out',
      payment_status: 'paid'
    }
  ],
  
  cleaning_tasks: [
    { room_id: 1, task_type: 'checkout', status: 'pending', scheduled_time: '2026-04-18 10:00:00', assigned_to: '保洁员A' },
    { room_id: 2, task_type: 'daily', status: 'in_progress', scheduled_time: '2026-04-18 14:00:00', assigned_to: '保洁员B' },
    { room_id: 3, task_type: 'checkout', status: 'completed', scheduled_time: '2026-04-17 11:00:00', assigned_to: '保洁员A', completed_time: '2026-04-17 12:30:00' },
    { room_id: 4, task_type: 'maintenance', status: 'pending', scheduled_time: '2026-04-19 09:00:00', assigned_to: '维修员C' }
  ],
  
  financial_records: [
    { order_id: 1, amount: 864, type: 'payment', payment_method: 'wechat', transaction_date: '2026-04-17 15:00:00' },
    { order_id: 2, amount: 1764, type: 'payment', payment_method: 'alipay', transaction_date: '2026-04-16 14:30:00' },
    { order_id: 4, amount: 300, type: 'deposit', payment_method: 'cash', transaction_date: '2026-04-17 10:00:00' },
    { order_id: 5, amount: 1764, type: 'payment', payment_method: 'card', transaction_date: '2026-04-15 16:00:00' }
  ]
};

// 清空现有测试数据
db.serialize(() => {
  console.log('📋 清理旧数据...');
  db.run('DELETE FROM financial_records');
  db.run('DELETE FROM cleaning_tasks');
  db.run('DELETE FROM room_occupancy');
  db.run('DELETE FROM orders');
  db.run('DELETE FROM customers');
  db.run('DELETE FROM rooms');
  
  console.log('✅ 旧数据已清理\n');
  
  // 插入房间
  console.log('🏠 添加房间数据...');
  const roomStmt = db.prepare('INSERT INTO rooms (room_number, room_type, price, status) VALUES (?, ?, ?, ?)');
  testData.rooms.forEach(room => {
    roomStmt.run(room.room_number, room.room_type, room.price, room.status);
  });
  roomStmt.finalize();
  console.log(`✅ 已添加 ${testData.rooms.length} 个房间\n`);
  
  // 插入客户
  console.log('👥 添加客户数据...');
  const customerStmt = db.prepare('INSERT INTO customers (name, phone, channel, id_card) VALUES (?, ?, ?, ?)');
  testData.customers.forEach(customer => {
    customerStmt.run(customer.name, customer.phone, customer.channel, customer.id_card);
  });
  customerStmt.finalize();
  console.log(`✅ 已添加 ${testData.customers.length} 个客户\n`);
  
  // 插入订单
  console.log('📋 添加订单数据...');
  const orderStmt = db.prepare('INSERT INTO orders (customer_id, room_id, check_in_date, check_out_date, total_price, status, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  testData.orders.forEach(order => {
    orderStmt.run(order.customer_id, order.room_id, order.check_in_date, order.check_out_date, order.total_price, order.status, order.payment_status);
  });
  orderStmt.finalize();
  console.log(`✅ 已添加 ${testData.orders.length} 个订单\n`);
  
  // 插入清洁任务
  console.log('🧹 添加清洁任务数据...');
  const cleaningStmt = db.prepare('INSERT INTO cleaning_tasks (room_id, task_type, status, scheduled_time, assigned_to, completed_time) VALUES (?, ?, ?, ?, ?, ?)');
  testData.cleaning_tasks.forEach(task => {
    cleaningStmt.run(task.room_id, task.task_type, task.status, task.scheduled_time, task.assigned_to, task.completed_time || null);
  });
  cleaningStmt.finalize();
  console.log(`✅ 已添加 ${testData.cleaning_tasks.length} 个清洁任务\n`);
  
  // 插入财务记录
  console.log('💰 添加财务数据...');
  const financialStmt = db.prepare('INSERT INTO financial_records (order_id, amount, type, payment_method, transaction_date) VALUES (?, ?, ?, ?, ?)');
  testData.financial_records.forEach(record => {
    financialStmt.run(record.order_id, record.amount, record.type, record.payment_method, record.transaction_date);
  });
  financialStmt.finalize();
  console.log(`✅ 已添加 ${testData.financial_records.length} 条财务记录\n`);
  
  // 生成房态数据
  console.log('📅 生成房态日历数据...');
  const occupancyStmt = db.prepare('INSERT INTO room_occupancy (room_id, date, status) VALUES (?, ?, ?)');
  
  // 为每个房间生成未来30天的房态
  const today = new Date('2026-04-18');
  for (let roomId = 1; roomId <= 8; roomId++) {
    for (let day = 0; day < 30; day++) {
      const date = new Date(today);
      date.setDate(today.getDate() + day);
      const dateStr = date.toISOString().split('T')[0];
      
      // 根据订单设置房态
      let status = 'available';
      if (roomId === 2 && day < 3) status = 'booked'; // 102房间前3天已订
      if (roomId === 6 && day < 2) status = 'booked'; // 302房间前2天已订
      if (roomId === 1 && day >= 1 && day < 3) status = 'booked'; // 101房间19-21已订
      if (roomId === 3 && day >= 0 && day < 4) status = 'booked'; // 201房间18-22已订
      if (roomId === 4) status = 'maintenance'; // 202房间维修中
      
      occupancyStmt.run(roomId, dateStr, status);
    }
  }
  occupancyStmt.finalize();
  console.log('✅ 已生成30天房态数据\n');
  
  console.log('🎉 测试数据添加完成!\n');
  console.log('📊 数据统计:');
  console.log(`   - 房间: ${testData.rooms.length} 个`);
  console.log(`   - 客户: ${testData.customers.length} 人`);
  console.log(`   - 订单: ${testData.orders.length} 个`);
  console.log(`   - 清洁任务: ${testData.cleaning_tasks.length} 个`);
  console.log(`   - 财务记录: ${testData.financial_records.length} 条`);
  console.log(`   - 房态记录: ${8 * 30} 条\n`);
  
  db.close(() => {
    console.log('✅ 数据库连接已关闭');
  });
});
