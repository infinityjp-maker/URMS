/**
 * IoTManager.ts
 * URMS v4.0 - IoT Manager
 * 
 * IoT デバイス連携・制御
 * BaseManager を継承した Subsystem Manager
 * 
 * Version: v4.0
 */

import { BaseManager, type ILogManager, type IProgressManager } from '@core/base/BaseManager'
import type { DashboardCard } from '@core/types/ManagerTypes'

/**
 * IoT デバイス情報
 */
export interface IoTDevice {
  id: string
  name: string
  deviceType: 'light' | 'thermostat' | 'sensor' | 'switch' | 'camera'
  manufacturer: string
  status: 'connected' | 'disconnected' | 'error'
  powerState: 'on' | 'off'
  lastUpdate: string
  properties: Record<string, any>
}

/**
 * IoT Manager インターフェース
 */
export interface IIoTManager {
  discoverDevices(): Promise<IoTDevice[]>
  controlDevice(deviceId: string, command: string): Promise<void>
  getDeviceStatus(deviceId: string): Promise<IoTDevice>
  getIoTCard(): Promise<DashboardCard>
}

/**
 * IoT Manager 実装
 * 
 * 責務:
 * - IoT デバイス検出・登録
 * - デバイス制御コマンド実行
 * - デバイスステータス監視
 * - Dashboard との連携
 */
export class IoTManager extends BaseManager implements IIoTManager {
  private devices: Map<string, IoTDevice> = new Map()

  constructor(
    logManager: ILogManager,
    progressManager: IProgressManager
  ) {
    super('IoTManager', logManager, progressManager)
  }

  /**
   * 初期化処理
   */
  protected async onInitialize(): Promise<void> {
    await this.logManager.info(
      this.managerName,
      'Initializing IoT device discovery...'
    )

    await this.logManager.info(
      this.managerName,
      'IoT manager ready'
    )
  }

  /**
   * シャットダウン処理
   */
  protected async onShutdown(): Promise<void> {
    await this.logManager.info(
      this.managerName,
      `Disconnecting from ${this.devices.size} IoT devices`
    )
    this.devices.clear()
  }

  /**
   * デバイス検出
   */
  async discoverDevices(): Promise<IoTDevice[]> {
    this.checkInitialized()

    return await this.executeTaskWithProgress(
      'Discovering IoT devices...',
      async (updateProgress) => {
        const devices: IoTDevice[] = [
          {
            id: 'iot1',
            name: 'Living Room Light',
            deviceType: 'light',
            manufacturer: 'Philips Hue',
            status: 'connected',
            powerState: 'on',
            lastUpdate: new Date().toISOString(),
            properties: { brightness: 80, color: '#FFFFFF' },
          },
          {
            id: 'iot2',
            name: 'Bedroom Thermostat',
            deviceType: 'thermostat',
            manufacturer: 'Nest',
            status: 'connected',
            powerState: 'on',
            lastUpdate: new Date().toISOString(),
            properties: { temperature: 72, humidity: 45 },
          },
        ]

        for (let i = 0; i < devices.length; i++) {
          await updateProgress((i / devices.length) * 100)
          this.devices.set(devices[i].id, devices[i])
        }

        await updateProgress(100)

        await this.logManager.info(
          this.managerName,
          `Discovered ${devices.length} IoT devices`
        )

        return devices
      },
      8000
    )
  }

  /**
   * デバイス制御
   */
  async controlDevice(deviceId: string, command: string): Promise<void> {
    this.checkInitialized()

    await this.executeTask(`Control: ${deviceId}`, async () => {
      const device = this.devices.get(deviceId)
      if (!device) {
        throw new Error(`IoT device ${deviceId} not found`)
      }

      // コマンド実行シミュレーション
      if (command === 'power_on') {
        device.powerState = 'on'
      } else if (command === 'power_off') {
        device.powerState = 'off'
      }

      device.lastUpdate = new Date().toISOString()
      this.devices.set(deviceId, device)

      await this.logManager.info(
        this.managerName,
        `Sent command to ${device.name}: ${command}`
      )
    })
  }

  /**
   * デバイスステータス取得
   */
  async getDeviceStatus(deviceId: string): Promise<IoTDevice> {
    this.checkInitialized()

    return await this.executeTask(`Get Status: ${deviceId}`, async () => {
      const device = this.devices.get(deviceId)
      if (!device) {
        throw new Error(`IoT device ${deviceId} not found`)
      }

      return device
    })
  }

  /**
   * Dashboard カード取得
   */
  async getIoTCard(): Promise<DashboardCard> {
    this.checkInitialized()

    const devices = Array.from(this.devices.values())
    const connectedCount = devices.filter(d => d.status === 'connected').length
    const errorCount = devices.filter(d => d.status === 'error').length

    return {
      id: 'iot-devices',
      title: 'IoT Devices',
      manager: 'IoTManager',
      status: errorCount > 0 ? 'warn' : 'normal',
      content: [
        { label: 'Total Devices', value: devices.length },
        { label: 'Connected', value: connectedCount },
        { label: 'Errors', value: errorCount },
      ],
      actions: [
        {
          id: 'discover',
          label: 'Discover Devices',
          command: 'iot:discover',
        },
      ],
      priority: 6,
    }
  }
}
