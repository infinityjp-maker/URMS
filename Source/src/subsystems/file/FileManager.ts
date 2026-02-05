/**
 * FileManager.ts
 * URMS v4.0 - File Manager
 * 
 * ファイル操作・分類・大容量処理の管理
 * BaseManager を継承した Subsystem Manager
 * 
 * Version: v4.0
 */

import { BaseManager, type ILogManager, type IProgressManager } from '@core/base/BaseManager'
import type { DashboardCard } from '@core/types/ManagerTypes'

/**
 * ファイル情報
 */
export interface FileInfo {
  id: string
  path: string
  name: string
  size: number
  mimeType: string
  created: string
  modified: string
  category: 'document' | 'media' | 'archive' | 'system' | 'other'
  tags?: string[]
}

/**
 * File Manager インターフェース
 */
export interface IFileManager {
  scanDirectory(path: string): Promise<FileInfo[]>
  classifyFile(fileOrName: FileInfo | string): string
  getStorageStats(): Promise<StorageStats>
  getFileCard(): Promise<DashboardCard>
}

/**
 * ストレージ統計
 */
export interface StorageStats {
  totalSize: number
  usedSize: number
  freeSize: number
  fileCount: number
  categoryBreakdown: Record<string, number>
}

/**
 * File Manager 実装
 * 
 * 責務:
 * - ファイルシステム監視
 * - ファイル分類・タグ付け
 * - ストレージ管理
 * - 大容量ファイル処理
 * - Dashboard との連携
 */
export class FileManager extends BaseManager implements IFileManager {
  private fileIndex: Map<string, FileInfo> = new Map()
  private storageStats: StorageStats = {
    totalSize: 0,
    usedSize: 0,
    freeSize: 0,
    fileCount: 0,
    categoryBreakdown: {},
  }

  constructor(
    logManager: ILogManager,
    progressManager: IProgressManager
  ) {
    super('FileManager', logManager, progressManager)
  }

  /**
   * 初期化処理
   */
  protected async onInitialize(): Promise<void> {
    await this.logManager.info(
      this.managerName,
      'Initializing file management system...'
    )

    // デフォルトディレクトリをスキャン
    // await this.scanDirectory('/home/user/Documents')

    await this.logManager.info(
      this.managerName,
      'File manager ready'
    )
  }

  /**
   * シャットダウン処理
   */
  protected async onShutdown(): Promise<void> {
    await this.logManager.info(
      this.managerName,
      `Saving file index: ${this.fileIndex.size} files`
    )
    this.fileIndex.clear()
  }

  /**
   * ディレクトリスキャン
   */
  async scanDirectory(path: string): Promise<FileInfo[]> {
    this.checkInitialized()

    return await this.executeTaskWithProgress(
      `Scanning: ${path}`,
      async (updateProgress) => {
        // シミュレーション実装
        const files: FileInfo[] = [
          {
            id: 'file1',
            path: `${path}/document.pdf`,
            name: 'document.pdf',
            size: 2048576,
            mimeType: 'application/pdf',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            category: 'document',
          },
          {
            id: 'file2',
            path: `${path}/image.jpg`,
            name: 'image.jpg',
            size: 1024000,
            mimeType: 'image/jpeg',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            category: 'media',
          },
        ]

        for (let i = 0; i < files.length; i++) {
          await updateProgress((i / files.length) * 100)
          this.fileIndex.set(files[i].id, files[i])
        }

        await updateProgress(100)

        await this.logManager.info(
          this.managerName,
          `Scanned ${files.length} files in ${path}`
        )

        return files
      },
      5000
    )
  }

  /**
   * ファイル分類
   */
  classifyFile(fileOrName: FileInfo | string): string {
    this.checkInitialized()

    // Accept either FileInfo or filename string
    let name: string
    let mimeType: string | undefined
    if (typeof fileOrName === 'string') {
      name = fileOrName
      // infer by extension
      const ext = name.split('.').pop()?.toLowerCase() || ''
      switch (ext) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
          mimeType = 'image/' + ext
          break
        case 'mp4':
        case 'mkv':
        case 'mov':
          mimeType = 'video/' + ext
          break
        case 'mp3':
        case 'wav':
          mimeType = 'audio/' + ext
          break
        case 'pdf':
        case 'doc':
        case 'docx':
        case 'txt':
        case 'ppt':
        case 'pptx':
          mimeType = 'application/' + ext
          break
        case 'zip':
        case 'rar':
        case '7z':
          mimeType = 'application/zip'
          break
        default:
          mimeType = 'application/octet-stream'
      }
    } else {
      name = fileOrName.name
      mimeType = fileOrName.mimeType
    }

    const category = this.determineCategory(mimeType)

    // update index if we have an id
    if (typeof fileOrName !== 'string' && fileOrName.id) {
      const updated = { ...fileOrName, category: category as any }
      this.fileIndex.set(fileOrName.id, updated)
    }

    // log synchronously (fire-and-forget)
    this.logManager.info(this.managerName, `File classified: ${name} → ${category}`)

    return category
  }

  /**
   * ストレージ統計取得
   */
  async getStorageStats(): Promise<StorageStats> {
    this.checkInitialized()

    return await this.executeTask('Calculate Storage Stats', async () => {
      let totalSize = 0
      const breakdown: Record<string, number> = {}

      for (const file of this.fileIndex.values()) {
        totalSize += file.size
        breakdown[file.category] = (breakdown[file.category] || 0) + file.size
      }

      // If no files indexed, assume a default total capacity (1TB)
      const capacity = 1099511627776
      const used = totalSize
      const free = Math.max(0, capacity - used)

      this.storageStats = {
        totalSize: capacity,
        usedSize: used,
        freeSize: free,
        fileCount: this.fileIndex.size,
        categoryBreakdown: breakdown,
      }

      return this.storageStats
    })
  }

  /**
   * Dashboard カード取得
   */
  async getFileCard(): Promise<DashboardCard> {
    this.checkInitialized()

    const stats = await this.getStorageStats()
    const usagePercent = (stats.usedSize / 1099511627776) * 100

    return {
      id: 'file-manager-card',
      title: 'File Manager',
      manager: 'FileManager',
      managerId: 'FileManager',
      status: usagePercent > 80 ? 'warn' : 'normal',
      content: [
        { label: 'Total Files', value: stats.fileCount },
        { label: 'Used Space', value: `${(stats.usedSize / 1073741824).toFixed(2)} GB` },
        { label: 'Free Space', value: `${(stats.freeSize / 1073741824).toFixed(2)} GB` },
        { label: 'Storage Usage', value: `${usagePercent.toFixed(1)}%` },
      ],
      actions: [
        {
          id: 'scan-disk',
          label: 'Scan Disk',
          command: 'file:scan_disk',
        },
      ],
      priority: 5,
    }
  }

  /**
   * プライベート: MIME タイプからカテゴリを決定
   */
  private determineCategory(mimeType?: string): string {
    if (!mimeType || typeof mimeType !== 'string') return 'other'
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType === 'application/pdf') return 'document'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document'
    if (mimeType.includes('compressed') || mimeType.includes('archive') || mimeType === 'application/zip') return 'archive'
    if (mimeType.startsWith('application/x-') || mimeType === 'application/octet-stream') return 'system'
    return 'other'
  }
}
