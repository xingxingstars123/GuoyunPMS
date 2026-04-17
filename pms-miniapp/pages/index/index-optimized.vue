<template>
  <view class="container">
    <!-- 顶部欢迎区 -->
    <view class="welcome-section">
      <view class="welcome-content">
        <text class="welcome-title">早安,管理员 👋</text>
        <text class="welcome-subtitle">{{ currentDate }}</text>
      </view>
      <view class="notification-btn" @tap="navigateTo('/pages/messages/messages')">
        <text class="notification-icon">🔔</text>
        <view v-if="unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</view>
      </view>
    </view>

    <!-- 核心统计卡片 -->
    <view class="stats-cards">
      <view class="stat-card primary-card">
        <view class="card-icon-wrapper primary-icon">
          <text class="card-emoji">💰</text>
        </view>
        <view class="card-content">
          <text class="card-label">今日营业额</text>
          <text class="card-value">¥{{ stats.revenue }}</text>
          <text class="card-trend positive">+12.5% ↑</text>
        </view>
      </view>
      
      <view class="stat-card-row">
        <view class="stat-card mini-card">
          <view class="card-icon-wrapper blue-icon">
            <text class="card-emoji-small">🏠</text>
          </view>
          <view class="mini-card-content">
            <text class="mini-card-value">{{ stats.availableRooms }}</text>
            <text class="mini-card-label">可售房间</text>
          </view>
        </view>
        
        <view class="stat-card mini-card">
          <view class="card-icon-wrapper green-icon">
            <text class="card-emoji-small">📋</text>
          </view>
          <view class="mini-card-content">
            <text class="mini-card-value">{{ stats.roomStatus.checkedIn }}</text>
            <text class="mini-card-label">在住订单</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 房态快览 -->
    <view class="room-status-card">
      <view class="card-header">
        <text class="card-title">房态快览</text>
        <text class="view-all" @tap="navigateTo('/pages/room-calendar/room-calendar')">查看详情 →</text>
      </view>
      <view class="status-grid">
        <view class="status-item">
          <view class="status-indicator blue"></view>
          <text class="status-count">{{ stats.roomStatus.preArrival }}</text>
          <text class="status-label">待入住</text>
        </view>
        <view class="status-item">
          <view class="status-indicator green"></view>
          <text class="status-count">{{ stats.roomStatus.checkedIn }}</text>
          <text class="status-label">已入住</text>
        </view>
        <view class="status-item">
          <view class="status-indicator orange"></view>
          <text class="status-count">{{ stats.roomStatus.preDeparture }}</text>
          <text class="status-label">待离店</text>
        </view>
        <view class="status-item">
          <view class="status-indicator gray"></view>
          <text class="status-count">{{ stats.roomStatus.checkedOut }}</text>
          <text class="status-label">已离店</text>
        </view>
        <view class="status-item">
          <view class="status-indicator purple"></view>
          <text class="status-count">{{ stats.roomStatus.pending }}</text>
          <text class="status-label">待处理</text>
        </view>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-actions-card">
      <view class="card-header">
        <text class="card-title">快捷操作</text>
      </view>
      <view class="actions-grid">
        <view class="action-item" @tap="navigateTo('/pages/create-order/create-order')">
          <view class="action-icon-wrapper primary-bg">
            <text class="action-icon">➕</text>
          </view>
          <text class="action-label">创建订单</text>
        </view>
        <view class="action-item" @tap="navigateTo('/pages/orders/orders')">
          <view class="action-icon-wrapper blue-bg">
            <text class="action-icon">📋</text>
          </view>
          <text class="action-label">订单管理</text>
        </view>
        <view class="action-item" @tap="navigateTo('/pages/customers/customers')">
          <view class="action-icon-wrapper green-bg">
            <text class="action-icon">👥</text>
          </view>
          <text class="action-label">客户列表</text>
        </view>
        <view class="action-item" @tap="navigateTo('/pages/cleaning/cleaning')">
          <view class="action-icon-wrapper orange-bg">
            <text class="action-icon">🧹</text>
          </view>
          <text class="action-label">清洁管理</text>
        </view>
        <view class="action-item" @tap="navigateTo('/pages/finance/finance')">
          <view class="action-icon-wrapper purple-bg">
            <text class="action-icon">📊</text>
          </view>
          <text class="action-label">财务统计</text>
        </view>
        <view class="action-item" @tap="navigateTo('/pages/settings/settings')">
          <view class="action-icon-wrapper gray-bg">
            <text class="action-icon">⚙️</text>
          </view>
          <text class="action-label">系统设置</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/request.js'

export default {
  data() {
    return {
      currentDate: '',
      unreadCount: 99,
      stats: {
        revenue: 0,
        availableRooms: 0,
        roomStatus: {
          preArrival: 0,
          checkedIn: 0,
          preDeparture: 0,
          checkedOut: 0,
          pending: 0
        }
      }
    }
  },
  onLoad() {
    this.updateDate()
    this.loadStats()
  },
  onShow() {
    this.loadStats()
  },
  onPullDownRefresh() {
    this.loadStats()
    setTimeout(() => {
      uni.stopPullDownRefresh()
    }, 1000)
  },
  methods: {
    updateDate() {
      const now = new Date()
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      const month = now.getMonth() + 1
      const date = now.getDate()
      const day = days[now.getDay()]
      this.currentDate = `${month}月${date}日 ${day}`
    },
    async loadStats() {
      try {
        const data = await api.getDashboardStats()
        this.stats = data
      } catch (error) {
        console.error('加载统计数据失败:', error)
        // 使用模拟数据
        this.stats = {
          revenue: 8650,
          availableRooms: 12,
          roomStatus: {
            preArrival: 5,
            checkedIn: 8,
            preDeparture: 3,
            checkedOut: 2,
            pending: 1
          }
        }
      }
    },
    navigateTo(url) {
      uni.navigateTo({ url })
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #F5F7FA;
  padding-bottom: 20rpx;
}

/* 顶部欢迎区 */
.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx 30rpx;
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
}

.welcome-content {
  flex: 1;
}

.welcome-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: white;
  margin-bottom: 8rpx;
}

.welcome-subtitle {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.notification-btn {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.notification-icon {
  font-size: 36rpx;
}

.badge {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  min-width: 32rpx;
  height: 32rpx;
  background: #FF4757;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  color: white;
  font-weight: bold;
  padding: 0 8rpx;
  border: 3rpx solid #4A90E2;
}

/* 统计卡片 */
.stats-cards {
  padding: 0 30rpx;
  margin-top: -40rpx;
}

.stat-card {
  background: white;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(74, 144, 226, 0.12);
  margin-bottom: 20rpx;
}

.primary-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-icon-wrapper {
  width: 100rpx;
  height: 100rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.primary-icon {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.card-emoji {
  font-size: 48rpx;
}

.card-content {
  flex: 1;
}

.card-label {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 8rpx;
}

.card-value {
  display: block;
  font-size: 52rpx;
  font-weight: bold;
  color: white;
  margin-bottom: 8rpx;
}

.card-trend {
  display: inline-block;
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.stat-card-row {
  display: flex;
  gap: 20rpx;
}

.mini-card {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 24rpx;
}

.blue-icon {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
}

.green-icon {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
}

.card-emoji-small {
  font-size: 36rpx;
}

.mini-card-content {
  flex: 1;
  margin-left: 20rpx;
}

.mini-card-value {
  display: block;
  font-size: 44rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 4rpx;
}

.mini-card-label {
  display: block;
  font-size: 24rpx;
  color: #999;
}

/* 房态快览卡片 */
.room-status-card {
  background: white;
  border-radius: 24rpx;
  padding: 32rpx;
  margin: 0 30rpx 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.view-all {
  font-size: 26rpx;
  color: #4A90E2;
}

.status-grid {
  display: flex;
  justify-content: space-between;
}

.status-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
}

.status-indicator {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  margin-bottom: 12rpx;
}

.status-indicator.blue { background: #4A90E2; }
.status-indicator.green { background: #2ecc71; }
.status-indicator.orange { background: #f39c12; }
.status-indicator.gray { background: #95a5a6; }
.status-indicator.purple { background: #9b59b6; }

.status-count {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.status-label {
  font-size: 22rpx;
  color: #999;
}

/* 快捷操作卡片 */
.quick-actions-card {
  background: white;
  border-radius: 24rpx;
  padding: 32rpx;
  margin: 0 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24rpx;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
}

.action-icon-wrapper {
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
  transition: all 0.3s;
}

.action-item:active .action-icon-wrapper {
  transform: scale(0.9);
}

.primary-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.blue-bg {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
}

.green-bg {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
}

.orange-bg {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
}

.purple-bg {
  background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
}

.gray-bg {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
}

.action-icon {
  font-size: 40rpx;
}

.action-label {
  font-size: 24rpx;
  color: #666;
  text-align: center;
}
</style>
