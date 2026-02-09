import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from '@vitejs/plugin-legacy';
import path from "path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    react(),
    // Provide a legacy (nomodule) build fallback for older or restricted WebView environments
    legacy({
      targets: ["defaults", "not IE 11"],
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"]
    })
  ],
  base: './',
  
  build: {
    outDir: './dist',
    minify: 'esbuild',
    sourcemap: false,
    brotliSize: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
      // Note: previously @tauri-apps/api was marked external which left bare
      // import specifiers in the build. Remove `external` so the package is
      // bundled into `dist` and works from file:// when packaged by Tauri.
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
      // Vite dev-time aliases to make @tauri-apps subpath imports resolvable
      "@tauri-apps/api/tauri": path.resolve(__dirname, "./node_modules/@tauri-apps/api/index.js"),
      "@tauri-apps/api/event": path.resolve(__dirname, "./node_modules/@tauri-apps/api/event.js"),
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
