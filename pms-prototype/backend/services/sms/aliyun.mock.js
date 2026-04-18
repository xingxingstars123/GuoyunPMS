/**
 * 阿里云短信Mock服务
 */
const mockData = require('../../utils/mockData');

class AliyunSmsMockService {
  constructor() {
    console.log('🎭 使用Mock阿里云短信服务');
    // 存储已发送的验证码（开发环境可查看）
    this.sentCodes = new Map();
  }

  /**
   * 发送验证码（Mock）
   */
  async sendVerifyCode(phone, code) {
    console.log(`📱 Mock发送验证码到 ${phone}: ${code}`);
    
    // 模拟网络延迟
    await this.delay(300);

    // 保存验证码（方便开发时查看）
    this.sentCodes.set(phone, {
      code,
      sentAt: Date.now()
    });

    // 在控制台显示验证码（开发环境）
    console.log(`✅ 验证码已发送: ${code} (${phone})`);

    // 模拟98%成功率
    if (Math.random() < 0.98) {
      return {
        success: true,
        mockData: {
          code, // Mock环境返回验证码方便测试
          phone,
          provider: 'aliyun_mock'
        }
      };
    } else {
      return {
        success: false,
        error: 'Mock发送失败：网络异常'
      };
    }
  }

  /**
   * 发送订单通知（Mock）
   */
  async sendOrderNotify(phone, orderData) {
    console.log(`📱 Mock发送订单通知到 ${phone}:`, orderData);
    
    await this.delay(300);

    console.log(`✅ 订单通知已发送: 订单${orderData.orderNo} (${phone})`);

    return {
      success: true,
      mockData: {
        phone,
        orderNo: orderData.orderNo,
        provider: 'aliyun_mock'
      }
    };
  }

  /**
   * 获取最近发送的验证码（仅Mock环境）
   */
  getLastCode(phone) {
    const data = this.sentCodes.get(phone);
    return data ? data.code : null;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new AliyunSmsMockService();
