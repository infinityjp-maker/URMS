use serde_json::Value;

pub async fn fetch_weather(lat: f64, lon: f64) -> Result<Value, String> {
    let url = format!(
        "https://api.open-meteo.com/v1/forecast?latitude={}&longitude={}&current_weather=true&hourly=temperature_2m,weathercode",
        lat, lon
    );

    let client = reqwest::Client::new();
    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("failed to fetch weather: {}", e))?;

    let json = resp
        .json::<Value>()
        .await
        .map_err(|e| format!("failed to parse weather json: {}", e))?;

    Ok(json)
}
