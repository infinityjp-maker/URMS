/**
 * SystemManager.ts
 * URMS v4.0 - System Manager
 * 
 * CPU/RAM/Disk/Network のシステムリソース監視
 * BaseManager を継承し、Log/Progress を統合
 * 
 * Version: v4.0
 */

import { BaseManager, type ILogManager, type IProgressManager } from '@core/base/BaseManager'
import type { DashboardCard } from '@core/types/ManagerTypes'

/**
 * システムリソース情報
 */
export interface SystemResource {
  name: string
  type: 'cpu' | 'memory' | 'disk' | 'network'
  usage: number // 0-100 パーセンテージ
  total?: string
  available?: string
  threshold: number
  status: 'normal' | 'warning' | 'critical'
  timestamp: number
}

/**
 * システムステータス
 */
export interface SystemStatus {
  cpu: SystemResource
  memory: SystemResource
  disk: SystemResource
  network: SystemResource
  lastUpdate: number
}

/**
 * System Manager インターフェース
 */
export interface ISystemManager {
  getSystemStatus(): Promise<SystemStatus>
  getResourceAlert(): Promise<DashboardCard>
  monitorResources(intervalMs?: number): Promise<string>
  setThreshold(type: string, value: number): Promise<void>
}

/**
 * System Manager 実装
 * 
 * 責務:
 * - システムリソース監視
 * - CPU/メモリ/ディスク/ネットワーク情報取得
 * - 異常検知・通知
 * - Dashboard との連携
 */
export class SystemManager extends BaseManager implements ISystemManager {
  private thresholds = {
    cpu: 80,
    memory: 85,
    disk: 90,
    network: 1000, // Mbps
  }

  private status: SystemStatus = {
    cpu: this.createResourceTemplate('CPU', 'cpu'),
    memory: this.createResourceTemplate('Memory', 'memory'),
    disk: this.createResourceTemplate('Disk', 'disk'),
    network: this.createResourceTemplate('Network', 'network'),
    lastUpdate: Date.now(),
  }

  private monitoring: boolean = false
  private monitoringInterval: ReturnType<typeof setInterval> | null = null
  private monitoringTaskId: string | null = null

  constructor(
    logManager: ILogManager,
    progressManager: IProgressManager
  ) {
    super('SystemManager', logManager, progressManager)
  }

  /**
   * 初期化処理
   */
  protected async onInitialize(): Promise<void> {
    await this.logManager.info(
      this.managerName,
      'Setting up resource monitoring...'
    )

    // 初期リソース情報取得
    await this.updateSystemStatus()

    // Rust バックエンドから初期情報を取得
    // (invoke('get_system_info') など)

    await this.logManager.info(
      this.managerName,
      'System monitoring initialized'
    )
  }

  /**
   * シャットダウン処理
   */
  protected async onShutdown(): Promise<void> {
    // モニタリング停止
    this.stopMonitoring()

    await this.logManager.info(
      this.managerName,
      'System monitoring stopped'
    )
  }

  /**
   * システムステータス取得
   */
  async getSystemStatus(): Promise<SystemStatus> {
    this.checkInitialized()

    return await this.executeTask('Get System Status', async () => {
      await this.updateSystemStatus()
      return this.status
    }, 5000)
  }

  /**
   * リソース警告カード取得
   */
  async getResourceAlert(): Promise<DashboardCard> {
    this.checkInitialized()

    const status = await this.getSystemStatus()
    const alerts = this.detectAlerts(status)

    return {
      id: 'system-resource-alert',
      title: 'System Resources',
      manager: 'SystemManager',
      managerId: 'SystemManager',
      status: alerts.length > 0 ? 'warn' : 'normal',
      content: [
        { label: 'CPU', value: `${status.cpu.usage.toFixed(1)}%` },
        { label: 'Memory', value: `${status.memory.usage.toFixed(1)}%` },
        { label: 'Disk', value: `${status.disk.usage.toFixed(1)}%` },
      ],
      actions: [
        {
          id: 'view-details',
          label: 'View Details',
          command: 'system:view_details',
        },
      ],
      priority: alerts.length > 0 ? 8 : 5,
    }
  }

  /**
   * リソース監視開始
   */
  async monitorResources(intervalMs: number = 5000): Promise<string> {
    this.checkInitialized()

    if (this.monitoring) {
      await this.logManager.warn(
        this.managerName,
        'Monitoring already running'
      )
      return
    }

    await this.logManager.info(
      this.managerName,
      'Starting continuous monitoring...'
    )

    this.monitoring = true

    // Start a progress task for monitoring
    try {
      this.monitoringTaskId = await this.progressManager.startTask(
        'System Resource Monitoring',
        intervalMs
      )
    } catch (err) {
      await this.logManager.warn(this.managerName, 'Failed to start monitoring task')
    }

    // 指定間隔ごとにリソース情報更新
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.updateSystemStatus()

        // 異常検知
        const alerts = this.detectAlerts(this.status)
        if (alerts.length > 0) {
          await this.logManager.warn(
            this.managerName,
            `Resource alert: ${alerts.join(', ')}`
          )
        }
        // 更新があるたびに簡易的な進捗更新を通知
        if (this.monitoringTaskId) {
          try {
            const percent = Math.floor((Date.now() / 1000) % 100)
            await this.progressManager.updateProgress(this.monitoringTaskId, percent)
          } catch (e) {
            // ignore progress update failures
          }
        }
      } catch (error) {
        await this.logManager.error(
          this.managerName,
          `Monitoring error: ${this.formatError(error)}`
        )
      }
    }, intervalMs)
    // monitoringInterval stored internally; return monitoring task id if available
    return this.monitoringTaskId ?? 'monitoring'
  }

  /**
   * 閾値設定
   */
  async setThreshold(type: string, value: number): Promise<void> {
    this.checkInitialized()

    if (!(type in this.thresholds)) {
      throw new Error(`Invalid resource type: ${type}`)
    }

    const oldValue = this.thresholds[type as keyof typeof this.thresholds]
    this.thresholds[type as keyof typeof this.thresholds] = value

    await this.logManager.info(
      this.managerName,
      `Threshold updated: ${type} ${oldValue} → ${value}`
    )
  }

  /**
   * プライベート: システムステータス更新
   */
  private async updateSystemStatus(): Promise<void> {
    // 実際の実装では Tauri invoke で Rust バックエンドから取得
    // const systemInfo = await invoke('get_system_info')

    // ここではシミュレーション
    this.status = {
      cpu: this.updateResourceUsage(this.status.cpu, 'cpu'),
      memory: this.updateResourceUsage(this.status.memory, 'memory'),
      disk: this.updateResourceUsage(this.status.disk, 'disk'),
      network: this.updateResourceUsage(this.status.network, 'network'),
      lastUpdate: Date.now(),
    }
  }

  /**
   * プライベート: リソース使用率シミュレーション更新
   */
  private updateResourceUsage(
    resource: SystemResource,
    type: keyof typeof this.thresholds
  ): SystemResource {
    // ランダムに使用率をシミュレート
    const baseUsage = Math.random() * 70
    const jitter = Math.sin(Date.now() / 10000) * 10
    const usage = Math.max(0, Math.min(100, baseUsage + jitter))

    const threshold = this.thresholds[type]
    let status: SystemResource['status'] = 'normal'
    if (usage > threshold + 10) status = 'critical'
    else if (usage > threshold) status = 'warning'

    return {
      ...resource,
      usage,
      status,
      timestamp: Date.now(),
    }
  }

  /**
   * プライベート: 異常検知
   */
  private detectAlerts(status: SystemStatus): string[] {
    const alerts: string[] = []

    if (status.cpu.status === 'critical') {
      alerts.push(`CPU Critical: ${status.cpu.usage.toFixed(1)}%`)
    } else if (status.cpu.status === 'warning') {
      alerts.push(`CPU Warning: ${status.cpu.usage.toFixed(1)}%`)
    }

    if (status.memory.status === 'critical') {
      alerts.push(`Memory Critical: ${status.memory.usage.toFixed(1)}%`)
    } else if (status.memory.status === 'warning') {
      alerts.push(`Memory Warning: ${status.memory.usage.toFixed(1)}%`)
    }

    if (status.disk.status === 'critical') {
      alerts.push(`Disk Critical: ${status.disk.usage.toFixed(1)}%`)
    } else if (status.disk.status === 'warning') {
      alerts.push(`Disk Warning: ${status.disk.usage.toFixed(1)}%`)
    }

    return alerts
  }

  /**
   * プライベート: リソーステンプレート作成
   */
  private createResourceTemplate(
    name: string,
    type: SystemResource['type']
  ): SystemResource {
    return {
      name,
      type,
      usage: 0,
      threshold: this.thresholds[type as keyof typeof this.thresholds],
      status: 'normal',
      timestamp: Date.now(),
    }
  }

  /**
   * 停止用（テストから private にアクセスして利用される想定）
   */
  private stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    // complete progress task if one was started
    if (this.monitoringTaskId) {
      void this.progressManager.completeTask(this.monitoringTaskId).catch(() => {})
      this.monitoringTaskId = null
    }
    this.monitoring = false
  }

  /**
   * プライベート: システムステータス更新（重複削除）
   */
}
