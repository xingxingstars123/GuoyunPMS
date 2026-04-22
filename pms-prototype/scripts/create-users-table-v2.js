/**
 * 创建用户表 (使用父级database.js)
 */

const path = require('path');
const bcrypt = require('bcrypt');

// 使用绝对路径require
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '../database/pms.db');
const db = new Database(dbPath);

async function createUsersTable() {
  console.log('📋 创建用户表...');

  // 创建users表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'STAFF',
      created_at TEXT NOT NULL,
      updated_at TEXT,
      last_login TEXT,
      CONSTRAINT chk_role CHECK (role IN ('ADMIN', 'MANAGER', 'STAFF', 'CLEANER'))
    )
  `);

  console.log('✅ users表创建成功');

  // 检查是否已有管理员用户
  const stmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?');
  const adminCount = stmt.get('ADMIN');

  if (adminCount.count === 0) {
    console.log('📝 创建默认管理员账户...');
    
    // 创建默认管理员账户
    const defaultPassword = 'admin123'; // 生产环境请修改!
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    const insertStmt = db.prepare(`
      INSERT INTO users (username, password_hash, role, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `);
    
    insertStmt.run('admin', passwordHash, 'ADMIN');

    console.log('✅ 默认管理员账户创建成功');
    console.log('   用户名: admin');
    console.log('   密码: admin123');
    console.log('   ⚠️  请在生产环境中立即修改默认密码!');
  } else {
    console.log('ℹ️  管理员账户已存在,跳过创建');
  }

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  `);

  console.log('✅ 用户表索引创建成功');

  db.close();
  console.log('🎉 用户表初始化完成!');
}

// 执行
createUsersTable().catch(err => {
  console.error('❌ 创建用户表失败:', err);
  process.exit(1);
});
