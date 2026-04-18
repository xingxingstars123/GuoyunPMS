/**
 * 短信服务统一入口
 */
const config = require('../../config/integration');

// 根据配置选择真实服务或Mock服务
const aliyunSms = config.useMock 
  ? require('./aliyun.mock') 
  : null; // 真实服务暂未实现

class SmsService {
  constructor() {
    this.client = aliyunSms;
    this.useMock = config.useMock;
  }

  /**
   * 发送验证码
   */
  async sendVerifyCode(phone) {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      const result = await this.client.sendVerifyCode(phone, code);

      if (result.success) {
        // Mock环境下也保存验证码
        await this.saveVerifyCode(phone, code, 300);

        return {
          success: true,
          // Mock环境返回验证码方便测试
          ...(this.useMock && { mockCode: code })
        };
      } else {
        return result;
      }
    } catch (error) {
      console.error('发送验证码失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 验证验证码
   */
  async verifyCode(phone, code) {
    try {
      const savedCode = await this.getVerifyCode(phone);
      
      if (!savedCode) {
        return {
          success: false,
          error: '验证码已过期'
        };
      }

      if (savedCode !== code) {
        return {
          success: false,
          error: '验证码错误'
        };
      }

      await this.deleteVerifyCode(phone);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 发送订单通知
   */
  async sendOrderNotify(phone, orderData) {
    try {
      const result = await this.client.sendOrderNotify(phone, orderData);
      return result;
    } catch (error) {
      console.error('发送订单通知失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 简单的内存存储（实际应使用Redis）
  verifyCodeStore = new Map();

  async saveVerifyCode(phone, code, ttl) {
    this.verifyCodeStore.set(phone, {
      code,
      expiresAt: Date.now() + ttl * 1000
    });
    console.log(`保存验证码: ${phone} -> ${code} (${ttl}秒)`);
  }

  async getVerifyCode(phone) {
    const data = this.verifyCodeStore.get(phone);
    if (!data) return null;
    
    // 检查是否过期
    if (Date.now() > data.expiresAt) {
      this.verifyCodeStore.delete(phone);
      return null;
    }
    
    return data.code;
  }

  async deleteVerifyCode(phone) {
    this.verifyCodeStore.delete(phone);
    console.log(`删除验证码: ${phone}`);
  }
}

module.exports = new SmsService();
