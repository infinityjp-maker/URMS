// Backend/src-tauri/src/subsystems/asset/commands.rs
// Tauri commands for AssetManager

use std::sync::LazyLock;
use tokio::sync::Mutex;

use super::{Asset, AssetManager};
use crate::base::base_manager::ManagerError;

static ASSET_MANAGER: LazyLock<Mutex<AssetManager>> =
    LazyLock::new(|| Mutex::new(AssetManager::new()));

fn format_manager_error(err: ManagerError) -> String {
    format!(
        "{}::{} - {} ({})",
        err.manager, err.operation, err.message, err.error_type
    )
}

#[tauri::command]
pub async fn asset_manager_add_asset(asset: Asset) -> Result<(), String> {
    let mut manager = ASSET_MANAGER.lock().await;
    manager.add_asset(asset).map_err(format_manager_error)
}

#[tauri::command]
pub async fn asset_manager_get_asset(id: String) -> Result<Asset, String> {
    let manager = ASSET_MANAGER.lock().await;
    manager.get_asset(&id).map_err(format_manager_error)
}

#[tauri::command]
pub async fn asset_manager_get_all_assets() -> Result<Vec<Asset>, String> {
    let manager = ASSET_MANAGER.lock().await;
    Ok(manager.get_all_assets())
}

#[tauri::command]
pub async fn asset_manager_update_asset(id: String, asset: Asset) -> Result<(), String> {
    let mut manager = ASSET_MANAGER.lock().await;
    manager.update_asset(&id, asset).map_err(format_manager_error)
}

#[tauri::command]
pub async fn asset_manager_delete_asset(id: String) -> Result<(), String> {
    let mut manager = ASSET_MANAGER.lock().await;
    manager.delete_asset(&id).map_err(format_manager_error)
}

#[tauri::command]
pub async fn asset_manager_count_assets() -> Result<usize, String> {
    let manager = ASSET_MANAGER.lock().await;
    Ok(manager.count_assets())
}

#[tauri::command]
pub async fn asset_manager_count_by_status(status: String) -> Result<usize, String> {
    let manager = ASSET_MANAGER.lock().await;
    Ok(manager.count_by_status(&status))
}
