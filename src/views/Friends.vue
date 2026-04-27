<template>
  <div class="friends-container" v-loading="loading">
    <!-- 顶部操作区 -->
    <div class="header-action">
      <h2 style="color: var(--text-main); margin:0;">我的好友与排行榜</h2>
      <div style="display: flex; gap: 10px; width: 350px;">
        <el-input 
          v-model="inviteCodeInput" 
          placeholder="请输入朋友的6位专属邀请码" 
          clearable 
          prefix-icon="Search"
        />
        <el-button type="primary" color="var(--tomato-red)" @click="addFriend">
          添加好友
        </el-button>
      </div>
    </div>

    <!-- 好友列表区 -->
    <el-row :gutter="20" v-if="friends.length > 0">
      <!-- 循环渲染好友卡片 -->
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="(friend, index) in friends" :key="friend.id">
        <el-card class="friend-card" shadow="hover">
          <!-- 卡片头部：头像与排名 -->
          <div class="card-top">
            <div class="rank-badge" :class="`rank-${index + 1}`" v-if="index < 3">
               TOP {{ index + 1 }}
            </div>
            <el-avatar :src="friend.avatar" :size="70" class="f-avatar"></el-avatar>
            <h3 class="f-name">{{ friend.username }}</h3>
            <p class="f-sign">{{ friend.signature || '这个人很懒，什么都没写~' }}</p>
          </div>
          
          <!-- 卡片底部：专注数据 -->
          <div class="card-bottom">
            <div class="data-box">
              <div class="data-title">今日专注</div>
              <div class="data-value" style="color: var(--tomato-red);">
                {{ (friend.todayFocusSeconds / 60).toFixed(0) }} <span class="unit">分钟</span>
              </div>
            </div>
            <div class="divider"></div>
            <div class="data-box">
              <div class="data-title">本周总计</div>
              <div class="data-value" style="color: var(--leaf-green);">
                {{ (friend.weekFocusSeconds / 3600).toFixed(1) }} <span class="unit">小时</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 空状态 -->
    <el-empty 
      v-else 
      description="你还没有添加任何好友，快去向朋友要邀请码吧！" 
      :image-size="200"
    ></el-empty>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const inviteCodeInput = ref('')
const friends = ref([])

// 获取好友列表
const fetchFriends = async () => {
  loading.value = true
  try {
    const res = await request.get('/friend/list')
    friends.value = res
  } finally {
    loading.value = false
  }
}

// 添加好友
const addFriend = async () => {
  if (!inviteCodeInput.value) {
    return ElMessage.warning('邀请码不能为空哦')
  }
  try {
    // URL传参方式调用
    await request.post(`/friend/add?inviteCode=${inviteCodeInput.value.trim().toUpperCase()}`)
    ElMessage.success('添加成功！你们现在可以互相看到专注时长了')
    inviteCodeInput.value = '' // 清空输入框
    fetchFriends() // 刷新列表
  } catch (e) {
    // 错误提示 request.js 里的拦截器会处理
  }
}

onMounted(() => {
  fetchFriends()
})
</script>

<style scoped>
.friends-container {
  max-width: 1000px;
  margin: 0 auto;
}
.header-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.02);
}

.friend-card {
  border-radius: 16px;
  border: none;
  margin-bottom: 20px;
  position: relative;
  overflow: visible;
}
.friend-card :deep(.el-card__body) {
  padding: 0;
}

.card-top {
  padding: 30px 20px 20px;
  text-align: center;
  background-color: var(--cream-white);
  border-radius: 16px 16px 0 0;
  position: relative;
}
.f-avatar {
  border: 4px solid white;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  margin-bottom: 10px;
}
.f-name {
  margin: 0 0 5px 0;
  color: var(--text-main);
}
.f-sign {
  font-size: 12px;
  color: #999;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 前三名徽章样式 */
.rank-badge {
  position: absolute;
  top: -10px;
  left: 20px;
  padding: 4px 12px;
  border-radius: 12px;
  color: white;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.rank-1 { background: linear-gradient(45deg, #FFD700, #FFA500); }
.rank-2 { background: linear-gradient(45deg, #C0C0C0, #a1a1a1); }
.rank-3 { background: linear-gradient(45deg, #CD7F32, #b87333); }

.card-bottom {
  display: flex;
  padding: 15px 0;
  background: white;
  border-radius: 0 0 16px 16px;
}
.data-box {
  flex: 1;
  text-align: center;
}
.divider {
  width: 1px;
  background-color: #f0f0f0;
}
.data-title {
  font-size: 12px;
  color: #999;
  margin-bottom: 5px;
}
.data-value {
  font-size: 20px;
  font-weight: bold;
}
.unit {
  font-size: 12px;
  font-weight: normal;
}
</style>
