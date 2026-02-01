// Backend/src-tauri/src/subsystems/network/network_manager.rs
// NetworkManager - ネットワーク管理
// Version: v4.0

use serde::{Deserialize, Serialize};

/// デバイス情報構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkDevice {
    pub ip: String,
    pub mac: String,
    pub hostname: String,
    pub online: bool,
    pub latency: u32,
}

/// ネットワーク統計構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkStats {
    pub devices_online: u32,
    pub devices_offline: u32,
    pub average_latency: u32,
    pub network_status: String,
}

/// NetworkManager 構造体
pub struct NetworkManager {
    #[allow(dead_code)]
    name: String,
    devices: Vec<NetworkDevice>,
    stats: NetworkStats,
}

impl NetworkManager {
    /// 新規作成
    pub fn new() -> Self {
        Self {
            name: "NetworkManager".to_string(),
            devices: Vec::new(),
            stats: NetworkStats {
                devices_online: 0,
                devices_offline: 0,
                average_latency: 0,
                network_status: "normal".to_string(),
            },
        }
    }

    /// ネットワークをスキャン
    pub async fn scan_network(&mut self, subnet: &str) -> Result<Vec<NetworkDevice>, String> {
        // シミュレーション: ネットワークデバイスを検出
        let mut devices = vec![
            NetworkDevice {
                ip: "192.168.1.1".to_string(),
                mac: "00:1A:2B:3C:4D:5E".to_string(),
                hostname: "gateway".to_string(),
                online: true,
                latency: 1,
            },
            NetworkDevice {
                ip: "192.168.1.100".to_string(),
                mac: "00:1A:2B:3C:4D:5F".to_string(),
                hostname: "desktop".to_string(),
                online: true,
                latency: 5,
            },
            NetworkDevice {
                ip: "192.168.1.101".to_string(),
                mac: "00:1A:2B:3C:4D:60".to_string(),
                hostname: "laptop".to_string(),
                online: false,
                latency: 0,
            },
        ];

        // フィルタリング (subnet に基づいて)
        if !subnet.is_empty() {
            devices.retain(|d| d.ip.starts_with(subnet.split('/').next().unwrap_or("")));
        }

        self.devices = devices.clone();
        self.update_stats();

        Ok(devices)
    }

    /// デバイスに ping を送信
    pub async fn ping_device(&self, ip: &str) -> Result<u32, String> {
        // シミュレーション: ping レイテンシーを返す
        let latency = match ip {
            "192.168.1.1" => 1,
            "8.8.8.8" => 15,
            "1.1.1.1" => 12,
            _ => 10,
        };

        Ok(latency)
    }

    /// ネットワーク統計を取得
    pub async fn get_network_stats(&self) -> Result<NetworkStats, String> {
        Ok(self.stats.clone())
    }

    /// 統計を更新
    fn update_stats(&mut self) {
        let mut online_count = 0;
        let mut offline_count = 0;
        let mut total_latency = 0u32;

        for device in &self.devices {
            if device.online {
                online_count += 1;
                total_latency += device.latency as u32;
            } else {
                offline_count += 1;
            }
        }

        let avg_latency = if online_count > 0 {
            total_latency / online_count
        } else {
            0
        };

        let status = if online_count >= 3 {
            "normal"
        } else if online_count >= 1 {
            "warning"
        } else {
            "critical"
        };

        self.stats.devices_online = online_count;
        self.stats.devices_offline = offline_count;
        self.stats.average_latency = avg_latency;
        self.stats.network_status = status.to_string();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_network_manager() {
        let manager = NetworkManager::new();
        assert_eq!(manager.name, "NetworkManager");
        assert_eq!(manager.devices.len(), 0);
        assert_eq!(manager.stats.devices_online, 0);
        assert_eq!(manager.stats.devices_offline, 0);
    }

    #[test]
    fn test_network_device_structure() {
        let device = NetworkDevice {
            ip: "192.168.1.1".to_string(),
            mac: "00:1A:2B:3C:4D:5E".to_string(),
            hostname: "gateway".to_string(),
            online: true,
            latency: 5,
        };

        assert_eq!(device.ip, "192.168.1.1");
        assert_eq!(device.mac, "00:1A:2B:3C:4D:5E");
        assert_eq!(device.hostname, "gateway");
        assert_eq!(device.online, true);
        assert_eq!(device.latency, 5);
    }

    #[tokio::test]
    async fn test_scan_network_success() {
        let mut manager = NetworkManager::new();
        let devices = manager.scan_network("192.168.1").await.unwrap();
        
        assert!(devices.len() > 0);
        assert!(devices.iter().any(|d| d.ip == "192.168.1.1"));
        assert_eq!(manager.devices.len(), devices.len());
    }

    #[tokio::test]
    async fn test_scan_network_updates_stats() {
        let mut manager = NetworkManager::new();
        manager.scan_network("192.168.1").await.unwrap();
        
        assert!(manager.stats.devices_online > 0);
        assert!(manager.stats.devices_offline >= 0);
    }

    #[tokio::test]
    async fn test_scan_network_empty_subnet() {
        let mut manager = NetworkManager::new();
        let devices = manager.scan_network("").await.unwrap();
        
        // 空のサブネットでもすべてのデバイスが返される
        assert!(devices.len() > 0);
    }

    #[tokio::test]
    async fn test_scan_network_no_match() {
        let mut manager = NetworkManager::new();
        let devices = manager.scan_network("10.0.0").await.unwrap();
        
        // 192.168.x.x ではなく 10.0.0.x を検索するので空になる
        assert_eq!(devices.len(), 0);
    }

    #[tokio::test]
    async fn test_ping_device_gateway() {
        let manager = NetworkManager::new();
        let latency = manager.ping_device("192.168.1.1").await.unwrap();
        
        assert_eq!(latency, 1);
    }

    #[tokio::test]
    async fn test_ping_device_google_dns() {
        let manager = NetworkManager::new();
        let latency = manager.ping_device("8.8.8.8").await.unwrap();
        
        assert_eq!(latency, 15);
    }

    #[tokio::test]
    async fn test_ping_device_cloudflare_dns() {
        let manager = NetworkManager::new();
        let latency = manager.ping_device("1.1.1.1").await.unwrap();
        
        assert_eq!(latency, 12);
    }

    #[tokio::test]
    async fn test_ping_device_unknown() {
        let manager = NetworkManager::new();
        let latency = manager.ping_device("192.168.1.200").await.unwrap();
        
        // デフォルト値
        assert_eq!(latency, 10);
    }

    #[tokio::test]
    async fn test_get_network_stats_after_scan() {
        let mut manager = NetworkManager::new();
        manager.scan_network("192.168.1").await.unwrap();
        
        let stats = manager.get_network_stats().await.unwrap();
        assert!(stats.devices_online > 0);
        // 2 devices online, 1 offline -> status is "warning" (< 3 online)
        assert_eq!(stats.network_status, "warning");
    }

    #[test]
    fn test_network_stats_structure() {
        let stats = NetworkStats {
            devices_online: 3,
            devices_offline: 1,
            average_latency: 5,
            network_status: "normal".to_string(),
        };

        assert_eq!(stats.devices_online, 3);
        assert_eq!(stats.devices_offline, 1);
        assert_eq!(stats.average_latency, 5);
        assert_eq!(stats.network_status, "normal");
    }

    #[test]
    fn test_network_stats_warning_status() {
        // 1-2 のデバイスがオンラインの場合は警告
        let stats = NetworkStats {
            devices_online: 1,
            devices_offline: 2,
            average_latency: 10,
            network_status: "warning".to_string(),
        };

        assert_eq!(stats.network_status, "warning");
    }

    #[test]
    fn test_network_stats_critical_status() {
        // デバイスがすべてオフラインの場合は重大
        let stats = NetworkStats {
            devices_online: 0,
            devices_offline: 3,
            average_latency: 0,
            network_status: "critical".to_string(),
        };

        assert_eq!(stats.network_status, "critical");
    }
}
