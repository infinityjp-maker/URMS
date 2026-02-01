// Backend/src-tauri/src/subsystems/schedule/commands.rs
// Tauri commands for ScheduleManager

use std::sync::LazyLock;
use tokio::sync::Mutex;

use super::{Schedule, ScheduleManager};

static SCHEDULE_MANAGER: LazyLock<Mutex<ScheduleManager>> =
    LazyLock::new(|| Mutex::new(ScheduleManager::new()));

#[tauri::command]
pub async fn schedule_manager_create_schedule(
    manager_id: String,
    title: String,
    due_date: u64,
    recurrence: String,
    priority: String,
) -> Result<Schedule, String> {
    let mut manager = SCHEDULE_MANAGER.lock().await;
    manager
        .create_schedule(&manager_id, &title, due_date, &recurrence, &priority)
        .await
}

#[tauri::command]
pub async fn schedule_manager_update_schedule(
    id: String,
    title: Option<String>,
    priority: Option<String>,
) -> Result<Schedule, String> {
    let mut manager = SCHEDULE_MANAGER.lock().await;
    manager
        .update_schedule(id.as_str(), title.as_deref(), priority.as_deref())
        .await
}

#[tauri::command]
pub async fn schedule_manager_delete_schedule(id: String) -> Result<bool, String> {
    let mut manager = SCHEDULE_MANAGER.lock().await;
    manager.delete_schedule(&id).await
}

#[tauri::command]
pub async fn schedule_manager_get_upcoming_schedules(days: u32) -> Result<Vec<Schedule>, String> {
    let manager = SCHEDULE_MANAGER.lock().await;
    manager.get_upcoming_schedules(days).await
}
