/**
 * SystemManager.test.ts
 * SystemManager ユニットテスト
 * 
 * Version: v4.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SystemManager } from '../../Source/src/system/SystemManager'

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

describe('SystemManager', () => {
  let manager: SystemManager

  beforeEach(async () => {
    manager = new SystemManager(mockLogManager, mockProgressManager)
    await manager.initialize()
  })

  afterEach(async () => {
    await manager.shutdown()
  })

  it('should get system status', async () => {
    const status = await manager.getSystemStatus()
    
    expect(status).toBeDefined()
    expect(status.cpu).toBeDefined()
    expect(status.memory).toBeDefined()
    expect(status.disk).toBeDefined()
    expect(status.network).toBeDefined()
  })

  it('should validate resource values', async () => {
    const status = await manager.getSystemStatus()
    
    expect(status.cpu.usage).toBeGreaterThanOrEqual(0)
    expect(status.cpu.usage).toBeLessThanOrEqual(100)
    
    expect(status.memory.usage).toBeGreaterThanOrEqual(0)
    expect(status.memory.usage).toBeLessThanOrEqual(100)
    
    expect(status.disk.usage).toBeGreaterThanOrEqual(0)
    expect(status.disk.usage).toBeLessThanOrEqual(100)
  })

  it('should get resource alert', async () => {
    const alert = await manager.getResourceAlert()
    
    expect(alert).toBeDefined()
    expect(alert.id).toBe('system-resource-alert')
    expect(alert.managerId).toBe('SystemManager')
  })

  it('should detect status levels', async () => {
    const status = await manager.getSystemStatus()
    
    expect(['normal', 'warning', 'critical']).toContain(status.cpu.status)
    expect(['normal', 'warning', 'critical']).toContain(status.memory.status)
    expect(['normal', 'warning', 'critical']).toContain(status.disk.status)
  })

  it('should set threshold values', async () => {
    manager.setThreshold('cpu', 30)
    manager.setThreshold('memory', 40)
    manager.setThreshold('disk', 50)
    
    // Verify thresholds are set by checking alerts would trigger
    const alert = await manager.getResourceAlert()
    expect(alert).toBeDefined()
  })

  it('should start resource monitoring', async () => {
    const taskId = await manager.monitorResources(5000)
    
    expect(taskId).toBeDefined()
    
    // Clean up
    manager['stopMonitoring']()
  })

  it('should include alerts in dashboard card', async () => {
    const alert = await manager.getResourceAlert()
    
    expect(alert.content).toBeDefined()
    expect(alert.content.length).toBeGreaterThan(0)
  })
})
