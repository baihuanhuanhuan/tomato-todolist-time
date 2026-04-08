<template>
  <el-container class="layout-container">
    <!-- 左侧侧边栏 -->
    <el-aside width="220px" class="aside-menu">
      <div class="logo-box">
        <img src="/tomato.png" alt="logo" class="logo-img" />
        <span class="logo-text">洋柿子计划</span>
      </div>
      <!-- 导航菜单 -->
      <el-menu
        :default-active="$route.path"
        router
        class="custom-menu"
        background-color="transparent"
      >
        <el-menu-item index="/tasks">
          <el-icon><List /></el-icon>
          <span>任务大厅</span>
        </el-menu-item>
        <el-menu-item index="/stats">
          <el-icon><DataLine /></el-icon>
          <span>专注统计</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶部 Header -->
      <el-header class="header">
        <div class="header-title">{{ getTitle() }}</div>
        <div class="user-info">
          <el-avatar size="small" style="background-color: var(--leaf-green);">User</el-avatar>
        </div>
      </el-header>

      <!-- 主体内容区 (子路由渲染的地方) -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>

    <!-- 侧边全局悬浮窗: 洋柿子专注钟 -->
    <div class="tomato-drawer-wrapper" :class="{ 'is-open': drawerVisible }">
      <!-- 抽拉小箭头 -->
      <div class="drawer-handler" @click="toggleDrawer">
        <el-icon><ArrowLeft v-if="!drawerVisible" /><ArrowRight v-else /></el-icon>
        <div class="handler-text">番茄钟</div>
      </div>
      
      <!-- 悬浮窗主体 -->
      <!-- 悬浮窗主体 -->
      <div class="drawer-content">
        <h3 style="color: var(--tomato-red); margin-top: 0;">开始专注</h3>
        
        <el-input 
          placeholder="给专注命名(如:英语)" 
          v-model="focusStore.focusName" 
          size="small" 
          style="margin-bottom: 15px;"
          :disabled="focusStore.isRunning"
        />
        
        <el-radio-group 
          v-model="focusStore.timerType" 
          size="small" 
          style="margin-bottom: 15px;"
          :disabled="focusStore.isRunning"
        >
          <el-radio-button label="countdown">倒计时</el-radio-button>
          <el-radio-button label="stopwatch">正向计时</el-radio-button>
        </el-radio-group>

        <!-- 如果是倒计时且未开始，允许输入分钟数 -->
        <div v-if="focusStore.timerType === 'countdown' && !focusStore.isRunning" style="margin-bottom: 15px; text-align: center;">
             设定分钟: <el-input-number v-model="focusStore.initialMinutes" :min="1" :max="120" size="small" />
        </div>
        
        <!-- 大大的时间显示 -->
        <div class="timer-display" :class="{'is-running': focusStore.isRunning}">
            {{ focusStore.formattedTime }}
        </div>
        
        <!-- 按钮组 -->
        <div class="action-buttons" style="width: 100%; display: flex; gap: 10px;">
            <el-button 
                v-if="!focusStore.isRunning" 
                type="primary" 
                color="var(--leaf-green)" 
                round 
                style="flex: 1;" 
                @click="focusStore.startTimer"
            >开始</el-button>
            
            <template v-else>
                 <el-button 
                    v-if="focusStore.timerType === 'stopwatch'" 
                    type="primary" 
                    color="var(--tomato-red)" 
                    round 
                    style="flex: 1;" 
                    @click="focusStore.finishFocus(false)"
                >结束记录</el-button>
                <el-button 
                    color="#f56c6c" 
                    plain
                    round 
                    style="flex: 1;" 
                    @click="focusStore.stopTimer"
                >放弃</el-button>
            </template>
        </div>
      </div>
    </div>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useFocusStore } from '../store/focus'

const route = useRoute()
const drawerVisible = ref(false)
const focusName = ref('')
const timerType = ref('countdown')
const focusStore = useFocusStore()
// 切换抽屉状态
const toggleDrawer = () => {
  drawerVisible.value = !drawerVisible.value
}

// 动态获取标题
const getTitle = () => {
  if (route.path.includes('/tasks')) return '📝 任务大厅'
  if (route.path.includes('/stats')) return '📊 专注统计'
  return '洋柿子计划安排'
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  background-color: var(--cream-white);
}

.aside-menu {
  background-color: #fff;
  border-right: 1px solid #f0f0f0;
  box-shadow: 2px 0 8px rgba(0,0,0,0.02);
}

.logo-box {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #f0f0f0;
}

.logo-img {
  width: 32px;
  height: 32px;
  margin-right: 10px;
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
  color: var(--tomato-red);
}

.custom-menu {
  border-right: none;
}

.header {
  background-color: var(--cream-white);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}

.header-title {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-main);
}

.main-content {
  padding: 20px;
}

/* --- 番茄钟悬浮抽屉样式 --- */
.tomato-drawer-wrapper {
  position: fixed;
  right: -250px; /* 默认隐藏主体 */
  top: 20%;
  width: 250px;
  height: 400px;
  background-color: #fff;
  box-shadow: -4px 4px 15px rgba(230, 92, 92, 0.15); /* 淡淡的洋柿子红阴影 */
  border-radius: 12px 0 0 12px;
  transition: right 0.3s ease;
  z-index: 999;
}

.tomato-drawer-wrapper.is-open {
  right: 0;
}

.drawer-handler {
  position: absolute;
  left: -30px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 100px;
  background-color: var(--tomato-red);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 8px 0 0 8px;
  cursor: pointer;
  box-shadow: -2px 0 5px rgba(0,0,0,0.1);
}

.handler-text {
  writing-mode: vertical-lr;
  font-size: 12px;
  letter-spacing: 2px;
  margin-top: 5px;
}

.drawer-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timer-display {
  font-size: 48px;
  font-weight: bold;
  color: var(--text-main);
  margin: 20px 0;
  font-family: 'Courier New', Courier, monospace;
}
</style>
