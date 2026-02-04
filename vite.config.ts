import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  base: './',
  
  build: {
    outDir: './dist',
    minify: 'esbuild',
    sourcemap: false,
    brotliSize: true,
    rollupOptions: {
      // Do not try to bundle or resolve Tauri runtime modules; keep them external
      external: [/^@tauri-apps\/api(\/.*)?$/],
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "./Source/src/core"),
      "@system": path.resolve(__dirname, "./Source/src/system"),
      "@subsystems": path.resolve(__dirname, "./Source/src/subsystems"),
      "@components": path.resolve(__dirname, "./Source/src/components"),
      "@hooks": path.resolve(__dirname, "./Source/src/hooks"),
      "@utils": path.resolve(__dirname, "./Source/src/utils"),
      "@styles": path.resolve(__dirname, "./Source/src/styles"),
      "@pages": path.resolve(__dirname, "./Source/src/pages"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `Backend`
      ignored: ["**/Backend/**"],
    },
  },
}));
