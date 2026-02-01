/**
 * BaseManager.test.ts
 * BaseManager ユニットテスト
 * 
 * Version: v4.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BaseManager } from '../../Source/src/core/base/BaseManager'

/**
 * テスト用 Mock Manager
 */
class MockManager extends BaseManager {
  public initializeCalled = false
  public shutdownCalled = false

  protected async onInitialize(): Promise<void> {
    this.initializeCalled = true
  }

  protected async onShutdown(): Promise<void> {
    this.shutdownCalled = true
  }
}

/**
 * Mock Log Manager
 */
const mockLogManager = {
  info: async () => {},
  warn: async () => {},
  error: async () => {},
}

/**
 * Mock Progress Manager
 */
const mockProgressManager = {
  startTask: async () => 'task_id',
  updateProgress: async () => {},
  completeTask: async () => {},
  errorTask: async () => {},
}

describe('BaseManager', () => {
  let manager: MockManager

  beforeEach(() => {
    manager = new MockManager('TestManager', mockLogManager, mockProgressManager)
  })

  afterEach(async () => {
    if (manager.isInitialized()) {
      await manager.shutdown()
    }
  })

  it('should initialize successfully', async () => {
    expect(manager.isInitialized()).toBe(false)
    
    await manager.initialize()
    
    expect(manager.isInitialized()).toBe(true)
    expect(manager.initializeCalled).toBe(true)
  })

  it('should shutdown successfully', async () => {
    await manager.initialize()
    expect(manager.isInitialized()).toBe(true)

    await manager.shutdown()

    expect(manager.shutdownCalled).toBe(true)
  })

  it('should throw error when checkInitialized called on uninitialized manager', async () => {
    expect(() => {
      manager['checkInitialized']()
    }).toThrow()
  })

  it('should format errors correctly', () => {
    const error = new Error('Test error')
    const formatted = manager['formatError'](error)
    expect(formatted).toBe('Test error')

    const nonError = 'String error'
    const formattedNonError = manager['formatError'](nonError)
    expect(formattedNonError).toBe('String error')
  })

  it('should execute tasks successfully', async () => {
    await manager.initialize()

    const result = await manager['executeTask']('Test Task', async () => {
      return 'success'
    })

    expect(result).toBe('success')
  })
})
