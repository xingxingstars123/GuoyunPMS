/**
 * Mock数据生成器
 * 用于生成各种测试数据
 */
class MockDataGenerator {
  /**
   * 生成随机ID
   */
  generateId(prefix = 'id') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `${prefix}_${timestamp}${random}`;
  }

  /**
   * 生成随机字符串
   */
  randomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 生成订单字符串（支付宝格式）
   */
  generateOrderString(params) {
    const paramStr = Object.keys(params)
      .sort()
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    // 添加Mock签名
    return `${paramStr}&sign=${this.randomString(64)}`;
  }

  /**
   * 生成手机号
   */
  generatePhoneNumber() {
    const prefixes = ['130', '131', '132', '133', '135', '136', '137', '138', '139'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return prefix + suffix;
  }

  /**
   * 生成邮箱
   */
  generateEmail() {
    const domains = ['gmail.com', 'qq.com', '163.com', 'hotmail.com'];
    const name = this.randomString(8);
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${name}@${domain}`;
  }

  /**
   * 生成订单号
   */
  generateOrderNo() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PMS${timestamp}${random}`;
  }
}

module.exports = new MockDataGenerator();
