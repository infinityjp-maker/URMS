import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import sirv from 'sirv';
import { defineConfig, type Plugin } from 'vite';

const wireframesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../docs/design/wireframes',
);

function wireframesPlugin(): Plugin {
  return {
    name: 'urms-wireframes',
    configureServer(server) {
      server.middlewares.use('/wireframes', sirv(wireframesDir, { dev: true }));
    },
    configurePreviewServer(server) {
      server.middlewares.use('/wireframes', sirv(wireframesDir));
    },
  };
}

export default defineConfig({
  plugins: [react(), wireframesPlugin()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/v1': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
    },
  },
  preview: {
    port: 5173,
    host: true,
  },
});
