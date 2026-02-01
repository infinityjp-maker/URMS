// Backend/src-tauri/src/subsystems/network/commands.rs
// Tauri commands for NetworkManager

use std::sync::LazyLock;
use tokio::sync::Mutex;

use super::{NetworkDevice, NetworkManager, NetworkStats};

static NETWORK_MANAGER: LazyLock<Mutex<NetworkManager>> = LazyLock::new(|| Mutex::new(NetworkManager::new()));

#[tauri::command]
pub async fn network_manager_scan_network(subnet: String) -> Result<Vec<NetworkDevice>, String> {
    let mut manager = NETWORK_MANAGER.lock().await;
    manager.scan_network(&subnet).await
}

#[tauri::command]
pub async fn network_manager_ping_device(ip: String) -> Result<u32, String> {
    let manager = NETWORK_MANAGER.lock().await;
    manager.ping_device(&ip).await
}

#[tauri::command]
pub async fn network_manager_get_network_stats(
    subnet: Option<String>,
) -> Result<NetworkStats, String> {
    let mut manager = NETWORK_MANAGER.lock().await;
    if let Some(subnet) = subnet {
        let _ = manager.scan_network(&subnet).await?;
    }
    manager.get_network_stats().await
}
