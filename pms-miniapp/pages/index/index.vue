<template>
  <view class="container">
    <!-- 顶部统计卡片 -->
    <view class="stats-header">
      <view class="stat-card revenue-card">
        <text class="stat-label">当日营业额</text>
        <text class="stat-value">¥ {{ stats.revenue }}</text>
      </view>
      <view class="stat-card room-card">
        <text class="stat-label">可售（间）</text>
        <text class="stat-value">{{ stats.availableRooms }}</text>
      </view>
    </view>

    <!-- 房态统计条 -->
    <view class="room-status-bar">
      <view class="status-item">
        <text class="status-label">预订</text>
        <text class="status-value">{{ stats.roomStatus.preArrival }}</text>
      </view>
      <view class="status-item">
        <text class="status-label">已抵</text>
        <text class="status-value">{{ stats.roomStatus.checkedIn }}</text>
      </view>
      <view class="status-item">
        <text class="status-label">预离</text>
        <text class="status-value">{{ stats.roomStatus.preDeparture }}</text>
      </view>
      <view class="status-item">
        <text class="status-label">已离</text>
        <text class="status-value">{{ stats.roomStatus.checkedOut }}</text>
      </view>
      <view class="status-item">
        <text class="status-label">新办</text>
        <text class="status-value">{{ stats.roomStatus.pending }}</text>
      </view>
    </view>

    <!-- 功能模块网格 -->
    <view class="function-grid">
      <view class="grid-item" @tap="navigateTo('/pages/orders/orders')">
        <text class="grid-icon">📋</text>
        <text class="grid-label">订单管理</text>
      </view>
      <view class="grid-item" @tap="navigateTo('/pages/customers/customers')">
        <text class="grid-icon">👥</text>
        <text class="grid-label">客户列表</text>
      </view>
      <view class="grid-item" @tap="navigateTo('/pages/finance/finance')">
        <text class="grid-icon">📊</text>
        <text class="grid-label">财务统计</text>
      </view>
      <view class="grid-item" @tap="navigateTo('/pages/room-calendar/room-calendar')">
        <text class="grid-icon">📅</text>
        <text class="grid-label">房态日历</text>
      </view>
      <view class="grid-item" @tap="navigateTo('/pages/cleaning/cleaning')">
        <text class="grid-icon">🧹</text>
        <text class="grid-label">清洁管理</text>
      </view>
      <view class="grid-item" @tap="navigateTo('/pages/settings/settings')">
        <text class="grid-icon">⚙️</text>
        <text class="grid-label">系统设置</text>
      </view>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/request.js'

export default {
  data() {
    return {
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
    this.loadStats()
  },
  onPullDownRefresh() {
    this.loadStats()
    setTimeout(() => {
      uni.stopPullDownRefresh()
    }, 1000)
  },
  methods: {
    async loadStats() {
      try {
        const data = await api.getDashboardStats()
        this.stats = data
      } catch (error) {
        console.error('加载统计数据失败:', error)
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
  padding: 20rpx;
  background: linear-gradient(180deg, #4A90E2 0%, #F8F8F8 300rpx);
  min-height: 100vh;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.stat-card {
  flex: 1;
  margin: 0 10rpx;
  padding: 30rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}

.revenue-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.room-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-label {
  display: block;
  color: rgba(255,255,255,0.9);
  font-size: 28rpx;
  margin-bottom: 12rpx;
}

.stat-value {
  display: block;
  color: white;
  font-size: 48rpx;
  font-weight: bold;
}

.room-status-bar {
  display: flex;
  background: white;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.status-item {
  flex: 1;
  text-align: center;
  border-right: 1rpx solid #eee;
}

.status-item:last-child {
  border-right: none;
}

.status-label {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.status-value {
  display: block;
  font-size: 40rpx;
  color: #4A90E2;
  font-weight: bold;
}

.function-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.grid-item {
  background: white;
  border-radius: 16rpx;
  padding: 40rpx 20rpx;
  text-align: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
  transition: all 0.3s;
}

.grid-item:active {
  transform: scale(0.95);
  background: #f5f5f5;
}

.grid-icon {
  display: block;
  font-size: 60rpx;
  margin-bottom: 12rpx;
}

.grid-label {
  display: block;
  font-size: 28rpx;
  color: #333;
}
</style>
