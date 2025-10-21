import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';

// Check if HTTPS certificates exist (only for local dev)
const httpsConfig = (() => {
  const keyPath = './localhost+1-key.pem';
  const certPath = './localhost+1.pem';

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return {
      key: keyPath,
      cert: certPath,
    };
  }
  return false;
})();

// https://vite.dev/config/
export default defineConfig({
  // Keep the dev server output visible across HMR updates
  // (Vite clears the console on updates by default; disable that)
  clearScreen: false,
  server: {
    host: true,
    // Only use HTTPS if certificates exist (local dev)
    ...(httpsConfig ? { https: httpsConfig } : {}),
    proxy: {
      // 代理 API 请求到生产环境
      '/api': {
        target: 'https://car-washing-two.vercel.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: '洗车管理系统',
        short_name: '洗车',
        description: '智能洗车记录与车牌识别管理系统',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    // 使用 esbuild 代替 terser 进行压缩，避免 PWA 插件与 terser 冲突
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
