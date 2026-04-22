/**
 * PostgreSQL数据库配置
 * 生产环境推荐使用PostgreSQL替代SQLite
 */

const { Pool } = require('pg');
require('dotenv').config();

// 创建连接池
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pms',
  user: process.env.DB_USER || 'pms_user',
  password: process.env.DB_PASSWORD,
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000, // 空闲连接超时
  connectionTimeoutMillis: 2000, // 连接超时
});

// 测试连接
pool.on('connect', () => {
  console.log('✅ PostgreSQL连接成功');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL连接错误:', err);
});

/**
 * 执行查询
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
};

/**
 * 执行事务
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * 初始化数据库表
 */
async function initDatabase() {
  console.log('📋 初始化PostgreSQL数据库...');

  // 房源表
  await query(`
    CREATE TABLE IF NOT EXISTS properties (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      address TEXT,
      total_rooms INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 房间表
  await query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id SERIAL PRIMARY KEY,
      property_id INTEGER REFERENCES properties(id),
      room_number VARCHAR(50) NOT NULL,
      room_type VARCHAR(50),
      base_price DECIMAL(10,2),
      status VARCHAR(20) DEFAULT 'available',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 客户表
  await query(`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) UNIQUE,
      email VARCHAR(255),
      channel VARCHAR(50),
      total_orders INTEGER DEFAULT 0,
      total_spent DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 订单表
  await query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id),
      room_id INTEGER REFERENCES rooms(id),
      channel VARCHAR(50),
      channel_order_id VARCHAR(100),
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 用户表
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'STAFF',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP,
      last_login TIMESTAMP,
      CONSTRAINT chk_role CHECK (role IN ('ADMIN', 'MANAGER', 'STAFF', 'CLEANER'))
    )
  `);

  // 清洁任务表
  await query(`
    CREATE TABLE IF NOT EXISTS cleaning_tasks (
      id SERIAL PRIMARY KEY,
      room_id INTEGER REFERENCES rooms(id),
      assigned_to VARCHAR(255),
      scheduled_time TIMESTAMP,
      completed_time TIMESTAMP,
      status VARCHAR(20) DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建索引
  await query('CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_orders_room_id ON orders(room_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel)');
  await query('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
  await query('CREATE INDEX IF NOT EXISTS idx_orders_check_in ON orders(check_in)');
  await query('CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)');
  await query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
  await query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');

  console.log('✅ PostgreSQL数据库初始化完成');
}

/**
 * 关闭连接池
 */
async function closePool() {
  await pool.end();
  console.log('PostgreSQL连接池已关闭');
}

module.exports = {
  query,
  transaction,
  initDatabase,
  closePool,
  pool
};
