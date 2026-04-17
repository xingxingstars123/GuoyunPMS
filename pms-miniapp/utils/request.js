// API 基础地址 - 支持环境变量
const BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://43.173.91.161:3100'

// 请求封装
export function request(options) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          const errorMsg = res.data?.message || `请求失败(${res.statusCode})`
          uni.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 3000
          })
          console.error('请求错误:', res)
          reject(res)
        }
      },
      fail: (err) => {
        uni.showToast({
          title: '网络连接失败,请检查网络',
          icon: 'none',
          duration: 3000
        })
        console.error('网络错误:', err)
        reject(err)
      }
    })
  })
}

// 导出具体接口
export const api = {
  // 获取首页统计
  getDashboardStats() {
    return request({ url: '/api/dashboard/stats' })
  },
  
  // 获取订单列表
  getOrders(params) {
    return request({ url: '/api/orders', data: params })
  },
  
  // 创建订单
  createOrder(data) {
    return request({ url: '/api/orders', method: 'POST', data })
  },
  
  // 获取客户列表
  getCustomers(params) {
    return request({ url: '/api/customers', data: params })
  },
  
  // 获取月度财务
  getMonthlyFinance(params) {
    return request({ url: '/api/finance/monthly', data: params })
  },
  
  // 获取渠道列表
  getChannels() {
    return request({ url: '/api/channels' })
  },
  
  // 获取房态日历
  getRoomCalendar(params) {
    return request({ url: '/api/rooms/calendar', data: params })
  },
  
  // 获取清洁任务列表
  getCleaningTasks(params) {
    return request({ url: '/api/cleaning/tasks', data: params })
  },
  
  // 创建清洁任务
  createCleaningTask(data) {
    return request({ url: '/api/cleaning/tasks', method: 'POST', data })
  },
  
  // 更新清洁任务
  updateCleaningTask(id, data) {
    return request({ url: `/api/cleaning/tasks/${id}`, method: 'PUT', data })
  }
}
