import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from './views/Dashboard.vue'
import Orders from './views/Orders.vue'
import RoomCalendar from './views/RoomCalendar.vue'
import Customers from './views/Customers.vue'
import Finance from './views/Finance.vue'
import Cleaning from './views/Cleaning.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/orders', name: 'Orders', component: Orders },
  { path: '/calendar', name: 'Calendar', component: RoomCalendar },
  { path: '/customers', name: 'Customers', component: Customers },
  { path: '/finance', name: 'Finance', component: Finance },
  { path: '/cleaning', name: 'Cleaning', component: Cleaning }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
