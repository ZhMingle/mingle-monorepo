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
      srcDir: 'public',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'React Learning App',
        short_name: 'React App',
        description: 'Code Review Feedback System and Sorting Articles',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
          {
            src: 'vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
