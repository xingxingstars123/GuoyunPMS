-- =============================================
-- 国韵民宿PMS系统 - 业务模块数据库设计
-- 包含: 智能定价/预测分析/会员系统/营销工具
-- 创建时间: 2026-04-18
-- =============================================

-- ===============================
-- 1. 智能定价系统
-- ===============================

-- 价格策略表
CREATE TABLE IF NOT EXISTS pricing_strategies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,           -- 策略名称
  description TEXT,                      -- 策略描述
  is_active BOOLEAN DEFAULT 0,          -- 是否启用
  
  -- 节假日系数
  holiday_multiplier DECIMAL(3,2) DEFAULT 1.0,  -- 1.3 = +30%
  
  -- 周末系数
  weekend_multiplier DECIMAL(3,2) DEFAULT 1.0,  -- 1.2 = +20%
  
  -- 淡旺季系数
  high_season_multiplier DECIMAL(3,2) DEFAULT 1.0,
  low_season_multiplier DECIMAL(3,2) DEFAULT 1.0,
  
  -- 入住率系数
  occupancy_high_multiplier DECIMAL(3,2) DEFAULT 1.0,  -- 入住率>80%
  occupancy_low_multiplier DECIMAL(3,2) DEFAULT 1.0,   -- 入住率<30%
  
  -- 提前预订折扣
  early_booking_7days_discount DECIMAL(3,2) DEFAULT 0,  -- 0.1 = -10%
  early_booking_30days_discount DECIMAL(3,2) DEFAULT 0,
  
  -- 连住折扣
  stay_3days_discount DECIMAL(3,2) DEFAULT 0,  -- 0.05 = -5%
  stay_7days_discount DECIMAL(3,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 价格日历表
CREATE TABLE IF NOT EXISTS price_calendar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  date DATE NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,      -- 基准价
  final_price DECIMAL(10,2) NOT NULL,     -- 最终价格
  multipliers JSON,                        -- 应用的系数JSON
  is_holiday BOOLEAN DEFAULT 0,
  is_weekend BOOLEAN DEFAULT 0,
  occupancy_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  UNIQUE(room_id, date)
);

CREATE INDEX idx_price_calendar_date ON price_calendar(date);
CREATE INDEX idx_price_calendar_room ON price_calendar(room_id);

-- ===============================
-- 2. 会员系统
-- ===============================

-- 会员表
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL UNIQUE,
  member_level VARCHAR(20) DEFAULT 'normal',  -- normal/silver/gold/diamond
  total_points INTEGER DEFAULT 0,             -- 总积分
  available_points INTEGER DEFAULT 0,         -- 可用积分
  total_spent DECIMAL(10,2) DEFAULT 0,        -- 累计消费
  total_stays INTEGER DEFAULT 0,              -- 累计入住次数
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  level_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX idx_members_customer ON members(customer_id);
CREATE INDEX idx_members_level ON members(member_level);

-- 积分记录表
CREATE TABLE IF NOT EXISTS points_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  points INTEGER NOT NULL,                    -- 积分变动(正数增加,负数减少)
  type VARCHAR(50) NOT NULL,                  -- consume/checkin/review/share/redeem
  description TEXT,
  order_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE INDEX idx_points_records_member ON points_records(member_id);
CREATE INDEX idx_points_records_type ON points_records(type);

-- 会员特权配置表
CREATE TABLE IF NOT EXISTS member_privileges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level VARCHAR(20) NOT NULL UNIQUE,          -- normal/silver/gold/diamond
  discount_rate DECIMAL(3,2) DEFAULT 1.0,     -- 0.95 = 95折
  free_upgrade BOOLEAN DEFAULT 0,              -- 免费升房
  late_checkout BOOLEAN DEFAULT 0,             -- 延迟退房
  priority_support BOOLEAN DEFAULT 0,          -- 专属客服
  points_multiplier DECIMAL(3,2) DEFAULT 1.0, -- 积分倍率
  upgrade_spent DECIMAL(10,2),                -- 升级所需消费
  upgrade_stays INTEGER,                       -- 升级所需入住次数
  description TEXT
);

-- 插入默认会员等级配置
INSERT OR REPLACE INTO member_privileges (level, discount_rate, free_upgrade, late_checkout, priority_support, points_multiplier, upgrade_spent, upgrade_stays, description) VALUES
('normal', 1.0, 0, 0, 0, 1.0, 0, 0, '普通会员'),
('silver', 0.95, 0, 0, 0, 1.2, 2000, 5, '银卡会员:95折+积分1.2倍'),
('gold', 0.90, 1, 0, 0, 1.5, 10000, 20, '金卡会员:9折+免费升房+积分1.5倍'),
('diamond', 0.85, 1, 1, 1, 2.0, 50000, 100, '钻石会员:85折+免费升房+延退+专属客服+积分2倍');

-- ===============================
-- 3. 营销工具系统
-- ===============================

-- 优惠券表
CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,           -- 优惠券码
  name VARCHAR(100) NOT NULL,                 -- 优惠券名称
  type VARCHAR(50) NOT NULL,                  -- discount/reduction/upgrade/gift
  
  -- 折扣类型
  discount_rate DECIMAL(3,2),                 -- 0.9 = 9折
  reduction_amount DECIMAL(10,2),             -- 减免金额
  min_amount DECIMAL(10,2),                   -- 最低消费
  
  -- 使用条件
  room_type VARCHAR(50),                      -- 限定房型
  valid_from DATE,
  valid_to DATE,
  total_count INTEGER,                        -- 总发放数量
  used_count INTEGER DEFAULT 0,               -- 已使用数量
  
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_valid ON coupons(valid_from, valid_to);

-- 用户优惠券表
CREATE TABLE IF NOT EXISTS user_coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  coupon_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'unused',        -- unused/used/expired
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP,
  order_id INTEGER,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX idx_user_coupons_customer ON user_coupons(customer_id);
CREATE INDEX idx_user_coupons_status ON user_coupons(status);

-- 营销活动表
CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,                  -- flash_sale/group_buy/invite
  description TEXT,
  
  -- 活动配置JSON
  config JSON,                                 -- {"discount": 0.8, "quota": 10}
  
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  
  status VARCHAR(20) DEFAULT 'draft',          -- draft/active/ended
  
  -- 统计数据
  participant_count INTEGER DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_time ON campaigns(start_time, end_time);

-- 推送记录表
CREATE TABLE IF NOT EXISTS push_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  type VARCHAR(50) NOT NULL,                  -- order/marketing/birthday
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  channel VARCHAR(50),                        -- sms/push/email
  status VARCHAR(20) DEFAULT 'pending',        -- pending/sent/failed
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX idx_push_logs_customer ON push_logs(customer_id);
CREATE INDEX idx_push_logs_status ON push_logs(status);

-- ===============================
-- 4. 预测分析系统
-- ===============================

-- 预测数据表
CREATE TABLE IF NOT EXISTS predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL UNIQUE,
  predicted_occupancy DECIMAL(5,2),          -- 预测入住率
  predicted_revenue DECIMAL(10,2),           -- 预测营收
  predicted_orders INTEGER,                  -- 预测订单数
  confidence DECIMAL(3,2),                   -- 置信度
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_predictions_date ON predictions(date);

-- 异常记录表
CREATE TABLE IF NOT EXISTS anomalies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type VARCHAR(50) NOT NULL,                 -- order/customer/revenue
  target_id INTEGER,                          -- 关联对象ID
  description TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',      -- low/medium/high
  status VARCHAR(20) DEFAULT 'new',           -- new/reviewed/resolved
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE INDEX idx_anomalies_type ON anomalies(type);
CREATE INDEX idx_anomalies_status ON anomalies(status);

-- ===============================
-- 触发器: 会员自动升级
-- ===============================

CREATE TRIGGER IF NOT EXISTS trigger_member_level_upgrade
AFTER UPDATE OF total_spent, total_stays ON members
FOR EACH ROW
BEGIN
  -- 升级到钻石会员
  UPDATE members 
  SET member_level = 'diamond', level_updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id 
    AND member_level != 'diamond'
    AND NEW.total_spent >= 50000 
    AND NEW.total_stays >= 100;
  
  -- 升级到金卡会员
  UPDATE members 
  SET member_level = 'gold', level_updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id 
    AND member_level NOT IN ('gold', 'diamond')
    AND NEW.total_spent >= 10000 
    AND NEW.total_stays >= 20;
  
  -- 升级到银卡会员
  UPDATE members 
  SET member_level = 'silver', level_updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id 
    AND member_level = 'normal'
    AND NEW.total_spent >= 2000 
    AND NEW.total_stays >= 5;
END;

-- ===============================
-- 触发器: 积分自动记录
-- ===============================

CREATE TRIGGER IF NOT EXISTS trigger_points_on_order
AFTER INSERT ON orders
FOR EACH ROW
WHEN NEW.payment_status = 'paid'
BEGIN
  -- 查找会员
  INSERT INTO points_records (member_id, points, type, description, order_id)
  SELECT 
    m.id,
    CAST(NEW.total_price * p.points_multiplier AS INTEGER),
    'consume',
    '订单消费获得积分',
    NEW.id
  FROM members m
  JOIN member_privileges p ON p.level = m.member_level
  WHERE m.customer_id = NEW.customer_id;
  
  -- 更新可用积分
  UPDATE members
  SET available_points = available_points + CAST(NEW.total_price * (SELECT points_multiplier FROM member_privileges WHERE level = members.member_level) AS INTEGER),
      total_points = total_points + CAST(NEW.total_price * (SELECT points_multiplier FROM member_privileges WHERE level = members.member_level) AS INTEGER),
      total_spent = total_spent + NEW.total_price,
      total_stays = total_stays + 1
  WHERE customer_id = NEW.customer_id;
END;

-- ===============================
-- 视图: 会员统计
-- ===============================

CREATE VIEW IF NOT EXISTS v_member_stats AS
SELECT 
  m.id,
  m.customer_id,
  c.name,
  c.phone,
  m.member_level,
  m.total_points,
  m.available_points,
  m.total_spent,
  m.total_stays,
  p.discount_rate,
  p.points_multiplier,
  m.joined_at,
  m.level_updated_at
FROM members m
JOIN customers c ON c.id = m.customer_id
JOIN member_privileges p ON p.level = m.member_level;

-- ===============================
-- 视图: 活跃优惠券
-- ===============================

CREATE VIEW IF NOT EXISTS v_active_coupons AS
SELECT 
  c.*,
  c.total_count - c.used_count AS remaining_count,
  CAST(c.used_count * 100.0 / NULLIF(c.total_count, 0) AS DECIMAL(5,2)) AS usage_rate
FROM coupons c
WHERE c.is_active = 1
  AND c.valid_to >= DATE('now')
  AND c.used_count < c.total_count;

-- ===============================
-- 完成
-- ===============================
