/**
 * AssetManager.test.ts
 * AssetManager ユニットテスト
 * 
 * Version: v4.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AssetManager } from '../../../Source/src/subsystems/asset/AssetManager'

/**
 * Mock Log Manager
 */
const mockLogManager = {
  info: async () => {},
  warn: async () => {},
  error: async () => {},
}

/**
 * Mock Progress Manager
 */
const mockProgressManager = {
  startTask: async () => 'task_id',
  updateProgress: async () => {},
  completeTask: async () => {},
  errorTask: async () => {},
}

describe('AssetManager', () => {
  let manager: AssetManager

  beforeEach(async () => {
    manager = new AssetManager(mockLogManager, mockProgressManager)
    await manager.initialize()
  })

  afterEach(async () => {
    await manager.shutdown()
  })

  it('should get assets', async () => {
    const assets = await manager.getAssets()
    
    expect(assets).toBeDefined()
    expect(Array.isArray(assets)).toBe(true)
  })

  it('should add asset', async () => {
    const asset = await manager.addAsset({
      name: 'Test Device',
      type: 'device',
      model: 'Test Model',
      status: 'active',
      purchaseDate: new Date(),
      warrantyExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    })
    
    expect(asset).toBeDefined()
    expect(asset.id).toBeDefined()
    expect(asset.name).toBe('Test Device')
  })

  it('should update asset', async () => {
    const asset = await manager.addAsset({
      name: 'Test Device',
      type: 'device',
      model: 'Test Model',
      status: 'active',
      purchaseDate: new Date(),
      warrantyExpiry: new Date(),
    })
    
    const updated = await manager.updateAsset(asset.id, {
      status: 'inactive',
    })
    
    expect(updated.status).toBe('inactive')
  })

  it('should delete asset', async () => {
    const asset = await manager.addAsset({
      name: 'Asset to Delete',
      type: 'device',
      model: 'Model',
      status: 'active',
      purchaseDate: new Date(),
      warrantyExpiry: new Date(),
    })
    
    const success = await manager.deleteAsset(asset.id)
    
    expect(success).toBe(true)
  })

  it('should get asset card', async () => {
    const card = await manager.getAssetCard()
    
    expect(card).toBeDefined()
    expect(card.id).toBe('asset-manager-card')
    expect(card.title).toBe('Asset Manager')
    expect(card.managerId).toBe('AssetManager')
  })

  it('should handle asset types', async () => {
    const types = ['device', 'software', 'license', 'hardware']
    
    for (const type of types) {
      const asset = await manager.addAsset({
        name: `Asset of type ${type}`,
        type: type as any,
        model: 'Model',
        status: 'active',
        purchaseDate: new Date(),
        warrantyExpiry: new Date(),
      })
      
      expect(asset.type).toBe(type)
    }
  })

  it('should track asset status', async () => {
    const asset = await manager.addAsset({
      name: 'Tracked Asset',
      type: 'device',
      model: 'Model',
      status: 'active',
      purchaseDate: new Date(),
      warrantyExpiry: new Date(),
    })
    
    expect(['active', 'inactive', 'maintenance']).toContain(asset.status)
  })

  it('should handle warranty dates', async () => {
    const purchaseDate = new Date()
    const warrantyExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    
    const asset = await manager.addAsset({
      name: 'Warranted Asset',
      type: 'device',
      model: 'Model',
      status: 'active',
      purchaseDate,
      warrantyExpiry,
    })
    
    expect(asset.purchaseDate).toBeDefined()
    expect(asset.warrantyExpiry).toBeDefined()
  })
})
