
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // 빌드 시점에 깃허브 시크릿에서 넘어온 API_KEY를 앱에 주입합니다.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  },
  base: './' // GitHub Pages 배포를 위한 상대 경로 설정
});
