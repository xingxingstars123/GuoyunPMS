<template>
  <view class="container">
    <!-- 未读消息提示 -->
    <view class="unread-banner" v-if="unreadCount > 0">
      <text class="unread-text">您有 {{ unreadCount }} 条未读消息</text>
      <text class="mark-read" @tap="markAllRead">全部已读</text>
    </view>

    <!-- 消息列表 -->
    <scroll-view scroll-y class="message-list">
      <view 
        class="message-item" 
        :class="{ unread: !msg.read }"
        v-for="msg in messages" 
        :key="msg.id"
        @tap="viewMessage(msg)"
      >
        <view class="message-icon" :class="'icon-' + msg.type">
          <text class="icon-text">{{ getIcon(msg.type) }}</text>
        </view>
        
        <view class="message-content">
          <view class="message-header">
            <text class="message-title">{{ msg.title }}</text>
            <text class="message-time">{{ formatTime(msg.created_at) }}</text>
          </view>
          <text class="message-body">{{ msg.content }}</text>
        </view>
        
        <view class="unread-dot" v-if="!msg.read"></view>
      </view>
      
      <view class="empty" v-if="messages.length === 0">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无消息</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      messages: [],
      unreadCount: 0
    }
  },
  onLoad() {
    this.loadMessages()
  },
  onShow() {
    this.loadMessages()
    // 清除底部导航栏的消息徽章
    this.updateTabBarBadge()
  },
  onPullDownRefresh() {
    this.loadMessages()
    setTimeout(() => {
      uni.stopPullDownRefresh()
    }, 1000)
  },
  methods: {
    // 模拟加载消息（实际项目从后端获取）
    loadMessages() {
      // 模拟消息数据
      this.messages = [
        {
          id: 1,
          type: 'order',
          title: '新订单提醒',
          content: '携程渠道新增订单 ORD202604150001，房间 301，请及时处理',
          created_at: new Date().toISOString(),
          read: false
        },
        {
          id: 2,
          type: 'sync',
          title: '渠道同步成功',
          content: '房间 302 状态已同步到携程、美团、飞猪、Booking、直销 5 个渠道',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          read: false
        },
        {
          id: 3,
          type: 'cleaning',
          title: '清洁任务提醒',
          content: '房间 201 清洁任务已完成，请查看',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          read: true
        },
        {
          id: 4,
          type: 'system',
          title: '系统通知',
          content: '欢迎使用国韵民宿管理系统 v1.1.0',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          read: true
        }
      ]
      
      // 计算未读数量
      this.unreadCount = this.messages.filter(m => !m.read).length
      
      // 更新底部导航栏徽章
      this.updateTabBarBadge()
    },
    
    getIcon(type) {
      const icons = {
        'order': '📋',
        'sync': '🔄',
        'cleaning': '🧹',
        'system': '📢'
      }
      return icons[type] || '📌'
    },
    
    formatTime(time) {
      const date = new Date(time)
      const now = new Date()
      const diff = now - date
      
      // 1分钟内
      if (diff < 60000) {
        return '刚刚'
      }
      // 1小时内
      if (diff < 3600000) {
        return Math.floor(diff / 60000) + '分钟前'
      }
      // 今天
      if (date.toDateString() === now.toDateString()) {
        return date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0')
      }
      // 昨天
      const yesterday = new Date(now)
      yesterday.setDate(now.getDate() - 1)
      if (date.toDateString() === yesterday.toDateString()) {
        return '昨天 ' + date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0')
      }
      // 更早
      return (date.getMonth() + 1) + '-' + date.getDate()
    },
    
    viewMessage(msg) {
      // 标记为已读
      msg.read = true
      this.unreadCount = this.messages.filter(m => !m.read).length
      this.updateTabBarBadge()
      
      // 显示消息详情
      uni.showModal({
        title: msg.title,
        content: msg.content + '\n\n时间: ' + new Date(msg.created_at).toLocaleString(),
        showCancel: false
      })
    },
    
    markAllRead() {
      this.messages.forEach(msg => {
        msg.read = true
      })
      this.unreadCount = 0
      this.updateTabBarBadge()
      
      uni.showToast({
        title: '已全部标记为已读',
        icon: 'success'
      })
    },
    
    updateTabBarBadge() {
      if (this.unreadCount > 0) {
        uni.setTabBarBadge({
          index: 4, // "我的" Tab 的索引（从0开始）
          text: String(this.unreadCount)
        })
      } else {
        uni.removeTabBarBadge({
          index: 4
        })
      }
    }
  }
}
</script>

<style scoped>
.container {
  height: 100vh;
  background: #F8F8F8;
  display: flex;
  flex-direction: column;
}

.unread-banner {
  background: #FFF7E6;
  padding: 20rpx 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #FFE7BA;
}

.unread-text {
  font-size: 26rpx;
  color: #FA8C16;
}

.mark-read {
  font-size: 26rpx;
  color: #1890FF;
}

.message-list {
  flex: 1;
}

.message-item {
  background: white;
  padding: 24rpx 30rpx;
  display: flex;
  align-items: flex-start;
  border-bottom: 1rpx solid #f0f0f0;
  position: relative;
}

.message-item.unread {
  background: #F6FFED;
}

.message-item:active {
  background: #f5f5f5;
}

.message-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.icon-order {
  background: #E6F7FF;
}

.icon-sync {
  background: #F6FFED;
}

.icon-cleaning {
  background: #FFF7E6;
}

.icon-system {
  background: #F9F0FF;
}

.icon-text {
  font-size: 40rpx;
}

.message-content {
  flex: 1;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.message-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.message-time {
  font-size: 24rpx;
  color: #999;
}

.message-body {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.unread-dot {
  position: absolute;
  top: 30rpx;
  right: 30rpx;
  width: 16rpx;
  height: 16rpx;
  background: #FF4D4F;
  border-radius: 50%;
}

.empty {
  text-align: center;
  padding: 150rpx 0;
}

.empty-icon {
  display: block;
  font-size: 100rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>
