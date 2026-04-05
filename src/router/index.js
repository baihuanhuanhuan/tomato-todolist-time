import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Layout',
    component: () => import('../layout/Layout.vue'), // 整体布局
    redirect: '/tasks',
    children: [
      {
        path: 'tasks',
        name: 'Tasks',
        component: () => import('../views/Tasks.vue') // 任务大厅
      },
      {
        path: 'stats',
        name: 'Stats',
        component: () => import('../views/Stats.vue') // 专注统计页面
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
