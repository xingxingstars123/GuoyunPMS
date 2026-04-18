/**
 * 第三方服务集成配置
 */
module.exports = {
  // Mock模式开关（开发环境使用Mock，生产环境使用真实服务）
  useMock: process.env.USE_MOCK !== 'false', // 默认true
  
  // 微信支付配置
  wechat: {
    appId: process.env.WECHAT_APP_ID || 'mock_app_id',
    mchId: process.env.WECHAT_MCH_ID || 'mock_mch_id',
    apiKey: process.env.WECHAT_API_KEY || 'mock_api_key',
    serialNo: process.env.WECHAT_SERIAL_NO || 'mock_serial_no',
    apiV3Key: process.env.WECHAT_API_V3_KEY || 'mock_apiv3_key',
    notifyUrl: process.env.WECHAT_NOTIFY_URL || 'http://localhost:3000/api/payment/callback/wechat'
  },

  // 支付宝配置
  alipay: {
    appId: process.env.ALIPAY_APP_ID || 'mock_app_id',
    privateKey: process.env.ALIPAY_PRIVATE_KEY || 'mock_private_key',
    publicKey: process.env.ALIPAY_PUBLIC_KEY || 'mock_public_key',
    notifyUrl: process.env.ALIPAY_NOTIFY_URL || 'http://localhost:3000/api/payment/callback/alipay',
    returnUrl: process.env.ALIPAY_RETURN_URL || 'http://localhost:3000/payment/success'
  },

  // 短信服务配置
  sms: {
    provider: process.env.SMS_PROVIDER || 'aliyun', // aliyun 或 tencent
    aliyun: {
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || 'mock_access_key_id',
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || 'mock_access_key_secret',
      signName: process.env.ALIYUN_SMS_SIGN_NAME || 'Mock签名'
    },
    tencent: {
      secretId: process.env.TENCENT_SECRET_ID || 'mock_secret_id',
      secretKey: process.env.TENCENT_SECRET_KEY || 'mock_secret_key',
      appId: process.env.TENCENT_SMS_APP_ID || 'mock_app_id',
      signName: process.env.TENCENT_SMS_SIGN_NAME || 'Mock签名'
    }
  },

  // 邮件服务配置
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || 'mock@example.com',
    pass: process.env.EMAIL_PASS || 'mock_password',
    fromName: process.env.EMAIL_FROM_NAME || 'PMS系统'
  },

  // TTLock智能门锁配置
  ttlock: {
    clientId: process.env.TTLOCK_CLIENT_ID || 'mock_client_id',
    clientSecret: process.env.TTLOCK_CLIENT_SECRET || 'mock_client_secret'
  },

  // 应用配置
  app: {
    url: process.env.APP_URL || 'http://localhost:3000'
  }
};
