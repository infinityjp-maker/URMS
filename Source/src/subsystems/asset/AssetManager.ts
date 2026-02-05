/**
 * AssetManager.ts
 * URMS v4.0 - Asset Manager
 * 
 * デバイス・資産・構成情報の管理
 * BaseManager を継承した Subsystem Manager の実装例
 * 
 * Version: v4.0
 */

import { BaseManager, type ILogManager, type IProgressManager } from '@core/base/BaseManager'
import type { DashboardCard } from '@core/types/ManagerTypes'

/**
 * 資産情報
 */
export interface Asset {
  id?: string
  name: string
  type: 'device' | 'software' | 'license' | string
  model?: string
  location?: string
  purchaseDate?: Date | string
  warrantyExpiry?: Date | string
  status: 'active' | 'inactive' | 'maintenance' | string
  metadata?: Record<string, any>
}

/**
 * Asset Manager インターフェース
 */
export interface IAssetManager {
  getAssets(): Promise<Asset[]>
  addAsset(asset: Partial<Asset>): Promise<Asset>
  updateAsset(id: string, asset: Partial<Asset>): Promise<Asset>
  deleteAsset(id: string): Promise<boolean>
  getAssetCard(): Promise<DashboardCard>
}

/**
 * Asset Manager 実装
 * 
 * 責務:
 * - 資産情報の登録・管理
 * - デバイス構成管理
 * - ソフトウェアライセンス管理
 * - Dashboard との連携
 */
export class AssetManager extends BaseManager implements IAssetManager {
  private assets: Map<string, Asset> = new Map()

  constructor(
    logManager: ILogManager,
    progressManager: IProgressManager
  ) {
    super('AssetManager', logManager, progressManager)
  }

  /**
   * 初期化処理
   */
  protected async onInitialize(): Promise<void> {
    await this.logManager.info(
      this.managerName,
      'Initializing asset management system...'
    )

    // 資産情報を初期ロード（Rust バックエンドから取得）
    // const initialAssets = await invoke('load_assets')
    // this.loadAssetsFromBackend(initialAssets)

    await this.logManager.info(
      this.managerName,
      'Asset manager ready'
    )
  }

  /**
   * シャットダウン処理
   */
  protected async onShutdown(): Promise<void> {
    await this.logManager.info(
      this.managerName,
      'Saving asset data...'
    )
    this.assets.clear()
  }

  /**
   * 資産一覧取得
   */
  async getAssets(): Promise<Asset[]> {
    this.checkInitialized()

    return await this.executeTask('Get Assets', async () => {
      return Array.from(this.assets.values())
    })
  }

  /**
   * 資産追加
   */
  async addAsset(asset: Partial<Asset>): Promise<Asset> {
    this.checkInitialized()

    return await this.executeTask(`Add Asset: ${asset.name || 'unnamed'}`, async () => {
      const id = asset.id || `asset_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
      const record: Asset = {
        id,
        name: asset.name || 'Unnamed',
        type: asset.type || 'device',
        model: asset.model,
        location: asset.location,
        purchaseDate: asset.purchaseDate,
        warrantyExpiry: asset.warrantyExpiry,
        status: asset.status || 'active',
        metadata: asset.metadata,
      }

      this.assets.set(id, record)

      await this.logManager.info(
        this.managerName,
        `Asset added: ${record.name} (${record.type})`
      )

      return record
    })
  }

  /**
   * 資産更新
   */
  async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset> {
    this.checkInitialized()

    await this.executeTask(`Update Asset: ${id}`, async () => {
      const asset = this.assets.get(id)
      if (!asset) {
        throw new Error(`Asset with ID ${id} not found`)
      }

      const updated = { ...asset, ...updates }
      this.assets.set(id, updated)

      await this.logManager.info(
        this.managerName,
        `Asset updated: ${updated.name}`
      )
      return updated
    })
    // executeTask returns the updated asset
    return this.assets.get(id) as Asset
  }

  /**
   * 資産削除
   */
  async deleteAsset(id: string): Promise<boolean> {
    this.checkInitialized()

    await this.executeTask(`Delete Asset: ${id}`, async () => {
      const asset = this.assets.get(id)
      if (!asset) {
        throw new Error(`Asset with ID ${id} not found`)
      }

      this.assets.delete(id)

      await this.logManager.info(
        this.managerName,
        `Asset deleted: ${asset.name}`
      )
    })
    return !this.assets.has(id)
  }

  /**
   * Dashboard カード取得
   */
  async getAssetCard(): Promise<DashboardCard> {
    this.checkInitialized()

    const assets = await this.getAssets()
    const activeCount = assets.filter(a => a.status === 'active').length
    const maintenanceCount = assets.filter(a => a.status === 'maintenance').length

    return {
      id: 'asset-manager-card',
      title: 'Asset Manager',
      manager: 'AssetManager',
      managerId: 'AssetManager',
      status: maintenanceCount > 0 ? 'warn' : 'normal',
      content: [
        { label: 'Total Assets', value: assets.length },
        { label: 'Active', value: activeCount },
        { label: 'Maintenance', value: maintenanceCount },
        { label: 'Inactive', value: assets.length - activeCount - maintenanceCount },
      ],
      actions: [
        {
          id: 'view-all',
          label: 'View All',
          command: 'asset:view_all',
        },
        {
          id: 'add-new',
          label: 'Add Asset',
          command: 'asset:add_new',
        },
      ],
      priority: 6,
    }
  }
}
