import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  optimizeDeps: {
    // @urms/shared barrel は node:crypto を含む — 誤 pre-bundle で白画面になる
    exclude: ['@urms/domain', '@urms/shared'],
  },
  server: {
    port: 1420,
    strictPort: true,
    // Windows: host false は IPv6 のみになり localhost(127.0.0.1) から開けない
    host: host ?? '127.0.0.1',
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
    proxy: {
      '^/(v1|health|metrics)': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    outDir: 'dist',
  },
});
