<template>
  <div class="profile-container">
    <el-card class="box-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span style="font-weight: bold; font-size: 18px; color: var(--text-main);">个人资料设置</span>
        </div>
      </template>

      <el-form :model="form" label-width="100px" style="max-width: 500px;">
        <el-form-item label="专属邀请码">
          <el-tag size="large" type="danger" effect="dark" style="font-size: 16px; letter-spacing: 2px;">
            {{ form.inviteCode }}
          </el-tag>
          <span style="color: #999; font-size: 12px; margin-left: 10px;">(发给朋友，添加你为好友)</span>
        </el-form-item>
        <el-form-item label="登录邮箱">
          <el-input v-model="form.email" disabled />
        </el-form-item>
        <el-form-item label="用户昵称">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="个性签名">
          <el-input v-model="form.signature" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="头像上传">
          <el-upload
            class="avatar-uploader"
            action="/api/file/upload" 
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
            :headers="uploadHeaders"
          ><img v-if="form.avatar" :src="form.avatar" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div style="font-size: 12px; color: #999; margin-top: 5px; line-height: 1.2;">
            点击图片可重新上传。只能上传 jpg/png 文件，且不超过 2MB。
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" color="var(--leaf-green)" @click="saveProfile">保存修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const form = ref({})

const uploadHeaders=computed(()=>{
  const token = localStorage.getItem('token')
  return token ? { Authorization: 'Bearer ' + token } : {}
})

onMounted(async () => {
  // 从后端获取最新的个人信息
  const res = await request.get('/user/profile')
  form.value = res
})

// 上传成功后的回调
const handleAvatarSuccess = (res, file) => {
    // 后端返回的 res 就是我们封装的 Result 格式
    if (res.code === 200) {
        // 把返回的图片 URL 赋值给表单
        form.value.avatar = res.data;
        ElMessage.success('头像上传成功，请点击【保存修改】生效');
    } else {
        ElMessage.error(res.msg || '上传失败');
    }
}

// 上传前的校验（限制大小和格式）
const beforeAvatarUpload = (rawFile) => {
  const isJPG = rawFile.type === 'image/jpeg' || rawFile.type === 'image/png'
  const isLt2M = rawFile.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('头像图片只能是 JPG 或 PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像图片大小不能超过 2MB!')
    return false
  }
  return true
}

const saveProfile = async () => {
  await request.put('/user/profile', form.value)
  ElMessage.success('资料修改成功！')
  // 更新本地存储的名字和头像，以刷新右上角的显示
  const oldInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  oldInfo.username = form.value.username
  oldInfo.avatar = form.value.avatar
  localStorage.setItem('userInfo', JSON.stringify(oldInfo))
  // 刷新页面让右上角生效
  setTimeout(() => window.location.reload(), 1000)
}
</script>

<style scoped>
.profile-container {
  padding: 20px;
}
/* Element Plus 上传组件的自定义样式 */
.avatar-uploader .avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%; /* 圆形头像 */
  display: block;
  object-fit: cover;
}
.avatar-uploader :deep(.el-upload) {
  border: 1px dashed var(--el-border-color);
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}
.avatar-uploader :deep(.el-upload:hover) {
  border-color: var(--el-color-primary);
}
.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
}
</style>