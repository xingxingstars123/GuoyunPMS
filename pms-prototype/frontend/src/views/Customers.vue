<template>
  <div class="customers-page">
    <el-card>
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部客户" name="all">
          <el-table :data="customers" style="width: 100%">
            <el-table-column prop="name" label="姓名" width="120"></el-table-column>
            <el-table-column prop="phone" label="电话" width="150"></el-table-column>
            <el-table-column prop="channel" label="来源渠道" width="120">
              <template #default="{ row }">
                <el-tag>{{ getChannelName(row.channel) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="total_orders" label="订单数" width="100"></el-table-column>
            <el-table-column prop="total_spent" label="累计消费" width="120">
              <template #default="{ row }">¥{{ row.total_spent }}</template>
            </el-table-column>
            <el-table-column prop="created_at" label="注册时间" width="180"></el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="携程" name="ctrip">
          <el-table :data="getCustomersByChannel('ctrip')" style="width: 100%">
            <el-table-column prop="name" label="姓名"></el-table-column>
            <el-table-column prop="phone" label="电话"></el-table-column>
            <el-table-column prop="total_orders" label="订单数"></el-table-column>
            <el-table-column prop="total_spent" label="累计消费">
              <template #default="{ row }">¥{{ row.total_spent }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="美团" name="meituan">
          <el-table :data="getCustomersByChannel('meituan')" style="width: 100%">
            <el-table-column prop="name" label="姓名"></el-table-column>
            <el-table-column prop="phone" label="电话"></el-table-column>
            <el-table-column prop="total_orders" label="订单数"></el-table-column>
            <el-table-column prop="total_spent" label="累计消费">
              <template #default="{ row }">¥{{ row.total_spent }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="直销" name="direct">
          <el-table :data="getCustomersByChannel('direct')" style="width: 100%">
            <el-table-column prop="name" label="姓名"></el-table-column>
            <el-table-column prop="phone" label="电话"></el-table-column>
            <el-table-column prop="total_orders" label="订单数"></el-table-column>
            <el-table-column prop="total_spent" label="累计消费">
              <template #default="{ row }">¥{{ row.total_spent }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const customers = ref([])
const activeTab = ref('all')

const fetchCustomers = async () => {
  try {
    const res = await axios.get('/api/customers')
    customers.value = res.data.data.all
  } catch (error) {
    console.error('获取客户失败:', error)
  }
}

const getCustomersByChannel = (channel) => {
  return customers.value.filter(c => c.channel === channel)
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

const handleTabChange = (tab) => {
  console.log('切换到:', tab)
}

onMounted(() => {
  fetchCustomers()
})
</script>

<style scoped>
.customers-page {
  padding: 20px;
}
</style>
