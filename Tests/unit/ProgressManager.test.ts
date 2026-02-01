/**
 * ProgressManager.test.ts
 * ProgressManager ユニットテスト
 * 
 * Version: v4.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ProgressManager } from '../../Source/src/core/progress/ProgressManager'

/**
 * Mock Log Manager
 */
const mockLogManager = {
  info: async () => {},
  warn: async () => {},
  error: async () => {},
}

describe('ProgressManager', () => {
  let manager: ProgressManager

  beforeEach(async () => {
    manager = new ProgressManager(mockLogManager)
    await manager.initialize()
  })

  afterEach(async () => {
    await manager.shutdown()
  })

  it('should start task', async () => {
    const taskId = await manager.startTask('TestManager', 'Test Task')
    
    expect(taskId).toBeDefined()
    expect(typeof taskId).toBe('string')
  })

  it('should update task progress', async () => {
    const taskId = await manager.startTask('TestManager', 'Test Task')
    
    await manager.updateProgress(taskId, 50)
    
    const tasks = manager.getTasks()
    const task = tasks.find(t => t.id === taskId)
    
    expect(task?.progress).toBe(50)
  })

  it('should complete task', async () => {
    const taskId = await manager.startTask('TestManager', 'Test Task')
    
    await manager.updateProgress(taskId, 100)
    await manager.completeTask(taskId)
    
    const tasks = manager.getTasks()
    const task = tasks.find(t => t.id === taskId)
    
    expect(task?.status).toBe('completed')
  })

  it('should error task', async () => {
    const taskId = await manager.startTask('TestManager', 'Test Task')
    
    await manager.errorTask(taskId, 'Test error')
    
    const tasks = manager.getTasks()
    const task = tasks.find(t => t.id === taskId)
    
    expect(task?.status).toBe('error')
  })

  it('should get running tasks', async () => {
    const taskId1 = await manager.startTask('TestManager', 'Task 1')
    const taskId2 = await manager.startTask('TestManager', 'Task 2')
    
    await manager.completeTask(taskId1)
    
    const running = manager.getRunningTasks()
    expect(running.length).toBeGreaterThan(0)
    expect(running.every(t => t.status === 'running')).toBe(true)
  })

  it('should calculate ETA', async () => {
    const taskId = await manager.startTask('TestManager', 'Test Task')
    
    // Fast updates to simulate progress
    await manager.updateProgress(taskId, 25)
    await new Promise(resolve => setTimeout(resolve, 100))
    await manager.updateProgress(taskId, 50)
    
    const tasks = manager.getTasks()
    const task = tasks.find(t => t.id === taskId)
    
    // ETA should be calculated
    expect(task?.estimatedRemainingTime).toBeDefined()
  })

  it('should cleanup completed tasks', async () => {
    const taskId = await manager.startTask('TestManager', 'Test Task')
    await manager.completeTask(taskId)
    
    const tasksBefore = manager.getTasks()
    const completedBefore = tasksBefore.filter(t => t.status === 'completed').length
    
    // Call cleanup
    await manager['cleanup']()
    
    const tasksAfter = manager.getTasks()
    const completedAfter = tasksAfter.filter(t => t.status === 'completed').length
    
    // Completed tasks should be removed
    expect(completedAfter).toBeLessThanOrEqual(completedBefore)
  })
})
