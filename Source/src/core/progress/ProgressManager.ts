/**
 * ProgressManager.ts
 * URMS v4.0 - Progress Manager
 * 
 * BaseManager を継承した Progress Manager の実装例
 * 全 Manager の進捗を一元管理
 * 
 * Version: v4.0
 */

import { BaseManager, type IProgressManager } from '@core/base/BaseManager'
import type { ProgressTask, ManagerConfig } from '@core/types/ManagerTypes'

/**
 * Progress Manager 実装
 * 
 * 責務:
 * - タスク進捗の登録・管理
 * - リアルタイム進捗更新
 * - Dashboard への進捗表示
 */
export class ProgressManager extends BaseManager implements IProgressManager {
  private tasks: Map<string, ProgressTask> = new Map()
  private config: ManagerConfig

  constructor(config?: ManagerConfig) {
    // Progress Manager は自己参照を避ける
    super('ProgressManager', undefined as any, undefined as any)
    this.config = config || {
      enabled: true,
      logLevel: 'INFO',
    }
    // Mock managers
    this.logManager = {
      info: async () => {},
      warn: async () => {},
      error: async () => {},
    }
    this.progressManager = this
  }

  protected async onInitialize(): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Progress Manager is disabled')
    }
    console.log(`[${this.managerName}] Initialized`)
  }

  protected async onShutdown(): Promise<void> {
    console.log(`[${this.managerName}] Shutting down - ${this.tasks.size} tasks cleanup`)
    this.tasks.clear()
  }

  /**
   * タスク開始
   */
  async startTask(title: string, estimatedTime?: number): Promise<string> {
    this.checkInitialized()

    const taskId = this.generateId()
    const task: ProgressTask = {
      taskId,
      title,
      percentage: 0,
      elapsedTime: 0,
      remainingTime: estimatedTime || 0,
      status: 'running',
      startedAt: Date.now(),
    }

    this.tasks.set(taskId, task)
    console.log(`[${this.managerName}] Task started: ${title}`)

    return taskId
  }

  /**
   * 進捗更新
   */
  async updateProgress(taskId: string, percentage: number): Promise<void> {
    this.checkInitialized()

    const task = this.tasks.get(taskId)
    if (!task) {
      throw new Error(`Task not found: ${taskId}`)
    }

    const now = Date.now()
    const elapsed = now - (task.startedAt || now)

    task.percentage = Math.min(100, Math.max(0, percentage))
    task.elapsedTime = elapsed

    // 残り時間を推定
    if (percentage > 0) {
      const totalEstimated = (elapsed * 100) / percentage
      task.remainingTime = Math.max(0, totalEstimated - elapsed)
    }

    // 100% なら自動完了
    if (task.percentage >= 100) {
      task.status = 'success'
      task.remainingTime = 0
    }
  }

  /**
   * タスク完了
   */
  async completeTask(taskId: string): Promise<void> {
    this.checkInitialized()

    const task = this.tasks.get(taskId)
    if (!task) {
      throw new Error(`Task not found: ${taskId}`)
    }

    task.status = 'success'
    task.percentage = 100
    task.remainingTime = 0

    console.log(`[${this.managerName}] Task completed: ${task.title}`)
  }

  /**
   * タスクエラー
   */
  async errorTask(taskId: string, error: string): Promise<void> {
    this.checkInitialized()

    const task = this.tasks.get(taskId)
    if (!task) {
      throw new Error(`Task not found: ${taskId}`)
    }

    task.status = 'error'
    task.errorMessage = error

    console.error(`[${this.managerName}] Task error: ${task.title} - ${error}`)
  }

  /**
   * タスク取得
   */
  async getTask(taskId: string): Promise<ProgressTask | null> {
    this.checkInitialized()
    return this.tasks.get(taskId) || null
  }

  /**
   * 全タスク取得
   */
  async getTasks(): Promise<ProgressTask[]> {
    this.checkInitialized()
    return Array.from(this.tasks.values())
  }

  /**
   * 実行中のタスク取得
   */
  async getRunningTasks(): Promise<ProgressTask[]> {
    this.checkInitialized()
    return Array.from(this.tasks.values()).filter(t => t.status === 'running')
  }

  /**
   * タスク削除（完了・失敗後）
   */
  async removeTask(taskId: string): Promise<void> {
    this.checkInitialized()

    const task = this.tasks.get(taskId)
    if (task && task.status !== 'running') {
      this.tasks.delete(taskId)
      console.log(`[${this.managerName}] Task removed: ${task.title}`)
    }
  }

  /**
   * 完了・失敗したタスクをクリア
   */
  async cleanup(): Promise<void> {
    this.checkInitialized()

    let cleaned = 0
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.status !== 'running') {
        this.tasks.delete(taskId)
        cleaned++
      }
    }

    console.log(`[${this.managerName}] Cleaned up ${cleaned} completed tasks`)
  }

  /**
   * ID 生成
   */
  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
