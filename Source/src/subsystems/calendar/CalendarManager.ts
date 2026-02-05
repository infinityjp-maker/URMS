import { BaseManager, type ILogManager, type IProgressManager } from '@core/base/BaseManager'
import type { DashboardCard } from '@core/types/ManagerTypes'

export type EventItem = {
  id?: string
  summary?: string
  start?: any
  end?: any
}

export interface ICalendarManager {
  syncWithGoogle(apiKey: string, calendarId: string, maxResults?: number): Promise<EventItem[]>
  syncWithOAuth(calendarId: string, maxResults?: number): Promise<EventItem[]>
  getEvents(maxResults?: number): Promise<EventItem[]>
  getCalendarCard(): Promise<DashboardCard>
}

export class CalendarManager extends BaseManager implements ICalendarManager {
  private events: EventItem[] = []

  constructor(logManager: ILogManager, progressManager: IProgressManager) {
    super('CalendarManager', logManager, progressManager)
  }

  protected async onInitialize(): Promise<void> {
    await this.logManager.info(this.managerName, 'Initializing calendar manager...')
  }

  protected async onShutdown(): Promise<void> {
    await this.logManager.info(this.managerName, 'Shutting down calendar manager...')
    this.events = []
  }

  async syncWithGoogle(apiKey: string, calendarId: string, maxResults = 5): Promise<EventItem[]> {
    this.checkInitialized()
    return await this.executeTask('Sync Calendar (API Key)', async () => {
      try {
        const mod = await import('@tauri-apps/api/tauri')
        const tauri = mod.default || mod
        const res: any = await tauri.invoke('calendar_sync_with_google', { api_key: apiKey, calendar_id: calendarId, max_results: maxResults })
        if (Array.isArray(res)) {
          this.events = res as EventItem[]
        }
        return this.events
      } catch (e) {
        await this.logManager.warn(this.managerName, `calendar sync failed: ${e}`)
        return this.events
      }
    })
  }

  async syncWithOAuth(calendarId: string, maxResults = 5): Promise<EventItem[]> {
    this.checkInitialized()
    return await this.executeTask('Sync Calendar (OAuth)', async () => {
      try {
        const mod = await import('@tauri-apps/api/tauri')
        const tauri = mod.default || mod
        const res: any = await tauri.invoke('calendar_sync_with_oauth', { calendar_id: calendarId, max_results: maxResults })
        if (Array.isArray(res)) {
          this.events = res as EventItem[]
        }
        return this.events
      } catch (e) {
        await this.logManager.warn(this.managerName, `oauth calendar sync failed: ${e}`)
        return this.events
      }
    })
  }

  async getEvents(maxResults = 5): Promise<EventItem[]> {
    this.checkInitialized()
    return await this.executeTask('Get Calendar Events', async () => {
      return this.events.slice(0, maxResults)
    })
  }

  async getCalendarCard(): Promise<DashboardCard> {
    this.checkInitialized()
    const events = await this.getEvents(5)
        return {
      id: 'weather-calendar-card',
      title: 'Weather & Calendar',
      manager: 'CalendarManager',
      managerId: 'CalendarManager',
      status: events.length > 0 ? 'normal' : 'warn',
      content: [
        { label: 'Upcoming', value: events.length },
      ],
      actions: [
        { id: 'refresh', label: 'Refresh', command: 'calendar:refresh' }
      ],
      priority: 5,
    }
  }
}
