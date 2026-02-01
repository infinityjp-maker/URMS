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
  async getRecent(limit: number): Promise<LogEntry[]> {
    this.checkInitialized()
    return this.logs.slice(-limit)
  }

  /**
   * ログ検索
   */
  async search(filter: LogFilter): Promise<LogEntry[]> {
    this.checkInitialized()

    let results = [...this.logs]

    // Manager でフィルタ
    if (filter.manager) {
      results = results.filter(l => l.manager === filter.manager)
    }

    // ログレベルでフィルタ
    if (filter.level) {
      results = results.filter(l => l.level === filter.level)
    }

    // 日付でフィルタ
    if (filter.startDate) {
      const startTime = new Date(filter.startDate).getTime()
      results = results.filter(l => new Date(l.timestamp).getTime() >= startTime)
    }

    if (filter.endDate) {
      const endTime = new Date(filter.endDate).getTime()
      results = results.filter(l => new Date(l.timestamp).getTime() <= endTime)
    }

    // キーワード検索
    if (filter.keyword) {
      const keyword = filter.keyword.toLowerCase()
      results = results.filter(
        l =>
          l.message.toLowerCase().includes(keyword) ||
          l.manager.toLowerCase().includes(keyword)
      )
    }

    return results
  }

  /**
   * Manager 別ログ取得
   */
  async getByManager(manager: string, limit: number): Promise<LogEntry[]> {
    this.checkInitialized()
    return this.logs
      .filter(l => l.manager === manager)
      .slice(-limit)
  }

  /**
   * ログクリア
   */
  async clear(): Promise<void> {
    this.checkInitialized()
    const count = this.logs.length
    this.logs = []
    console.log(`[${this.managerName}] Cleared ${count} logs`)
  }

  /**
   * ログ統計
   */
  async getStats(): Promise<{
    total: number
    info: number
    warn: number
    error: number
    managers: string[]
  }> {
    this.checkInitialized()

    const stats = {
      total: this.logs.length,
      info: this.logs.filter(l => l.level === 'INFO').length,
      warn: this.logs.filter(l => l.level === 'WARN').length,
      error: this.logs.filter(l => l.level === 'ERROR').length,
      managers: [...new Set(this.logs.map(l => l.manager))],
    }

    return stats
  }

  /**
   * ID 生成
   */
  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
