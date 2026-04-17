<template>
  <div id="app">
    <el-container style="height: 100vh">
      <!-- 侧边栏 -->
      <el-aside width="200px" style="background: linear-gradient(180deg, #4A90E2 0%, #357ABD 100%)">
        <div style="padding: 20px; text-align: center; color: white; font-size: 20px; font-weight: bold">
          国韵民宿
        </div>
        <el-menu
          :default-active="$route.path"
          router
          background-color="transparent"
          text-color="#fff"
          active-text-color="#ffd04b"
        >
          <el-menu-item index="/">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/orders">
            <el-icon><DocumentCopy /></el-icon>
            <span>订单管理</span>
          </el-menu-item>
          <el-menu-item index="/calendar">
            <el-icon><Calendar /></el-icon>
            <span>房态日历</span>
          </el-menu-item>
          <el-menu-item index="/customers">
            <el-icon><User /></el-icon>
            <span>客户列表</span>
          </el-menu-item>
          <el-menu-item index="/finance">
            <el-icon><TrendCharts /></el-icon>
            <span>财务统计</span>
          </el-menu-item>
          <el-menu-item index="/cleaning">
            <el-icon><Finished /></el-icon>
            <span>清洁管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-container>
        <el-header style="background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: space-between">
          <h2 style="margin: 0">{{ pageTitle }}</h2>
          <div>
            <el-button type="primary" @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </el-header>
        <el-main style="background: #f5f7fa">
          <router-view @update-title="updateTitle" />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const pageTitle = ref('首页')

const titleMap = {
  '/': '首页',
  '/orders': '订单管理',
  '/calendar': '房态日历',
  '/customers': '客户列表',
  '/finance': '财务统计',
  '/cleaning': '清洁管理'
}

watch(() => route.path, (newPath) => {
  pageTitle.value = titleMap[newPath] || '智能公寓管理系统'
}, { immediate: true })

const updateTitle = (title) => {
  pageTitle.value = title
}

const handleRefresh = () => {
  window.location.reload()
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.el-menu-item.is-active {
  background-color: rgba(255, 255, 255, 0.2) !important;
}
</style>
