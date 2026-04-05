import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173, // 前端固定端口
    open: true, // 启动时自动打开浏览器
    proxy: {
      // 这里的配置意味着：凡是请求路径以 /api 开头的都会被代理到 http://localhost:8080
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // 这里不需要重写路径，因为后端的接口也是以 /api 开头的
      }
    }
  }
})