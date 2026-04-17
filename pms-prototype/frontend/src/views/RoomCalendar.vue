<template>
  <div class="calendar-page">
    <el-card>
      <div style="margin-bottom: 20px">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="fetchCalendar"
        />
      </div>
      
      <el-table :data="calendar" style="width: 100%" border>
        <el-table-column prop="room_number" label="房间号" width="100" fixed></el-table-column>
        <el-table-column prop="room_type" label="房型" width="120" fixed></el-table-column>
        <el-table-column
          v-for="date in dates"
          :key="date"
          :label="formatDate(date)"
          width="100"
        >
          <template #default="{ row }">
            <div :class="['room-cell', getCellClass(row, date)]">
              {{ getCellText(row, date) }}
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import dayjs from 'dayjs'

const dateRange = ref([
  dayjs().format('YYYY-MM-DD'),
  dayjs().add(14, 'day').format('YYYY-MM-DD')
])

const calendar = ref([])

const dates = computed(() => {
  if (!dateRange.value || dateRange.value.length !== 2) return []
  
  const start = dayjs(dateRange.value[0])
  const end = dayjs(dateRange.value[1])
  const result = []
  
  let current = start
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    result.push(current.format('YYYY-MM-DD'))
    current = current.add(1, 'day')
  }
  
  return result
})

const fetchCalendar = async () => {
  if (!dateRange.value || dateRange.value.length !== 2) return
  
  try {
    const res = await axios.get('/api/rooms/calendar', {
      params: {
        startDate: dateRange.value[0],
        endDate: dateRange.value[1]
      }
    })
    calendar.value = res.data.data
  } catch (error) {
    console.error('获取房态失败:', error)
  }
}

const getCellClass = (room, date) => {
  const occupancy = room.occupancy?.find(o => o.date === date)
  if (!occupancy) return 'available'
  return occupancy.status
}

const getCellText = (room, date) => {
  const occupancy = room.occupancy?.find(o => o.date === date)
  if (!occupancy || occupancy.status === 'available') return '可售'
  return '已售'
}

const formatDate = (date) => {
  return dayjs(date).format('MM-DD')
}

onMounted(() => {
  fetchCalendar()
})
</script>

<style scoped>
.calendar-page {
  padding: 20px;
}

.room-cell {
  padding: 5px;
  text-align: center;
  font-size: 12px;
  border-radius: 4px;
}

.room-cell.available {
  background-color: #e6f7ff;
  color: #1890ff;
}

.room-cell.booked {
  background-color: #fff1f0;
  color: #f5222d;
}
</style>
