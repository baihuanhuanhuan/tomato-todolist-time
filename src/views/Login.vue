<template>
  <div class="login-container">
    <div class="login-box">
      <div class="logo-area">
        <img src="/tomato.png" alt="logo" class="logo" />
        <h2>洋柿子计划</h2>
        <p>让每一分钟都变得有营养</p>
      </div>

      <!-- 登录表单 -->
      <el-form v-if="isLogin" :model="loginForm" class="form-area" size="large">
        <el-form-item>
          <el-input v-model="loginForm.email" placeholder="请输入邮箱" prefix-icon="Message" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password prefix-icon="Lock" />
        </el-form-item>
        <el-button type="primary" color="var(--tomato-red)" class="submit-btn" round @click="handleLogin">登录</el-button>
        <div class="toggle-text">还没有账号？ <span @click="isLogin = false">立即注册</span></div>
      </el-form>

      <!-- 注册表单 -->
      <el-form v-else :model="registerForm" class="form-area" size="large">
        <el-form-item>
          <el-input v-model="registerForm.email" placeholder="请输入真实邮箱" prefix-icon="Message" />
        </el-form-item>
        
        <!-- 新增：验证码输入行 -->
        <el-form-item>
          <div style="display: flex; width: 100%; gap: 10px;">
            <el-input v-model="registerForm.code" placeholder="6位验证码" prefix-icon="Key" style="flex: 1;" />
            <el-button 
                :type="countdown > 0 ? 'info' : 'primary'" 
                :color="countdown > 0 ? '' : 'var(--leaf-green)'"
                :disabled="countdown > 0" 
                @click="sendCode"
                style="width: 110px;"
            >
              {{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <el-input v-model="registerForm.password" type="password" placeholder="设置密码" show-password prefix-icon="Lock" />
        </el-form-item>
        <el-button type="primary" color="var(--leaf-green)" class="submit-btn" round @click="handleRegister">注册账号</el-button>
        <div class="toggle-text">已有账号？ <span @click="isLogin = true">返回登录</span></div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLogin = ref(true)

const loginForm = ref({ email: '', password: '' })
const registerForm = ref({ email: '', password: '', code: '' }) // 新增 code 字段

const countdown = ref(0) // 倒计时秒数

// 登录逻辑
const handleLogin = async () => {
  if (!loginForm.value.email || !loginForm.value.password) {
    return ElMessage.warning('邮箱和密码不能为空')
  }
  try {
    const res = await request.post('/user/login', loginForm.value)
    localStorage.setItem('token', res.token)
    localStorage.setItem('userInfo', JSON.stringify(res.userInfo))
    ElMessage.success('欢迎回来！')
    router.push('/tasks')
  } catch (e) {}
}

// 发送验证码逻辑
const sendCode = async () => {
    // 简单的邮箱格式校验
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(registerForm.value.email)) {
        return ElMessage.warning('请先填写正确的邮箱地址！')
    }

    try {
        await request.get(`/user/sendEmailCode?email=${registerForm.value.email}`)
        ElMessage.success('验证码发送成功，请前往邮箱查看！')
        
        // 开始 60 秒倒计时
        countdown.value = 60
        const timer = setInterval(() => {
            countdown.value--
            if (countdown.value <= 0) {
                clearInterval(timer)
            }
        }, 1000)
    } catch (e) {}
}

// 注册逻辑
const handleRegister = async () => {
  if (!registerForm.value.email || !registerForm.value.password || !registerForm.value.code) {
    return ElMessage.warning('请填写完整注册信息')
  }
  try {
    // 把带着验证码的表单发给后端
    await request.post('/user/register', registerForm.value)
    ElMessage.success('注册成功，请登录！')
    isLogin.value = true
    loginForm.value.email = registerForm.value.email
  } catch (e) {}
}
</script>

<style scoped>
/* 样式保留之前的 */
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--cream-white);
  background-image: radial-gradient(#f2adad 1px, transparent 1px);
  background-size: 30px 30px;
}
.login-box {
  width: 400px;
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(230, 92, 92, 0.1);
}
.logo-area { text-align: center; margin-bottom: 30px; }
.logo-area .logo { width: 60px; }
.logo-area h2 { color: var(--tomato-red); margin: 10px 0 5px; }
.logo-area p { color: #999; font-size: 14px; margin: 0; }
.submit-btn { width: 100%; margin-top: 10px; font-weight: bold; }
.toggle-text { text-align: center; margin-top: 20px; font-size: 14px; color: #666; }
.toggle-text span { color: var(--tomato-red); cursor: pointer; font-weight: bold; }
</style>