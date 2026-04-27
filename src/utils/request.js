import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router' // 引入路由用于跳回登录页
// 创建 axios 实例
const request = axios.create({
    baseURL: '/api',
    timeout: 5000 // 请求超时时间
})

// request 拦截器 (每次发送请求前都会执行)
request.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token')
        // 只有在确实有 token 时才携带，避免出现 "Bearer null"
        if (token) {
            config.headers['Authorization'] = 'Bearer ' + token
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// response 拦截器 (每次接收到后端响应后都会执行)
request.interceptors.response.use(
    response => {
        //后端返回的 Result 类的 JSON 数据
        let res = response.data;
        // 如果我们后端的 Result 类里，成功是返回 200，失败是返回 500
        if (res.code === 200) {
            return res.data; // 直接返回实际的数据内容，也就是 Result 里的 data 字段
        } else if(res.code===401){
            // 401 说明后端拦截器发现你没登录或 Token 过期了
            ElMessage.error(res.msg || '请先登录')
            localStorage.removeItem('token')
            localStorage.removeItem('userInfo')
            router.push('/login') // 强制跳转到登录页
            return Promise.reject(new Error(res.msg))
        }
        else {
            // 如果后端返回的 code 不是 200，说明业务报错了 (比如没权限、参数错误)
            ElMessage.error(res.msg || '系统错误');
            return Promise.reject(new Error(res.msg || 'Error'));
        }
    },
    error => {
        // axios 只有在“拿不到响应”(断网/后端没开/跨域被浏览器拦截)时才算真正的网络错误
        const status = error?.response?.status
        const backendMsg = error?.response?.data?.msg
        const hasResponse = !!error?.response

        if (status === 401) {
            ElMessage.error(backendMsg || '未登录或登录已失效，请重新登录')
            localStorage.removeItem('token')
            localStorage.removeItem('userInfo')
            router.push('/login')
        } else if (hasResponse) {
            // 例如 404/500：后端有响应，但不是 2xx，不应提示“网络未连接”
            ElMessage.error(backendMsg || `请求失败（HTTP ${status}）`)
        } else {
            console.error('err' + error) // for debug
            ElMessage.error('网络连接失败，请检查后端是否启动')
        }
        return Promise.reject(error)
    }
)

export default request
