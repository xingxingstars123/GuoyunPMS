<template>
  <div class="orders-page">
    <!-- 筛选栏 -->
    <el-card style="margin-bottom: 20px">
      <el-form :inline="true">
        <el-form-item label="渠道">
          <el-select v-model="filters.channel" placeholder="全部渠道" clearable @change="fetchOrders">
            <el-option label="全部" value=""></el-option>
            <el-option v-for="ch in channels" :key="ch.code" :label="ch.name" :value="ch.code"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable @change="fetchOrders">
            <el-option label="全部" value=""></el-option>
            <el-option label="待确认" value="pending"></el-option>
            <el-option label="已确认" value="confirmed"></el-option>
            <el-option label="已入住" value="checked_in"></el-option>
            <el-option label="已退房" value="checked_out"></el-option>
            <el-option label="已取消" value="cancelled"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="dialogVisible = true">
            <el-icon><Plus /></el-icon>
            新建订单
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单列表 -->
    <el-card>
      <el-table :data="orders" style="width: 100%" v-loading="loading">
        <el-table-column prop="order_no" label="订单号" width="150"></el-table-column>
        <el-table-column prop="room_number" label="房间号" width="100"></el-table-column>
        <el-table-column prop="customer_name" label="客户姓名" width="120"></el-table-column>
        <el-table-column prop="customer_phone" label="电话" width="130"></el-table-column>
        <el-table-column prop="channel" label="渠道" width="100">
          <template #default="{ row }">
            <el-tag :type="getChannelType(row.channel)">{{ getChannelName(row.channel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="check_in" label="入住日期" width="110"></el-table-column>
        <el-table-column prop="check_out" label="退房日期" width="110"></el-table-column>
        <el-table-column prop="total_price" label="金额" width="100">
          <template #default="{ row }">¥{{ row.total_price }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="150">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleView(row)">查看</el-button>
            <el-button size="small" type="danger" v-if="row.status !== 'cancelled'" @click="handleCancel(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建订单对话框 -->
    <el-dialog v-model="dialogVisible" title="新建订单" width="600px">
      <el-form :model="newOrder" label-width="100px">
        <el-form-item label="房间">
          <el-select v-model="newOrder.roomId" placeholder="选择房间">
            <el-option v-for="room in availableRooms" :key="room.id" :label="`${room.room_number} (${room.room_type})`" :value="room.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="客户姓名">
          <el-input v-model="newOrder.customerName" placeholder="请输入姓名"></el-input>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="newOrder.customerPhone" placeholder="请输入电话"></el-input>
        </el-form-item>
        <el-form-item label="渠道">
          <el-select v-model="newOrder.channel" placeholder="选择渠道">
            <el-option v-for="ch in channels" :key="ch.code" :label="ch.name" :value="ch.code"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="入住日期">
          <el-date-picker v-model="newOrder.checkIn" type="date" placeholder="选择日期" value-format="YYYY-MM-DD"></el-date-picker>
        </el-form-item>
        <el-form-item label="退房日期">
          <el-date-picker v-model="newOrder.checkOut" type="date" placeholder="选择日期" value-format="YYYY-MM-DD"></el-date-picker>
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="newOrder.totalPrice" :min="0" :precision="2"></el-input-number>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="submitting">创建订单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const orders = ref([])
const channels = ref([])
const availableRooms = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)

const filters = ref({
  channel: '',
  status: ''
})

const newOrder = ref({
  roomId: null,
  customerName: '',
  customerPhone: '',
  channel: '',
  checkIn: '',
  checkOut: '',
  totalPrice: 0
})

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/orders', { params: filters.value })
    orders.value = res.data.data
  } catch (error) {
    ElMessage.error('获取订单失败')
  } finally {
    loading.value = false
  }
}

const fetchChannels = async () => {
  try {
    const res = await axios.get('/api/channels')
    channels.value = res.data.data
  } catch (error) {
    console.error('获取渠道失败:', error)
  }
}

const fetchRooms = async () => {
  try {
    const res = await axios.get('/api/rooms/calendar')
    availableRooms.value = res.data.data.filter(r => r.status === 'available')
  } catch (error) {
    console.error('获取房间失败:', error)
  }
}

const handleCreate = async () => {
  if (!newOrder.value.roomId || !newOrder.value.customerName || !newOrder.value.customerPhone) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  submitting.value = true
  try {
    const res = await axios.post('/api/orders', newOrder.value)
    ElMessage.success(res.data.message)
    dialogVisible.value = false
    fetchOrders()
    
    // 重置表单
    newOrder.value = {
      roomId: null,
      customerName: '',
      customerPhone: '',
      channel: '',
      checkIn: '',
      checkOut: '',
      totalPrice: 0
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '创建订单失败')
  } finally {
    submitting.value = false
  }
}

const handleView = (row) => {
  ElMessageBox.alert(`
    <p><strong>订单号:</strong> ${row.order_no}</p>
    <p><strong>客户:</strong> ${row.customer_name} (${row.customer_phone})</p>
    <p><strong>房间:</strong> ${row.room_number}</p>
    <p><strong>入住:</strong> ${row.check_in} → ${row.check_out}</p>
    <p><strong>金额:</strong> ¥${row.total_price}</p>
    <p><strong>渠道:</strong> ${getChannelName(row.channel)}</p>
    <p><strong>状态:</strong> ${getStatusLabel(row.status)}</p>
  `, '订单详情', {
    dangerouslyUseHTMLString: true
  })
}

const handleCancel = async (row) => {
  try {
    await ElMessageBox.confirm('确定要取消此订单吗？', '提示', { type: 'warning' })
    // 实际项目中调用取消接口
    ElMessage.success('订单已取消')
    fetchOrders()
  } catch {}
}

const getChannelName = (code) => {
  const map = {
    'ctrip': '携程',
    'meituan': '美团',
    'fliggy': '飞猪',
    'booking': 'Booking',
    'direct': '直销'
  }
  return map[code] || code
}

const getChannelType = (code) => {
  const map = {
    'ctrip': 'primary',
    'meituan': 'warning',
    'fliggy': 'success',
    'booking': 'info',
    'direct': 'danger'
  }
  return map[code] || ''
}

const getStatusLabel = (status) => {
  const map = {
    'pending': '待确认',
    'confirmed': '已确认',
    'checked_in': '已入住',
    'checked_out': '已退房',
    'cancelled': '已取消'
  }
  return map[status] || status
}

const getStatusType = (status) => {
  const map = {
    'pending': 'warning',
    'confirmed': 'success',
    'checked_in': 'primary',
    'checked_out': 'info',
    'cancelled': 'danger'
  }
  return map[status] || ''
}

onMounted(() => {
  fetchOrders()
  fetchChannels()
  fetchRooms()
})
</script>

<style scoped>
.orders-page {
  padding: 20px;
}
</style>
