/**
 * NetworkManager.test.ts
 * NetworkManager ユニットテスト
 * 
 * Version: v4.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NetworkManager } from '../../../Source/src/subsystems/network/NetworkManager'

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

describe('NetworkManager', () => {
  let manager: NetworkManager

  beforeEach(async () => {
    manager = new NetworkManager(mockLogManager, mockProgressManager)
    await manager.initialize()
  })

  afterEach(async () => {
    await manager.shutdown()
  })

  it('should scan network', async () => {
    const devices = await manager.scanNetwork('192.168.1.0/24')
    
    expect(devices).toBeDefined()
    expect(Array.isArray(devices)).toBe(true)
  })

  it('should ping device', async () => {
    const latency = await manager.pingDevice('192.168.1.1')
    
    expect(typeof latency).toBe('number')
    expect(latency).toBeGreaterThanOrEqual(0)
  })

  it('should get network statistics', async () => {
    const stats = await manager.getNetworkStats()
    
    expect(stats).toBeDefined()
    expect(stats.devicesOnline).toBeGreaterThanOrEqual(0)
    expect(stats.devicesOffline).toBeGreaterThanOrEqual(0)
    expect(stats.averageLatency).toBeGreaterThanOrEqual(0)
  })

  it('should return valid network status', async () => {
    const stats = await manager.getNetworkStats()
    
    expect(['normal', 'warning', 'critical']).toContain(stats.networkStatus)
  })

  it('should get network dashboard card', async () => {
    const card = await manager.getNetworkCard()
    
    expect(card).toBeDefined()
    expect(card.id).toBe('network-manager-card')
    expect(card.title).toBe('Network Manager')
    expect(card.managerId).toBe('NetworkManager')
  })

  it('should track device status', async () => {
    const stats = await manager.getNetworkStats()
    
    const totalDevices = stats.devicesOnline + stats.devicesOffline
    expect(totalDevices).toBeGreaterThanOrEqual(0)
  })

  it('should validate latency values', async () => {
    const latency = await manager.pingDevice('8.8.8.8')
    
    expect(latency).toBeGreaterThanOrEqual(0)
    expect(latency).toBeLessThan(10000) // Less than 10 seconds
  })
})
