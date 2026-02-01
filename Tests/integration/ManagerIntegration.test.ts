/**
 * ManagerIntegration.test.ts
 * URMS v4.0 - Integration Tests
 *
 * Phase 2: Manager 間通信 / Log・Progress パイプライン
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ProgressManager } from '../../Source/src/core/progress/ProgressManager'
import { LogManager } from '../../Source/src/core/log/LogManager'
import { DashboardManager } from '../../Source/src/core/dashboard/DashboardManager'
import { SystemManager } from '../../Source/src/system/SystemManager'
import type { DashboardCard } from '../../Source/src/core/types/ManagerTypes'

describe('Integration: Manager communication', () => {
  let progressManager: ProgressManager
  let logManager: LogManager
  let dashboardManager: DashboardManager
  let systemManager: SystemManager

  beforeEach(async () => {
    progressManager = new ProgressManager()
    await progressManager.initialize()

    logManager = new LogManager(progressManager)
    await logManager.initialize()

    dashboardManager = new DashboardManager(logManager, progressManager)
    await dashboardManager.initialize()

    systemManager = new SystemManager(logManager, progressManager)
    await systemManager.initialize()
  })

  afterEach(async () => {
    await systemManager.shutdown()
    await dashboardManager.shutdown()
    await logManager.shutdown()
    await progressManager.shutdown()
  })

  it('registers SystemManager alert card on DashboardManager', async () => {
    const alert = await systemManager.getResourceAlert()
    await dashboardManager.registerCard(alert as DashboardCard)

    const cards = await dashboardManager.getCards()
    expect(cards.some(card => card.id === 'system-resource-alert')).toBe(true)
  })

  it('executes task with progress and log records', async () => {
    await systemManager.getSystemStatus()

    const tasks = await progressManager.getTasks()
    expect(tasks.length).toBeGreaterThan(0)
    expect(tasks.some(task => task.status === 'success')).toBe(true)

    const stats = await logManager.getStats()
    expect(stats.total).toBeGreaterThan(0)
    expect(stats.managers).toContain('SystemManager')
  })

  it('refreshes dashboard via ProgressManager pipeline', async () => {
    const card: DashboardCard = {
      id: 'test-card',
      title: 'Test Card',
      manager: 'TestManager',
      status: 'normal',
      content: [],
      actions: [],
      priority: 1,
    }

    await dashboardManager.registerCard(card)
    await dashboardManager.refresh()

    const tasks = await progressManager.getTasks()
    expect(
      tasks.some(task => task.title === 'Refreshing Dashboard' && task.status === 'success')
    ).toBe(true)
  })
})
