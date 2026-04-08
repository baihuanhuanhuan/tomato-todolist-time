import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '../utils/request'
import { ElMessage, ElNotification } from 'element-plus'

export const useFocusStore = defineStore('focus', () => {
  // 状态
  const isRunning = ref(false)
  const timerType = ref('countdown') // 'countdown' | 'stopwatch'
  const focusName = ref('')
  const initialMinutes = ref(25) // 默认倒计时分钟数
  const remainingSeconds = ref(25 * 60) // 剩余或累计的秒数
  const startTime = ref(null) // 记录开始的真实时间

  let timerInterval = null

  // 格式化时间显示 (MM:SS)
  const formattedTime = computed(() => {
    const mins = Math.floor(remainingSeconds.value / 60)
    const secs = remainingSeconds.value % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  })

  // 开始计时
  const startTimer = () => {
    if (!focusName.value) {
      ElMessage.warning('请先给本次专注命名哦！')
      return
    }
    if (timerType.value === 'countdown' && initialMinutes.value <= 0) {
      ElMessage.warning('倒计时时间必须大于0！')
      return
    }

    isRunning.value = true
    startTime.value = new Date().toISOString()
    
    // 如果是正向计时，确保秒数从0开始
    if (timerType.value === 'stopwatch') {
      remainingSeconds.value = 0
    } else if (timerType.value === 'countdown') {
       remainingSeconds.value = initialMinutes.value * 60
    }

    timerInterval = setInterval(() => {
      if (timerType.value === 'countdown') {
        remainingSeconds.value--
        if (remainingSeconds.value <= 0) {
          finishFocus(true) // 正常结束
        }
      } else {
        remainingSeconds.value++ // 正向计时递增
      }
    }, 1000)
  }

  // 停止并放弃本次计时
  const stopTimer = () => {
    clearInterval(timerInterval)
    isRunning.value = false
    remainingSeconds.value = timerType.value === 'countdown' ? initialMinutes.value * 60 : 0
  }

  // 完成专注 (正常结束或手动结束正向计时)
  const finishFocus = async (isAutoFinish = false) => {
    clearInterval(timerInterval)
    isRunning.value = false
    
    let totalSeconds = 0;
    if (timerType.value === 'countdown') {
        totalSeconds = initialMinutes.value * 60; // 倒计时算总设定时间
    } else {
        totalSeconds = remainingSeconds.value; // 正向计时算累计时间
    }

    // 只有专注时间超过30秒才保存记录，防止误触
    if (totalSeconds >= 30) {
        try {
            await request.post('/focus', {
                focusName: focusName.value,
                focusType: timerType.value === 'countdown' ? 1 : 0,
                durationSeconds: totalSeconds,
                startTime: startTime.value
            })
            ElNotification({
                title: '专注完成！',
                message: `太棒了，你在“${focusName.value}”上专注了 ${Math.floor(totalSeconds/60)} 分钟！`,
                type: 'success',
            })
        } catch (error) {
            console.error("保存专注记录失败", error)
        }
    } else {
        ElMessage.info('专注时间太短，本次不记录哦。')
    }

    // 重置状态
    remainingSeconds.value = timerType.value === 'countdown' ? initialMinutes.value * 60 : 0
    focusName.value = ''
  }

  return {
    isRunning, timerType, focusName, initialMinutes, remainingSeconds,
    formattedTime, startTimer, stopTimer, finishFocus
  }
})