/**
 * NetworkManager.ts
 * URMS v4.0 - Network Manager
 * 
 * LAN/Ping/デバイス検出ネットワーク管理
 * BaseManager を継承した Subsystem Manager
 * 
 * Version: v4.0
 */

import { BaseManager, type ILogManager, type IProgressManager } from '@core/base/BaseManager'
import type { DashboardCard } from '@core/types/ManagerTypes'

/**
 * ネットワークデバイス情報
 */
export interface NetworkDevice {
  id: string
  hostname: string
  ipAddress: string
  macAddress: string
  isOnline: boolean
  lastSeen: string
  deviceType: 'computer' | 'printer' | 'phone' | 'other'
  latency: number // ms
}

/**
 * ネットワーク統計
 */
export interface NetworkStats {
  devicesOnline: number
  devicesOffline: number
  totalDevices: number
  averageLatency: number
  networkStatus: 'normal' | 'warning' | 'critical'
}

/**
 * Network Manager インターフェース
 */
export interface INetworkManager {
  scanNetwork(): Promise<NetworkDevice[]>
  pingDevice(ipAddress: string): Promise<number>
  getNetworkStats(): Promise<NetworkStats>
  getNetworkCard(): Promise<DashboardCard>
}

/**
 * Network Manager 実装
 * 
 * 責務:
 * - LAN スキャン・デバイス検出
 * - Ping 診断
 * - ネットワークステータス監視
 * - Dashboard との連携
 */
export class NetworkManager extends BaseManager implements INetworkManager {
  private devices: Map<string, NetworkDevice> = new Map()
  private stats: NetworkStats = {
    devicesOnline: 0,
    devicesOffline: 0,
    totalDevices: 0,
    averageLatency: 0,
    networkStatus: 'normal',
  }

  constructor(
    logManager: ILogManager,
    progressManager: IProgressManager
  ) {
    super('NetworkManager', logManager, progressManager)
  }

  /**
   * 初期化処理
   */
  protected async onInitialize(): Promise<void> {
    await this.logManager.info(
      this.managerName,
      'Initializing network scanner...'
    )

    await this.logManager.info(
      this.managerName,
      'Network manager ready'
    )
  }

  /**
   * シャットダウン処理
   */
  protected async onShutdown(): Promise<void> {
    await this.logManager.info(
      this.managerName,
      'Stopping network monitoring'
    )
    this.devices.clear()
  }

  /**
   * ネットワークスキャン
   */
  async scanNetwork(): Promise<NetworkDevice[]> {
    this.checkInitialized()

    return await this.executeTaskWithProgress(
      'Scanning network...',
      async (updateProgress) => {
        const devices: NetworkDevice[] = [
          {
            id: 'device1',
            hostname: 'router.local',
            ipAddress: '192.168.1.1',
            macAddress: '00:11:22:33:44:55',
            isOnline: true,
            lastSeen: new Date().toISOString(),
            deviceType: 'other',
            latency: 5,
          },
          {
            id: 'device2',
            hostname: 'printer.local',
            ipAddress: '192.168.1.100',
            macAddress: 'AA:BB:CC:DD:EE:FF',
            isOnline: true,
            lastSeen: new Date().toISOString(),
            deviceType: 'printer',
            latency: 15,
          },
        ]

        for (let i = 0; i < devices.length; i++) {
          await updateProgress((i / devices.length) * 100)
          this.devices.set(devices[i].id, devices[i])
        }

        await updateProgress(100)
        await this.updateNetworkStats()

        await this.logManager.info(
          this.managerName,
          `Network scan complete: ${devices.length} devices found`
        )

        return devices
      },
      10000
    )
  }

  /**
   * Ping 診断
   */
  async pingDevice(ipAddress: string): Promise<number> {
    this.checkInitialized()

    return await this.executeTask(`Ping: ${ipAddress}`, async () => {
      // シミュレーション実装
      const latency = Math.random() * 50 + 10

      await this.logManager.info(
        this.managerName,
        `Ping ${ipAddress}: ${latency.toFixed(1)}ms`
      )

      return Math.round(latency)
    })
  }

  /**
   * ネットワーク統計取得
   */
  async getNetworkStats(): Promise<NetworkStats> {
    this.checkInitialized()

    return await this.executeTask('Get Network Stats', async () => {
      await this.updateNetworkStats()
      return this.stats
    })
  }

  /**
   * Dashboard カード取得
   */
  async getNetworkCard(): Promise<DashboardCard> {
    this.checkInitialized()

    const stats = await this.getNetworkStats()

    return {
      id: 'network-manager-card',
      title: 'Network Manager',
      manager: 'NetworkManager',
      managerId: 'NetworkManager',
      status: 'normal',
      content: [
        { label: 'Devices Online', value: stats.devicesOnline },
        { label: 'Devices Offline', value: stats.devicesOffline },
        { label: 'Avg Latency', value: `${stats.averageLatency.toFixed(1)}ms` },
        { label: 'Network Status', value: stats.networkStatus.toUpperCase() },
      ],
      actions: [
        {
          id: 'scan-network',
          label: 'Scan Now',
          command: 'network:scan',
        },
      ],
      priority: 6,
    }
  }

  /**
   * プライベート: ネットワーク統計更新
   */
  private async updateNetworkStats(): Promise<void> {
    const devices = Array.from(this.devices.values())
    const onlineDevices = devices.filter(d => d.isOnline)
    const totalLatency = onlineDevices.reduce((sum, d) => sum + d.latency, 0)

    const avg = onlineDevices.length > 0 ? totalLatency / onlineDevices.length : 0

    let status: NetworkStats['networkStatus'] = 'normal'
    if (onlineDevices.length === 0) {
      status = 'critical'
    } else if (avg > 200) {
      status = 'critical'
    } else if (avg > 100) {
      status = 'warning'
    } else {
      status = 'normal'
    }

    this.stats = {
      devicesOnline: onlineDevices.length,
      devicesOffline: devices.length - onlineDevices.length,
      totalDevices: devices.length,
      averageLatency: avg,
      networkStatus: status,
    }
  }
}
