/**
 * 应用数据库优化(索引、触发器、视图)
 */

const Database = require('../backend/node_modules/better-sqlite3');
const path = require('path');
const fs = require('fs');

const db = new Database(path.join(__dirname, '../database/pms.db'));

console.log('🔧 开始应用数据库优化...\n');

// 读取SQL文件
const sql = fs.readFileSync(path.join(__dirname, 'optimize-database.sql'), 'utf8');

// 分割SQL语句
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

let successCount = 0;
let errorCount = 0;

statements.forEach((statement, index) => {
  try {
    db.exec(statement);
    
    // 提取操作类型
    const match = statement.match(/CREATE\s+(INDEX|TRIGGER|VIEW)/i);
    if (match) {
      const type = match[1].toUpperCase();
      const nameMatch = statement.match(/IF NOT EXISTS\s+(\w+)/i);
      const name = nameMatch ? nameMatch[1] : `statement_${index}`;
      console.log(`✅ ${type}: ${name}`);
      successCount++;
    }
  } catch (error) {
    console.error(`❌ 执行失败:`, error.message);
    errorCount++;
  }
});

console.log(`\n📊 优化完成:`);
console.log(`   - 成功: ${successCount}`);
console.log(`   - 失败: ${errorCount}`);

// 验证优化结果
console.log('\n🔍 验证数据库结构...\n');

// 检查索引
const indexes = db.prepare(`
  SELECT name, tbl_name 
  FROM sqlite_master 
  WHERE type = 'index' 
    AND name LIKE 'idx_%'
  ORDER BY tbl_name, name
`).all();

console.log(`📌 索引 (${indexes.length}):`);
indexes.forEach(idx => {
  console.log(`   - ${idx.tbl_name}.${idx.name}`);
});

// 检查触发器
const triggers = db.prepare(`
  SELECT name, tbl_name 
  FROM sqlite_master 
  WHERE type = 'trigger'
  ORDER BY tbl_name, name
`).all();

console.log(`\n⚡ 触发器 (${triggers.length}):`);
triggers.forEach(trg => {
  console.log(`   - ${trg.tbl_name}.${trg.name}`);
});

// 检查视图
const views = db.prepare(`
  SELECT name 
  FROM sqlite_master 
  WHERE type = 'view'
  ORDER BY name
`).all();

console.log(`\n👁️  视图 (${views.length}):`);
views.forEach(view => {
  console.log(`   - ${view.name}`);
});

// 性能测试
console.log('\n⚡ 性能测试...\n');

const tests = [
  {
    name: '查询今日订单(使用索引)',
    query: `SELECT COUNT(*) as count FROM orders WHERE DATE(check_in) = DATE('now')`
  },
  {
    name: '按渠道统计(使用索引)',
    query: `SELECT channel, COUNT(*) as count FROM orders GROUP BY channel`
  },
  {
    name: '客户订单历史(使用外键索引)',
    query: `
      SELECT o.*, c.name 
      FROM orders o 
      JOIN customers c ON o.customer_id = c.id 
      LIMIT 10
    `
  },
  {
    name: '渠道性能视图',
    query: `SELECT * FROM v_channel_performance LIMIT 5`
  }
];

tests.forEach(test => {
  const start = Date.now();
  const result = db.prepare(test.query).all();
  const elapsed = Date.now() - start;
  console.log(`   ${test.name}: ${elapsed}ms (${result.length} rows)`);
});

console.log('\n✅ 数据库优化应用完成!\n');

db.close();
