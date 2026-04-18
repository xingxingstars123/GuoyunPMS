/**
 * 微信支付Mock服务
 */
const mockData = require('../../utils/mockData');

class WechatPayMockService {
  constructor() {
    console.log('🎭 使用Mock微信支付服务');
    // 模拟订单存储（实际项目会存数据库）
    this.mockOrders = new Map();
  }

  /**
   * 小程序支付（Mock）
   */
  async miniProgramPay(orderData) {
    console.log('📱 Mock微信小程序支付:', orderData);
    
    // 模拟网络延迟
    await this.delay(500);

    // 模拟90%成功率
    if (Math.random() < 0.9) {
      const prepayId = mockData.generateId('prepay_id');
      
      this.mockOrders.set(orderData.orderNo, {
        status: 'pending',
        prepayId,
        createdAt: Date.now()
      });

      return {
        success: true,
        data: {
          prepay_id: prepayId,
          // 小程序调起支付所需参数
          package: `prepay_id=${prepayId}`,
          nonceStr: mockData.randomString(32),
          timeStamp: String(Math.floor(Date.now() / 1000)),
          signType: 'RSA',
          paySign: mockData.randomString(64)
        }
      };
    } else {
      // 模拟失败
      return {
        success: false,
        error: 'Mock支付失败：余额不足'
      };
    }
  }

  /**
   * H5支付（Mock）
   */
  async h5Pay(orderData) {
    console.log('🌐 Mock微信H5支付:', orderData);
    
    await this.delay(500);

    if (Math.random() < 0.9) {
      const prepayId = mockData.generateId('prepay_id');
      
      return {
        success: true,
        data: {
          h5_url: `https://wx.tenpay.com/cgi-bin/mmpayweb-bin/checkmweb?prepay_id=${prepayId}`,
          prepay_id: prepayId
        }
      };
    } else {
      return {
        success: false,
        error: 'Mock支付失败：订单异常'
      };
    }
  }

  /**
   * 查询订单（Mock）
   */
  async queryOrder(orderNo) {
    console.log('🔍 Mock查询微信订单:', orderNo);
    
    await this.delay(300);

    const order = this.mockOrders.get(orderNo);
    
    if (!order) {
      return {
        success: false,
        error: '订单不存在'
      };
    }

    // 模拟订单状态变化（创建5秒后自动支付成功）
    const isPaid = Date.now() - order.createdAt > 5000;
    
    if (isPaid && order.status === 'pending') {
      order.status = 'paid';
      order.paidAt = Date.now();
      order.transactionId = mockData.generateId('transaction_id');
    }

    return {
      success: true,
      data: {
        out_trade_no: orderNo,
        transaction_id: order.transactionId,
        trade_state: order.status === 'paid' ? 'SUCCESS' : 'NOTPAY',
        trade_state_desc: order.status === 'paid' ? '支付成功' : '未支付',
        success_time: order.paidAt ? new Date(order.paidAt).toISOString() : null
      }
    };
  }

  /**
   * 申请退款（Mock）
   */
  async refund(refundData) {
    console.log('💰 Mock微信退款:', refundData);
    
    await this.delay(800);

    // 模拟95%成功率
    if (Math.random() < 0.95) {
      return {
        success: true,
        data: {
          refund_id: mockData.generateId('refund_id'),
          out_refund_no: refundData.refundNo,
          transaction_id: mockData.generateId('transaction_id'),
          out_trade_no: refundData.orderNo,
          status: 'SUCCESS',
          success_time: new Date().toISOString()
        }
      };
    } else {
      return {
        success: false,
        error: 'Mock退款失败：订单不支持退款'
      };
    }
  }

  /**
   * 验证签名（Mock）
   */
  verifySignature(signature, timestamp, nonce, body) {
    console.log('🔐 Mock验证微信签名');
    // Mock环境下总是验证通过
    return true;
  }

  /**
   * 模拟延迟
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new WechatPayMockService();
