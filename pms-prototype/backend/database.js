const Database = require('better-sqlite3');
const path = require('path');

// 创建数据库连接
const db = new Database(path.join(__dirname, '../database/pms.db'));

// 初始化数据库表
function initDatabase() {
  // 房源表
  db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      total_rooms INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 房间表
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER,
      room_number TEXT NOT NULL,
      room_type TEXT,
      base_price REAL,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id)
    )
  `);

  // 客户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      id_card TEXT,
      channel TEXT,
      total_orders INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 订单表
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      room_id INTEGER,
      customer_id INTEGER,
      channel TEXT NOT NULL,
      check_in DATE,
      check_out DATE,
      total_price REAL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `);

  // 房态表（用于日历）
  db.exec(`
    CREATE TABLE IF NOT EXISTS room_occupancy (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER,
      order_id INTEGER,
      date DATE,
      status TEXT,
      price REAL,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      UNIQUE(room_id, date)
    )
  `);

  // 清洁任务表
  db.exec(`
    CREATE TABLE IF NOT EXISTS cleaning_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER,
      assigned_to TEXT,
      status TEXT DEFAULT 'pending',
      scheduled_time DATETIME,
      completed_time DATETIME,
      notes TEXT,
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    )
  `);

  // 财务记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS financial_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      type TEXT,
      category TEXT,
      amount REAL,
      date DATE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  // 渠道配置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      enabled INTEGER DEFAULT 1,
      commission_rate REAL DEFAULT 0,
      config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 插入默认数据
  insertDefaultData();

  console.log('✅ 数据库初始化完成');
}

function insertDefaultData() {
  // 检查是否已有数据
  const propertyCount = db.prepare('SELECT COUNT(*) as count FROM properties').get();
  if (propertyCount.count > 0) return;

  // 插入默认房源
  const property = db.prepare('INSERT INTO properties (name, address, total_rooms) VALUES (?, ?, ?)');
  const propertyId = property.run('国韵民宿', '上海市浦东新区', 11).lastInsertRowid;

  // 插入房间
  const room = db.prepare('INSERT INTO rooms (property_id, room_number, room_type, base_price, status) VALUES (?, ?, ?, ?, ?)');
  for (let i = 1; i <= 11; i++) {
    room.run(propertyId, `${i}01`, i <= 3 ? '大床房' : '标准间', 299 + i * 10, 'available');
  }

  // 插入渠道
  const channel = db.prepare('INSERT INTO channels (name, code, commission_rate) VALUES (?, ?, ?)');
  channel.run('携程', 'ctrip', 0.15);
  channel.run('美团', 'meituan', 0.12);
  channel.run('飞猪', 'fliggy', 0.10);
  channel.run('Booking', 'booking', 0.18);
  channel.run('直销', 'direct', 0);

  // 插入模拟订单
  const order = db.prepare(`
    INSERT INTO orders (order_no, room_id, customer_id, channel, check_in, check_out, total_price, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const customer = db.prepare('INSERT INTO customers (name, phone, channel) VALUES (?, ?, ?)');
  
  const channels = ['ctrip', 'meituan', 'direct', 'booking'];
  const today = new Date();
  
  for (let i = 0; i < 5; i++) {
    const customerId = customer.run(`客户${i + 1}`, `138${String(i).padStart(8, '0')}`, channels[i % channels.length]).lastInsertRowid;
    
    const checkIn = new Date(today);
    checkIn.setDate(today.getDate() + i);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkIn.getDate() + 2);
    
    order.run(
      `ORD${Date.now()}${i}`,
      (i % 11) + 1,
      customerId,
      channels[i % channels.length],
      checkIn.toISOString().split('T')[0],
      checkOut.toISOString().split('T')[0],
      599 + i * 100,
      i < 2 ? 'confirmed' : 'pending'
    );
  }

  console.log('✅ 默认数据插入完成');
}

module.exports = { db, initDatabase };
