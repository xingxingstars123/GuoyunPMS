<template>
  <view class="container">
    <!-- Tab 切换 -->
    <view class="tabs">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === tab.code }"
        v-for="tab in tabs" 
        :key="tab.code"
        @tap="switchTab(tab.code)"
      >
        {{ tab.name }}
      </view>
    </view>

    <!-- 客户列表 -->
    <scroll-view scroll-y class="customer-list">
      <view class="customer-item" v-for="customer in filteredCustomers" :key="customer.id">
        <view class="customer-header">
          <text class="customer-name">{{ customer.name }}</text>
          <view class="customer-channel">{{ getChannelName(customer.channel) }}</view>
        </view>
        <view class="customer-info">
          <text class="info-item">电话: {{ formatPhone(customer.phone) }}</text>
        </view>
        <view class="customer-footer">
          <text class="info-item">订单数: {{ customer.total_orders }}</text>
          <text class="customer-spent">累计消费: ¥{{ customer.total_spent }}</text>
        </view>
      </view>
      
      <view class="empty" v-if="filteredCustomers.length === 0">
        <text class="empty-text">暂无客户</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { api } from '@/utils/request.js'

export default {
  data() {
    return {
      customers: [],
      activeTab: '',
      tabs: [
        { name: '全部', code: '' },
        { name: '携程', code: 'ctrip' },
        { name: '美团', code: 'meituan' },
        { name: '直销', code: 'direct' }
      ]
    }
  },
  computed: {
    filteredCustomers() {
      if (!this.activeTab) {
        return this.customers
      }
      return this.customers.filter(c => c.channel === this.activeTab)
    }
  },
  onLoad() {
    this.loadCustomers()
  },
  onPullDownRefresh() {
    this.loadCustomers()
    setTimeout(() => {
      uni.stopPullDownRefresh()
    }, 1000)
  },
  methods: {
    async loadCustomers() {
      try {
        const data = await api.getCustomers()
        this.customers = data.data.all
      } catch (error) {
        console.error('加载客户失败:', error)
      }
    },
    switchTab(code) {
      this.activeTab = code
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
    },
    formatPhone(phone) {
      if (!phone) return ''
      return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    }
  }
}
</script>

<style scoped>
.container {
  height: 100vh;
  background: #F8F8F8;
}

.tabs {
  display: flex;
  background: white;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.tab-item.active {
  color: #4A90E2;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background: #4A90E2;
  border-radius: 2rpx;
}

.customer-list {
  height: calc(100vh - 100rpx);
  padding: 20rpx;
}

.customer-item {
  background: white;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.customer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.customer-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.customer-channel {
  padding: 6rpx 16rpx;
  background: #E6F7FF;
  color: #1890FF;
  border-radius: 6rpx;
  font-size: 24rpx;
}

.customer-info {
  margin-bottom: 12rpx;
}

.info-item {
  font-size: 26rpx;
  color: #666;
  display: block;
  margin-bottom: 8rpx;
}

.customer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  border-top: 1rpx solid #eee;
}

.customer-spent {
  font-size: 28rpx;
  color: #FF4D4F;
  font-weight: bold;
}

.empty {
  text-align: center;
  padding: 100rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>
