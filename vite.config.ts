import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // 이 부분이 없으면 빌드 후 흰 화면만 나옵니다.
  server: {
    port: 8000,
  }
})