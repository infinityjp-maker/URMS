/**
 * ScheduleManager.test.ts
 * ScheduleManager ユニットテスト
 * 
 * Version: v4.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ScheduleManager } from '../../../Source/src/subsystems/schedule/ScheduleManager'

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

describe('ScheduleManager', () => {
  let manager: ScheduleManager

  beforeEach(async () => {
    manager = new ScheduleManager(mockLogManager, mockProgressManager)
    await manager.initialize()
  })

  afterEach(async () => {
    await manager.shutdown()
  })

  it('should create schedule', async () => {
    const schedule = await manager.createSchedule(
      'TestManager',
      'Test Task',
      new Date(),
      'daily',
      'high'
    )
    
    expect(schedule).toBeDefined()
    expect(schedule.id).toBeDefined()
    expect(schedule.title).toBe('Test Task')
  })

  it('should update schedule', async () => {
    const schedule = await manager.createSchedule(
      'TestManager',
      'Original Task',
      new Date(),
      'daily',
      'medium'
    )
    
    const updated = await manager.updateSchedule(schedule.id, {
      title: 'Updated Task',
      priority: 'high',
    })
    
    expect(updated.title).toBe('Updated Task')
    expect(updated.priority).toBe('high')
  })

  it('should delete schedule', async () => {
    const schedule = await manager.createSchedule(
      'TestManager',
      'Task to Delete',
      new Date(),
      'daily',
      'low'
    )
    
    const success = await manager.deleteSchedule(schedule.id)
    
    expect(success).toBe(true)
  })

  it('should get upcoming schedules', async () => {
    const now = new Date()
    const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    await manager.createSchedule(
      'TestManager',
      'Upcoming Task',
      futureDate,
      'daily',
      'high'
    )
    
    const upcoming = await manager.getUpcomingSchedules(7)
    
    expect(upcoming).toBeDefined()
    expect(Array.isArray(upcoming)).toBe(true)
  })

  it('should get schedule dashboard card', async () => {
    const card = await manager.getScheduleCard()
    
    expect(card).toBeDefined()
    expect(card.id).toBe('schedule-manager-card')
    expect(card.title).toBe('Schedule Manager')
    expect(card.managerId).toBe('ScheduleManager')
  })

  it('should validate recurrence patterns', async () => {
    const patterns = ['daily', 'weekly', 'monthly', 'yearly', 'once']
    
    for (const pattern of patterns) {
      const schedule = await manager.createSchedule(
        'TestManager',
        `Task ${pattern}`,
        new Date(),
        pattern as any,
        'medium'
      )
      
      expect(schedule.recurrence).toBe(pattern)
    }
  })

  it('should validate priority levels', async () => {
    const priorities = ['low', 'medium', 'high']
    
    for (const priority of priorities) {
      const schedule = await manager.createSchedule(
        'TestManager',
        `Task ${priority}`,
        new Date(),
        'daily',
        priority as any
      )
      
      expect(schedule.priority).toBe(priority)
    }
  })
})
