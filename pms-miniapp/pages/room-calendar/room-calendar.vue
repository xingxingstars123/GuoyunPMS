<template>
  <view class="container">
    <!-- 日期选择 -->
    <view class="date-selector">
      <view class="month-header">
        <text class="nav-btn" @tap="prevMonth">←</text>
        <text class="current-month">{{ currentMonth }}</text>
        <text class="nav-btn" @tap="nextMonth">→</text>
      </view>
    </view>

    <!-- 日历表头 -->
    <view class="calendar-header">
      <view class="header-cell">房间</view>
      <view class="header-cell" v-for="date in dates" :key="date">
        {{ formatDate(date) }}
      </view>
    </view>

    <!-- 房态日历 -->
    <scroll-view scroll-y class="calendar-body">
      <view class="room-row" v-for="room in rooms" :key="room.id">
        <view class="room-cell">{{ room.room_number }}</view>
        <view 
          class="status-cell" 
          :class="getCellClass(room, date)"
          v-for="date in dates" 
          :key="date"
          @tap="viewDetail(room, date)"
        >
          <text class="status-text">{{ getCellText(room, date) }}</text>
        </view>
      </view>
      
      <view class="empty" v-if="rooms.length === 0">
        <text class="empty-text">暂无数据</text>
      </view>
    </scroll-view>

    <!-- 图例 -->
    <view class="legend">
      <view class="legend-item">
        <view class="legend-color available"></view>
        <text class="legend-text">可售</text>
      </view>
      <view class="legend-item">
        <view class="legend-color booked"></view>
        <text class="legend-text">已售</text>
      </view>
      <view class="legend-item">
        <view class="legend-color maintenance"></view>
        <text class="legend-text">维修</text>
      </view>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/request.js'

export default {
  data() {
    const now = new Date()
    return {
      currentDate: now,
      rooms: [],
      calendar: {},
      dates: []
    }
  },
  computed: {
    currentMonth() {
      return this.currentDate.getFullYear() + '年' + (this.currentDate.getMonth() + 1) + '月'
    }
  },
  onLoad() {
    this.generateDates()
    this.loadCalendar()
  },
  onPullDownRefresh() {
    this.loadCalendar()
    setTimeout(() => {
      uni.stopPullDownRefresh()
    }, 1000)
  },
  methods: {
    generateDates() {
      const dates = []
      const start = new Date(this.currentDate)
      start.setDate(1)
      
      for (let i = 0; i < 14; i++) {
        const date = new Date(start)
        date.setDate(start.getDate() + i)
        dates.push(date.toISOString().split('T')[0])
      }
      
      this.dates = dates
    },
    async loadCalendar() {
      try {
        const startDate = this.dates[0]
        const endDate = this.dates[this.dates.length - 1]
        
        const res = await api.getRoomCalendar({ startDate, endDate })
        this.rooms = res.data
        
        // 构建日历数据映射
        this.calendar = {}
        this.rooms.forEach(room => {
          this.calendar[room.id] = {}
          
          // 修复BUG: 如果occupancy为空,生成默认状态
          if (!room.occupancy || room.occupancy.length === 0) {
            this.dates.forEach(date => {
              this.calendar[room.id][date] = 'available'
            })
          } else {
            room.occupancy.forEach(occ => {
              this.calendar[room.id][occ.date] = occ.status
            })
          }
        })
      } catch (error) {
        console.error('加载房态失败:', error)
        uni.showToast({
          title: '加载失败,请稍后重试',
          icon: 'none'
        })
      }
    },
    getCellClass(room, date) {
      const status = this.calendar[room.id]?.[date] || 'available'
      return status
    },
    getCellText(room, date) {
      const status = this.calendar[room.id]?.[date] || 'available'
      const statusMap = {
        'available': '可',
        'booked': '售',
        'maintenance': '修'
      }
      return statusMap[status] || '可'
    },
    formatDate(dateStr) {
      const date = new Date(dateStr)
      return (date.getMonth() + 1) + '/' + date.getDate()
    },
    prevMonth() {
      const date = new Date(this.currentDate)
      date.setMonth(date.getMonth() - 1)
      this.currentDate = date
      this.generateDates()
      this.loadCalendar()
    },
    nextMonth() {
      const date = new Date(this.currentDate)
      date.setMonth(date.getMonth() + 1)
      this.currentDate = date
      this.generateDates()
      this.loadCalendar()
    },
    viewDetail(room, date) {
      const status = this.calendar[room.id]?.[date]
      if (status === 'booked') {
        uni.showToast({
          title: `${room.room_number} 已预订`,
          icon: 'none'
        })
      } else {
        uni.showModal({
          title: '房间详情',
          content: `房间: ${room.room_number}\n日期: ${date}\n状态: ${status === 'available' ? '可售' : '不可售'}`,
          showCancel: false
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

.date-selector {
  background: white;
  padding: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.month-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-btn {
  padding: 10rpx 30rpx;
  font-size: 32rpx;
  color: #4A90E2;
  font-weight: bold;
}

.current-month {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.calendar-header {
  display: flex;
  background: white;
  border-bottom: 2rpx solid #4A90E2;
}

.header-cell {
  min-width: 100rpx;
  padding: 16rpx 8rpx;
  text-align: center;
  font-size: 24rpx;
  font-weight: bold;
  color: #333;
}

.header-cell:first-child {
  min-width: 120rpx;
  background: #f5f5f5;
  position: sticky;
  left: 0;
  z-index: 10;
}

.calendar-body {
  flex: 1;
  overflow-x: scroll;
}

.room-row {
  display: flex;
  background: white;
  border-bottom: 1rpx solid #eee;
}

.room-cell {
  min-width: 120rpx;
  padding: 20rpx 8rpx;
  text-align: center;
  font-size: 26rpx;
  font-weight: bold;
  background: #f5f5f5;
  border-right: 1rpx solid #eee;
  position: sticky;
  left: 0;
  z-index: 5;
}

.status-cell {
  min-width: 100rpx;
  padding: 20rpx 8rpx;
  text-align: center;
  border-right: 1rpx solid #f0f0f0;
}

.status-cell.available {
  background: #e6f7ff;
}

.status-cell.booked {
  background: #fff1f0;
}

.status-cell.maintenance {
  background: #fff7e6;
}

.status-text {
  font-size: 24rpx;
  color: #666;
}

.legend {
  display: flex;
  justify-content: center;
  background: white;
  padding: 20rpx;
  border-top: 1rpx solid #eee;
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 0 20rpx;
}

.legend-color {
  width: 40rpx;
  height: 40rpx;
  border-radius: 6rpx;
  margin-right: 10rpx;
}

.legend-color.available {
  background: #e6f7ff;
}

.legend-color.booked {
  background: #fff1f0;
}

.legend-color.maintenance {
  background: #fff7e6;
}

.legend-text {
  font-size: 24rpx;
  color: #666;
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
