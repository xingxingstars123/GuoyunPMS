/**
 * WebSocket实时通知服务
 * 用于订单、任务等实时推送
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
require('dotenv').config();

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> WebSocket
  }

  /**
   * 启动WebSocket服务器
   */
  start(port = 3102) {
    this.wss = new WebSocket.Server({ 
      port,
      // 验证连接
      verifyClient: (info, callback) => {
        // 允许所有连接(认证在连接后处理)
        callback(true);
      }
    });

    this.wss.on('connection', (ws, req) => {
      console.log('🔌 WebSocket客户端连接');

      // 处理认证消息
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);

          // 认证消息
          if (data.type === 'auth') {
            this.handleAuth(ws, data.token);
          }
        } catch (err) {
          ws.send(JSON.stringify({
            type: 'error',
            message: '消息格式错误'
          }));
        }
      });

      ws.on('close', () => {
        // 从clients中移除
        for (const [userId, client] of this.clients.entries()) {
          if (client === ws) {
            this.clients.delete(userId);
            console.log(`🔌 用户 ${userId} 断开连接`);
            break;
          }
        }
      });

      ws.on('error', (err) => {
        console.error('WebSocket错误:', err);
      });

      // 发送欢迎消息
      ws.send(JSON.stringify({
        type: 'welcome',
        message: '请发送认证token',
        timestamp: Date.now()
      }));
    });

    console.log(`🔌 WebSocket服务已启动: ws://localhost:${port}`);
  }

  /**
   * 处理认证
   */
  handleAuth(ws, token) {
    try {
      // 验证JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 保存连接
      this.clients.set(decoded.id, ws);

      // 发送认证成功消息
      ws.send(JSON.stringify({
        type: 'auth_success',
        user: {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role
        },
        timestamp: Date.now()
      }));

      console.log(`✅ 用户 ${decoded.username} (${decoded.id}) 认证成功`);
    } catch (err) {
      ws.send(JSON.stringify({
        type: 'auth_failed',
        message: 'Token无效或已过期',
        timestamp: Date.now()
      }));

      ws.close();
    }
  }

  /**
   * 发送通知给指定用户
   */
  notify(userId, event, data) {
    const ws = this.clients.get(userId);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'notification',
        event,
        data,
        timestamp: Date.now()
      }));
      return true;
    }

    return false;
  }

  /**
   * 广播消息给所有在线用户
   */
  broadcast(event, data, filter = null) {
    let count = 0;

    for (const [userId, ws] of this.clients.entries()) {
      if (filter && !filter(userId)) {
        continue;
      }

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'notification',
          event,
          data,
          timestamp: Date.now()
        }));
        count++;
      }
    }

    return count;
  }

  /**
   * 发送给特定角色的用户
   */
  notifyByRole(role, event, data) {
    // 注意: 这里需要维护userId->role的映射
    // 简化版本: 广播给所有人(客户端根据角色过滤)
    return this.broadcast(event, { ...data, targetRole: role });
  }

  /**
   * 获取在线用户数
   */
  getOnlineCount() {
    return this.clients.size;
  }

  /**
   * 获取在线用户列表
   */
  getOnlineUsers() {
    return Array.from(this.clients.keys());
  }

  /**
   * 关闭服务
   */
  close() {
    if (this.wss) {
      this.wss.close();
      this.clients.clear();
      console.log('WebSocket服务已关闭');
    }
  }
}

// 单例模式
const wsService = new WebSocketService();

// 便捷方法
const notify = (userId, event, data) => wsService.notify(userId, event, data);
const broadcast = (event, data) => wsService.broadcast(event, data);
const notifyAdmins = (event, data) => wsService.notifyByRole('ADMIN', event, data);

module.exports = {
  wsService,
  notify,
  broadcast,
  notifyAdmins
};
