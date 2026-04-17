<template>
  <view class="container">
    <!-- 民宿信息 -->
    <view class="section">
      <view class="section-title">民宿信息</view>
      <view class="setting-item">
        <text class="setting-label">民宿名称</text>
        <input class="setting-input" v-model="settings.hotelName" placeholder="请输入民宿名称" />
      </view>
      <view class="setting-item">
        <text class="setting-label">联系电话</text>
        <input class="setting-input" v-model="settings.contactPhone" placeholder="请输入联系电话" />
      </view>
      <view class="setting-item">
        <text class="setting-label">详细地址</text>
        <input class="setting-input" v-model="settings.address" placeholder="请输入详细地址" />
      </view>
    </view>

    <!-- 房间管理 -->
    <view class="section">
      <view class="section-title">
        房间管理
        <text class="add-btn" @tap="showAddRoom">+ 新增</text>
      </view>
      <view class="room-list">
        <view class="room-item" v-for="room in rooms" :key="room.id">
          <view class="room-info">
            <text class="room-number">{{ room.room_number }}</text>
            <text class="room-type">{{ room.room_type }}</text>
            <text class="room-price">¥{{ room.base_price }}/晚</text>
          </view>
          <view class="room-actions">
            <text class="action-btn edit" @tap="editRoom(room)">编辑</text>
            <text class="action-btn delete" @tap="deleteRoom(room.id)">删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 渠道配置 -->
    <view class="section">
      <view class="section-title">渠道配置</view>
      <view class="channel-list">
        <view class="channel-item" v-for="channel in channels" :key="channel.code">
          <view class="channel-info">
            <text class="channel-name">{{ channel.name }}</text>
            <text class="channel-code">{{ channel.code }}</text>
          </view>
          <switch :checked="channel.enabled" @change="toggleChannel(channel)" />
        </view>
      </view>
    </view>

    <!-- 通知设置 -->
    <view class="section">
      <view class="section-title">通知设置</view>
      <view class="setting-item">
        <text class="setting-label">新订单通知</text>
        <switch :checked="settings.notifyNewOrder" @change="e => settings.notifyNewOrder = e.detail.value" />
      </view>
      <view class="setting-item">
        <text class="setting-label">清洁提醒</text>
        <switch :checked="settings.notifyCleaning" @change="e => settings.notifyCleaning = e.detail.value" />
      </view>
      <view class="setting-item">
        <text class="setting-label">系统消息</text>
        <switch :checked="settings.notifySystem" @change="e => settings.notifySystem = e.detail.value" />
      </view>
    </view>

    <!-- 保存按钮 -->
    <view class="save-section">
      <button class="save-btn" @tap="saveSettings" :loading="saving">保存设置</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      settings: {
        hotelName: '国韵民宿',
        contactPhone: '400-123-4567',
        address: '浙江省杭州市西湖区观芦村88号',
        notifyNewOrder: true,
        notifyCleaning: true,
        notifySystem: true
      },
      rooms: [
        { id: 1, room_number: '101', room_type: '标准间', base_price: 288, status: 'available' },
        { id: 2, room_number: '102', room_type: '标准间', base_price: 288, status: 'available' },
        { id: 3, room_number: '201', room_type: '豪华套房', base_price: 588, status: 'available' },
        { id: 4, room_number: '202', room_type: '豪华套房', base_price: 588, status: 'available' }
      ],
      channels: [
        { code: 'ctrip', name: '携程', enabled: true },
        { code: 'meituan', name: '美团', enabled: true },
        { code: 'fliggy', name: '飞猪', enabled: true },
        { code: 'booking', name: 'Booking', enabled: false },
        { code: 'direct', name: '直销', enabled: true }
      ],
      saving: false
    }
  },
  onLoad() {
    this.loadSettings()
  },
  methods: {
    loadSettings() {
      // 实际项目中从 API 加载设置
      const saved = uni.getStorageSync('settings')
      if (saved) {
        this.settings = { ...this.settings, ...saved }
      }
    },
    showAddRoom() {
      uni.showModal({
        title: '新增房间',
        editable: true,
        placeholderText: '请输入房间号',
        success: (res) => {
          if (res.confirm && res.content) {
            const newRoom = {
              id: Date.now(),
              room_number: res.content,
              room_type: '标准间',
              base_price: 288,
              status: 'available'
            }
            this.rooms.push(newRoom)
            uni.showToast({ title: '房间创建成功', icon: 'success' })
          }
        }
      })
    },
    editRoom(room) {
      uni.showModal({
        title: '编辑房间',
        editable: true,
        placeholderText: '请输入房间号',
        content: room.room_number,
        success: (res) => {
          if (res.confirm && res.content) {
            room.room_number = res.content
            uni.showToast({ title: '修改成功', icon: 'success' })
          }
        }
      })
    },
    deleteRoom(id) {
      uni.showModal({
        title: '确认删除',
        content: '删除后无法恢复，确定要删除此房间吗？',
        success: (res) => {
          if (res.confirm) {
            this.rooms = this.rooms.filter(r => r.id !== id)
            uni.showToast({ title: '删除成功', icon: 'success' })
          }
        }
      })
    },
    toggleChannel(channel) {
      channel.enabled = !channel.enabled
      uni.showToast({
        title: channel.enabled ? `已启用${channel.name}` : `已禁用${channel.name}`,
        icon: 'none'
      })
    },
    saveSettings() {
      this.saving = true
      
      // 保存到本地存储
      uni.setStorageSync('settings', this.settings)
      
      setTimeout(() => {
        this.saving = false
        uni.showToast({
          title: '设置已保存',
          icon: 'success'
        })
      }, 500)
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #F8F8F8;
  padding: 20rpx 20rpx 120rpx;
}

.section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.add-btn {
  font-size: 28rpx;
  color: #4A90E2;
  font-weight: normal;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 28rpx;
  color: #333;
}

.setting-input {
  flex: 1;
  text-align: right;
  font-size: 28rpx;
  color: #666;
  margin-left: 20rpx;
}

.room-list {
  margin-top: 10rpx;
}

.room-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.room-item:last-child {
  border-bottom: none;
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

.room-type {
  font-size: 24rpx;
  color: #999;
  margin-right: 20rpx;
}

.room-price {
  font-size: 28rpx;
  color: #4A90E2;
}

.room-actions {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  font-size: 26rpx;
  padding: 8rpx 24rpx;
  border-radius: 6rpx;
}

.action-btn.edit {
  color: #4A90E2;
  background: #E6F7FF;
}

.action-btn.delete {
  color: #FF4D4F;
  background: #FFF1F0;
}

.channel-list {
  margin-top: 10rpx;
}

.channel-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.channel-item:last-child {
  border-bottom: none;
}

.channel-info {
  flex: 1;
}

.channel-name {
  font-size: 28rpx;
  color: #333;
  margin-right: 20rpx;
}

.channel-code {
  font-size: 24rpx;
  color: #999;
}

.save-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx;
  background: white;
  border-top: 1rpx solid #eee;
}

.save-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background: #4A90E2;
  color: white;
  border-radius: 8rpx;
  font-size: 32rpx;
}
</style>
