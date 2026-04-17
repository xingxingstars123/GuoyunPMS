-- ============================================
-- 数据库结构优化脚本
-- 添加索引、约束、触发器
-- ============================================

-- ============ 索引优化 ============

-- 订单表索引
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_room_id ON orders(room_id);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_check_in ON orders(check_in);
CREATE INDEX IF NOT EXISTS idx_orders_check_out ON orders(check_out);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 客户表索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_channel ON customers(channel);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- 房态表索引
CREATE INDEX IF NOT EXISTS idx_occupancy_room_date ON room_occupancy(room_id, date);
CREATE INDEX IF NOT EXISTS idx_occupancy_order_id ON room_occupancy(order_id);
CREATE INDEX IF NOT EXISTS idx_occupancy_status ON room_occupancy(status);

-- 清洁任务索引
CREATE INDEX IF NOT EXISTS idx_cleaning_room_id ON cleaning_tasks(room_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_status ON cleaning_tasks(status);
CREATE INDEX IF NOT EXISTS idx_cleaning_scheduled ON cleaning_tasks(scheduled_time);

-- 财务记录索引
CREATE INDEX IF NOT EXISTS idx_financial_order_id ON financial_records(order_id);
CREATE INDEX IF NOT EXISTS idx_financial_type ON financial_records(type);
CREATE INDEX IF NOT EXISTS idx_financial_date ON financial_records(date);
CREATE INDEX IF NOT EXISTS idx_financial_category ON financial_records(category);

-- 房间表索引
CREATE INDEX IF NOT EXISTS idx_rooms_property_id ON rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_number ON rooms(property_id, room_number);

-- ============ 数据验证触发器 ============

-- 订单金额不能为负
CREATE TRIGGER IF NOT EXISTS check_order_price_positive
BEFORE INSERT ON orders
BEGIN
  SELECT CASE
    WHEN NEW.total_price < 0 THEN
      RAISE(ABORT, '订单金额不能为负数')
  END;
END;

-- 退房日期必须晚于入住日期
CREATE TRIGGER IF NOT EXISTS check_order_dates
BEFORE INSERT ON orders
BEGIN
  SELECT CASE
    WHEN NEW.check_out <= NEW.check_in THEN
      RAISE(ABORT, '退房日期必须晚于入住日期')
  END;
END;

-- 订单创建时间不能晚于入住时间
CREATE TRIGGER IF NOT EXISTS check_order_created_time
BEFORE INSERT ON orders
BEGIN
  SELECT CASE
    WHEN DATE(NEW.created_at) > NEW.check_in THEN
      RAISE(ABORT, '订单创建时间不能晚于入住时间')
  END;
END;

-- ============ 自动统计触发器 ============

-- 订单创建时更新客户统计
CREATE TRIGGER IF NOT EXISTS update_customer_stats_on_order_insert
AFTER INSERT ON orders
WHEN NEW.status != 'cancelled'
BEGIN
  UPDATE customers
  SET 
    total_orders = total_orders + 1,
    total_spent = total_spent + NEW.total_price
  WHERE id = NEW.customer_id;
END;

-- 订单取消时更新客户统计
CREATE TRIGGER IF NOT EXISTS update_customer_stats_on_order_cancel
AFTER UPDATE ON orders
WHEN OLD.status != 'cancelled' AND NEW.status = 'cancelled'
BEGIN
  UPDATE customers
  SET 
    total_orders = total_orders - 1,
    total_spent = total_spent - OLD.total_price
  WHERE id = NEW.customer_id;
END;

-- 订单恢复时更新客户统计
CREATE TRIGGER IF NOT EXISTS update_customer_stats_on_order_restore
AFTER UPDATE ON orders
WHEN OLD.status = 'cancelled' AND NEW.status != 'cancelled'
BEGIN
  UPDATE customers
  SET 
    total_orders = total_orders + 1,
    total_spent = total_spent + NEW.total_price
  WHERE id = NEW.customer_id;
END;

-- ============ 数据一致性触发器 ============

-- 删除订单时清理相关房态
CREATE TRIGGER IF NOT EXISTS cleanup_occupancy_on_order_delete
BEFORE DELETE ON orders
BEGIN
  DELETE FROM room_occupancy WHERE order_id = OLD.id;
END;

-- 删除订单时清理相关财务记录
CREATE TRIGGER IF NOT EXISTS cleanup_financial_on_order_delete
BEFORE DELETE ON orders
BEGIN
  DELETE FROM financial_records WHERE order_id = OLD.id;
END;

-- ============ 业务逻辑触发器 ============

-- 订单完成时自动创建清洁任务
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
END;

-- ============ 约束强化 ============

-- 订单状态只能是特定值
CREATE TRIGGER IF NOT EXISTS validate_order_status
BEFORE INSERT ON orders
BEGIN
  SELECT CASE
    WHEN NEW.status NOT IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'pre_arrival', 'pre_departure') THEN
      RAISE(ABORT, '无效的订单状态')
  END;
END;

CREATE TRIGGER IF NOT EXISTS validate_order_status_update
BEFORE UPDATE ON orders
BEGIN
  SELECT CASE
    WHEN NEW.status NOT IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'pre_arrival', 'pre_departure') THEN
      RAISE(ABORT, '无效的订单状态')
  END;
END;

-- 清洁任务状态验证
CREATE TRIGGER IF NOT EXISTS validate_cleaning_status
BEFORE INSERT ON cleaning_tasks
BEGIN
  SELECT CASE
    WHEN NEW.status NOT IN ('pending', 'in_progress', 'completed', 'cancelled') THEN
      RAISE(ABORT, '无效的清洁任务状态')
  END;
END;

-- 财务类型验证
CREATE TRIGGER IF NOT EXISTS validate_financial_type
BEFORE INSERT ON financial_records
BEGIN
  SELECT CASE
    WHEN NEW.type NOT IN ('income', 'expense') THEN
      RAISE(ABORT, '财务类型必须是income或expense')
  END;
END;

-- ============ 性能统计视图 ============

-- 每日营收视图
CREATE VIEW IF NOT EXISTS v_daily_revenue AS
SELECT 
  DATE(check_in) as date,
  COUNT(*) as order_count,
  SUM(total_price) as total_revenue,
  AVG(total_price) as avg_order_value,
  channel
FROM orders
WHERE status NOT IN ('cancelled', 'pending')
GROUP BY DATE(check_in), channel;

-- 房间利用率视图
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
GROUP BY r.id;

-- 渠道统计视图
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
GROUP BY o.channel;

-- 客户价值视图
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
WHERE c.total_orders > 0;
