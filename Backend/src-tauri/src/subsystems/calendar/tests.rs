#[cfg(test)]
mod tests {
    use super::super::auth_adapter;
    use serde_json::json;

    // These tests touch the OS keyring. They are marked ignored by default
    // to avoid running in CI unless explicitly requested.
    #[test]
    #[ignore]
    fn test_get_oauth_tokens_roundtrip() {
        // Prepare a fake token JSON and store it in the keyring
        let sample = json!({"access_token":"ya29.sample","refresh_token":"1/refresh","expires_in":3600});
        let s = serde_json::to_string(&sample).expect("serialize");
        let kr = keyring::Entry::new("URMS", "google_oauth_token");
        let _ = kr.set_password(&s).expect("store token");

        let got = auth_adapter::get_oauth_tokens().expect("get tokens");
        assert!(got.get("access_token").is_some());

        // cleanup
        let _ = auth_adapter::disconnect_oauth();
    }

    #[test]
    #[ignore]
    fn test_disconnect_oauth_removes_keys() {
        // Write a dummy token then disconnect
        let sample = json!({"access_token":"x"});
        let s = serde_json::to_string(&sample).expect("serialize");
        let kr = keyring::Entry::new("URMS", "google_oauth_token");
        let _ = kr.set_password(&s).expect("store token");

        let _ = auth_adapter::disconnect_oauth();

        // Now get_oauth_tokens should return empty object
        let got = auth_adapter::get_oauth_tokens().expect("get tokens");
        assert!(got.as_object().map(|m| m.is_empty()).unwrap_or(false));
    }
}
