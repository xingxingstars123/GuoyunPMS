const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../database/pms.db');
const db = new Database(dbPath);

async function init() {
  console.log('📋 创建用户表...');

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

  const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('ADMIN');

  if (adminCount.count === 0) {
    console.log('📝 创建默认管理员...');
    const passwordHash = await bcrypt.hash('admin123', 12);
    db.prepare('INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, datetime(\'now\'))').run('admin', passwordHash, 'ADMIN');
    console.log('✅ 管理员创建成功 (用户名:admin, 密码:admin123)');
  }

  db.exec('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');

  db.close();
  console.log('🎉 完成!');
}

init().catch(err => {
  console.error('❌ 失败:', err);
  process.exit(1);
});
