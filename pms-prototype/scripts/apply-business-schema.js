const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/pms.db');
const schemaPath = path.join(__dirname, '../database/schema-business-modules.sql');

console.log('📊 应用业务模块数据库设计...\n');

const db = new sqlite3.Database(dbPath);
const schema = fs.readFileSync(schemaPath, 'utf8');

// 分割SQL语句(按分号和换行)
const statements = schema
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`📝 共 ${statements.length} 条SQL语句\n`);

db.serialize(() => {
  let successCount = 0;
  let errorCount = 0;
  
  statements.forEach((sql, index) => {
    db.run(sql, (err) => {
      if (err) {
        console.error(`❌ 语句 ${index + 1} 失败:`, err.message);
        console.error(`   SQL: ${sql.substring(0, 100)}...`);
        errorCount++;
      } else {
        successCount++;
        const preview = sql.substring(0, 80).replace(/\s+/g, ' ');
        console.log(`✅ ${index + 1}/${statements.length}: ${preview}...`);
      }
      
      if (index === statements.length - 1) {
        console.log(`\n🎉 完成! 成功: ${successCount}, 失败: ${errorCount}\n`);
        db.close();
      }
    });
  });
});
