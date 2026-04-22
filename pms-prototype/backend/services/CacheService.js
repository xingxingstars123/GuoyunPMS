/**
 * Redis缓存服务
 * 提供统一的缓存接口
 */

const redis = require('redis');
require('dotenv').config();

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * 连接Redis
   */
  async connect() {
    if (this.client) {
      return;
    }

    try {
      this.client = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379
        },
        password: process.env.REDIS_PASSWORD || undefined,
        // 连接失败时不抛出错误
        lazyConnect: true
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis连接错误:', err.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis连接成功');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (err) {
      console.warn('⚠️  Redis不可用,将使用无缓存模式:', err.message);
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * 获取缓存
   */
  async get(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      console.error('Cache get error:', err);
      return null;
    }
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttl - 过期时间(秒),默认300秒
   */
  async set(key, value, ttl = 300) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error('Cache set error:', err);
      return false;
    }
  }

  /**
   * 删除缓存
   */
  async del(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (err) {
      console.error('Cache del error:', err);
      return false;
    }
  }

  /**
   * 批量删除(支持通配符)
   */
  async delPattern(pattern) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (err) {
      console.error('Cache delPattern error:', err);
      return false;
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (err) {
      console.error('Cache exists error:', err);
      return false;
    }
  }

  /**
   * 设置过期时间
   */
  async expire(key, seconds) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (err) {
      console.error('Cache expire error:', err);
      return false;
    }
  }

  /**
   * 获取剩余TTL
   */
  async ttl(key) {
    if (!this.isConnected || !this.client) {
      return -1;
    }

    try {
      return await this.client.ttl(key);
    } catch (err) {
      console.error('Cache ttl error:', err);
      return -1;
    }
  }

  /**
   * 清空所有缓存
   */
  async flush() {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.flushDb();
      console.log('🗑️  Redis缓存已清空');
      return true;
    } catch (err) {
      console.error('Cache flush error:', err);
      return false;
    }
  }

  /**
   * 关闭连接
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      console.log('Redis连接已关闭');
    }
  }
}

// 单例模式
const cacheService = new CacheService();

module.exports = cacheService;
