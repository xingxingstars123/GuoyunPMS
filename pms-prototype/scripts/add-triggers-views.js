/**
 * 添加触发器和视图(单独执行,避免SQL解析问题)
 */

const Database = require('../backend/node_modules/better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../database/pms.db'));

console.log('🔧 添加触发器和视图...\n');

// ============ 触发器 ============

const triggers = [
  {
    name: 'update_customer_stats_on_order_insert',
    sql: `
      CREATE TRIGGER IF NOT EXISTS update_customer_stats_on_order_insert
      AFTER INSERT ON orders
      WHEN NEW.status != 'cancelled'
      BEGIN
        UPDATE customers
        SET 
          total_orders = total_orders + 1,
          total_spent = total_spent + NEW.total_price
        WHERE id = NEW.customer_id;
      END
    `
  },
  {
    name: 'update_customer_stats_on_order_cancel',
    sql: `
      CREATE TRIGGER IF NOT EXISTS update_customer_stats_on_order_cancel
      AFTER UPDATE ON orders
      WHEN OLD.status != 'cancelled' AND NEW.status = 'cancelled'
      BEGIN
        UPDATE customers
        SET 
          total_orders = total_orders - 1,
          total_spent = total_spent - OLD.total_price
        WHERE id = NEW.customer_id;
      END
    `
  },
  {
    name: 'create_cleaning_task_on_checkout',
    sql: `
      CREATE TRIGGER IF NOT EXISTS create_cleaning_task_on_checkout
      AFTER UPDATE ON orders
      WHEN OLD.status != 'checked_out' AND NEW.status = 'checked_out'
      BEGIN
        INSERT INTO cleaning_tasks (room_id, status, scheduled_time, notes)
        VALUES (
          NEW.room_id,
          'pending',
          datetime(NEW.check_out || ' 14:00:00'),
          '退房后清洁 - 订单号: ' || NEW.order_no
        );
      END
    `
  }
];

console.log('⚡ 创建触发器:');
triggers.forEach(trigger => {
  try {
    db.exec(trigger.sql);
    console.log(`   ✅ ${trigger.name}`);
  } catch (error) {
    console.error(`   ❌ ${trigger.name}: ${error.message}`);
  }
});

// ============ 视图 ============

const views = [
  {
    name: 'v_daily_revenue',
    sql: `
      CREATE VIEW IF NOT EXISTS v_daily_revenue AS
      SELECT 
        DATE(check_in) as date,
        COUNT(*) as order_count,
        SUM(total_price) as total_revenue,
        AVG(total_price) as avg_order_value,
        channel
      FROM orders
      WHERE status NOT IN ('cancelled', 'pending')
      GROUP BY DATE(check_in), channel
    `
  },
  {
    name: 'v_room_utilization',
    sql: `
      CREATE VIEW IF NOT EXISTS v_room_utilization AS
      SELECT 
        r.id as room_id,
        r.room_number,
        r.room_type,
        COUNT(DISTINCT ro.date) as booked_days,
        COUNT(DISTINCT CASE WHEN ro.status = 'available' THEN ro.date END) as available_days
      FROM rooms r
      LEFT JOIN room_occupancy ro ON r.id = ro.room_id
        AND ro.date >= DATE('now', '-30 days')
        AND ro.date < DATE('now')
      GROUP BY r.id, r.room_number, r.room_type
    `
  },
  {
    name: 'v_channel_performance',
    sql: `
      CREATE VIEW IF NOT EXISTS v_channel_performance AS
      SELECT 
        o.channel,
        c.name as channel_name,
        COUNT(*) as total_orders,
        SUM(o.total_price) as total_revenue,
        AVG(o.total_price) as avg_order_value,
        c.commission_rate,
        SUM(o.total_price * c.commission_rate) as total_commission
      FROM orders o
      LEFT JOIN channels c ON o.channel = c.code
      WHERE o.status NOT IN ('cancelled', 'pending')
        AND o.created_at >= DATE('now', '-30 days')
      GROUP BY o.channel, c.name, c.commission_rate
    `
  },
  {
    name: 'v_customer_value',
    sql: `
      CREATE VIEW IF NOT EXISTS v_customer_value AS
      SELECT 
        c.id,
        c.name,
        c.phone,
        c.channel,
        c.total_orders,
        c.total_spent,
        CASE 
          WHEN c.total_orders = 0 THEN 0
          ELSE c.total_spent / c.total_orders
        END as avg_order_value,
        (
          SELECT MAX(created_at)
          FROM orders
          WHERE customer_id = c.id
        ) as last_order_date,
        JULIANDAY('now') - JULIANDAY((
          SELECT MAX(created_at)
          FROM orders
          WHERE customer_id = c.id
        )) as days_since_last_order
      FROM customers c
      WHERE c.total_orders > 0
    `
  }
];

console.log('\n👁️  创建视图:');
views.forEach(view => {
  try {
    db.exec(view.sql);
    console.log(`   ✅ ${view.name}`);
  } catch (error) {
    console.error(`   ❌ ${view.name}: ${error.message}`);
  }
});

// 验证
console.log('\n📊 验证结果:');

const triggerCount = db.prepare(`
  SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'trigger'
`).get();
console.log(`   触发器: ${triggerCount.count}`);

const viewCount = db.prepare(`
  SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'view'
`).get();
console.log(`   视图: ${viewCount.count}`);

// 测试视图
console.log('\n🧪 测试视图查询:');

const testQueries = [
  { name: '渠道性能', query: 'SELECT * FROM v_channel_performance LIMIT 3' },
  { name: '客户价值', query: 'SELECT * FROM v_customer_value LIMIT 3' },
  { name: '每日营收', query: 'SELECT * FROM v_daily_revenue LIMIT 3' }
];

testQueries.forEach(test => {
  try {
    const result = db.prepare(test.query).all();
    console.log(`   ✅ ${test.name}: ${result.length} 行`);
  } catch (error) {
    console.error(`   ❌ ${test.name}: ${error.message}`);
  }
});

console.log('\n✅ 触发器和视图添加完成!\n');

db.close();
