// Backend/src-tauri/src/subsystems/iot/commands.rs
// Tauri commands for IoTManager

use std::sync::LazyLock;
use tokio::sync::Mutex;

use super::{ControlResult, IoTDevice, IoTManager};

static IOT_MANAGER: LazyLock<Mutex<IoTManager>> = LazyLock::new(|| Mutex::new(IoTManager::new()));

async fn ensure_initialized(manager: &mut IoTManager) -> Result<(), String> {
    if manager.discover_devices().await?.is_empty() {
        manager.initialize().await?;
    }
    Ok(())
}

#[tauri::command]
pub async fn iot_manager_initialize() -> Result<Vec<IoTDevice>, String> {
    let mut manager = IOT_MANAGER.lock().await;
    manager.initialize().await?;
    manager.discover_devices().await
}

#[tauri::command]
pub async fn iot_manager_discover_devices() -> Result<Vec<IoTDevice>, String> {
    let mut manager = IOT_MANAGER.lock().await;
    ensure_initialized(&mut manager).await?;
    manager.discover_devices().await
}

#[tauri::command]
pub async fn iot_manager_control_device(
    device_id: String,
    command: String,
) -> Result<ControlResult, String> {
    let mut manager = IOT_MANAGER.lock().await;
    ensure_initialized(&mut manager).await?;
    manager.control_device(&device_id, &command).await
}

#[tauri::command]
pub async fn iot_manager_get_device_status(device_id: String) -> Result<IoTDevice, String> {
    let mut manager = IOT_MANAGER.lock().await;
    ensure_initialized(&mut manager).await?;
    manager.get_device_status(&device_id).await
}
