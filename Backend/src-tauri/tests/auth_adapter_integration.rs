use urms_lib::subsystems::calendar::auth_adapter;
use serde_json::json;

// Integration tests that exercise OS keyring. Marked ignored by default.
#[test]
#[ignore]
fn integration_test_get_and_disconnect_oauth() {
    let sample = json!({"access_token":"ya29.test","refresh_token":"1/refresh","expires_in":3600});
    let s = serde_json::to_string(&sample).expect("serialize");
    let kr = keyring::Entry::new("URMS", "google_oauth_token");
    kr.set_password(&s).expect("store token");

    let got = auth_adapter::get_oauth_tokens().expect("get tokens");
    assert!(got.get("access_token").is_some());

    let _ = auth_adapter::disconnect_oauth();
    let got2 = auth_adapter::get_oauth_tokens().expect("get tokens 2");
    assert!(got2.as_object().map(|m| m.is_empty()).unwrap_or(false));
}
