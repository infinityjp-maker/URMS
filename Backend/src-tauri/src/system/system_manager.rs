/**
 * system_manager.rs
 * URMS System Manager (Rust)
 * 
 * CPU/RAM/Disk/Network リソース監視
 * 
 * Version: v4.0
 */

use log::info;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::base::base_manager::{BaseManager, ManagerResult, ManagerError, ManagerState};

/// システムリソース情報
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemResource {
    pub name: String,
    pub resource_type: String, // "cpu", "memory", "disk", "network"
    pub usage: f64,
    pub total: Option<String>,
    pub available: Option<String>,
    pub threshold: f64,
    pub status: String, // "normal", "warning", "critical"
    pub timestamp: u64,
}

/// システムステータス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemStatus {
    pub cpu: SystemResource,
    pub memory: SystemResource,
    pub disk: SystemResource,
    pub network: SystemResource,
    pub last_update: u64,
}

/// System Manager 実装
pub struct SystemManager {
    state: ManagerState,
    thresholds: ThresholdConfig,
}

/// 閾値設定
#[derive(Debug, Clone)]
struct ThresholdConfig {
    cpu: f64,
    memory: f64,
    disk: f64,
    network: f64,
}

impl SystemManager {
    /// 新規インスタンス作成
    pub fn new() -> Self {
        SystemManager {
            state: ManagerState::Uninitialized,
            thresholds: ThresholdConfig {
                cpu: 80.0,
                memory: 85.0,
                disk: 90.0,
                network: 1000.0,
            },
        }
    }

    /// システムステータス取得
    pub fn get_system_status(&self) -> ManagerResult<SystemStatus> {
        info!("[SystemManager] Fetching system status...");

        if self.state != ManagerState::Ready {
            return Err(ManagerError::new(
                "SystemManager",
                "get_system_status",
                "Manager not initialized",
                "NotInitialized",
            ));
        }

        // 実装例：システム情報の取得
        // 実際の実装では sysinfo クレートなどを使用
        let cpu = self.get_cpu_info()?;
        let memory = self.get_memory_info()?;
        let disk = self.get_disk_info()?;
        let network = self.get_network_info()?;

        Ok(SystemStatus {
            cpu,
            memory,
            disk,
            network,
            last_update: self.get_timestamp(),
        })
    }

    /// 閾値設定
    pub fn set_threshold(&mut self, resource_type: &str, value: f64) -> ManagerResult<()> {
        match resource_type {
            "cpu" => self.thresholds.cpu = value,
            "memory" => self.thresholds.memory = value,
            "disk" => self.thresholds.disk = value,
            "network" => self.thresholds.network = value,
            _ => {
                return Err(ManagerError::new(
                    "SystemManager",
                    "set_threshold",
                    &format!("Invalid resource type: {}", resource_type),
                    "InvalidParameter",
                ))
            }
        }

        info!(
            "[SystemManager] Threshold updated: {} = {}",
            resource_type, value
        );
        Ok(())
    }

    // プライベートメソッド

    /// CPU 情報取得
    fn get_cpu_info(&self) -> ManagerResult<SystemResource> {
        // シミュレーション実装
        Ok(SystemResource {
            name: "CPU".to_string(),
            resource_type: "cpu".to_string(),
            usage: 45.3,
            total: Some("8 cores".to_string()),
            available: None,
            threshold: self.thresholds.cpu,
            status: self.get_status(45.3, self.thresholds.cpu),
            timestamp: self.get_timestamp(),
        })
    }

    /// メモリ情報取得
    fn get_memory_info(&self) -> ManagerResult<SystemResource> {
        // シミュレーション実装
        Ok(SystemResource {
            name: "Memory".to_string(),
            resource_type: "memory".to_string(),
            usage: 62.1,
            total: Some("16 GB".to_string()),
            available: Some("6 GB".to_string()),
            threshold: self.thresholds.memory,
            status: self.get_status(62.1, self.thresholds.memory),
            timestamp: self.get_timestamp(),
        })
    }

    /// ディスク情報取得
    fn get_disk_info(&self) -> ManagerResult<SystemResource> {
        // シミュレーション実装
        Ok(SystemResource {
            name: "Disk".to_string(),
            resource_type: "disk".to_string(),
            usage: 71.5,
            total: Some("1 TB".to_string()),
            available: Some("280 GB".to_string()),
            threshold: self.thresholds.disk,
            status: self.get_status(71.5, self.thresholds.disk),
            timestamp: self.get_timestamp(),
        })
    }

    /// ネットワーク情報取得
    fn get_network_info(&self) -> ManagerResult<SystemResource> {
        // シミュレーション実装
        Ok(SystemResource {
            name: "Network".to_string(),
            resource_type: "network".to_string(),
            usage: 150.0,
            total: Some("1000 Mbps".to_string()),
            available: None,
            threshold: self.thresholds.network,
            status: self.get_status(150.0, self.thresholds.network),
            timestamp: self.get_timestamp(),
        })
    }

    /// ステータス判定
    fn get_status(&self, usage: f64, threshold: f64) -> String {
        if usage > threshold + 10.0 {
            "critical".to_string()
        } else if usage > threshold {
            "warning".to_string()
        } else {
            "normal".to_string()
        }
    }

    /// タイムスタンプ取得
    fn get_timestamp(&self) -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0)
    }
}

/// BaseManager トレイト実装
impl BaseManager for SystemManager {
    fn name(&self) -> &str {
        "SystemManager"
    }

    async fn initialize(&mut self) -> ManagerResult<()> {
        info!("[SystemManager] Initializing...");
        self.state = ManagerState::Initializing;

        // システムリソースの初期チェック
        let _status = self.get_system_status()?;

        self.state = ManagerState::Ready;
        info!("[SystemManager] Initialized successfully");
        Ok(())
    }

    async fn shutdown(&mut self) -> ManagerResult<()> {
        info!("[SystemManager] Shutting down...");
        self.state = ManagerState::Shutdown;
        Ok(())
    }

    async fn health_check(&self) -> ManagerResult<()> {
        if self.state != ManagerState::Ready {
            return Err(ManagerError::new(
                "SystemManager",
                "health_check",
                "Manager not in Ready state",
                "NotReady",
            ));
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_system_manager_creation() {
        let manager = SystemManager::new();
        assert_eq!(manager.state, ManagerState::Uninitialized);
    }

    #[test]
    fn test_threshold_configuration() {
        let mut manager = SystemManager::new();
        let result = manager.set_threshold("cpu", 75.0);
        assert!(result.is_ok());
        assert_eq!(manager.thresholds.cpu, 75.0);
    }

    #[test]
    fn test_invalid_threshold_type() {
        let mut manager = SystemManager::new();
        let result = manager.set_threshold("invalid", 50.0);
        assert!(result.is_err());
    }

    #[test]
    fn test_status_determination() {
        let manager = SystemManager::new();
        assert_eq!(manager.get_status(50.0, 80.0), "normal");
        assert_eq!(manager.get_status(85.0, 80.0), "warning");
        assert_eq!(manager.get_status(91.0, 80.0), "critical");
    }
}
