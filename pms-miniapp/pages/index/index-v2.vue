<template>
  <view class="dashboard">
    <!-- 头部 -->
    <view class="header">
      <view class="header-bg"></view>
      <view class="header-content">
        <view class="greeting">
          <text class="greeting-text">早安，管理员</text>
          <text class="date-text">{{ currentDate }}</text>
        </view>
        <view class="header-icon" @tap="openNotifications">
          <text class="icon">🔔</text>
          <view class="badge" v-if="unreadCount > 0">{{ unreadCount }}</view>
        </view>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-container">
      <view class="stats-row">
        <view class="stat-card revenue-card" @tap="viewRevenue">
          <view class="stat-icon">💰</view>
          <view class="stat-content">
            <text class="stat-label">今日营收</text>
            <text class="stat-value">¥{{ stats.revenue || 0 }}</text>
          </view>
          <view class="stat-trend">
            <text class="trend-up">↗ 12%</text>
          </view>
        </view>

        <view class="stat-card rooms-card" @tap="viewRooms">
          <view class="stat-icon">🏠</view>
          <view class="stat-content">
            <text class="stat-label">可售房间</text>
            <text class="stat-value">{{ stats.availableRooms || 0 }}</text>
          </view>
        </view>
      </view>

      <!-- 房态统计 -->
      <view class="room-status-card">
        <view class="card-header">
          <text class="card-title">房态概览</text>
          <text class="card-subtitle">实时数据</text>
        </view>
        <view class="status-grid">
          <view class="status-item" v-for="(item, index) in roomStatusList" :key="index">
            <view class="status-count" :class="'count-' + item.type">
              {{ item.count }}
            </view>
            <text class="status-label">{{ item.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-actions">
      <text class="section-title">快捷操作</text>
      <view class="actions-grid">
        <view class="action-item" 
              v-for="(action, index) in quickActions" 
              :key="index"
              @tap="handleAction(action.path)">
          <view class="action-icon-wrap" :style="{ background: action.gradient }">
            <text class="action-icon">{{ action.icon }}</text>
          </view>
          <text class="action-label">{{ action.label }}</text>
        </view>
      </view>
    </view>

    <!-- 今日待办 -->
    <view class="todo-section" v-if="todos.length > 0">
      <view class="section-header">
        <text class="section-title">今日待办</text>
        <text class="section-more" @tap="viewAllTodos">查看全部</text>
      </view>
      <view class="todo-list">
        <view class="todo-item" v-for="(todo, index) in todos" :key="index">
          <view class="todo-icon" :class="'priority-' + todo.priority">
            {{ todo.icon }}
          </view>
          <view class="todo-content">
            <text class="todo-title">{{ todo.title }}</text>
            <text class="todo-time">{{ todo.time }}</text>
          </view>
          <view class="todo-action" @tap="completeTodo(index)">
            <text class="action-text">完成</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 最新订单 -->
    <view class="orders-section">
      <view class="section-header">
        <text class="section-title">最新订单</text>
        <text class="section-more" @tap="viewAllOrders">查看全部</text>
      </view>
      <view class="orders-list" v-if="recentOrders.length > 0">
        <view class="order-item" 
              v-for="order in recentOrders" 
              :key="order.id"
              @tap="viewOrderDetail(order.id)">
          <view class="order-header">
            <view class="order-no">{{ order.order_no }}</view>
            <view class="order-status" :class="'status-' + order.status">
              {{ getStatusText(order.status) }}
            </view>
          </view>
          <view class="order-body">
            <view class="order-info">
              <text class="room-name">{{ order.room_number }} - {{ order.room_type }}</text>
              <text class="guest-name">{{ order.customer_name }}</text>
            </view>
            <view class="order-meta">
              <text class="check-in-date">{{ formatDate(order.check_in) }}</text>
              <text class="order-price">¥{{ order.total_price }}</text>
            </view>
          </view>
        </view>
      </view>
      <view class="empty-state" v-else>
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无订单</text>
      </view>
    </view>
  </view>
</template>

<script>
import { request } from '@/utils/request.js'

export default {
  data() {
    return {
      currentDate: '',
      unreadCount: 3,
      stats: {
        revenue: 0,
        availableRooms: 0,
        roomStatus: {}
      },
      quickActions: [
        { label: '新建订单', icon: '📝', path: '/pages/create-order/create-order', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
        { label: '房态日历', icon: '📅', path: '/pages/room-calendar/room-calendar', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
        { label: '清洁任务', icon: '🧹', path: '/pages/cleaning/cleaning', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
        { label: '客户管理', icon: '👥', path: '/pages/customers/customers', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
        { label: '财务报表', icon: '📊', path: '/pages/finance/finance', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
        { label: '系统设置', icon: '⚙️', path: '/pages/settings/settings', gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }
      ],
      todos: [
        { title: '101房退房清洁', time: '10:00', icon: '🧹', priority: 'high' },
        { title: '确认携程订单', time: '11:30', icon: '📋', priority: 'medium' },
        { title: '客户咨询回复', time: '14:00', icon: '💬', priority: 'low' }
      ],
      recentOrders: []
    }
  },
  computed: {
    roomStatusList() {
      const { roomStatus } = this.stats
      return [
        { label: '待入住', count: roomStatus.preArrival || 0, type: 'pre-arrival' },
        { label: '已入住', count: roomStatus.checkedIn || 0, type: 'checked-in' },
        { label: '待退房', count: roomStatus.preDeparture || 0, type: 'pre-departure' },
        { label: '待确认', count: roomStatus.pending || 0, type: 'pending' }
      ]
    }
  },
  onLoad() {
    this.initPage()
  },
  onShow() {
    this.loadData()
  },
  methods: {
    initPage() {
      const now = new Date()
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      this.currentDate = `${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`
    },
    
    async loadData() {
      uni.showLoading({ title: '加载中...' })
      
      try {
        // 加载统计数据
        const statsRes = await request('/api/dashboard/stats')
        if (statsRes.success) {
          this.stats = statsRes.data
        }
        
        // 加载最新订单
        const ordersRes = await request('/api/orders', { limit: 5 })
        if (ordersRes.success) {
          this.recentOrders = ordersRes.data.slice(0, 5)
        }
      } catch (error) {
        console.error('加载数据失败:', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },
    
    handleAction(path) {
      uni.navigateTo({ url: path })
    },
    
    viewRevenue() {
      uni.navigateTo({ url: '/pages/finance/finance' })
    },
    
    viewRooms() {
      uni.navigateTo({ url: '/pages/room-calendar/room-calendar' })
    },
    
    viewAllTodos() {
      uni.navigateTo({ url: '/pages/cleaning/cleaning' })
    },
    
    viewAllOrders() {
      uni.navigateTo({ url: '/pages/orders/orders' })
    },
    
    viewOrderDetail(orderId) {
      uni.navigateTo({ url: `/pages/order-detail/order-detail?id=${orderId}` })
    },
    
    completeTodo(index) {
      this.todos.splice(index, 1)
      uni.showToast({ title: '已完成', icon: 'success' })
    },
    
    openNotifications() {
      uni.navigateTo({ url: '/pages/messages/messages' })
    },
    
    getStatusText(status) {
      const map = {
        pending: '待确认',
        confirmed: '已确认',
        checked_in: '已入住',
        checked_out: '已退房',
        cancelled: '已取消'
      }
      return map[status] || status
    },
    
    formatDate(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return `${date.getMonth() + 1}/${date.getDate()}`
    }
  }
}
</script>

<style lang="scss" scoped>
@import "@/common/theme-enhanced.scss";

.dashboard {
  min-height: 100vh;
  background: linear-gradient(180deg, #E6FFFA 0%, #F7FAFC 50%);
  padding-bottom: 120rpx;
}

// ============ 头部 ============

.header {
  position: relative;
  height: 300rpx;
  overflow: hidden;
  
  .header-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    background: $primary-gradient;
    border-bottom-left-radius: 48rpx;
    border-bottom-right-radius: 48rpx;
  }
  
  .header-content {
    position: relative;
    @include flex-row;
    justify-content: space-between;
    padding: 80rpx $spacing-lg $spacing-xl;
    color: white;
    
    .greeting {
      @include flex-col;
      gap: $spacing-xs;
      
      .greeting-text {
        font-size: $font-2xl;
        font-weight: bold;
      }
      
      .date-text {
        font-size: $font-sm;
        opacity: 0.9;
      }
    }
    
    .header-icon {
      position: relative;
      width: 88rpx;
      height: 88rpx;
      @include flex-center;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10rpx);
      border-radius: $radius-full;
      
      .icon {
        font-size: $font-2xl;
      }
      
      .badge {
        position: absolute;
        top: 8rpx;
        right: 8rpx;
        min-width: 32rpx;
        height: 32rpx;
        @include flex-center;
        background: $error;
        color: white;
        font-size: 20rpx;
        font-weight: bold;
        border-radius: $radius-full;
        padding: 0 8rpx;
      }
    }
  }
}

// ============ 统计卡片 ============

.stats-container {
  padding: 0 $spacing-lg;
  margin-top: -80rpx;
}

.stats-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: $spacing-md;
  margin-bottom: $spacing-md;
}

.stat-card {
  @include glass-card;
  @include card-hover;
  padding: $spacing-lg;
  border-radius: $radius-xl;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 120rpx;
    height: 120rpx;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
    border-radius: 50%;
    transform: translate(30%, -30%);
  }
  
  .stat-icon {
    font-size: 56rpx;
    margin-bottom: $spacing-sm;
  }
  
  .stat-content {
    @include flex-col;
    gap: $spacing-xs;
    
    .stat-label {
      font-size: $font-sm;
      color: $text-secondary;
    }
    
    .stat-value {
      font-size: $font-2xl;
      font-weight: bold;
      color: $text-primary;
    }
  }
  
  .stat-trend {
    position: absolute;
    top: $spacing-md;
    right: $spacing-md;
    
    .trend-up {
      font-size: $font-sm;
      color: $success;
      font-weight: 600;
    }
  }
}

.room-status-card {
  @include glass-card;
  padding: $spacing-lg;
  border-radius: $radius-xl;
  
  .card-header {
    @include flex-row;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: $spacing-lg;
    
    .card-title {
      font-size: $font-lg;
      font-weight: bold;
      color: $text-primary;
    }
    
    .card-subtitle {
      font-size: $font-xs;
      color: $text-tertiary;
    }
  }
  
  .status-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $spacing-md;
    
    .status-item {
      @include flex-col;
      align-items: center;
      gap: $spacing-sm;
      
      .status-count {
        width: 80rpx;
        height: 80rpx;
        @include flex-center;
        border-radius: $radius-lg;
        font-size: $font-xl;
        font-weight: bold;
        color: white;
        
        &.count-pre-arrival { background: $info; }
        &.count-checked-in { background: $success; }
        &.count-pre-departure { background: $warning; }
        &.count-pending { background: $text-tertiary; }
      }
      
      .status-label {
        font-size: $font-xs;
        color: $text-secondary;
      }
    }
  }
}

// ============ 快捷操作 ============

.quick-actions {
  padding: $spacing-xl $spacing-lg;
  
  .section-title {
    font-size: $font-lg;
    font-weight: bold;
    color: $text-primary;
    margin-bottom: $spacing-lg;
  }
  
  .actions-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-lg;
    
    .action-item {
      @include flex-col;
      align-items: center;
      gap: $spacing-sm;
      transition: transform $duration-fast $ease-out;
      
      &:active {
        transform: scale(0.95);
      }
      
      .action-icon-wrap {
        width: 112rpx;
        height: 112rpx;
        @include flex-center;
        border-radius: $radius-xl;
        box-shadow: $shadow-lg;
        
        .action-icon {
          font-size: 48rpx;
        }
      }
      
      .action-label {
        font-size: $font-sm;
        color: $text-secondary;
      }
    }
  }
}

// ============ 待办事项 ============

.todo-section {
  padding: 0 $spacing-lg $spacing-xl;
  
  .section-header {
    @include flex-row;
    justify-content: space-between;
    margin-bottom: $spacing-lg;
    
    .section-title {
      font-size: $font-lg;
      font-weight: bold;
      color: $text-primary;
    }
    
    .section-more {
      font-size: $font-sm;
      color: $primary-color;
    }
  }
  
  .todo-list {
    @include glass-card;
    border-radius: $radius-xl;
    overflow: hidden;
    
    .todo-item {
      @include flex-row;
      padding: $spacing-lg;
      gap: $spacing-md;
      border-bottom: 1rpx solid $border-light;
      transition: background $duration-fast;
      
      &:last-child {
        border-bottom: none;
      }
      
      &:active {
        background: rgba(0, 0, 0, 0.02);
      }
      
      .todo-icon {
        width: 72rpx;
        height: 72rpx;
        @include flex-center;
        border-radius: $radius-md;
        font-size: $font-xl;
        flex-shrink: 0;
        
        &.priority-high { background: $error-light; }
        &.priority-medium { background: $warning-light; }
        &.priority-low { background: $info-light; }
      }
      
      .todo-content {
        @include flex-col;
        gap: $spacing-xs;
        flex: 1;
        
        .todo-title {
          font-size: $font-md;
          color: $text-primary;
          font-weight: 500;
        }
        
        .todo-time {
          font-size: $font-xs;
          color: $text-tertiary;
        }
      }
      
      .todo-action {
        @include flex-center;
        padding: 0 $spacing-md;
        
        .action-text {
          font-size: $font-sm;
          color: $primary-color;
          font-weight: 600;
        }
      }
    }
  }
}

// ============ 最新订单 ============

.orders-section {
  padding: 0 $spacing-lg $spacing-xl;
  
  .section-header {
    @include flex-row;
    justify-content: space-between;
    margin-bottom: $spacing-lg;
    
    .section-title {
      font-size: $font-lg;
      font-weight: bold;
      color: $text-primary;
    }
    
    .section-more {
      font-size: $font-sm;
      color: $primary-color;
    }
  }
  
  .orders-list {
    @include flex-col;
    gap: $spacing-md;
    
    .order-item {
      @include glass-card;
      @include card-hover;
      padding: $spacing-lg;
      border-radius: $radius-lg;
      
      .order-header {
        @include flex-row;
        justify-content: space-between;
        margin-bottom: $spacing-md;
        
        .order-no {
          font-size: $font-sm;
          color: $text-secondary;
          font-weight: 600;
        }
        
        .order-status {
          padding: $spacing-xs $spacing-sm;
          border-radius: $radius-sm;
          font-size: $font-xs;
          font-weight: 600;
          
          &.status-confirmed { background: $success-light; color: $success; }
          &.status-pending { background: $warning-light; color: $warning; }
          &.status-checked_in { background: $info-light; color: $info; }
          &.status-checked_out { background: $bg-tertiary; color: $text-secondary; }
          &.status-cancelled { background: $error-light; color: $error; }
        }
      }
      
      .order-body {
        .order-info {
          @include flex-col;
          gap: $spacing-xs;
          margin-bottom: $spacing-sm;
          
          .room-name {
            font-size: $font-md;
            font-weight: bold;
            color: $text-primary;
          }
          
          .guest-name {
            font-size: $font-sm;
            color: $text-secondary;
          }
        }
        
        .order-meta {
          @include flex-row;
          justify-content: space-between;
          
          .check-in-date {
            font-size: $font-sm;
            color: $text-tertiary;
          }
          
          .order-price {
            font-size: $font-md;
            font-weight: bold;
            color: $primary-color;
          }
        }
      }
    }
  }
  
  .empty-state {
    @include flex-col;
    @include flex-center;
    padding: $spacing-2xl;
    
    .empty-icon {
      font-size: 96rpx;
      margin-bottom: $spacing-md;
    }
    
    .empty-text {
      font-size: $font-md;
      color: $text-tertiary;
    }
  }
}
</style>
