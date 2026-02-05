/**
 * ScheduleManager.ts
 * URMS v4.0 - Schedule Manager
 * 
 * スケジュール・タスク管理
 * BaseManager を継承した Subsystem Manager
 * 
 * Version: v4.0
 */

import { BaseManager, type ILogManager, type IProgressManager } from '@core/base/BaseManager'
import type { DashboardCard } from '@core/types/ManagerTypes'

/**
 * スケジュール項目
 */
export interface ScheduleItem {
  id: string
  title: string
  description?: string
  startTime: string // ISO 8601
  endTime?: string
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'once'
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  tags?: string[]
}

/**
 * Schedule Manager インターフェース
 */
export interface IScheduleManager {
  createSchedule(managerId: string, title: string, startTime: Date | string, recurrence?: string, priority?: string): Promise<ScheduleItem>
  updateSchedule(id: string, item: Partial<ScheduleItem>): Promise<ScheduleItem>
  deleteSchedule(id: string): Promise<boolean>
  getUpcomingSchedules(days: number): Promise<ScheduleItem[]>
  getScheduleCard(): Promise<DashboardCard>
}

/**
 * Schedule Manager 実装
 * 
 * 責務:
 * - スケジュール管理
 * - タスク追跡
 * - 期限リマインダー
 * - Dashboard との連携
 */
export class ScheduleManager extends BaseManager implements IScheduleManager {
  private schedules: Map<string, ScheduleItem> = new Map()
  private nextId: number = 1

  constructor(
    logManager: ILogManager,
    progressManager: IProgressManager
  ) {
    super('ScheduleManager', logManager, progressManager)
  }

  /**
   * 初期化処理
   */
  protected async onInitialize(): Promise<void> {
    await this.logManager.info(
      this.managerName,
      'Initializing schedule management...'
    )

    await this.logManager.info(
      this.managerName,
      'Schedule manager ready'
    )
  }

  /**
   * シャットダウン処理
   */
  protected async onShutdown(): Promise<void> {
    await this.logManager.info(
      this.managerName,
      `Saving ${this.schedules.size} schedules`
    )
    this.schedules.clear()
  }

  /**
   * スケジュール作成
   */
  async createSchedule(_managerId: string, title: string, startTime: Date | string, recurrence: string = 'once', priority: string = 'medium'): Promise<ScheduleItem> {
    this.checkInitialized()

    return await this.executeTask(`Create Schedule: ${title}`, async () => {
      const id = `schedule_${this.nextId++}`
      const start = (startTime instanceof Date) ? startTime.toISOString() : String(startTime)

      const newItem: ScheduleItem = {
        id,
        title,
        startTime: start,
        recurrence: recurrence as any,
        priority: priority as any,
        status: 'scheduled',
      }

      this.schedules.set(id, newItem)

      await this.logManager.info(
        this.managerName,
        `Schedule created: ${title}`
      )

      return newItem
    })
  }

  /**
   * スケジュール更新
   */
  async updateSchedule(id: string, updates: Partial<ScheduleItem>): Promise<ScheduleItem> {
    this.checkInitialized()

    return await this.executeTask(`Update Schedule: ${id}`, async () => {
      const item = this.schedules.get(id)
      if (!item) {
        throw new Error(`Schedule ${id} not found`)
      }

      const updated: ScheduleItem = { ...item, ...updates }
      this.schedules.set(id, updated)

      await this.logManager.info(
        this.managerName,
        `Schedule updated: ${updated.title}`
      )

      return updated
    })
  }

  /**
   * スケジュール削除
   */
  async deleteSchedule(id: string): Promise<boolean> {
    this.checkInitialized()

    return await this.executeTask(`Delete Schedule: ${id}`, async () => {
      const item = this.schedules.get(id)
      if (!item) {
        throw new Error(`Schedule ${id} not found`)
      }

      this.schedules.delete(id)

      await this.logManager.info(
        this.managerName,
        `Schedule deleted: ${item.title}`
      )

      return true
    })
  }

  /**
   * 近日中のスケジュール取得
   */
  async getUpcomingSchedules(days: number): Promise<ScheduleItem[]> {
    this.checkInitialized()

    return await this.executeTask(`Get Schedules (${days} days)`, async () => {
      const now = new Date()
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

      const upcoming = Array.from(this.schedules.values()).filter(item => {
        const startTime = new Date(item.startTime)
        return startTime >= now && startTime <= futureDate
      })

      return upcoming.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
    })
  }

  /**
   * Dashboard カード取得
   */
  async getScheduleCard(): Promise<DashboardCard> {
    this.checkInitialized()

    const upcoming = await this.getUpcomingSchedules(7)
    const highPriority = upcoming.filter(s => s.priority === 'high').length

    return {
      id: 'schedule-manager-card',
      title: 'Schedule Manager',
      manager: 'ScheduleManager',
      status: upcoming.length > 0 ? 'normal' : 'warn',
      content: [
        { label: 'Total Schedules', value: this.schedules.size },
        { label: 'Upcoming (7 days)', value: upcoming.length },
        { label: 'High Priority', value: highPriority },
      ],
      actions: [
        {
          id: 'add-schedule',
          label: 'Add Schedule',
          command: 'schedule:add',
        },
        {
          id: 'view-all',
          label: 'View All',
          command: 'schedule:view_all',
        },
      ],
      priority: 5,
    }
  }
}
