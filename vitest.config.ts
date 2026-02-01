import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./Tests/setup.ts'],
    include: [
      'Tests/unit/**/*.test.ts',
      'Tests/unit/**/*.test.tsx',
      'Tests/integration/**/*.test.ts',
      'Tests/integration/**/*.test.tsx',
    ],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'Tests/setup.ts',
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './Source/src/core'),
      '@system': path.resolve(__dirname, './Source/src/system'),
      '@subsystems': path.resolve(__dirname, './Source/src/subsystems'),
      '@components': path.resolve(__dirname, './Source/src/components'),
      '@hooks': path.resolve(__dirname, './Source/src/hooks'),
      '@utils': path.resolve(__dirname, './Source/src/utils'),
      '@styles': path.resolve(__dirname, './Source/src/styles'),
    },
  },
})
