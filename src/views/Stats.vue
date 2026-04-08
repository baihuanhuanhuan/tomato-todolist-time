<template>
  <div class="stats-container" v-loading="loading">
    
    <!-- 顶部概览卡片 -->
    <el-row :gutter="20" class="summary-cards">
      <el-col :span="12">
        <el-card shadow="hover" class="data-card today-card">
          <div class="card-title">🍅 今日专注总时长</div>
          <div class="card-value">{{ (todayFocusSeconds / 60).toFixed(0) }} <span class="unit">分钟</span></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="data-card week-card">
          <div class="card-title">🌿 近七天专注总计</div>
          <div class="card-value">{{ (weekFocusSeconds / 3600).toFixed(1) }} <span class="unit">小时</span></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ECharts 趋势图 -->
    <el-card shadow="hover" class="chart-card">
      <h3 style="margin-top:0; color: var(--text-main);">近七天专注趋势</h3>
      <div ref="chartRef" style="height: 250px; width: 100%;"></div>
    </el-card>

    <!-- 日历热力图 -->
    <el-card shadow="hover" class="calendar-card">
      <h3 style="margin-top:0; color: var(--text-main);">洋柿子专注日历 (点击查看详情)</h3>
      <el-calendar v-model="currentDate">
        <template #date-cell="{ data }">
          <div 
            class="calendar-cell" 
            :style="getHeatmapStyle(data.day)"
            @click="handleDateClick(data.day)"
          >
            <!-- 显示日期数字 -->
            <div class="date-num">{{ data.day.split('-').slice(2).join('') }}</div>
            <!-- 如果当天有专注时间，显示一个小标识 -->
            <div v-if="getFocusTimeByDate(data.day) > 0" class="focus-badge">
              {{ (getFocusTimeByDate(data.day) / 60).toFixed(0) }}m
            </div>
          </div>
        </template>
      </el-calendar>
    </el-card>

    <!-- 每日详情弹窗 -->
    <el-dialog v-model="showDetailDialog" :title="`${selectedDate} 数据分析`" width="400px">
      <div class="detail-section">
        <h4>🍅 专注记录</h4>
        <el-timeline v-if="selectedFocusRecords.length > 0">
          <el-timeline-item
            v-for="(record, index) in selectedFocusRecords"
            :key="index"
            :type="'danger'"
            :timestamp="formatTime(record.createTime)"
          >
            {{ record.focusName }} ({{ (record.durationSeconds / 60).toFixed(0) }}分钟)
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="这天没有专注记录哦" :image-size="60"></el-empty>
      </div>

      <div class="detail-section" style="margin-top: 20px;">
        <h4>🌿 已完成任务</h4>
        <ul class="task-list" v-if="selectedCompletedTasks.length > 0">
          <li v-for="task in selectedCompletedTasks" :key="task.id">
            <el-icon color="#7bb059"><Check /></el-icon> {{ task.title }}
          </li>
        </ul>
        <el-empty v-else description="没有完成的任务" :image-size="60"></el-empty>
      </div>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import request from '../utils/request'
import dayjs from 'dayjs' // 日期处理神器，Vite默认带了相关的能力，若报错请 npm install dayjs

const loading = ref(false)
const chartRef = ref(null)
let myChart = null

// 数据源
const allFocusRecords = ref([])
const allTasks = ref([])

// 统计数据
const todayFocusSeconds = ref(0)
const weekFocusSeconds = ref(0)
const heatmapData = ref({}) // 结构: {'2023-10-01': 3600 (秒)}

// 日历与弹窗状态
const currentDate = ref(new Date())
const showDetailDialog = ref(false)
const selectedDate = ref('')
const selectedFocusRecords = ref([])
const selectedCompletedTasks = ref([])

// 页面加载时获取所有数据
const fetchData = async () => {
    loading.value = true
    try {
        // 并行请求专注记录和任务列表
        const [focusRes, tasksRes] = await Promise.all([
            request.get('/focus/list'),
            request.get('/task/list')
        ])
        allFocusRecords.value = focusRes
        allTasks.value = tasksRes

        processData()
        initChart()
    } finally {
        loading.value = false
    }
}

// 处理与聚合数据
const processData = () => {
    const todayStr = dayjs().format('YYYY-MM-DD')
    const sevenDaysAgo = dayjs().subtract(6, 'day')
    
    let todaySecs = 0
    let weekSecs = 0
    const heatMap = {}
    const weekTrend = [0, 0, 0, 0, 0, 0, 0] // 存放近7天每天的秒数

    allFocusRecords.value.forEach(record => {
        // 后端传来的可能是时间字符串，我们只取 YYYY-MM-DD 部分
        const recordDateStr = dayjs(record.createTime).format('YYYY-MM-DD')
        const secs = record.durationSeconds

        // 累计每日热力图数据
        if (!heatMap[recordDateStr]) heatMap[recordDateStr] = 0
        heatMap[recordDateStr] += secs

        // 今日统计
        if (recordDateStr === todayStr) {
            todaySecs += secs
        }

        // 近七天统计
        const recordDayjs = dayjs(recordDateStr)
        if (recordDayjs.isAfter(sevenDaysAgo.subtract(1, 'day'))) {
            weekSecs += secs
            // 计算是近7天中的哪一天 (0是今天，6是6天前)
            const diffDays = dayjs().startOf('day').diff(recordDayjs.startOf('day'), 'day')
            if(diffDays >=0 && diffDays < 7) {
                weekTrend[6 - diffDays] += secs
            }
        }
    })

    todayFocusSeconds.value = todaySecs
    weekFocusSeconds.value = weekSecs
    heatmapData.value = heatMap

    // 把计算好的 7 天趋势存起来供图表使用
    window.weekTrendData = weekTrend.map(s => (s / 60).toFixed(0)) // 转成分钟
}

// 初始化 ECharts
const initChart = () => {
    if (!chartRef.value) return
    if (myChart) myChart.dispose()
    
    myChart = echarts.init(chartRef.value)
    
    // 生成近7天的日期标签 (X轴)
    const xAxisData = []
    for(let i=6; i>=0; i--) {
        xAxisData.push(dayjs().subtract(i, 'day').format('MM-DD'))
    }

    const option = {
        tooltip: { trigger: 'axis', formatter: '{b} <br/>专注: {c} 分钟' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: xAxisData, axisLine: { lineStyle: { color: '#ccc' } } },
        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#eee' } } },
        series: [
            {
                data: window.weekTrendData,
                type: 'bar',
                barWidth: '40%',
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'var(--tomato-red)' }, // 洋柿子红渐变
                        { offset: 1, color: 'var(--tomato-red-light)' }
                    ]),
                    borderRadius: [4, 4, 0, 0]
                }
            }
        ]
    }
    myChart.setOption(option)
}

// 获取某天的专注秒数
const getFocusTimeByDate = (dateStr) => {
    return heatmapData.value[dateStr] || 0
}

// 核心：动态返回日历格子的背景色 (热力图效果)
const getHeatmapStyle = (dateStr) => {
    const secs = getFocusTimeByDate(dateStr)
    if (secs === 0) return { backgroundColor: 'transparent' }
    
    const mins = secs / 60
    // 颜色渐变逻辑：时间越长，颜色越深
    if (mins <= 25) return { backgroundColor: '#fbe6e6' } // 非常浅的红
    if (mins <= 60) return { backgroundColor: '#f6cece' } // 浅红
    if (mins <= 120) return { backgroundColor: '#f2adad' } // 中红
    return { backgroundColor: 'var(--tomato-red)', color: 'white' } // 深红 (洋柿子红)
}

// 点击日历格子的事件
const handleDateClick = (dateStr) => {
    selectedDate.value = dateStr
    
    // 筛选当天的专注记录
    selectedFocusRecords.value = allFocusRecords.value.filter(r => 
        dayjs(r.createTime).format('YYYY-MM-DD') === dateStr
    )
    
    // 筛选当天的已完成任务 (这里我们简单地用任务的 createTime 或 updateTime 代替)
    // 因为最初设计的表里只有 status，没有 finish_time，我们近似处理为：状态为2，且创建/修改日期在今天的
    selectedCompletedTasks.value = allTasks.value.filter(t => 
        t.status === 2 && dayjs(t.createTime).format('YYYY-MM-DD') === dateStr
    )
    
    showDetailDialog.value = true
}

// 格式化时间戳 (仅显示时分)
const formatTime = (timeStr) => {
    return dayjs(timeStr).format('HH:mm')
}

// 监听窗口大小变化调整图表
window.addEventListener('resize', () => {
    if(myChart) myChart.resize()
})

onMounted(() => {
    fetchData()
})
</script>

<style scoped>
.stats-container {
    max-width: 900px;
    margin: 0 auto;
    padding-bottom: 40px;
}
.summary-cards {
    margin-bottom: 20px;
}
.data-card {
    border-radius: 12px;
    text-align: center;
    border: none;
}
.today-card {
    background: linear-gradient(135deg, var(--tomato-red-light) 0%, #fff 100%);
}
.week-card {
    background: linear-gradient(135deg, #eaf2e3 0%, #fff 100%); /* 淡淡的叶子绿背景 */
}
.card-title {
    color: #666;
    font-size: 14px;
    margin-bottom: 10px;
}
.card-value {
    color: var(--tomato-red);
    font-size: 36px;
    font-weight: bold;
}
.week-card .card-value {
    color: var(--leaf-green);
}
.unit {
    font-size: 14px;
    font-weight: normal;
    color: #999;
}
.chart-card, .calendar-card {
    border-radius: 12px;
    margin-bottom: 20px;
    border: none;
}

/* --- 自定义日历样式 --- */
/* 去除默认的 padding，让我们自己的单元格撑满 */
:deep(.el-calendar-table .el-calendar-day) {
    padding: 0;
    height: 80px;
}
.calendar-cell {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 8px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.calendar-cell:hover {
    transform: scale(0.95);
    border-radius: 8px;
}
.date-num {
    font-weight: bold;
}
.focus-badge {
    align-self: flex-end;
    font-size: 12px;
    background: rgba(0,0,0,0.1);
    padding: 2px 6px;
    border-radius: 10px;
}

/* 详情弹窗样式 */
.detail-section h4 {
    margin: 0 0 10px 0;
    color: var(--text-main);
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
}
.task-list {
    list-style: none;
    padding: 0;
    margin: 0;
}
.task-list li {
    font-size: 14px;
    margin-bottom: 8px;
    color: #555;
    display: flex;
    align-items: center;
    gap: 8px;
}
</style>
