-- ============================================
-- 国韵民宿PMS系统 - 4大核心业务模块数据库设计
-- 创建时间: 2026-04-18
-- ============================================

-- ============ 1️⃣ 智能定价系统表 ============

-- 基准价格表
CREATE TABLE IF NOT EXISTS base_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_type VARCHAR(50) NOT NULL,              -- 房型
  base_price DECIMAL(10,2) NOT NULL,            -- 基准价格
  effective_date DATE NOT NULL,                 -- 生效日期
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_type, effective_date)
);

-- 动态定价策略表
CREATE TABLE IF NOT EXISTS pricing_strategies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  strategy_name VARCHAR(100) NOT NULL,         -- 策略名称
  strategy_type VARCHAR(50) NOT NULL,          -- 策略类型:holiday/weekend/season/occupancy/advance/consecutive
  rule_config TEXT NOT NULL,                   -- 规则配置(JSON)
  is_active TINYINT DEFAULT 1,                 -- 是否启用
  priority INTEGER DEFAULT 0,                  -- 优先级
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 价格日历表
CREATE TABLE IF NOT EXISTS price_calendar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_type VARCHAR(50) NOT NULL,
  price_date DATE NOT NULL,                    -- 日期
  base_price DECIMAL(10,2) NOT NULL,           -- 基准价
  final_price DECIMAL(10,2) NOT NULL,          -- 最终价格
  adjustment_detail TEXT,                      -- 调价明细(JSON)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_type, price_date)
);

CREATE INDEX idx_price_calendar_date ON price_calendar(price_date);
CREATE INDEX idx_price_calendar_room ON price_calendar(room_type);

-- ============ 2️⃣ 预测分析系统表 ============

-- 预测数据表
CREATE TABLE IF NOT EXISTS prediction_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prediction_type VARCHAR(50) NOT NULL,        -- 预测类型:occupancy/revenue
  prediction_date DATE NOT NULL,               -- 预测日期
  predicted_value DECIMAL(10,2) NOT NULL,      -- 预测值
  confidence_level DECIMAL(5,2),               -- 置信度
  actual_value DECIMAL(10,2),                  -- 实际值(用于回测)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(prediction_type, prediction_date)
);

-- 异常记录表
CREATE TABLE IF NOT EXISTS anomaly_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anomaly_type VARCHAR(50) NOT NULL,           -- 异常类型:order/customer/payment
  entity_id INTEGER NOT NULL,                  -- 关联实体ID
  anomaly_score DECIMAL(5,2) NOT NULL,         -- 异常分数
  anomaly_reason TEXT,                         -- 异常原因
  status VARCHAR(20) DEFAULT 'pending',        -- 状态:pending/reviewed/resolved
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME
);

CREATE INDEX idx_anomaly_type ON anomaly_records(anomaly_type);
CREATE INDEX idx_anomaly_status ON anomaly_records(status);

-- ============ 3️⃣ 会员系统表 ============

-- 会员表
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(100),
  member_level VARCHAR(20) DEFAULT 'regular',  -- 会员等级:regular/silver/gold/diamond
  total_points INTEGER DEFAULT 0,              -- 总积分
  available_points INTEGER DEFAULT 0,          -- 可用积分
  total_spent DECIMAL(10,2) DEFAULT 0,         -- 累计消费
  total_stays INTEGER DEFAULT 0,               -- 累计入住次数
  join_date DATE NOT NULL,                     -- 加入日期
  birthday DATE,                               -- 生日
  last_stay_date DATE,                         -- 最后入住日期
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_members_level ON members(member_level);

-- 积分记录表
CREATE TABLE IF NOT EXISTS points_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  points_change INTEGER NOT NULL,              -- 积分变化(正数为增加,负数为减少)
  points_type VARCHAR(50) NOT NULL,            -- 积分类型:consume/checkin/review/share/redeem
  related_order_id INTEGER,                    -- 关联订单ID
  description TEXT,                            -- 描述
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE INDEX idx_points_member ON points_records(member_id);
CREATE INDEX idx_points_created ON points_records(created_at);

-- 会员特权表
CREATE TABLE IF NOT EXISTS member_privileges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  privilege_name VARCHAR(100) NOT NULL,        -- 特权名称
  member_level VARCHAR(20) NOT NULL,           -- 适用等级
  privilege_type VARCHAR(50) NOT NULL,         -- 特权类型:discount/upgrade/late_checkout/service
  privilege_value TEXT,                        -- 特权值(JSON)
  description TEXT,                            -- 描述
  is_active TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_privileges_level ON member_privileges(member_level);

-- ============ 4️⃣ 营销工具系统表 ============

-- 优惠券表
CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coupon_code VARCHAR(50) NOT NULL UNIQUE,     -- 优惠券码
  coupon_name VARCHAR(100) NOT NULL,           -- 优惠券名称
  coupon_type VARCHAR(50) NOT NULL,            -- 类型:full_reduction/discount/upgrade/birthday
  discount_rule TEXT NOT NULL,                 -- 折扣规则(JSON)
  total_quantity INTEGER DEFAULT -1,           -- 总数量(-1表示无限)
  issued_quantity INTEGER DEFAULT 0,           -- 已发放数量
  used_quantity INTEGER DEFAULT 0,             -- 已使用数量
  valid_from DATE NOT NULL,                    -- 有效期开始
  valid_to DATE NOT NULL,                      -- 有效期结束
  target_user_type VARCHAR(50),                -- 目标用户:all/new/return/birthday
  min_consume DECIMAL(10,2) DEFAULT 0,         -- 最低消费要求
  is_active TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coupons_code ON coupons(coupon_code);
CREATE INDEX idx_coupons_valid ON coupons(valid_from, valid_to);

-- 用户优惠券表
CREATE TABLE IF NOT EXISTS user_coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  coupon_id INTEGER NOT NULL,
  received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME,
  order_id INTEGER,                            -- 使用订单ID
  status VARCHAR(20) DEFAULT 'available',      -- 状态:available/used/expired
  FOREIGN KEY (member_id) REFERENCES members(id),
  FOREIGN KEY (coupon_id) REFERENCES coupons(id)
);

CREATE INDEX idx_user_coupons_member ON user_coupons(member_id);
CREATE INDEX idx_user_coupons_status ON user_coupons(status);

-- 营销活动表
CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_name VARCHAR(100) NOT NULL,         -- 活动名称
  campaign_type VARCHAR(50) NOT NULL,          -- 类型:flash_sale/group_buy/referral/points_multiplier
  campaign_config TEXT NOT NULL,               -- 活动配置(JSON)
  start_time DATETIME NOT NULL,                -- 开始时间
  end_time DATETIME NOT NULL,                  -- 结束时间
  target_audience TEXT,                        -- 目标受众(JSON)
  participation_count INTEGER DEFAULT 0,       -- 参与人数
  conversion_count INTEGER DEFAULT 0,          -- 转化人数
  total_revenue DECIMAL(10,2) DEFAULT 0,       -- 总营收
  is_active TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaigns_time ON campaigns(start_time, end_time);
CREATE INDEX idx_campaigns_active ON campaigns(is_active);

-- 推送记录表
CREATE TABLE IF NOT EXISTS push_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  push_type VARCHAR(50) NOT NULL,              -- 类型:order_reminder/marketing/birthday
  target_user_id INTEGER NOT NULL,
  target_phone VARCHAR(20),
  push_channel VARCHAR(20) NOT NULL,           -- 渠道:sms/push/email
  push_content TEXT NOT NULL,                  -- 推送内容
  push_status VARCHAR(20) DEFAULT 'pending',   -- 状态:pending/sent/failed
  sent_at DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_push_logs_user ON push_logs(target_user_id);
CREATE INDEX idx_push_logs_status ON push_logs(push_status);
CREATE INDEX idx_push_logs_created ON push_logs(created_at);

-- ============ 初始化基础数据 ============

-- 初始化基准价格
INSERT OR IGNORE INTO base_prices (room_type, base_price, effective_date) VALUES
  ('standard', 288.00, '2026-01-01'),
  ('deluxe', 388.00, '2026-01-01'),
  ('suite', 688.00, '2026-01-01'),
  ('villa', 1288.00, '2026-01-01');

-- 初始化定价策略
INSERT OR IGNORE INTO pricing_strategies (strategy_name, strategy_type, rule_config, priority) VALUES
  ('节假日溢价', 'holiday', '{"multiplier": 1.5, "holidays": ["2026-05-01", "2026-10-01", "2026-01-01"]}', 10),
  ('周末溢价', 'weekend', '{"multiplier": 1.2}', 8),
  ('旺季策略', 'season', '{"peak_multiplier": 1.3, "off_multiplier": 0.85, "peak_months": [7, 8, 10]}', 6),
  ('提前预订优惠', 'advance', '{"7_days": 0.95, "15_days": 0.9}', 4),
  ('连住折扣', 'consecutive', '{"3_days": 0.95, "7_days": 0.9}', 5);

-- 初始化会员特权
INSERT OR IGNORE INTO member_privileges (privilege_name, member_level, privilege_type, privilege_value, description) VALUES
  ('银卡折扣', 'silver', 'discount', '{"discount": 0.95}', '全场95折'),
  ('金卡折扣', 'gold', 'discount', '{"discount": 0.90}', '全场9折'),
  ('钻石折扣', 'diamond', 'discount', '{"discount": 0.85}', '全场85折'),
  ('金卡免费升房', 'gold', 'upgrade', '{"enabled": true}', '免费升级房型'),
  ('钻石免费升房', 'diamond', 'upgrade', '{"enabled": true}', '免费升级房型'),
  ('钻石延迟退房', 'diamond', 'late_checkout', '{"hours": 2}', '延迟2小时退房'),
  ('钻石专属客服', 'diamond', 'service', '{"enabled": true}', '一对一专属客服');

-- 初始化优惠券模板
INSERT OR IGNORE INTO coupons (coupon_code, coupon_name, coupon_type, discount_rule, total_quantity, valid_from, valid_to, target_user_type, min_consume) VALUES
  ('NEW2026', '新客专享券', 'full_reduction', '{"threshold": 200, "discount": 30}', 1000, '2026-01-01', '2026-12-31', 'new', 200),
  ('SPRING90', '春季9折券', 'discount', '{"discount_rate": 0.9}', 500, '2026-03-01', '2026-05-31', 'all', 100),
  ('BIRTHDAY50', '生日专享券', 'full_reduction', '{"threshold": 0, "discount": 50}', -1, '2026-01-01', '2026-12-31', 'birthday', 0);

COMMIT;
