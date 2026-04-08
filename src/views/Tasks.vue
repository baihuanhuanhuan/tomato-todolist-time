<template>
  <div class="tasks-container">
    <div class="header-action">
      <h2 style="color: var(--text-main); margin:0;">我的待办</h2>
      <el-button type="primary" color="var(--tomato-red)" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon> 快速新建
      </el-button>
    </div>

    <!-- 任务列表容器 -->
    <div class="task-list" v-loading="loading">
      <div v-if="tasks.length === 0" class="empty-state">
        <el-empty description="今天也很闲哦~ 去专注一下吧！" />
      </div>

      <!-- 循环渲染每一个任务卡片 -->
      <el-card 
        v-for="task in tasks" 
        :key="task.id" 
        class="task-card"
        :class="{ 'is-done': task.status === 2 }"
      >
        <div class="task-inner">
          <div class="checkbox-area">
             <el-checkbox 
                :model-value="task.status === 2" 
                @change="(val) => handleStatusChange(task, val)"
                size="large"
            />
          </div>
          <div class="content-area">
            <h3 class="task-title" :class="{ 'del-line': task.status === 2 }">
               <el-tag v-if="task.priority === 3" type="danger" size="small" effect="dark" round style="margin-right:5px;">急</el-tag>
               <el-tag v-if="task.priority === 2" type="warning" size="small" round style="margin-right:5px;">中</el-tag>
               {{ task.title }}
            </h3>
            <p class="task-desc" v-if="task.content">{{ task.content }}</p>
          </div>
          <div class="action-area">
            <el-button type="danger" text @click="deleteTask(task.id)">删除</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 新建任务弹窗 -->
    <el-dialog v-model="showAddDialog" title="新建计划" width="30%">
      <el-form :model="newTask">
        <el-form-item label="任务标题">
          <el-input v-model="newTask.title" autocomplete="off" />
        </el-form-item>
        <el-form-item label="详细说明">
           <el-input type="textarea" v-model="newTask.content" />
        </el-form-item>
         <el-form-item label="优先级">
            <el-radio-group v-model="newTask.priority">
              <el-radio :label="1">低 (绿)</el-radio>
              <el-radio :label="2">中 (黄)</el-radio>
              <el-radio :label="3">高 (红)</el-radio>
            </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" color="var(--leaf-green)" @click="submitTask">保存</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const tasks = ref([])
const loading = ref(false)
const showAddDialog = ref(false)
const newTask = ref({ title: '', content: '', priority: 1, status: 0 })

// 获取任务列表
const fetchTasks = async () => {
    loading.value = true
    try {
        const data = await request.get('/task/list')
        tasks.value = data
    } finally {
        loading.value = false
    }
}

// 提交新任务
const submitTask = async () => {
    if(!newTask.value.title) {
        ElMessage.warning('标题不能为空哦！')
        return
    }
    await request.post('/task', newTask.value)
    ElMessage.success('添加成功！')
    showAddDialog.value = false
    newTask.value = { title: '', content: '', priority: 1, status: 0 } // 重置表单
    fetchTasks() // 刷新列表
}

// 切换完成状态
const handleStatusChange = async (task, isChecked) => {
    const newStatus = isChecked ? 2 : 0;
    // 乐观更新 UI
    const originalStatus = task.status;
    task.status = newStatus;
    try {
        await request.put(`/task/${task.id}/status/${newStatus}`);
        if(newStatus === 2) {
             ElMessage.success('又完成了一项，太棒啦！');
        }
    } catch (e) {
        // 接口失败，回退 UI
        task.status = originalStatus;
    }
}

// 删除任务
const deleteTask = (id) => {
    ElMessageBox.confirm('确定要删除这个任务吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(async () => {
        await request.delete(`/task/${id}`)
        ElMessage.success('已删除')
        fetchTasks()
    }).catch(() => {})
}

// 页面加载时自动获取数据
onMounted(() => {
    fetchTasks()
})
</script>

<style scoped>
.tasks-container {
    max-width: 800px;
    margin: 0 auto;
}
.header-action {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
.task-card {
    margin-bottom: 12px;
    border-radius: 8px;
    border: none;
    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    transition: all 0.3s;
}
.task-card:hover {
    box-shadow: 0 5px 15px rgba(230,92,92,0.1);
}
.task-inner {
    display: flex;
    align-items: flex-start;
}
.checkbox-area {
    padding-top: 2px;
    margin-right: 15px;
}
.content-area {
    flex: 1;
}
.task-title {
    margin: 0 0 5px 0;
    font-size: 16px;
    color: var(--text-main);
    transition: color 0.3s;
}
.task-desc {
    margin: 0;
    font-size: 13px;
    color: #999;
}
/* 完成状态的样式 */
.is-done {
    opacity: 0.6;
    background-color: #fafafa;
}
.del-line {
    text-decoration: line-through;
    color: #ccc;
}
</style>