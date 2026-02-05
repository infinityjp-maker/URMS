/**
 * ManagerTypes.ts
 * URMS Manager 共通型定義
 * 
 * Version: v4.0
 */

/**
 * ダッシュボードカード定義
 */
export interface DashboardCard {
  /** カード一意ID */
  id: string
  
  /** カードタイトル */
  title: string
  
  /** 管理元 Manager 名 */
  manager: string
  /** 互換性用: 管理元 ID (一部テストが `managerId` を期待しているため追加) */
  managerId?: string
  
  /** 状態: normal | warn | error */
  status: 'normal' | 'warn' | 'error'
  
  /** カードコンテンツ */
  content: DashboardContent[]
  
  /** カードアクション（オプション） */
  actions?: DashboardAction[]
  
  /** 表示優先度（1-10, 高い方が優先） */
  priority: number
  
  /** 最終更新時刻 */
  updatedAt?: string
}

/**
 * ダッシュボードカードコンテンツ
 */
export interface DashboardContent {
  /** ラベル */
  label: string
  
  /** 値 */
  value: string | number
  
  /** グラフデータ（Sparkline用） */
  graph?: number[]
  
  /** 単位 */
  unit?: string
}

/**
 * ダッシュボードカードアクション
 */
export interface DashboardAction {
  /** アクションID */
  id: string
  
  /** ボタンラベル */
  label: string
  
  /** 実行コマンド名 */
  command: string
  
  /** コマンドパラメータ */
  params?: Record<string, any>
}

/**
 * ログエントリ
 */
export interface LogEntry {
  /** ログID */
  id: string
  
  /** タイムスタンプ */
  timestamp: string
  
  /** ログレベル */
  level: 'INFO' | 'WARN' | 'ERROR'
  
  /** 出力元 Manager */
  manager: string
  
  /** メッセージ */
  message: string
  
  /** メタデータ */
  metadata?: Record<string, any>
}

/**
 * ログフィルタ
 */
export interface LogFilter {
  /** Manager 名でフィルタ */
  manager?: string
  
  /** ログレベルでフィルタ */
  level?: 'INFO' | 'WARN' | 'ERROR'
  
  /** 開始日時 */
  startDate?: string
  
  /** 終了日時 */
  endDate?: string
  
  /** キーワード検索 */
  keyword?: string
}

/**
 * 進捗タスク
 */
export interface ProgressTask {
  /** タスクID */
  taskId: string
  
  /** タスクタイトル */
  title: string
  
  /** 進捗率（0-100） */
  percentage: number
  
  /** 経過時間（ms） */
  elapsedTime: number
  
  /** 残り時間（ms） */
  remainingTime: number
  
  /** タスク状態 */
  status: 'running' | 'success' | 'error' | 'completed'
  
  /** エラーメッセージ（エラー時） */
  errorMessage?: string
  
  /** 互換性フィールド: 外部コードが期待する別名 */
  id?: string
  progress?: number
  estimatedRemainingTime?: number

  /** 開始時刻 */
  startedAt?: number
}

/**
 * システムステータス
 */
export interface SystemStatus {
  /** CPU使用率（0-100） */
  cpu: number
  
  /** メモリ使用率（0-100） */
  memory: number
  
  /** ディスク情報 */
  disk: {
    used: number
    free: number
    total: number
  }
  
  /** ネットワーク情報 */
  network: {
    up: number  // kbps
    down: number  // kbps
  }
  
  /** ステータス */
  status: 'normal' | 'warn' | 'error'
}

/**
 * Manager 設定基本構造
 */
export interface ManagerConfig {
  /** Manager 有効化フラグ */
  enabled: boolean
  
  /** ログレベル */
  logLevel: 'INFO' | 'WARN' | 'ERROR'
  
  /** タイムアウト（ms） */
  timeout?: number
  
  /** カスタム設定 */
  custom?: Record<string, any>
}
