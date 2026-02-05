use serde_json::Value;
use crate::subsystems::calendar::manager;
use crate::subsystems::calendar::auth_adapter;

#[tauri::command]
pub async fn calendar_sync_with_google(api_key: String, calendar_id: String, max_results: Option<u32>) -> Result<Vec<Value>, String> {
    let max = max_results.unwrap_or(5);
    let inst = manager::instance();
    let mut guard = inst.lock().await;
    match guard.sync_with_google(&api_key, &calendar_id, max).await {
        Ok(events) => Ok(events),
        Err(e) => Err(e),
    }
}

#[tauri::command]
pub async fn calendar_get_events(max_results: Option<u32>) -> Result<Vec<Value>, String> {
    let max = max_results.unwrap_or(5) as usize;
    let inst = manager::instance();
    let guard = inst.lock().await;
    Ok(guard.get_events(max))
}

#[tauri::command]
pub async fn calendar_start_oauth(client_id: String, client_secret: String) -> Result<Value, String> {
    auth_adapter::start_oauth_flow(client_id, client_secret).await
}

#[tauri::command]
pub fn calendar_get_oauth_tokens() -> Result<Value, String> {
    auth_adapter::get_oauth_tokens()
}

#[tauri::command]
pub async fn calendar_sync_with_oauth(calendar_id: String, max_results: Option<u32>) -> Result<Vec<Value>, String> {
    auth_adapter::sync_with_oauth(calendar_id, max_results).await
}

#[tauri::command]
pub fn calendar_disconnect_oauth() -> Result<Value, String> {
    auth_adapter::disconnect_oauth()
}
