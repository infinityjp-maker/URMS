use serde_json::Value;

#[tauri::command]
pub async fn get_weather(lat: f64, lon: f64) -> Result<Value, String> {
    let url = format!("https://api.open-meteo.com/v1/forecast?latitude={}&longitude={}&current_weather=true&hourly=temperature_2m,weathercode", lat, lon);
    match reqwest::Client::new().get(&url).send().await {
        Ok(resp) => match resp.json::<Value>().await {
            Ok(json) => Ok(json),
            Err(e) => Err(format!("failed to parse weather json: {}", e)),
        },
        Err(e) => Err(format!("failed to fetch weather: {}", e)),
    }
}
