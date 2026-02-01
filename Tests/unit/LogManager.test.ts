/**
 * LogManager.test.ts
 * LogManager ユニットテスト
 * 
 * Version: v4.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { LogManager } from '../../Source/src/core/log/LogManager'

/**
 * Mock Progress Manager
 */
const mockProgressManager = {
  startTask: async () => 'task_id',
  updateProgress: async () => {},
  completeTask: async () => {},
  errorTask: async () => {},
}

describe('LogManager', () => {
  let manager: LogManager

  beforeEach(async () => {
    manager = new LogManager(mockProgressManager)
    await manager.initialize()
  })

  afterEach(async () => {
    await manager.shutdown()
  })

  it('should log info messages', async () => {
    await manager.info('TestManager', 'Test info message')
    
    const logs = manager.getRecent(1)
    expect(logs).toHaveLength(1)
    expect(logs[0].message).toBe('Test info message')
    expect(logs[0].level).toBe('info')
  })

  it('should log warning messages', async () => {
    await manager.warn('TestManager', 'Test warning message')
    
    const logs = manager.getRecent(1)
    expect(logs[0].level).toBe('warn')
  })

  it('should log error messages', async () => {
    await manager.error('TestManager', 'Test error message')
    
    const logs = manager.getRecent(1)
    expect(logs[0].level).toBe('error')
  })

  it('should retrieve recent logs', async () => {
    for (let i = 0; i < 5; i++) {
      await manager.info('TestManager', `Message ${i}`)
    }

    const recent = manager.getRecent(3)
    expect(recent).toHaveLength(3)
  })

  it('should search logs by keyword', async () => {
    await manager.info('TestManager', 'Important message')
    await manager.info('TestManager', 'Other message')

    const results = manager.search('Important')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].message).toContain('Important')
  })

  it('should filter logs by manager', async () => {
    await manager.info('Manager1', 'Message from 1')
    await manager.info('Manager2', 'Message from 2')

    const filtered = manager.getByManager('Manager1')
    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered.every(log => log.managerId === 'Manager1')).toBe(true)
  })

  it('should get statistics', async () => {
    await manager.info('TestManager', 'Message 1')
    await manager.warn('TestManager', 'Message 2')
    await manager.error('TestManager', 'Message 3')

    const stats = manager.getStats()
    expect(stats.total).toBeGreaterThanOrEqual(3)
    expect(stats.byLevel.info).toBeGreaterThan(0)
    expect(stats.byLevel.warn).toBeGreaterThan(0)
    expect(stats.byLevel.error).toBeGreaterThan(0)
  })

  it('should clear logs', async () => {
    await manager.info('TestManager', 'Message')
    expect(manager.getRecent(10).length).toBeGreaterThan(0)

    manager.clear()
    expect(manager.getRecent(10)).toHaveLength(0)
  })
})
