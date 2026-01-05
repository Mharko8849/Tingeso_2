import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_TARGET || 'http://localhost:8080';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/users': {
          target: target,
          changeOrigin: true,
          secure: false,
        },
        '/kardex': {
          target: target,
          changeOrigin: true,
          secure: false,
        },
        '/inventory': {
          target: target,
          changeOrigin: true,
          secure: false,
        },
        '/tools': {
          target: target,
          changeOrigin: true,
          secure: false,
        },
        '/tool-states': {
          target: target,
          changeOrigin: true,
          secure: false,
        },
        '/loans': {
          target: target,
          changeOrigin: true,
          secure: false,
        },
        '/clients': {
          target: target,
          changeOrigin: true,
          secure: false,
        },
        '/reports': {
          target: target,
          changeOrigin: true,
          secure: false,
        },
        '/amounts': {
          target: target,
          changeOrigin: true,
          secure: false,
        },
        '/images': {
          target: target,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
