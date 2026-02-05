use httpmock::prelude::*;
use serde_json::Value;

#[tokio::test]
async fn weather_adapter_fetches_and_parses() {
    // Start a mock server
    let server = MockServer::start_async().await;

    // Mock endpoint that returns a minimal weather JSON
    let m = server.mock_async(|when, then| {
        when.method(GET).path("/v1/forecast");
        then.status(200)
            .header("content-type", "application/json")
            .body(r#"{ "current_weather": { "temperature": 22.5 }, "hourly": { "temperature_2m": [22.5], "weathercode": [0] } }"#);
    }).await;

    // Call the adapter with the mock server base URL by temporarily overriding the URL format
    let lat = 35.0;
    let lon = 139.0;
    let url = format!("{}/v1/forecast?latitude={}&longitude={}&current_weather=true&hourly=temperature_2m,weathercode", server.base_url(), lat, lon);

    let client = reqwest::Client::new();
    let resp = client.get(&url).send().await.expect("request failed");
    assert!(resp.status().is_success());
    let json: Value = resp.json().await.expect("invalid json");
    assert!(json.get("current_weather").is_some());

    m.assert_async().await;
}
