use serde_json::Value;
use crate::subsystems::weather::weather_adapter;

#[tauri::command]
pub async fn get_weather(lat: f64, lon: f64) -> Result<Value, String> {
    // Delegate external HTTP calls to the weather adapter to keep commands thin and testable.
    weather_adapter::fetch_weather(lat, lon).await
}
