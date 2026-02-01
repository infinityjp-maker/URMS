/**
 * IoTManager.test.ts
 * IoTManager ユニットテスト
 * 
 * Version: v4.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { IoTManager } from '../../../Source/src/subsystems/iot/IoTManager'

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

describe('IoTManager', () => {
  let manager: IoTManager

  beforeEach(async () => {
    manager = new IoTManager(mockLogManager, mockProgressManager)
    await manager.initialize()
  })

  afterEach(async () => {
    await manager.shutdown()
  })

  it('should discover IoT devices', async () => {
    const devices = await manager.discoverDevices()
    
    expect(devices).toBeDefined()
    expect(Array.isArray(devices)).toBe(true)
  })

  it('should control device', async () => {
    const result = await manager.controlDevice('device_001', 'power_on')
    
    expect(result).toBeDefined()
    expect(result.success).toBeDefined()
  })

  it('should get device status', async () => {
    const status = await manager.getDeviceStatus('device_001')
    
    expect(status).toBeDefined()
    expect(status.id).toBe('device_001')
    expect(['light', 'thermostat', 'sensor', 'switch', 'camera']).toContain(status.type)
  })

  it('should get IoT dashboard card', async () => {
    const card = await manager.getIoTCard()
    
    expect(card).toBeDefined()
    expect(card.id).toBe('iot-manager-card')
    expect(card.title).toBe('IoT Manager')
    expect(card.managerId).toBe('IoTManager')
  })

  it('should track device power states', async () => {
    const devices = await manager.discoverDevices()
    
    for (const device of devices) {
      expect([true, false]).toContain(device.powered)
    }
  })

  it('should handle multiple device types', async () => {
    const devices = await manager.discoverDevices()
    const types = devices.map(d => d.type)
    
    expect(types.length).toBeGreaterThan(0)
    expect(types.every(t => ['light', 'thermostat', 'sensor', 'switch', 'camera'].includes(t))).toBe(true)
  })

  it('should control power commands', async () => {
    const result1 = await manager.controlDevice('device_001', 'power_on')
    const result2 = await manager.controlDevice('device_001', 'power_off')
    
    expect(result1.success).toBeDefined()
    expect(result2.success).toBeDefined()
  })
})
