<template>
  <div class="dashboard">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="12">
        <el-card class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <div class="stat-content">
            <div class="stat-label">当日营业额</div>
            <div class="stat-value">¥ {{ stats.revenue }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
          <div class="stat-content">
            <div class="stat-label">可售（间）</div>
            <div class="stat-value">{{ stats.availableRooms }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 房态统计条 -->
    <el-card style="margin-bottom: 20px">
      <el-row :gutter="10" class="room-status-bar">
        <el-col :span="4">
          <div class="status-item">
            <div class="status-label">预抵</div>
            <div class="status-value">{{ stats.roomStatus.preArrival }}</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="status-item">
            <div class="status-label">已抵</div>
            <div class="status-value">{{ stats.roomStatus.checkedIn }}</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="status-item">
            <div class="status-label">预离</div>
            <div class="status-value">{{ stats.roomStatus.preDeparture }}</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="status-item">
            <div class="status-label">已离</div>
            <div class="status-value">{{ stats.roomStatus.checkedOut }}</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="status-item">
            <div class="status-label">新办</div>
            <div class="status-value">{{ stats.roomStatus.pending }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 功能模块网格 -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="module in modules" :key="module.name">
        <el-card class="module-card" shadow="hover" @click="navigateTo(module.path)">
          <div class="module-content">
            <el-icon :size="40" :color="module.color">
              <component :is="module.icon" />
            </el-icon>
            <div class="module-name">{{ module.name }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const stats = ref({
  revenue: 0,
  availableRooms: 0,
  roomStatus: {
    preArrival: 0,
    checkedIn: 0,
    preDeparture: 0,
    checkedOut: 0,
    pending: 0
  }
})

const modules = [
  { name: '日历房态', icon: 'Calendar', color: '#409EFF', path: '/calendar' },
  { name: '单日房态', icon: 'Document', color: '#67C23A', path: '/calendar' },
  { name: '订单管理', icon: 'DocumentCopy', color: '#E6A23C', path: '/orders' },
  { name: '客户列表', icon: 'User', color: '#F56C6C', path: '/customers' },
  { name: '餐饮', icon: 'Food', color: '#909399', path: '/' },
  { name: '餐饮订单', icon: 'Tickets', color: '#C084FC', path: '/' },
  { name: 'AI直播间', icon: 'VideoCamera', color: '#60A5FA', path: '/' },
  { name: '智能定价', icon: 'TrendCharts', color: '#34D399', path: '/finance' },
  { name: '智能评价', icon: 'ChatDotSquare', color: '#FBBF24', path: '/' },
  { name: '更多', icon: 'More', color: '#94A3B8', path: '/' }
]

const fetchStats = async () => {
  try {
    const res = await axios.get('/api/dashboard/stats')
    stats.value = res.data
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const navigateTo = (path) => {
  if (path !== '/') {
    router.push(path)
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stat-card {
  border: none;
  color: white;
  height: 120px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
}

.stat-label {
  font-size: 16px;
  margin-bottom: 10px;
  opacity: 0.9;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
}

.room-status-bar {
  text-align: center;
}

.status-item {
  padding: 10px;
  border-right: 1px solid #eee;
}

.status-item:last-child {
  border-right: none;
}

.status-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.status-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.module-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.module-card:hover {
  transform: translateY(-5px);
}

.module-content {
  text-align: center;
  padding: 20px 0;
}

.module-name {
  margin-top: 10px;
  font-size: 14px;
  color: #333;
}
</style>
