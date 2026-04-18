/**
 * 支付宝Mock服务
 */
const mockData = require('../../utils/mockData');

class AlipayMockService {
  constructor() {
    console.log('🎭 使用Mock支付宝服务');
    this.mockOrders = new Map();
  }

  /**
   * APP支付（Mock）
   */
  async appPay(orderData) {
    console.log('📱 Mock支付宝APP支付:', orderData);
    
    await this.delay(500);

    if (Math.random() < 0.9) {
      const orderString = mockData.generateOrderString({
        app_id: 'mock_app_id',
        method: 'alipay.trade.app.pay',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString(),
        version: '1.0',
        biz_content: JSON.stringify({
          out_trade_no: orderData.orderNo,
          total_amount: orderData.amount,
          subject: orderData.subject
        })
      });

      this.mockOrders.set(orderData.orderNo, {
        status: 'pending',
        createdAt: Date.now()
      });

      return {
        success: true,
        data: orderString
      };
    } else {
      return {
        success: false,
        error: 'Mock支付失败'
      };
    }
  }

  /**
   * 网页支付（Mock）
   */
  async pagePay(orderData) {
    console.log('🌐 Mock支付宝网页支付:', orderData);
    
    await this.delay(500);

    if (Math.random() < 0.9) {
      const orderString = mockData.generateOrderString({
        app_id: 'mock_app_id',
        method: 'alipay.trade.page.pay',
        return_url: 'http://localhost:3000/payment/success',
        notify_url: 'http://localhost:3000/api/payment/callback/alipay',
        biz_content: JSON.stringify({
          out_trade_no: orderData.orderNo,
          total_amount: orderData.amount,
          subject: orderData.subject,
          product_code: 'FAST_INSTANT_TRADE_PAY'
        })
      });

      return {
        success: true,
        data: `https://openapi.alipay.com/gateway.do?${orderString}`
      };
    } else {
      return {
        success: false,
        error: 'Mock支付失败'
      };
    }
  }

  /**
   * 查询订单（Mock）
   */
  async queryOrder(orderNo) {
    console.log('🔍 Mock查询支付宝订单:', orderNo);
    
    await this.delay(300);

    const order = this.mockOrders.get(orderNo);
    
    if (!order) {
      return {
        success: false,
        error: '订单不存在'
      };
    }

    const isPaid = Date.now() - order.createdAt > 5000;
    
    if (isPaid && order.status === 'pending') {
      order.status = 'paid';
      order.paidAt = Date.now();
      order.tradeNo = mockData.generateId('trade_no');
    }

    return {
      success: true,
      data: {
        out_trade_no: orderNo,
        trade_no: order.tradeNo,
        trade_status: order.status === 'paid' ? 'TRADE_SUCCESS' : 'WAIT_BUYER_PAY',
        total_amount: '100.00',
        buyer_pay_amount: '100.00'
      }
    };
  }

  /**
   * 申请退款（Mock）
   */
  async refund(refundData) {
    console.log('💰 Mock支付宝退款:', refundData);
    
    await this.delay(800);

    if (Math.random() < 0.95) {
      return {
        success: true,
        data: {
          trade_no: mockData.generateId('trade_no'),
          out_trade_no: refundData.orderNo,
          buyer_logon_id: '136****1234',
          fund_change: 'Y',
          refund_fee: refundData.refundAmount,
          gmt_refund_pay: new Date().toISOString()
        }
      };
    } else {
      return {
        success: false,
        error: 'Mock退款失败'
      };
    }
  }

  /**
   * 验证签名（Mock）
   */
  checkNotifySign(params) {
    console.log('🔐 Mock验证支付宝签名');
    return true;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new AlipayMockService();
