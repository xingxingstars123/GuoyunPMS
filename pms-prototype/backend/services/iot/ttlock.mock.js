/**
 * TTLock智能门锁Mock服务
 */
const mockData = require('../../utils/mockData');

class TTLockMockService {
  constructor() {
    console.log('🎭 使用Mock智能门锁服务');
    this.mockPasswords = new Map();
    this.mockRecords = [];
  }

  /**
   * 生成临时密码（Mock）
   */
  async generatePassword(lockId, startDate, endDate) {
    console.log(`🔐 Mock生成门锁密码: ${lockId}`);
    
    await this.delay(500);

    if (Math.random() < 0.95) {
      // 生成6位数字密码
      const password = Math.floor(100000 + Math.random() * 900000).toString();
      const passwordId = mockData.generateId('pwd_id');

      this.mockPasswords.set(passwordId, {
        lockId,
        password,
        startDate,
        endDate,
        createdAt: Date.now()
      });

      console.log(`✅ 临时密码已生成: ${password} (${passwordId})`);

      return {
        success: true,
        password,
        passwordId,
        mockData: {
          lockId,
          validFrom: new Date(startDate).toISOString(),
          validUntil: new Date(endDate).toISOString()
        }
      };
    } else {
      return {
        success: false,
        error: 'Mock生成密码失败：门锁离线'
      };
    }
  }

  /**
   * 删除密码（Mock）
   */
  async deletePassword(lockId, passwordId) {
    console.log(`🗑️ Mock删除门锁密码: ${passwordId}`);
    
    await this.delay(300);

    const password = this.mockPasswords.get(passwordId);
    
    if (!password) {
      return {
        success: false,
        error: '密码不存在'
      };
    }

    this.mockPasswords.delete(passwordId);
    console.log(`✅ 密码已删除: ${passwordId}`);

    return { success: true };
  }

  /**
   * 获取开锁记录（Mock）
   */
  async getLockRecords(lockId, startDate, endDate) {
    console.log(`📋 Mock获取开锁记录: ${lockId}`);
    
    await this.delay(400);

    // 生成一些Mock开锁记录
    const records = [];
    const count = Math.floor(Math.random() * 10) + 5; // 5-15条记录
    
    for (let i = 0; i < count; i++) {
      records.push({
        recordId: mockData.generateId('record_id'),
        lockId,
        unlockMethod: Math.random() > 0.5 ? 'password' : 'fingerprint',
        username: '测试用户',
        unlockTime: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // 最近7天
        success: Math.random() > 0.1 // 90%成功率
      });
    }

    console.log(`✅ 获取到${records.length}条开锁记录`);

    return {
      success: true,
      records: records.sort((a, b) => b.unlockTime - a.unlockTime)
    };
  }

  /**
   * 获取门锁电量（Mock）
   */
  async getLockBattery(lockId) {
    console.log(`🔋 Mock获取门锁电量: ${lockId}`);
    
    await this.delay(300);

    const battery = Math.floor(Math.random() * 100); // 0-100%
    const isOnline = Math.random() > 0.1; // 90%在线率

    console.log(`✅ 门锁电量: ${battery}% (${isOnline ? '在线' : '离线'})`);

    return {
      success: true,
      battery,
      status: {
        isOnline,
        lastUpdate: Date.now(),
        signalStrength: Math.floor(Math.random() * 100)
      }
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new TTLockMockService();
