import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue') // 登录页
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('../layout/Layout.vue'),
    redirect: '/tasks',
    children: [
      { path: 'tasks', name: 'Tasks', component: () => import('../views/Tasks.vue') },
      { path: 'stats', name: 'Stats', component: () => import('../views/Stats.vue') },
      { path: 'profile', name: 'Profile', component: () => import('../views/Profile.vue') }, // 个人中心
      { path: 'friends', name: 'Friends', component: () => import('../views/Friends.vue') } // 好友列表
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  // 如果去的地方不是登录页，且没有 token，就踢回登录页
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next() // 放行
  }
})

export default router
