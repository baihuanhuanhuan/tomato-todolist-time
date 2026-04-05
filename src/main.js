import { createApp } from 'vue'
import './style.css' // 引入全局样式
import App from './App.vue'
import router from './router'// 引入路由

// 引入核心库
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css' // 引入 Element Plus
import * as ElementPlusIconsVue from '@element-plus/icons-vue' // 引入所有图标

const app = createApp(App)

const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
