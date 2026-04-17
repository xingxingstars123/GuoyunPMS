<template>
  <view class="container">
    <view class="form-card">
      <view class="form-item">
        <text class="label">房间<text class="required">*</text></text>
        <picker :range="rooms" range-key="display" @change="onRoomChange">
          <view class="picker">
            {{ selectedRoom ? selectedRoom.display : '请选择房间' }} ▼
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">客户姓名<text class="required">*</text></text>
        <input 
          class="input" 
          v-model="form.customerName" 
          placeholder="请输入客户姓名"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-item">
        <text class="label">联系电话<text class="required">*</text></text>
        <input 
          class="input" 
          v-model="form.customerPhone" 
          type="number"
          placeholder="请输入联系电话"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-item">
        <text class="label">预订渠道<text class="required">*</text></text>
        <picker :range="channels" range-key="name" @change="onChannelChange">
          <view class="picker">
            {{ selectedChannel ? selectedChannel.name : '请选择渠道' }} ▼
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">入住日期<text class="required">*</text></text>
        <picker mode="date" :value="form.checkIn" @change="onCheckInChange">
          <view class="picker">
            {{ form.checkIn || '请选择日期' }} ▼
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">退房日期<text class="required">*</text></text>
        <picker mode="date" :value="form.checkOut" @change="onCheckOutChange">
          <view class="picker">
            {{ form.checkOut || '请选择日期' }} ▼
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">订单金额<text class="required">*</text></text>
        <input 
          class="input" 
          v-model="form.totalPrice" 
          type="digit"
          placeholder="请输入金额"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-item">
        <text class="label">备注</text>
        <textarea 
          class="textarea" 
          v-model="form.notes" 
          placeholder="请输入备注信息"
          placeholder-class="placeholder"
        />
      </view>
    </view>

    <view class="btn-group">
      <button class="btn btn-cancel" @tap="cancel">取消</button>
      <button class="btn btn-submit" @tap="submit" :loading="submitting">创建订单</button>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/request.js'

export default {
  data() {
    return {
      form: {
        roomId: null,
        customerName: '',
        customerPhone: '',
        channel: '',
        checkIn: '',
        checkOut: '',
        totalPrice: '',
        notes: ''
      },
      rooms: [],
      channels: [],
      selectedRoom: null,
      selectedChannel: null,
      submitting: false
    }
  },
  onLoad() {
    this.loadRooms()
    this.loadChannels()
    
    // 设置默认日期（今天和明天）
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    this.form.checkIn = today.toISOString().split('T')[0]
    this.form.checkOut = tomorrow.toISOString().split('T')[0]
  },
  methods: {
    async loadRooms() {
      try {
        const res = await api.getRoomCalendar()
        this.rooms = res.data.map(room => ({
          ...room,
          display: `${room.room_number} (${room.room_type})`
        }))
      } catch (error) {
        console.error('加载房间失败:', error)
      }
    },
    async loadChannels() {
      try {
        const res = await api.getChannels()
        this.channels = res.data
      } catch (error) {
        console.error('加载渠道失败:', error)
      }
    },
    onRoomChange(e) {
      const index = e.detail.value
      this.selectedRoom = this.rooms[index]
      this.form.roomId = this.selectedRoom.id
      
      // 自动填充房价
      if (this.selectedRoom.base_price && !this.form.totalPrice) {
        const days = this.calculateDays()
        this.form.totalPrice = (this.selectedRoom.base_price * days).toFixed(2)
      }
    },
    onChannelChange(e) {
      const index = e.detail.value
      this.selectedChannel = this.channels[index]
      this.form.channel = this.selectedChannel.code
    },
    onCheckInChange(e) {
      this.form.checkIn = e.detail.value
      this.updatePrice()
    },
    onCheckOutChange(e) {
      this.form.checkOut = e.detail.value
      this.updatePrice()
    },
    calculateDays() {
      if (!this.form.checkIn || !this.form.checkOut) return 1
      
      const checkIn = new Date(this.form.checkIn)
      const checkOut = new Date(this.form.checkOut)
      const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
      
      return days > 0 ? days : 1
    },
    updatePrice() {
      if (this.selectedRoom && this.selectedRoom.base_price) {
        const days = this.calculateDays()
        this.form.totalPrice = (this.selectedRoom.base_price * days).toFixed(2)
      }
    },
    validate() {
      if (!this.form.roomId) {
        uni.showToast({ title: '请选择房间', icon: 'none' })
        return false
      }
      if (!this.form.customerName) {
        uni.showToast({ title: '请输入客户姓名', icon: 'none' })
        return false
      }
      if (!this.form.customerPhone) {
        uni.showToast({ title: '请输入联系电话', icon: 'none' })
        return false
      }
      if (!/^1\d{10}$/.test(this.form.customerPhone)) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
        return false
      }
      if (!this.form.channel) {
        uni.showToast({ title: '请选择预订渠道', icon: 'none' })
        return false
      }
      if (!this.form.checkIn || !this.form.checkOut) {
        uni.showToast({ title: '请选择入住和退房日期', icon: 'none' })
        return false
      }
      if (new Date(this.form.checkOut) <= new Date(this.form.checkIn)) {
        uni.showToast({ title: '退房日期必须晚于入住日期', icon: 'none' })
        return false
      }
      if (!this.form.totalPrice || parseFloat(this.form.totalPrice) <= 0) {
        uni.showToast({ title: '请输入正确的金额', icon: 'none' })
        return false
      }
      return true
    },
    async submit() {
      if (!this.validate()) return
      
      this.submitting = true
      try {
        const res = await api.createOrder({
          roomId: this.form.roomId,
          customerName: this.form.customerName,
          customerPhone: this.form.customerPhone,
          channel: this.form.channel,
          checkIn: this.form.checkIn,
          checkOut: this.form.checkOut,
          totalPrice: parseFloat(this.form.totalPrice)
        })
        
        uni.showToast({
          title: '订单创建成功',
          icon: 'success'
        })
        
        // 显示渠道通知消息
        setTimeout(() => {
          uni.showModal({
            title: '渠道同步通知',
            content: `订单已创建！\n\n已自动通知以下渠道：\n• 携程\n• 美团\n• 飞猪\n• Booking\n• 直销\n\n房间状态已更新为“已售”`,
            confirmText: '查看消息',
            cancelText: '返回列表',
            success: (modalRes) => {
              if (modalRes.confirm) {
                // 跳转到消息页面
                uni.redirectTo({
                  url: '/pages/messages/messages'
                })
              } else {
                // 返回订单列表
                uni.navigateBack()
              }
            }
          })
        }, 1500)
        
      } catch (error) {
        uni.showToast({
          title: error.message || '创建失败',
          icon: 'none'
        })
      } finally {
        this.submitting = false
      }
    },
    cancel() {
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #F8F8F8;
  padding: 20rpx;
  padding-bottom: 120rpx;
}

.form-card {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
}

.required {
  color: #FF4D4F;
  margin-left: 4rpx;
}

.picker {
  padding: 20rpx 24rpx;
  background: #F8F8F8;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
}

.input {
  padding: 20rpx 24rpx;
  background: #F8F8F8;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.textarea {
  padding: 20rpx 24rpx;
  background: #F8F8F8;
  border-radius: 8rpx;
  font-size: 28rpx;
  min-height: 150rpx;
}

.placeholder {
  color: #999;
}

.btn-group {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  padding: 20rpx;
  background: white;
  border-top: 1rpx solid #eee;
  gap: 20rpx;
}

.btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 8rpx;
  font-size: 32rpx;
}

.btn-cancel {
  background: #F8F8F8;
  color: #666;
}

.btn-submit {
  background: #4A90E2;
  color: white;
}
</style>
