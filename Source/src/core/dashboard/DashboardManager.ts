/**
 * DashboardManager.ts
 * URMS v4.0 - Dashboard Manager
 * 
 * BaseManager を継承し、ダッシュボード UI と
 * ログ・進捗管理を統合した実装例
 * 
 * Version: v4.0
 */

import { BaseManager, type ILogManager, type IProgressManager } from '@core/base/BaseManager'
import type { DashboardCard, ManagerConfig } from '@core/types/ManagerTypes'
import { invoke } from '@tauri-apps/api/core'

/**
 * System Stats from backend
 */
export interface SystemStats {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  network_stats: {
    devices_online: number
    devices_offline: number
    average_latency: number
    network_status: string
  }
}

/**
 * Dashboard Manager インターフェース
 */
export interface IDashboardManager {
  registerCard(card: DashboardCard): void
  unregisterCard(cardId: string): void
  getCards(): DashboardCard[]
  reorderCards(cardIds: string[]): void
  setTheme(theme: 'Future' | 'Dark' | 'Light'): void
  getTheme(): 'Future' | 'Dark' | 'Light'
  notifyWarning(message: string): void
  notifyError(message: string): void
  getSystemStats(): Promise<SystemStats>
  getNetworkStats(): Promise<any>
  getStorageStats(): Promise<any>
}

/**
 * Dashboard Manager 実装
 * 
 * 責務:
 * - Dashboard カードの登録・管理
 * - テーマ管理（Future Mode/Dark/Light）
 * - 異常通知・警告
 * - UI リアルタイム更新
 */
export class DashboardManager extends BaseManager implements IDashboardManager {
  private cards: Map<string, DashboardCard> = new Map()
  public _theme: 'Future' | 'Dark' | 'Light' = 'Future'
  private config: ManagerConfig

  constructor(
    logManager: ILogManager,
    progressManager: IProgressManager,
    config?: ManagerConfig
  ) {
    super('DashboardManager', logManager, progressManager)
    this.config = config || {
      enabled: true,
      logLevel: 'INFO',
    }
  }

  /**
   * 初期化処理
   */
  protected async onInitialize(): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Dashboard Manager is disabled')
    }

    // 初期カード登録
    await this.logManager.info(
      this.managerName,
      'Setting up Dashboard cards...'
    )

    // Future Mode テーマを設定
    this._theme = 'Future'

    await this.logManager.info(
      this.managerName,
      `Dashboard initialized with ${this.getTheme()} theme`
    )
  }

  /**
   * シャットダウン処理
   */
  protected async onShutdown(): Promise<void> {
    this.cards.clear()
    await this.logManager.info(
      this.managerName,
      'Dashboard cards cleared'
    )
  }

  /**
   * ダッシュボードカード登録
   * 
   * @param card - 登録するカード
   */
  registerCard(card: DashboardCard): void {
    this.checkInitialized()

    void this.logManager.info(
      this.managerName,
      `Registering card: ${card.title} (${card.manager})`
    )

    this.cards.set(card.id, card)

    void this.logManager.info(
      this.managerName,
      `Card registered: ${card.title}`
    )
  }

  /**
   * ダッシュボードカード削除
   */
  unregisterCard(cardId: string): void {
    this.checkInitialized()

    const card = this.cards.get(cardId)
    if (card) {
      this.cards.delete(cardId)
      void this.logManager.info(
        this.managerName,
        `Card unregistered: ${card.title}`
      )
    }
  }

  /**
   * 全カード取得
   */
  getCards(): DashboardCard[] {
    this.checkInitialized()
    return Array.from(this.cards.values()).sort((a, b) => b.priority - a.priority)
  }

  /**
   * カード順序変更
   */
  reorderCards(cardIds: string[]): void {
    this.checkInitialized()

    // 新しい順序でカードを再構成
    const reorderedCards = new Map<string, DashboardCard>()
    for (const id of cardIds) {
      const card = this.cards.get(id)
      if (card) {
        reorderedCards.set(id, card)
      }
    }

    this.cards = reorderedCards
    void this.logManager.info(
      this.managerName,
      `Cards reordered: ${cardIds.length} items`
    )
  }

  /**
   * テーマ設定
   */
  setTheme(theme: 'Future' | 'Dark' | 'Light'): void {
    this.checkInitialized()

    this._theme = theme
    void this.logManager.info(
      this.managerName,
      `Theme changed to: ${theme}`
    )
  }

  /**
   * テーマ取得
   */
  getTheme(): 'Future' | 'Dark' | 'Light' {
    this.checkInitialized()
    return this._theme
  }

  /**
   * 警告通知
   */
  notifyWarning(message: string): void {
    this.checkInitialized()

    const id = `notification-${Date.now()}`
    const updatedCard: DashboardCard = {
      id,
      title: 'Warning',
      manager: this.managerName,
      managerId: this.managerName,
      content: [{ label: 'Message', value: message }],
      status: 'warn',
      actions: [],
      priority: 1,
    }

    this.registerCard(updatedCard)
    void this.logManager.warn(
      this.managerName,
      `Warning: ${message}`
    )
  }

  /**
   * エラー通知
   */
  notifyError(message: string): void {
    this.checkInitialized()

    const id = `notification-${Date.now()}`
    const updatedCard: DashboardCard = {
      id,
      title: 'Error',
      manager: this.managerName,
      managerId: this.managerName,
      content: [{ label: 'Message', value: message }],
      status: 'error',
      actions: [],
      priority: 1,
    }

    this.registerCard(updatedCard)
    void this.logManager.error(
      this.managerName,
      `Error: ${message}`
    )
  }

  /**
   * Dashboard を再構築（全カード更新）
   */
  async refresh(): Promise<void> {
    const taskId = await this.progressManager.startTask(
      'Refreshing Dashboard',
      3000
    )

    try {
      await this.progressManager.updateProgress(taskId, 50)

      // 各カードをリフレッシュ
      for (const card of this.cards.values()) {
        if (card.status === 'error') {
          card.status = 'normal'
        }
      }

      await this.progressManager.updateProgress(taskId, 100)
      await this.progressManager.completeTask(taskId)

      await this.logManager.info(
        this.managerName,
        `Dashboard refreshed: ${this.cards.size} cards`
      )
    } catch (error) {
      await this.progressManager.errorTask(taskId, String(error))
      await this.logManager.error(
        this.managerName,
        `Dashboard refresh failed: ${String(error)}`
      )
      throw error
    }
  }

  /**
   * Get system statistics from backend
   */
  async getSystemStats(): Promise<SystemStats> {
    this.checkInitialized()

    try {
      const networkStats = await invoke('network_manager_get_network_stats')
      const storageStats = await invoke('file_manager_get_storage_stats')

      // Mock CPU/Memory data (in real app, get from Tauri system commands)
      return {
        cpu_usage: Math.random() * 100,
        memory_usage: Math.random() * 100,
        disk_usage: storageStats ? 
          ((storageStats as any).used_size / (storageStats as any).total_size * 100) : 
          0,
        network_stats: networkStats as any
      }
    } catch (error) {
      await this.logManager.error(
        this.managerName,
        `Failed to get system stats: ${String(error)}`
      )
      throw error
    }
  }

  /**
   * Get network statistics from backend
   */
  async getNetworkStats(): Promise<any> {
    this.checkInitialized()

    try {
      return await invoke('network_manager_get_network_stats')
    } catch (error) {
      await this.logManager.error(
        this.managerName,
        `Failed to get network stats: ${String(error)}`
      )
      throw error
    }
  }

  /**
   * Get storage statistics from backend
   */
  async getStorageStats(): Promise<any> {
    this.checkInitialized()

    try {
      return await invoke('file_manager_get_storage_stats')
    } catch (error) {
      await this.logManager.error(
        this.managerName,
        `Failed to get storage stats: ${String(error)}`
      )
      throw error
    }
  }
}
