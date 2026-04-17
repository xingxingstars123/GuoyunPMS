<template>
  <div class="finance-page">
    <!-- 月度选择 -->
    <el-card style="margin-bottom: 20px">
      <el-date-picker
        v-model="selectedMonth"
        type="month"
        placeholder="选择月份"
        value-format="YYYY-MM"
        @change="fetchFinance"
      />
    </el-card>

    <!-- 总收入卡片 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="8">
        <el-card>
          <el-statistic title="总收入" :value="financeData.totalRevenue" :precision="2" prefix="¥" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <el-statistic title="订单数" :value="totalOrders" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <el-statistic title="平均客单价" :value="avgOrderValue" :precision="2" prefix="¥" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 渠道收入对比 -->
    <el-card style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span>渠道收入对比</span>
        </div>
      </template>
      <div ref="channelChart" style="width: 100%; height: 300px"></div>
    </el-card>

    <!-- 每日收入趋势 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>每日收入趋势</span>
        </div>
      </template>
      <div ref="trendChart" style="width: 100%; height: 300px"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import axios from 'axios'
import dayjs from 'dayjs'
import * as echarts from 'echarts'

const selectedMonth = ref(dayjs().format('YYYY-MM'))
const financeData = ref({
  totalRevenue: 0,
  channelStats: [],
  dailyTrend: []
})

const channelChart = ref(null)
const trendChart = ref(null)

const totalOrders = computed(() => {
  return financeData.value.channelStats.reduce((sum, item) => sum + item.order_count, 0)
})

const avgOrderValue = computed(() => {
  if (totalOrders.value === 0) return 0
  return financeData.value.totalRevenue / totalOrders.value
})

const fetchFinance = async () => {
  try {
    const [year, month] = selectedMonth.value.split('-')
    const res = await axios.get('/api/finance/monthly', {
      params: { year, month }
    })
    financeData.value = res.data.data
    
    await nextTick()
    renderCharts()
  } catch (error) {
    console.error('获取财务数据失败:', error)
  }
}

const renderCharts = () => {
  // 渠道收入对比饼图
  if (channelChart.value) {
    const chart1 = echarts.init(channelChart.value)
    chart1.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center'
      },
      series: [
        {
          type: 'pie',
          radius: '50%',
          data: financeData.value.channelStats.map(item => ({
            name: getChannelName(item.channel),
            value: item.revenue
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    })
  }
  
  // 每日收入趋势折线图
  if (trendChart.value) {
    const chart2 = echarts.init(trendChart.value)
    chart2.setOption({
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: financeData.value.dailyTrend.map(item => dayjs(item.date).format('MM-DD'))
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '¥{value}'
        }
      },
      series: [
        {
          name: '收入',
          type: 'line',
          data: financeData.value.dailyTrend.map(item => item.revenue),
          smooth: true,
          itemStyle: {
            color: '#409EFF'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
                { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
              ]
            }
          }
        }
      ]
    })
  }
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

onMounted(() => {
  fetchFinance()
})
</script>

<style scoped>
.finance-page {
  padding: 20px;
}
</style>
