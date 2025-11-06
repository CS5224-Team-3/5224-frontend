import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}, // ✅ 防止 aws-amplify 报 process 未定义
  },
  resolve: {
    alias: {
      '@': '/src', // ✅ 可使用 "@/..." 路径导入
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://m1.apifoxmock.com/m1/5867152-5553625-6285792',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
})
