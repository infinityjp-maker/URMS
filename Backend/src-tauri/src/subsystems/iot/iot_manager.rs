// Backend/src-tauri/src/subsystems/iot/iot_manager.rs
// IoTManager - IoT デバイス管理
// Version: v4.0

use serde::{Deserialize, Serialize};

/// IoT デバイス構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IoTDevice {
    pub id: String,
    pub name: String,
    pub device_type: String, // light, thermostat, sensor, switch, camera
    pub location: String,
    pub powered: bool,
    pub properties: std::collections::HashMap<String, String>,
}

/// デバイス制御結果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ControlResult {
    pub success: bool,
    pub message: String,
}

/// IoTManager 構造体
pub struct IoTManager {
    #[allow(dead_code)]
    name: String,
    devices: Vec<IoTDevice>,
}

impl IoTManager {
    /// 新規作成
    pub fn new() -> Self {
        Self {
            name: "IoTManager".to_string(),
            devices: Vec::new(),
        }
    }

    /// 初期化
    pub async fn initialize(&mut self) -> Result<(), String> {
        // デバイス初期化
        self.devices = vec![
            IoTDevice {
                id: "device_001".to_string(),
                name: "Living Room Light".to_string(),
                device_type: "light".to_string(),
                location: "Living Room".to_string(),
                powered: true,
                properties: std::collections::HashMap::new(),
            },
            IoTDevice {
                id: "device_002".to_string(),
                name: "Bedroom Thermostat".to_string(),
                device_type: "thermostat".to_string(),
                location: "Bedroom".to_string(),
                powered: true,
                properties: std::collections::HashMap::new(),
            },
            IoTDevice {
                id: "device_003".to_string(),
                name: "Front Door Camera".to_string(),
                device_type: "camera".to_string(),
                location: "Front Door".to_string(),
                powered: true,
                properties: std::collections::HashMap::new(),
            },
        ];

        Ok(())
    }

    /// IoT デバイスを検出
    pub async fn discover_devices(&self) -> Result<Vec<IoTDevice>, String> {
        Ok(self.devices.clone())
    }

    /// デバイスを制御
    pub async fn control_device(
        &mut self,
        device_id: &str,
        command: &str,
    ) -> Result<ControlResult, String> {
        let device = self
            .devices
            .iter_mut()
            .find(|d| d.id == device_id)
            .ok_or_else(|| format!("Device {} not found", device_id))?;

        match command {
            "power_on" => {
                device.powered = true;
                Ok(ControlResult {
                    success: true,
                    message: format!("Device {} powered on", device_id),
                })
            }
            "power_off" => {
                device.powered = false;
                Ok(ControlResult {
                    success: true,
                    message: format!("Device {} powered off", device_id),
                })
            }
            _ => Err(format!("Unknown command: {}", command)),
        }
    }

    /// デバイスのステータスを取得
    pub async fn get_device_status(&self, device_id: &str) -> Result<IoTDevice, String> {
        self.devices
            .iter()
            .find(|d| d.id == device_id)
            .cloned()
            .ok_or_else(|| format!("Device {} not found", device_id))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_iot_manager() {
        let manager = IoTManager::new();
        assert_eq!(manager.name, "IoTManager");
        assert_eq!(manager.devices.len(), 0);
    }

    #[test]
    fn test_iot_device_structure() {
        let device = IoTDevice {
            id: "device_001".to_string(),
            name: "Living Room Light".to_string(),
            device_type: "light".to_string(),
            location: "Living Room".to_string(),
            powered: true,
            properties: std::collections::HashMap::new(),
        };

        assert_eq!(device.id, "device_001");
        assert_eq!(device.name, "Living Room Light");
        assert_eq!(device.device_type, "light");
        assert_eq!(device.location, "Living Room");
        assert_eq!(device.powered, true);
    }

    #[tokio::test]
    async fn test_initialize_devices() {
        let mut manager = IoTManager::new();
        manager.initialize().await.unwrap();
        
        assert_eq!(manager.devices.len(), 3);
        assert_eq!(manager.devices[0].device_type, "light");
        assert_eq!(manager.devices[1].device_type, "thermostat");
        assert_eq!(manager.devices[2].device_type, "camera");
    }

    #[tokio::test]
    async fn test_discover_devices_after_init() {
        let mut manager = IoTManager::new();
        manager.initialize().await.unwrap();
        
        let devices = manager.discover_devices().await.unwrap();
        assert_eq!(devices.len(), 3);
        assert!(devices.iter().any(|d| d.id == "device_001"));
    }

    #[tokio::test]
    async fn test_discover_devices_empty() {
        let manager = IoTManager::new();
        let devices = manager.discover_devices().await.unwrap();
        
        assert_eq!(devices.len(), 0);
    }

    #[tokio::test]
    async fn test_control_device_power_on() {
        let mut manager = IoTManager::new();
        manager.initialize().await.unwrap();
        
        let result = manager.control_device("device_001", "power_on").await.unwrap();
        assert_eq!(result.success, true);
        assert!(result.message.contains("powered on"));
    }

    #[tokio::test]
    async fn test_control_device_power_off() {
        let mut manager = IoTManager::new();
        manager.initialize().await.unwrap();
        
        let result = manager.control_device("device_001", "power_off").await.unwrap();
        assert_eq!(result.success, true);
        assert!(result.message.contains("powered off"));
    }

    #[tokio::test]
    async fn test_control_device_invalid_command() {
        let mut manager = IoTManager::new();
        manager.initialize().await.unwrap();
        
        let result = manager.control_device("device_001", "invalid_command").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_control_device_nonexistent() {
        let mut manager = IoTManager::new();
        manager.initialize().await.unwrap();
        
        let result = manager.control_device("device_999", "power_on").await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[tokio::test]
    async fn test_get_device_status_success() {
        let mut manager = IoTManager::new();
        manager.initialize().await.unwrap();
        
        let device = manager.get_device_status("device_001").await.unwrap();
        assert_eq!(device.name, "Living Room Light");
        assert_eq!(device.device_type, "light");
    }

    #[tokio::test]
    async fn test_get_device_status_nonexistent() {
        let mut manager = IoTManager::new();
        manager.initialize().await.unwrap();
        
        let result = manager.get_device_status("device_999").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_control_then_check_status() {
        let mut manager = IoTManager::new();
        manager.initialize().await.unwrap();
        
        // デバイスをオフにする
        manager.control_device("device_001", "power_off").await.unwrap();
        
        // ステータスを確認
        let device = manager.get_device_status("device_001").await.unwrap();
        assert_eq!(device.powered, false);
        
        // デバイスをオンにする
        manager.control_device("device_001", "power_on").await.unwrap();
        
        // ステータスを再度確認
        let device = manager.get_device_status("device_001").await.unwrap();
        assert_eq!(device.powered, true);
    }

    #[test]
    fn test_control_result_structure() {
        let result = ControlResult {
            success: true,
            message: "Device powered on".to_string(),
        };

        assert_eq!(result.success, true);
        assert_eq!(result.message, "Device powered on");
    }

    #[tokio::test]
    async fn test_multiple_device_types() {
        let mut manager = IoTManager::new();
        manager.initialize().await.unwrap();
        
        let devices = manager.discover_devices().await.unwrap();
        let device_types: Vec<String> = devices.iter().map(|d| d.device_type.clone()).collect();
        
        assert!(device_types.contains(&"light".to_string()));
        assert!(device_types.contains(&"thermostat".to_string()));
        assert!(device_types.contains(&"camera".to_string()));
    }
}
