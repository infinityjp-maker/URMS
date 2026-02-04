use serde_json::Value;

pub async fn fetch_google_events(api_key: &str, calendar_id: &str, max_results: u32) -> Result<Value, String> {
    let time_min = chrono::Utc::now().to_rfc3339();
    let encoded_cal = urlencoding::encode(calendar_id);
    let url = format!(
        "https://www.googleapis.com/calendar/v3/calendars/{}/events",
        encoded_cal
    );

    let params = [
        ("key", api_key),
        ("timeMin", time_min.as_str()),
        ("maxResults", &max_results.to_string()),
        ("singleEvents", "true"),
        ("orderBy", "startTime"),
    ];

    match reqwest::Client::new().get(&url).query(&params).send().await {
        Ok(resp) => match resp.json::<Value>().await {
            Ok(json) => Ok(json),
            Err(e) => Err(format!("failed to parse calendar json: {}", e)),
        },
        Err(e) => Err(format!("failed to fetch calendar events: {}", e)),
    }
}
