use serde_json::Value;
use crate::subsystems::calendar::manager;
use keyring::Entry;
use oauth2::basic::BasicClient;
use oauth2::{AuthUrl, ClientId, ClientSecret, TokenUrl, RedirectUrl, AuthorizationCode, Scope};
use oauth2::reqwest::async_http_client;
use serde_json::json;
use std::net::TcpListener;
use std::time::Duration;
use oauth2::url::Url;
use std::io::{Read, Write};
use oauth2::RefreshToken;
use oauth2::TokenResponse;
use reqwest::StatusCode;

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
    // Start a loopback listener on an ephemeral port
    let listener = TcpListener::bind(("127.0.0.1", 0)).map_err(|e| format!("failed to bind loopback: {}", e))?;
    let local_port = listener.local_addr().map_err(|e| format!("addr: {}", e))?.port();

    let auth_url = AuthUrl::new("https://accounts.google.com/o/oauth2/v2/auth".to_string()).map_err(|e| format!("auth url: {}", e))?;
    let token_url = TokenUrl::new("https://oauth2.googleapis.com/token".to_string()).map_err(|e| format!("token url: {}", e))?;

    let redirect = format!("http://127.0.0.1:{}/callback", local_port);

    let client = BasicClient::new(
        ClientId::new(client_id.clone()),
        Some(ClientSecret::new(client_secret.clone())),
        auth_url,
        Some(token_url),
    )
    .set_redirect_uri(RedirectUrl::new(redirect.clone()).map_err(|e| format!("redirect url: {}", e))?);

    let (pkce_challenge, _pkce_verifier) = oauth2::PkceCodeChallenge::new_random_sha256();

    let (auth_url, _csrf_token) = client
        .authorize_url(|| oauth2::CsrfToken::new_random())
        .add_scope(Scope::new("https://www.googleapis.com/auth/calendar.events.readonly".to_string()))
        .set_pkce_challenge(pkce_challenge)
        .url();

    // open system browser
    let _ = webbrowser::open(auth_url.as_str());

    // wait for single connection with code parameter
    listener.set_nonblocking(false).map_err(|e| format!("set nonblocking: {}", e))?;
    // set a timeout of 2 minutes
    listener
        .set_nonblocking(false)
        .map_err(|e| format!("set nonblocking2: {}", e))?;

    let start = std::time::Instant::now();
    let code_opt = loop {
        if start.elapsed() > Duration::from_secs(120) {
            break None;
        }
        if let Ok((mut stream, _addr)) = listener.accept() {
            use std::io::Read;
            let mut buf = [0u8; 4096];
            if let Ok(n) = stream.read(&mut buf) {
                let req = String::from_utf8_lossy(&buf[..n]).to_string();
                if let Some(line) = req.split_whitespace().nth(1) {
                    if let Ok(url) = Url::parse(&format!("http://localhost{}", line)) {
                        let code_opt = url.query_pairs().find_map(|(k, v)| if k == "code" { Some(v.into_owned()) } else { None });
                        if let Some(code) = code_opt {
                            // respond minimal HTML
                            let resp = "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: 38\r\n\r\n<html><body>OK. You can close this window.</body></html>";
                            let _ = stream.write_all(resp.as_bytes());
                            break Some(code);
                        }
                    }
                }
            }
        }
        std::thread::sleep(Duration::from_millis(200));
    };

    let code = match code_opt {
        Some(c) => c,
        None => return Err("timeout waiting for OAuth callback".to_string()),
    };

    // exchange code for token
    let token_result = client
        .exchange_code(AuthorizationCode::new(code))
        .set_pkce_verifier(_pkce_verifier)
        .request_async(async_http_client)
        .await
        .map_err(|e| format!("token exchange failed: {}", e))?;

    // serialize token to JSON and store in keyring
    let tok_json = serde_json::to_string(&token_result).map_err(|e| format!("serialize token: {}", e))?;
    let kr = Entry::new("URMS", "google_oauth_token");
    kr.set_password(&tok_json).map_err(|e| format!("store token failed: {}", e))?;
    // also store client_id and client_secret for refresh use
    let kr_id = Entry::new("URMS", "google_oauth_client_id");
    let kr_secret = Entry::new("URMS", "google_oauth_client_secret");
    let _ = kr_id.set_password(&client_id).map_err(|e| format!("store client_id failed: {}", e))?;
    let _ = kr_secret.set_password(&client_secret).map_err(|e| format!("store client_secret failed: {}", e))?;

    Ok(json!({"status":"ok"}))
}

#[tauri::command]
pub fn calendar_get_oauth_tokens() -> Result<Value, String> {
    let kr = Entry::new("URMS", "google_oauth_token");
    match kr.get_password() {
        Ok(s) => match serde_json::from_str::<Value>(&s) {
            Ok(v) => Ok(v),
            Err(e) => Err(format!("parse token json: {}", e)),
        },
        Err(_) => Ok(json!({})),
    }
}

#[tauri::command]
pub async fn calendar_sync_with_oauth(calendar_id: String, max_results: Option<u32>) -> Result<Vec<Value>, String> {
    let max = max_results.unwrap_or(5) as usize;

    // load token from keyring
    let kr = Entry::new("URMS", "google_oauth_token");
    let token_json = kr.get_password().map_err(|e| format!("no token stored: {}", e))?;
    let mut tok_val: Value = serde_json::from_str(&token_json).map_err(|e| format!("parse token json: {}", e))?;

    let client = reqwest::Client::new();
    let url = format!("https://www.googleapis.com/calendar/v3/calendars/{}/events", urlencoding::encode(&calendar_id));

    // first attempt with stored access token
    if let Some(at) = tok_val.get("access_token").and_then(|v| v.as_str()) {
        let resp = client
            .get(&url)
            .bearer_auth(at)
            .query(&[("maxResults", max.to_string())])
            .send()
            .await
            .map_err(|e| format!("request failed: {}", e))?;
        if resp.status() != StatusCode::UNAUTHORIZED {
            let body: Value = resp.json().await.map_err(|e| format!("invalid json: {}", e))?;
            if let Some(items) = body.get("items").and_then(|v| v.as_array()) {
                return Ok(items.clone());
            }
            return Ok(vec![]);
        }
    }

    // if we reach here, either no access token or got 401 -> try refresh
    let refresh = tok_val.get("refresh_token").and_then(|v| v.as_str()).ok_or("no refresh token available")?;
    // load client_id/secret from keyring
    let kr_id = Entry::new("URMS", "google_oauth_client_id");
    let kr_secret = Entry::new("URMS", "google_oauth_client_secret");
    let client_id = kr_id.get_password().map_err(|e| format!("no client_id stored: {}", e))?;
    let client_secret = kr_secret.get_password().map_err(|e| format!("no client_secret stored: {}", e))?;

    let auth_url = AuthUrl::new("https://accounts.google.com/o/oauth2/v2/auth".to_string()).map_err(|e| format!("auth url: {}", e))?;
    let token_url = TokenUrl::new("https://oauth2.googleapis.com/token".to_string()).map_err(|e| format!("token url: {}", e))?;
    let oauth_client = BasicClient::new(
        ClientId::new(client_id.clone()),
        Some(ClientSecret::new(client_secret.clone())),
        auth_url,
        Some(token_url),
    );

    let new_token = oauth_client
        .exchange_refresh_token(&RefreshToken::new(refresh.to_string()))
        .request_async(async_http_client)
        .await
        .map_err(|e| format!("refresh failed: {}", e))?;

    // update stored token JSON
    let new_json = serde_json::to_string(&new_token).map_err(|e| format!("serialize new token: {}", e))?;
    let _ = kr.set_password(&new_json).map_err(|e| format!("store refreshed token failed: {}", e))?;

    // call API with refreshed token
    let at = new_token.access_token().secret();
    let resp = client
        .get(&url)
        .bearer_auth(at)
        .query(&[("maxResults", max.to_string())])
        .send()
        .await
        .map_err(|e| format!("request failed: {}", e))?;
    if resp.status().is_success() {
            let body: Value = resp.json::<Value>().await.map_err(|e| format!("invalid json: {}", e))?;
            if let Some(items) = body.get("items").and_then(|v| v.as_array()) {
                return Ok(items.clone());
            }
        return Ok(vec![]);
    }

    Err(format!("request failed with status: {}", resp.status()))
}
