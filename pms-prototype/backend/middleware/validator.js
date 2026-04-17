/**
 * 参数验证中间件
 */

const { BusinessError, ErrorCodes } = require('./errorHandler');

/**
 * 验证规则
 */
const Rules = {
  required: (value) => value !== undefined && value !== null && value !== '',
  string: (value) => typeof value === 'string',
  number: (value) => typeof value === 'number' || !isNaN(Number(value)),
  positive: (value) => Number(value) > 0,
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: (value) => /^1[3-9]\d{9}$/.test(value),
  date: (value) => !isNaN(Date.parse(value)),
  in: (allowedValues) => (value) => allowedValues.includes(value)
};

/**
 * 验证器
 */
function validate(schema) {
  return (req, res, next) => {
    const errors = [];
    const data = { ...req.body, ...req.query, ...req.params };
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      for (const [ruleName, ruleValue] of Object.entries(rules)) {
        const rule = typeof Rules[ruleName] === 'function' 
          ? Rules[ruleName] 
          : Rules[ruleName](ruleValue);
        
        if (!rule(value)) {
          errors.push(`${field} 验证失败: ${ruleName}`);
        }
      }
    }
    
    if (errors.length > 0) {
      throw new BusinessError(ErrorCodes.INVALID_PARAMS, errors.join('; '));
    }
    
    next();
  };
}

/**
 * 快捷验证函数
 */
const validators = {
  /**
   * 创建订单参数验证
   */
  createOrder: validate({
    roomId: { required: true, number: true, positive: true },
    customerName: { required: true, string: true },
    customerPhone: { required: true, phone: true },
    checkIn: { required: true, date: true },
    checkOut: { required: true, date: true },
    totalPrice: { required: true, number: true, positive: true },
    channel: { required: true, string: true }
  }),
  
  /**
   * 查询订单参数验证
   */
  queryOrders: validate({
    status: { in: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'] },
    channel: { string: true }
  }),
  
  /**
   * 创建清洁任务验证
   */
  createCleaningTask: validate({
    roomId: { required: true, number: true },
    assignedTo: { required: true, string: true },
    scheduledTime: { required: true, date: true }
  })
};

module.exports = {
  validate,
  validators,
  Rules
};
