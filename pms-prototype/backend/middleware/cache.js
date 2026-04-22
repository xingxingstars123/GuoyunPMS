/**
 * 缓存中间件
 * 自动缓存GET请求的响应
 */

const cacheService = require('../services/CacheService');

/**
 * 缓存中间件
 * @param {string|function} keyOrFn - 缓存键或生成函数
 * @param {number} ttl - 过期时间(秒),默认300
 */
const cacheMiddleware = (keyOrFn, ttl = 300) => {
  return async (req, res, next) => {
    // 只缓存GET请求
    if (req.method !== 'GET') {
      return next();
    }

    // 生成缓存键
    const cacheKey = typeof keyOrFn === 'function' 
      ? keyOrFn(req) 
      : keyOrFn;

    try {
      // 尝试从缓存获取
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        // 添加缓存命中标记
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      // 缓存未命中,拦截res.json保存缓存
      res.setHeader('X-Cache', 'MISS');
      
      const originalJson = res.json.bind(res);
      res.json = async (data) => {
        // 只缓存成功响应
        if (data && data.success !== false) {
          await cacheService.set(cacheKey, data, ttl);
        }
        return originalJson(data);
      };

      next();
    } catch (err) {
      // 缓存错误不影响业务
      console.error('Cache middleware error:', err);
      next();
    }
  };
};

/**
 * 自动生成缓存键
 * 基于路径和查询参数
 */
const autoCacheKey = (req) => {
  const path = req.path;
  const query = JSON.stringify(req.query);
  return `cache:${path}:${query}`;
};

/**
 * 使缓存失效
 */
const invalidateCache = async (pattern) => {
  try {
    await cacheService.delPattern(pattern);
    console.log(`🗑️  缓存失效: ${pattern}`);
  } catch (err) {
    console.error('Invalidate cache error:', err);
  }
};

/**
 * 缓存装饰器(用于服务层方法)
 */
const cacheable = (keyPrefix, ttl = 300) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;
      
      // 尝试从缓存获取
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 保存缓存
      await cacheService.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
};

module.exports = {
  cacheMiddleware,
  autoCacheKey,
  invalidateCache,
  cacheable,
  cacheService
};
