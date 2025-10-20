import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import { VitePWA } from 'vite-plugin-pwa';
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
    // PWA 插件暂时禁用，因为在 Vercel 构建时有问题
    // TODO: 修复 PWA 配置后重新启用
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   includeAssets: ['vite.svg'],
    //   manifest: {
    //     name: 'React Learning App',
    //     short_name: 'React App',
    //     description: 'Code Review Feedback System and Sorting Articles',
    //     theme_color: '#16a34a',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     scope: '/',
    //     start_url: '/',
    //     orientation: 'portrait-primary',
    //     icons: [
    //       {
    //         src: 'vite.svg',
    //         sizes: '192x192',
    //         type: 'image/svg+xml',
    //       },
    //       {
    //         src: 'vite.svg',
    //         sizes: '512x512',
    //         type: 'image/svg+xml',
    //       },
    //       {
    //         src: 'vite.svg',
    //         sizes: '512x512',
    //         type: 'image/svg+xml',
    //         purpose: 'any maskable',
    //       },
    //     ],
    //   },
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
    //     runtimeCaching: [
    //       {
    //         urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    //         handler: 'CacheFirst',
    //         options: {
    //           cacheName: 'google-fonts-cache',
    //           expiration: {
    //             maxEntries: 10,
    //             maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
    //           },
    //           cacheableResponse: {
    //             statuses: [0, 200]
    //           }
    //         }
    //       }
    //     ]
    //   },
    //   devOptions: {
    //     enabled: false,
    //   },
    // }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
