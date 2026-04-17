<template>
  <div class="cleaning-page">
    <!-- 工具栏 -->
    <el-card style="margin-bottom: 20px">
      <el-form :inline="true">
        <el-form-item>
          <el-date-picker v-model="selectedDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" @change="fetchTasks" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="filterStatus" placeholder="任务状态" clearable @change="fetchTasks">
            <el-option label="全部" value=""></el-option>
            <el-option label="待清洁" value="pending"></el-option>
            <el-option label="清洁中" value="in_progress"></el-option>
            <el-option label="已完成" value="completed"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="dialogVisible = true">
            <el-icon><Plus /></el-icon>
            新建任务
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 任务列表 -->
    <el-card>
      <el-table :data="tasks" style="width: 100%">
        <el-table-column prop="room_number" label="房间号" width="100"></el-table-column>
        <el-table-column prop="assigned_to" label="负责人" width="120"></el-table-column>
        <el-table-column prop="scheduled_time" label="计划时间" width="180"></el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="completed_time" label="完成时间" width="180"></el-table-column>
        <el-table-column prop="notes" label="备注"></el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" size="small" type="primary" @click="updateStatus(row.id, 'in_progress')">开始清洁</el-button>
            <el-button v-if="row.status === 'in_progress'" size="small" type="success" @click="updateStatus(row.id, 'completed')">完成</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建任务对话框 -->
    <el-dialog v-model="dialogVisible" title="新建清洁任务" width="500px">
      <el-form :model="newTask" label-width="100px">
        <el-form-item label="房间">
          <el-select v-model="newTask.roomId" placeholder="选择房间">
            <el-option v-for="room in rooms" :key="room.id" :label="room.room_number" :value="room.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="newTask.assignedTo" placeholder="输入负责人姓名"></el-input>
        </el-form-item>
        <el-form-item label="计划时间">
          <el-date-picker v-model="newTask.scheduledTime" type="datetime" placeholder="选择时间" value-format="YYYY-MM-DD HH:mm:ss"></el-date-picker>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="newTask.notes" type="textarea" placeholder="输入备注"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const tasks = ref([])
const rooms = ref([])
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const filterStatus = ref('')
const dialogVisible = ref(false)

const newTask = ref({
  roomId: null,
  assignedTo: '',
  scheduledTime: '',
  notes: ''
})

const fetchTasks = async () => {
  try {
    const res = await axios.get('/api/cleaning/tasks', {
      params: {
        date: selectedDate.value,
        status: filterStatus.value
      }
    })
    tasks.value = res.data.data
  } catch (error) {
    console.error('获取任务失败:', error)
  }
}

const fetchRooms = async () => {
  try {
    const res = await axios.get('/api/rooms/calendar')
    rooms.value = res.data.data
  } catch (error) {
    console.error('获取房间失败:', error)
  }
}

const handleCreate = async () => {
  try {
    await axios.post('/api/cleaning/tasks', newTask.value)
    ElMessage.success('任务创建成功')
    dialogVisible.value = false
    fetchTasks()
    newTask.value = { roomId: null, assignedTo: '', scheduledTime: '', notes: '' }
  } catch (error) {
    ElMessage.error('创建失败')
  }
}

const updateStatus = async (id, status) => {
  try {
    await axios.put(`/api/cleaning/tasks/${id}`, { status })
    ElMessage.success('状态已更新')
    fetchTasks()
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

const getStatusLabel = (status) => {
  const map = {
    'pending': '待清洁',
    'in_progress': '清洁中',
    'completed': '已完成'
  }
  return map[status] || status
}

const getStatusType = (status) => {
  const map = {
    'pending': 'warning',
    'in_progress': 'primary',
    'completed': 'success'
  }
  return map[status] || ''
}

onMounted(() => {
  fetchTasks()
  fetchRooms()
})
</script>

<style scoped>
.cleaning-page {
  padding: 20px;
}
</style>
