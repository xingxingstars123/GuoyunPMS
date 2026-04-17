<template>
  <view class="container">
    <!-- 筛选栏 -->
    <view class="filter-bar">
      <picker :range="channels" range-key="name" @change="onChannelChange">
        <view class="picker">
          {{ selectedChannel || '全部渠道' }} ▼
        </view>
      </picker>
    </view>

    <!-- 订单列表 -->
    <scroll-view scroll-y class="order-list" @scrolltolower="loadMore">
      <view class="order-item" v-for="order in orders" :key="order.id" @tap="viewDetail(order)">
        <view class="order-header">
          <text class="order-no">{{ order.order_no }}</text>
          <view class="order-status" :class="'status-' + order.status">
            {{ getStatusText(order.status) }}
          </view>
        </view>
        <view class="order-info">
          <text class="info-item">房间: {{ order.room_number }}</text>
          <text class="info-item">客户: {{ order.customer_name }}</text>
        </view>
        <view class="order-info">
          <text class="info-item">入住: {{ order.check_in }}</text>
          <text class="info-item">退房: {{ order.check_out }}</text>
        </view>
        <view class="order-footer">
          <text class="order-channel">{{ getChannelName(order.channel) }}</text>
          <text class="order-price">¥{{ order.total_price }}</text>
        </view>
      </view>
      
      <view class="load-more" v-if="orders.length > 0">
        {{ loading ? '加载中...' : '已加载全部' }}
      </view>
      
      <view class="empty" v-if="orders.length === 0 && !loading">
        <text class="empty-text">暂无订单</text>
      </view>
    </scroll-view>

    <!-- 新建按钮 -->
    <view class="fab" @tap="createOrder">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/request.js'

export default {
  data() {
    return {
      orders: [],
      channels: [{ name: '全部渠道', code: '' }],
      selectedChannel: '',
      loading: false
    }
  },
  onLoad() {
    this.loadChannels()
    this.loadOrders()
  },
  onPullDownRefresh() {
    this.loadOrders()
    setTimeout(() => {
      uni.stopPullDownRefresh()
    }, 1000)
  },
  methods: {
    async loadChannels() {
      try {
        const data = await api.getChannels()
        this.channels = [{ name: '全部渠道', code: '' }, ...data.data]
      } catch (error) {
        console.error('加载渠道失败:', error)
      }
    },
    async loadOrders() {
      this.loading = true
      try {
        const data = await api.getOrders({ channel: this.selectedChannel })
        this.orders = data.data
      } catch (error) {
        console.error('加载订单失败:', error)
      } finally {
        this.loading = false
      }
    },
    onChannelChange(e) {
      const index = e.detail.value
      this.selectedChannel = this.channels[index].code
      this.loadOrders()
    },
    getStatusText(status) {
      const map = {
        'pending': '待确认',
        'confirmed': '已确认',
        'checked_in': '已入住',
        'checked_out': '已退房',
        'cancelled': '已取消'
      }
      return map[status] || status
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
    viewDetail(order) {
      uni.showModal({
        title: '订单详情',
        content: `订单号: ${order.order_no}\n客户: ${order.customer_name}\n房间: ${order.room_number}\n金额: ¥${order.total_price}`,
        showCancel: false
      })
    },
    createOrder() {
      uni.navigateTo({
        url: '/pages/create-order/create-order'
      })
    },
    loadMore() {
      // 分页加载更多
    }
  }
}
</script>

<style scoped>
.container {
  height: 100vh;
  background: #F8F8F8;
}

.filter-bar {
  background: white;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #eee;
}

.picker {
  padding: 16rpx 24rpx;
  background: #F8F8F8;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.order-list {
  height: calc(100vh - 100rpx);
  padding: 20rpx;
}

.order-item {
  background: white;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.order-no {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.order-status {
  padding: 6rpx 16rpx;
  border-radius: 6rpx;
  font-size: 24rpx;
}

.status-pending {
  background: #FFF7E6;
  color: #FA8C16;
}

.status-confirmed {
  background: #F6FFED;
  color: #52C41A;
}

.status-checked_in {
  background: #E6F7FF;
  color: #1890FF;
}

.order-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.info-item {
  font-size: 26rpx;
  color: #666;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  border-top: 1rpx solid #eee;
}

.order-channel {
  font-size: 24rpx;
  color: #999;
}

.order-price {
  font-size: 32rpx;
  color: #FF4D4F;
  font-weight: bold;
}

.load-more {
  text-align: center;
  padding: 20rpx;
  font-size: 24rpx;
  color: #999;
}

.empty {
  text-align: center;
  padding: 100rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.fab {
  position: fixed;
  right: 40rpx;
  bottom: 120rpx;
  width: 100rpx;
  height: 100rpx;
  background: #4A90E2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 16rpx rgba(74,144,226,0.3);
}

.fab-icon {
  color: white;
  font-size: 60rpx;
  line-height: 60rpx;
}
</style>
