/**
 * DashboardManager.test.ts
 * DashboardManager ユニットテスト
 * 
 * Version: v4.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DashboardManager } from '../../Source/src/core/dashboard/DashboardManager'
import type { DashboardCard } from '../../Source/src/core/types/ManagerTypes'

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

describe('DashboardManager', () => {
  let manager: DashboardManager

  beforeEach(async () => {
    manager = new DashboardManager(mockLogManager, mockProgressManager)
    await manager.initialize()
  })

  afterEach(async () => {
    await manager.shutdown()
  })

  it('should register and retrieve cards', async () => {
    const mockCard: DashboardCard = {
      id: 'test-card',
      title: 'Test Card',
      managerId: 'TestManager',
      content: [],
      status: 'normal',
      actions: [],
    }

    manager.registerCard(mockCard)
    const cards = manager.getCards()

    expect(cards).toHaveLength(1)
    expect(cards[0].id).toBe('test-card')
  })

  it('should unregister cards', async () => {
    const mockCard: DashboardCard = {
      id: 'test-card',
      title: 'Test Card',
      managerId: 'TestManager',
      content: [],
      status: 'normal',
      actions: [],
    }

    manager.registerCard(mockCard)
    expect(manager.getCards()).toHaveLength(1)

    manager.unregisterCard('test-card')
    expect(manager.getCards()).toHaveLength(0)
  })

  it('should set theme correctly', async () => {
    const themes = ['Light', 'Dark', 'Future']

    for (const theme of themes) {
      manager.setTheme(theme as any)
    }

    expect(manager['_theme']).toBe('Future')
  })

  it('should notify warnings and errors', async () => {
    manager.notifyWarning('Warning test')
    manager.notifyError('Error test')

    const cards = manager.getCards()
    const hasNotifications = cards.some(card => card.id.includes('notification'))

    expect(hasNotifications).toBe(true)
  })
})
