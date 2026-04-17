<template>
  <view class="container">
    <!-- 筛选栏 -->
    <view class="filter-bar">
      <picker mode="date" :value="selectedDate" @change="onDateChange">
        <view class="picker">
          {{ selectedDate }} ▼
        </view>
      </picker>
      <picker :range="statusOptions" range-key="name" @change="onStatusChange">
        <view class="picker">
          {{ statusOptions[selectedStatusIndex].name }} ▼
        </view>
      </picker>
    </view>

    <!-- 任务列表 -->
    <scroll-view scroll-y class="task-list">
      <view class="task-item" v-for="task in tasks" :key="task.id">
        <view class="task-header">
          <view class="room-info">
            <text class="room-number">{{ task.room_number }}</text>
            <text class="task-time">{{ formatTime(task.scheduled_time) }}</text>
          </view>
          <view class="task-status" :class="'status-' + task.status">
            {{ getStatusText(task.status) }}
          </view>
        </view>

        <view class="task-body">
          <view class="task-row">
            <text class="task-label">负责人：</text>
            <text class="task-value">{{ task.assigned_to || '未分配' }}</text>
          </view>
          <view class="task-row" v-if="task.notes">
            <text class="task-label">备注：</text>
            <text class="task-value">{{ task.notes }}</text>
          </view>
          <view class="task-row" v-if="task.completed_time">
            <text class="task-label">完成时间：</text>
            <text class="task-value">{{ task.completed_time }}</text>
          </view>
        </view>

        <view class="task-actions" v-if="task.status !== 'completed'">
          <button 
            v-if="task.status === 'pending'" 
            class="btn btn-start" 
            size="mini"
            @tap="updateStatus(task.id, 'in_progress')"
          >
            开始清洁
          </button>
          <button 
            v-if="task.status === 'in_progress'" 
            class="btn btn-complete" 
            size="mini"
            @tap="updateStatus(task.id, 'completed')"
          >
            完成
          </button>
        </view>
      </view>
      
      <view class="empty" v-if="tasks.length === 0">
        <text class="empty-text">暂无清洁任务</text>
      </view>
    </scroll-view>

    <!-- 新建按钮 -->
    <view class="fab" @tap="createTask">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/request.js'

export default {
  data() {
    const today = new Date().toISOString().split('T')[0]
    return {
      tasks: [],
      selectedDate: today,
      selectedStatusIndex: 0,
      statusOptions: [
        { name: '全部状态', value: '' },
        { name: '待清洁', value: 'pending' },
        { name: '清洁中', value: 'in_progress' },
        { name: '已完成', value: 'completed' }
      ]
    }
  },
  computed: {
    selectedStatus() {
      return this.statusOptions[this.selectedStatusIndex].value
    }
  },
  onLoad() {
    this.loadTasks()
  },
  onPullDownRefresh() {
    this.loadTasks()
    setTimeout(() => {
      uni.stopPullDownRefresh()
    }, 1000)
  },
  methods: {
    async loadTasks() {
      try {
        const params = {
          date: this.selectedDate
        }
        if (this.selectedStatus) {
          params.status = this.selectedStatus
        }
        
        const res = await api.getCleaningTasks(params)
        this.tasks = res.data
      } catch (error) {
        console.error('加载任务失败:', error)
      }
    },
    onDateChange(e) {
      this.selectedDate = e.detail.value
      this.loadTasks()
    },
    onStatusChange(e) {
      this.selectedStatusIndex = e.detail.value
      this.loadTasks()
    },
    getStatusText(status) {
      const map = {
        'pending': '待清洁',
        'in_progress': '清洁中',
        'completed': '已完成'
      }
      return map[status] || status
    },
    formatTime(time) {
      if (!time) return ''
      return time.split(' ')[1] || time
    },
    async updateStatus(id, status) {
      try {
        await api.updateCleaningTask(id, { status })
        
        uni.showToast({
          title: '状态已更新',
          icon: 'success'
        })
        
        this.loadTasks()
      } catch (error) {
        uni.showToast({
          title: '更新失败',
          icon: 'none'
        })
      }
    },
    createTask() {
      uni.showModal({
        title: '创建清洁任务',
        editable: true,
        placeholderText: '请输入房间号(如:101)',
        success: async (res) => {
          if (res.confirm && res.content) {
            try {
              const roomNumber = res.content.trim()
              
              // 创建任务
              await api.createCleaningTask({
                room_number: roomNumber,
                scheduled_time: this.selectedDate + ' 10:00:00',
                status: 'pending'
              })
              
              uni.showToast({
                title: '任务创建成功',
                icon: 'success'
              })
              
              // 刷新列表
              this.loadTasks()
            } catch (error) {
              uni.showToast({
                title: '创建失败',
                icon: 'none'
              })
            }
          }
        }
      })
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
  display: flex;
  gap: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.picker {
  flex: 1;
  padding: 16rpx 24rpx;
  background: #F8F8F8;
  border-radius: 8rpx;
  font-size: 26rpx;
  text-align: center;
}

.task-list {
  height: calc(100vh - 140rpx);
  padding: 20rpx;
}

.task-item {
  background: white;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.room-info {
  flex: 1;
}

.room-number {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-right: 20rpx;
}

.task-time {
  font-size: 24rpx;
  color: #999;
}

.task-status {
  padding: 6rpx 16rpx;
  border-radius: 6rpx;
  font-size: 24rpx;
}

.status-pending {
  background: #FFF7E6;
  color: #FA8C16;
}

.status-in_progress {
  background: #E6F7FF;
  color: #1890FF;
}

.status-completed {
  background: #F6FFED;
  color: #52C41A;
}

.task-body {
  margin-bottom: 16rpx;
}

.task-row {
  display: flex;
  margin-bottom: 8rpx;
}

.task-label {
  font-size: 26rpx;
  color: #666;
  min-width: 140rpx;
}

.task-value {
  flex: 1;
  font-size: 26rpx;
  color: #333;
}

.task-actions {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.btn {
  padding: 8rpx 32rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
}

.btn-start {
  background: #1890FF;
  color: white;
}

.btn-complete {
  background: #52C41A;
  color: white;
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
