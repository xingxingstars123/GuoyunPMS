<template>
  <view class="container">
    <!-- 个人信息 -->
    <view class="profile-card">
      <view class="avatar-section">
        <image class="avatar" src="/static/images/avatar-default.png" mode="aspectFill"></image>
        <view class="user-info">
          <text class="username">管理员</text>
          <text class="role">系统管理员</text>
        </view>
      </view>
    </view>

    <!-- 统计数据 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-value">{{ stats.todayOrders }}</text>
        <text class="stat-label">今日订单</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">¥{{ stats.todayRevenue }}</text>
        <text class="stat-label">今日营收</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ stats.totalRooms }}</text>
        <text class="stat-label">房间总数</text>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-group">
        <view class="menu-item" @tap="navigateTo('/pages/messages/messages')">
          <view class="menu-left">
            <text class="menu-icon">🔔</text>
            <text class="menu-label">消息通知</text>
          </view>
          <view class="menu-right">
            <view class="badge" v-if="unreadCount > 0">{{ unreadCount }}</view>
            <text class="menu-arrow">→</text>
          </view>
        </view>
        <view class="menu-item" @tap="navigateTo('/pages/cleaning/cleaning')">
          <view class="menu-left">
            <text class="menu-icon">🧹</text>
            <text class="menu-label">清洁管理</text>
          </view>
          <text class="menu-arrow">→</text>
        </view>
        <view class="menu-item" @tap="navigateTo('/pages/customers/customers')">
          <view class="menu-left">
            <text class="menu-icon">👥</text>
            <text class="menu-label">客户管理</text>
          </view>
          <text class="menu-arrow">→</text>
        </view>
        <view class="menu-item" @tap="showQRCode">
          <view class="menu-left">
            <text class="menu-icon">📱</text>
            <text class="menu-label">扫码入住</text>
          </view>
          <text class="menu-arrow">→</text>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @tap="viewNotices">
          <view class="menu-left">
            <text class="menu-icon">📢</text>
            <text class="menu-label">系统公告</text>
          </view>
          <text class="menu-arrow">→</text>
        </view>
        <view class="menu-item" @tap="viewHelp">
          <view class="menu-left">
            <text class="menu-icon">❓</text>
            <text class="menu-label">帮助中心</text>
          </view>
          <text class="menu-arrow">→</text>
        </view>
        <view class="menu-item" @tap="viewSettings">
          <view class="menu-left">
            <text class="menu-icon">⚙️</text>
            <text class="menu-label">系统设置</text>
          </view>
          <text class="menu-arrow">→</text>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @tap="viewAbout">
          <view class="menu-left">
            <text class="menu-icon">ℹ️</text>
            <text class="menu-label">关于我们</text>
          </view>
          <view class="menu-right">
            <text class="version">v1.0.0</text>
            <text class="menu-arrow">→</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section">
      <button class="logout-btn" @tap="logout">退出登录</button>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/request.js'

export default {
  data() {
    return {
      stats: {
        todayOrders: 0,
        todayRevenue: 0,
        totalRooms: 0
      },
      unreadCount: 2 // 未读消息数（实际项目从 API 获取）
    }
  },
  onLoad() {
    this.loadStats()
  },
  onShow() {
    this.loadStats()
  },
  methods: {
    async loadStats() {
      try {
        const res = await api.getDashboardStats()
        this.stats = {
          todayOrders: 0, // 可以从订单列表计算
          todayRevenue: res.revenue || 0,
          totalRooms: res.availableRooms || 0
        }
      } catch (error) {
        console.error('加载统计数据失败:', error)
      }
    },
    navigateTo(url) {
      uni.navigateTo({ url })
    },
    showQRCode() {
      uni.showModal({
        title: '扫码入住',
        content: '此功能需要集成扫码模块，敬请期待',
        showCancel: false
      })
    },
    viewNotices() {
      uni.showModal({
        title: '系统公告',
        content: '欢迎使用国韵民宿管理系统！\n\n当前版本: v1.0.0\n更新日期: 2026-04-15\n\n新功能:\n- 房态日历\n- 创建订单\n- 清洁管理',
        showCancel: false
      })
    },
    viewHelp() {
      uni.showModal({
        title: '帮助中心',
        content: '使用问题请联系:\n\n技术支持: 400-123-4567\n邮箱: support@guoyunminsu.com\n工作时间: 9:00-18:00',
        showCancel: false
      })
    },
    viewSettings() {
      uni.navigateTo({ url: '/pages/settings/settings' })
    },
    viewAbout() {
      uni.showModal({
        title: '关于国韵民宿',
        content: '国韵民宿智能管理系统\n\n版本: v1.0.0\n开发: OpenClaw AI\n日期: 2026-04-15\n\n© 2026 国韵民宿 All Rights Reserved',
        showCancel: false
      })
    },
    logout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.showToast({
              title: '已退出登录',
              icon: 'success'
            })
            // 实际项目中这里应该清除登录信息
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #F8F8F8;
  padding-bottom: 20rpx;
}

.profile-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
  margin-bottom: 20rpx;
}

.avatar-section {
  display: flex;
  align-items: center;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid rgba(255,255,255,0.3);
  background: white;
}

.user-info {
  flex: 1;
  margin-left: 30rpx;
}

.username {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: white;
  margin-bottom: 8rpx;
}

.role {
  display: block;
  font-size: 24rpx;
  color: rgba(255,255,255,0.9);
}

.stats-card {
  display: flex;
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin: 0 20rpx 20rpx;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.stat-item {
  flex: 1;
  text-align: center;
  border-right: 1rpx solid #eee;
}

.stat-item:last-child {
  border-right: none;
}

.stat-value {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.menu-section {
  padding: 0 20rpx;
}

.menu-group {
  background: white;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background: #f5f5f5;
}

.menu-left {
  display: flex;
  align-items: center;
}

.menu-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.menu-label {
  font-size: 28rpx;
  color: #333;
}

.menu-right {
  display: flex;
  align-items: center;
}

.version {
  font-size: 24rpx;
  color: #999;
  margin-right: 10rpx;
}

.menu-right {
  display: flex;
  align-items: center;
}

.badge {
  background: #FF4D4F;
  color: white;
  font-size: 20rpx;
  padding: 2rpx 10rpx;
  border-radius: 20rpx;
  margin-right: 10rpx;
  min-width: 32rpx;
  text-align: center;
}

.menu-arrow {
  font-size: 28rpx;
  color: #999;
}

.logout-section {
  padding: 0 20rpx;
  margin-top: 40rpx;
}

.logout-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: white;
  border: 1rpx solid #eee;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #FF4D4F;
}
</style>
