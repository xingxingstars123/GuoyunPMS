<template>
  <view class="container">
    <!-- 月份选择 -->
    <view class="month-picker">
      <picker mode="date" fields="month" @change="onMonthChange" :value="selectedMonth">
        <view class="picker">
          {{ selectedMonth }} ▼
        </view>
      </picker>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-cards">
      <view class="stat-card">
        <text class="stat-label">总收入</text>
        <text class="stat-value">¥ {{ financeData.totalRevenue }}</text>
      </view>
      <view class="stat-card">
        <text class="stat-label">订单数</text>
        <text class="stat-value">{{ totalOrders }}</text>
      </view>
    </view>

    <!-- 渠道收入列表 -->
    <view class="channel-list">
      <view class="list-header">
        <text class="header-title">渠道收入明细</text>
      </view>
      <view class="channel-item" v-for="item in financeData.channelStats" :key="item.channel">
        <view class="channel-info">
          <text class="channel-name">{{ getChannelName(item.channel) }}</text>
          <text class="channel-count">{{ item.order_count }} 单</text>
        </view>
        <text class="channel-revenue">¥{{ item.revenue }}</text>
      </view>
      
      <view class="empty" v-if="financeData.channelStats.length === 0">
        <text class="empty-text">暂无数据</text>
      </view>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/request.js'

export default {
  data() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    
    return {
      selectedMonth: `${year}-${month}`,
      financeData: {
        totalRevenue: 0,
        channelStats: [],
        dailyTrend: []
      }
    }
  },
  computed: {
    totalOrders() {
      return this.financeData.channelStats.reduce((sum, item) => sum + item.order_count, 0)
    }
  },
  onLoad() {
    this.loadFinance()
  },
  onPullDownRefresh() {
    this.loadFinance()
    setTimeout(() => {
      uni.stopPullDownRefresh()
    }, 1000)
  },
  methods: {
    async loadFinance() {
      const [year, month] = this.selectedMonth.split('-')
      try {
        const data = await api.getMonthlyFinance({ year, month })
        this.financeData = data.data
      } catch (error) {
        console.error('加载财务数据失败:', error)
      }
    },
    onMonthChange(e) {
      this.selectedMonth = e.detail.value
      this.loadFinance()
    },
    getChannelName(code) {
      const map = {
        'ctrip': '携程',
        'meituan': '美团',
        'fliggy': '飞猪',
        'booking': 'Booking',
        'direct': '直销'
      }
      return map[code] || code
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20rpx;
  background: #F8F8F8;
  min-height: 100vh;
}

.month-picker {
  background: white;
  border-radius: 16rpx;
  padding: 20rpx 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.picker {
  padding: 16rpx 24rpx;
  background: #F8F8F8;
  border-radius: 8rpx;
  font-size: 28rpx;
  text-align: center;
}

.stats-cards {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.stat-card {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}

.stat-label {
  display: block;
  color: rgba(255,255,255,0.9);
  font-size: 26rpx;
  margin-bottom: 12rpx;
}

.stat-value {
  display: block;
  color: white;
  font-size: 40rpx;
  font-weight: bold;
}

.channel-list {
  background: white;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.list-header {
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #eee;
}

.header-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.channel-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.channel-item:last-child {
  border-bottom: none;
}

.channel-info {
  flex: 1;
}

.channel-name {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.channel-count {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.channel-revenue {
  font-size: 32rpx;
  color: #FF4D4F;
  font-weight: bold;
}

.empty {
  text-align: center;
  padding: 60rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>
