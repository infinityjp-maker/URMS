/**
 * BaseManager.ts
 * URMS Manager 基底クラス
 * 
 * すべての Manager はこのクラスを継承し、
 * ライフサイクル・Log/Progress 統合・エラーハンドリングを自動化する
 * 
 * Version: v4.0
 * Author: URMS Team
 */

// インターフェース型定義（循環参照防止）
export interface ILogManager {
  info(manager: string, message: string, metadata?: Record<string, any>): Promise<void>
  warn(manager: string, message: string, metadata?: Record<string, any>): Promise<void>
  error(manager: string, message: string, metadata?: Record<string, any>): Promise<void>
}

export interface IProgressManager {
  startTask(title: string, estimatedTime?: number): Promise<string>
  updateProgress(taskId: string, percentage: number): Promise<void>
  completeTask(taskId: string): Promise<void>
  errorTask(taskId: string, error: string): Promise<void>
}

/**
 * Manager ライフサイクルインターフェース
 */
export interface IManager {
  initialize(): Promise<void>
  shutdown(): Promise<void>
  isInitialized(): boolean
}

/**
 * Manager 基底クラス
 * 
 * 責務:
 * - ライフサイクル管理（初期化・シャットダウン）
 * - Log/Progress 統合連携
 * - エラーハンドリング統一
 * - 非同期タスク実行管理
 */
export abstract class BaseManager implements IManager {
  protected logManager: ILogManager
  protected progressManager: IProgressManager
  protected managerName: string
  protected _isInitialized: boolean = false

  /**
   * コンストラクタ
   * 
   * @param name - Manager 名（ログ出力用）
   * @param logManager - Log Manager インスタンス
   * @param progressManager - Progress Manager インスタンス
   */
  constructor(
    name: string,
    logManager: ILogManager,
    progressManager: IProgressManager
  ) {
    this.managerName = name
    this.logManager = logManager
    this.progressManager = progressManager
  }

  /**
   * 初期化処理
   * 
   * 流れ:
   * 1. ログ出力: "Initializing..."
   * 2. サブクラスの onInitialize() 実行
   * 3. フラグ設定
   * 4. ログ出力: "Initialized successfully"
   */
  async initialize(): Promise<void> {
    try {
      await this.logManager.info(
        this.managerName,
        'Initializing Manager...'
      )

      await this.onInitialize()

      this._isInitialized = true

      await this.logManager.info(
        this.managerName,
        'Manager initialized successfully'
      )
    } catch (error) {
      await this.logManager.error(
        this.managerName,
        `Initialization failed: ${this.formatError(error)}`
      )
      this._isInitialized = false
      throw error
    }
  }

  /**
   * シャットダウン処理
   * 
   * 流れ:
   * 1. ログ出力: "Shutting down..."
   * 2. サブクラスの onShutdown() 実行
   * 3. フラグリセット
   * 4. ログ出力: "Shutdown complete"
   */
  async shutdown(): Promise<void> {
    try {
      await this.logManager.info(
        this.managerName,
        'Shutting down Manager...'
      )

      await this.onShutdown()

      this._isInitialized = false

      await this.logManager.info(
        this.managerName,
        'Manager shutdown complete'
      )
    } catch (error) {
      await this.logManager.error(
        this.managerName,
        `Shutdown failed: ${this.formatError(error)}`
      )
      throw error
    }
  }

  /**
   * 初期化済みフラグ取得
   */
  isInitialized(): boolean {
    return this._isInitialized
  }

  /**
   * 初期化チェック
   * 処理実行前に呼び出し
   */
  protected checkInitialized(): void {
    if (!this._isInitialized) {
      throw new Error(`${this.managerName} is not initialized`)
    }
  }

  /**
   * 非同期タスク実行ラッパー
   * 
   * Log/Progress 統合処理を自動化
   * 
   * @param taskTitle - タスク名
   * @param taskFn - 実行する処理
   * @param estimatedTime - 推定所要時間（ms）
   * @returns 処理結果
   */
  protected async executeTask<T>(
    taskTitle: string,
    taskFn: () => Promise<T>,
    estimatedTime?: number
  ): Promise<T> {
    const taskId = await this.progressManager.startTask(
      taskTitle,
      estimatedTime
    )

    try {
      await this.logManager.info(
        this.managerName,
        `Task started: ${taskTitle}`
      )

      const result = await taskFn()

      await this.progressManager.completeTask(taskId)
      await this.logManager.info(
        this.managerName,
        `Task completed: ${taskTitle}`
      )

      return result
    } catch (error) {
      const errorMessage = this.formatError(error)
      
      await this.progressManager.errorTask(taskId, errorMessage)
      await this.logManager.error(
        this.managerName,
        `Task failed: ${taskTitle} - ${errorMessage}`
      )

      throw error
    }
  }

  /**
   * 非同期タスク実行ラッパー（進捗更新版）
   * 
   * 進捗を複数回更新する場合に使用
   * 
   * @param taskTitle - タスク名
   * @param taskFn - 実行する処理（進捗更新コールバック付き）
   * @param estimatedTime - 推定所要時間（ms）
   * @returns 処理結果
   */
  protected async executeTaskWithProgress<T>(
    taskTitle: string,
    taskFn: (updateProgress: (percentage: number) => Promise<void>) => Promise<T>,
    estimatedTime?: number
  ): Promise<T> {
    const taskId = await this.progressManager.startTask(
      taskTitle,
      estimatedTime
    )

    try {
      await this.logManager.info(
        this.managerName,
        `Task started: ${taskTitle}`
      )

      const updateProgress = async (percentage: number) => {
        await this.progressManager.updateProgress(taskId, percentage)
      }

      const result = await taskFn(updateProgress)

      await this.progressManager.completeTask(taskId)
      await this.logManager.info(
        this.managerName,
        `Task completed: ${taskTitle}`
      )

      return result
    } catch (error) {
      const errorMessage = this.formatError(error)

      await this.progressManager.errorTask(taskId, errorMessage)
      await this.logManager.error(
        this.managerName,
        `Task failed: ${taskTitle} - ${errorMessage}`
      )

      throw error
    }
  }

  /**
   * エラーフォーマット
   */
  protected formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message
    }
    return String(error)
  }

  /**
   * サブクラスで実装すべきメソッド: 初期化処理
   */
  protected abstract onInitialize(): Promise<void>

  /**
   * サブクラスで実装すべきメソッド: シャットダウン処理
   */
  protected abstract onShutdown(): Promise<void>
}
