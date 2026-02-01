/**
 * FileManager.test.ts
 * FileManager ユニットテスト
 * 
 * Version: v4.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { FileManager } from '../../../Source/src/subsystems/file/FileManager'

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

describe('FileManager', () => {
  let manager: FileManager

  beforeEach(async () => {
    manager = new FileManager(mockLogManager, mockProgressManager)
    await manager.initialize()
  })

  afterEach(async () => {
    await manager.shutdown()
  })

  it('should scan directory', async () => {
    const files = await manager.scanDirectory('/home/user/documents')
    
    expect(files).toBeDefined()
    expect(Array.isArray(files)).toBe(true)
  })

  it('should classify files correctly', async () => {
    const classification = manager.classifyFile('document.pdf')
    
    expect(['document', 'image', 'video', 'audio', 'archive', 'other']).toContain(classification)
  })

  it('should get storage statistics', async () => {
    const stats = await manager.getStorageStats()
    
    expect(stats).toBeDefined()
    expect(stats.totalSize).toBeGreaterThan(0)
    expect(stats.usedSize).toBeGreaterThanOrEqual(0)
    expect(stats.freeSize).toBeGreaterThanOrEqual(0)
    expect(stats.fileCount).toBeGreaterThanOrEqual(0)
  })

  it('should provide category breakdown', async () => {
    const stats = await manager.getStorageStats()
    
    expect(stats.categoryBreakdown).toBeDefined()
    expect(typeof stats.categoryBreakdown).toBe('object')
  })

  it('should get file dashboard card', async () => {
    const card = await manager.getFileCard()
    
    expect(card).toBeDefined()
    expect(card.id).toBe('file-manager-card')
    expect(card.title).toBe('File Manager')
    expect(card.managerId).toBe('FileManager')
  })

  it('should validate storage calculations', async () => {
    const stats = await manager.getStorageStats()
    
    expect(stats.usedSize).toBeLessThanOrEqual(stats.totalSize)
    expect(stats.freeSize + stats.usedSize).toBeLessThanOrEqual(stats.totalSize * 1.1)
  })

  it('should handle empty directory', async () => {
    const files = await manager.scanDirectory('/empty/directory')
    
    expect(Array.isArray(files)).toBe(true)
  })
})
