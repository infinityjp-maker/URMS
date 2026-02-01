/**
 * Tests/setup.ts
 * Vitest セットアップファイル
 * 
 * Version: v4.0
 */

import { beforeAll, afterEach, vi } from 'vitest'

/**
 * グローバルセットアップ
 */
beforeAll(() => {
  // Mock global objects if needed
  if (typeof global.console === 'undefined') {
    global.console = console
  }
})

/**
 * テスト後のクリーンアップ
 */
afterEach(() => {
  // Clean up after each test
  vi.clearAllMocks()
})
