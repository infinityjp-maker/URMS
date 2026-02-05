/**
 * LogManager.ts
 * URMS v4.0 - Log Manager
 * 
 * BaseManager を継承した Log Manager の実装例
 * 全 Manager のログを一元管理
 * 
 * Version: v4.0
 */

import { BaseManager, type ILogManager, type IProgressManager } from '@core/base/BaseManager'
import type { LogEntry, LogFilter, ManagerConfig } from '@core/types/ManagerTypes'

/**
 * Log Manager 実装
 * 
 * 責務:
 * - 全 Manager からのログ受信
 * - ログの分類・保存
 * - ログ検索・フィルタリング
 * - Dashboard との連携
 */
export class LogManager extends BaseManager implements ILogManager {
  private logs: LogEntry[] = []
  private maxSize: number = 500
  private config: ManagerConfig

  constructor(progressManager: IProgressManager, config?: ManagerConfig) {
    super('LogManager', undefined as any, progressManager)
    this.config = config || {
      enabled: true,
      logLevel: 'INFO',
    }
    // Log Manager は自分自身を参照できない設計を避ける
    // そのため、ここでは mock を使用
    this.logManager = {
      info: async () => {},
      warn: async () => {},
      error: async () => {},
    }
  }

  protected async onInitialize(): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Log Manager is disabled')
    }
    console.log(`[${this.managerName}] Initialized`)
  }

  protected async onShutdown(): Promise<void> {
    console.log(`[${this.managerName}] Shutting down - ${this.logs.length} logs retained`)
  }

  /**
   * INFO ログ追加
   */
  async info(manager: string, message: string, metadata?: Record<string, any>): Promise<void> {
    this.addLog('INFO', manager, message, metadata)
  }

  /**
   * WARN ログ追加
   */
  async warn(manager: string, message: string, metadata?: Record<string, any>): Promise<void> {
    this.addLog('WARN', manager, message, metadata)
    console.warn(`[${manager}] ${message}`)
  }

  /**
   * ERROR ログ追加
   */
  async error(manager: string, message: string, metadata?: Record<string, any>): Promise<void> {
    this.addLog('ERROR', manager, message, metadata)
    console.error(`[${manager}] ${message}`)
  }

  /**
   * ログ追加処理（内部）
   */
  private addLog(
    level: 'INFO' | 'WARN' | 'ERROR',
    manager: string,
    message: string,
    metadata?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      manager,
      message,
      metadata,
    }

    this.logs.push(entry)

    // ログサイズ制限
    if (this.logs.length > this.maxSize) {
      this.logs.shift()
    }
  }

  /**
   * 最新ログ取得
   */
  getRecent(limit: number): Array<Record<string, any>> {
    this.checkInitialized()
    return this.logs.slice(-limit).map(l => this.mapEntry(l))
  }

  /**
   * ログ検索
   */
  // search は文字列キーワードまたは LogFilter を受け取る
  search(filterOrKeyword: string | LogFilter): Array<Record<string, any>> {
    this.checkInitialized()

    let results = [...this.logs]

    if (typeof filterOrKeyword === 'string') {
      const keyword = filterOrKeyword.toLowerCase()
      results = results.filter(l => l.message.toLowerCase().includes(keyword) || l.manager.toLowerCase().includes(keyword))
    } else {
      const filter = filterOrKeyword
      if (filter.manager) results = results.filter(l => l.manager === filter.manager)
      if (filter.level) results = results.filter(l => l.level === filter.level)
      if (filter.startDate) {
        const startTime = new Date(filter.startDate).getTime()
        results = results.filter(l => new Date(l.timestamp).getTime() >= startTime)
      }
      if (filter.endDate) {
        const endTime = new Date(filter.endDate).getTime()
        results = results.filter(l => new Date(l.timestamp).getTime() <= endTime)
      }
      if (filter.keyword) {
        const kw = filter.keyword.toLowerCase()
        results = results.filter(l => l.message.toLowerCase().includes(kw) || l.manager.toLowerCase().includes(kw))
      }
    }

    return results.map(l => this.mapEntry(l))
  }

  /**
   * Manager 別ログ取得
   */
  getByManager(manager: string, limit?: number): Array<Record<string, any>> {
    this.checkInitialized()
    const filtered = this.logs.filter(l => l.manager === manager)
    const sliced = typeof limit === 'number' ? filtered.slice(-limit) : filtered
    return sliced.map(l => this.mapEntry(l))
  }

  /**
   * ログクリア
   */
  clear(): void {
    this.checkInitialized()
    const count = this.logs.length
    this.logs = []
    console.log(`[${this.managerName}] Cleared ${count} logs`)
  }

  /**
   * ログ統計
   */
  getStats(): {
    total: number
    byLevel: { info: number; warn: number; error: number }
    managers: string[]
  } {
    this.checkInitialized()

    const stats = {
      total: this.logs.length,
      byLevel: {
        info: this.logs.filter(l => l.level === 'INFO').length,
        warn: this.logs.filter(l => l.level === 'WARN').length,
        error: this.logs.filter(l => l.level === 'ERROR').length,
      },
      managers: Array.from(new Set(this.logs.map(l => l.manager)))
    }

    return stats
  }

  /**
   * 内部 LogEntry をテストが期待する形に変換して返す
   */
  private mapEntry(l: LogEntry): Record<string, any> {
    return {
      id: l.id,
      timestamp: l.timestamp,
      level: l.level.toLowerCase(),
      managerId: l.manager,
      message: l.message,
      metadata: l.metadata,
    }
  }

  /**
   * ID 生成
   */
  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
