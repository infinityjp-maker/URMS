// Backend/src-tauri/src/subsystems/file/commands.rs
// Tauri commands for FileManager

use std::sync::LazyLock;
use tokio::sync::Mutex;

use super::{FileInfo, FileManager, StorageStats};

static FILE_MANAGER: LazyLock<Mutex<FileManager>> = LazyLock::new(|| Mutex::new(FileManager::new()));

#[tauri::command]
pub async fn file_manager_scan_directory(path: String) -> Result<Vec<FileInfo>, String> {
    let mut manager = FILE_MANAGER.lock().await;
    manager.scan_directory(&path).await
}

#[tauri::command]
pub async fn file_manager_classify_file(path: String) -> Result<String, String> {
    let manager = FILE_MANAGER.lock().await;
    Ok(manager.classify_file(std::ffi::OsStr::new(&path)))
}

#[tauri::command]
pub async fn file_manager_get_storage_stats() -> Result<StorageStats, String> {
    let manager = FILE_MANAGER.lock().await;
    manager.get_storage_stats().await
}
