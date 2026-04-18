/**
 * 邮件服务Mock
 */
const mockData = require('../../utils/mockData');

class EmailMockService {
  constructor() {
    console.log('🎭 使用Mock邮件服务');
    this.sentEmails = [];
  }

  /**
   * 发送邮件（Mock）
   */
  async sendEmail(to, subject, html) {
    console.log(`📧 Mock发送邮件到 ${to}`);
    console.log(`主题: ${subject}`);
    console.log(`内容预览: ${html.substring(0, 100)}...`);
    
    await this.delay(400);

    const emailId = mockData.generateId('email_id');
    
    this.sentEmails.push({
      id: emailId,
      to,
      subject,
      html,
      sentAt: Date.now()
    });

    console.log(`✅ 邮件已发送 (ID: ${emailId})`);

    if (Math.random() < 0.95) {
      return {
        success: true,
        messageId: emailId
      };
    } else {
      return {
        success: false,
        error: 'Mock发送失败：SMTP连接超时'
      };
    }
  }

  /**
   * 发送订单确认邮件（Mock）
   */
  async sendOrderConfirmation(email, orderData) {
    const html = `
      <h2>订单确认</h2>
      <p>尊敬的用户，您的订单已确认：</p>
      <ul>
        <li>订单号：${orderData.orderNo}</li>
        <li>房间：${orderData.roomName}</li>
        <li>金额：¥${orderData.amount}</li>
        <li>入住日期：${orderData.checkInDate}</li>
        <li>退房日期：${orderData.checkOutDate}</li>
      </ul>
      <p>感谢您的选择！</p>
    `;

    return await this.sendEmail(email, '订单确认通知', html);
  }

  /**
   * 发送密码重置邮件（Mock）
   */
  async sendPasswordReset(email, resetToken) {
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
    
    const html = `
      <h2>密码重置</h2>
      <p>您请求重置密码，请点击以下链接：</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>此链接30分钟内有效。</p>
      <p>如果这不是您的操作，请忽略此邮件。</p>
    `;

    return await this.sendEmail(email, '密码重置请求', html);
  }

  /**
   * 获取最近发送的邮件（仅Mock环境）
   */
  getRecentEmails(limit = 10) {
    return this.sentEmails.slice(-limit);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new EmailMockService();
