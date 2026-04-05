import axios from 'axios'
import { ElMessage } from 'element-plus'
// 创建 axios 实例
const request = axios.create({
    timeout: 5000 // 请求超时时间
})

// request 拦截器 (每次发送请求前都会执行)
request.interceptors.request.use(
    config => {
        // 等我们以后做了登录，这里要负责把 Token 放到请求头里带给后端
        // config.headers['Authorization'] = 'Bearer ' + localStorage.getItem('token')
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// response 拦截器 (每次接收到后端响应后都会执行)
request.interceptors.response.use(
    response => {
        // 这里的 res 就是后端返回的那个 Result 类的 JSON 数据
        let res = response.data;
        
        // 如果我们后端的 Result 类里，成功是返回 200，失败是返回 500
        if (res.code === 200) {
            return res.data; // 直接返回实际的数据内容，也就是 Result 里的 data 字段
        } else {
            // 如果后端返回的 code 不是 200，说明业务报错了 (比如没权限、参数错误)
            ElMessage.error(res.msg || '系统错误');
            return Promise.reject(new Error(res.msg || 'Error'));
        }
    },
    error => {
        console.error('err' + error) // for debug
        ElMessage.error('网络连接失败，请检查后端是否启动');
        return Promise.reject(error)
    }
)

export default request
