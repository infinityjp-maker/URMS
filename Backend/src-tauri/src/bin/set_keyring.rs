use keyring::Entry;
use serde_json::json;
use std::env;

fn set_tokens() -> Result<(), String> {
    let kr = Entry::new("URMS", "google_oauth_token");
    // sample token JSON (non-sensitive placeholder)
    let tok = json!({
        "access_token": "test_access_token",
        "refresh_token": "test_refresh_token",
        "scope": "https://www.googleapis.com/auth/calendar.events.readonly",
        "token_type": "Bearer",
        "expires_in": 3600
    });
    let s = serde_json::to_string(&tok).map_err(|e| format!("json err: {}", e))?;
    kr.set_password(&s).map_err(|e| format!("set token failed: {}", e))?;

    let kr_id = Entry::new("URMS", "google_oauth_client_id");
    let kr_secret = Entry::new("URMS", "google_oauth_client_secret");
    let _ = kr_id.set_password("test_client_id");
    let _ = kr_secret.set_password("test_client_secret");
    println!("set tokens in keyring");
    Ok(())
}

fn del_tokens() -> Result<(), String> {
    let kr = Entry::new("URMS", "google_oauth_token");
    let _ = kr.delete_password();
    let kr_id = Entry::new("URMS", "google_oauth_client_id");
    let _ = kr_id.delete_password();
    let kr_secret = Entry::new("URMS", "google_oauth_client_secret");
    let _ = kr_secret.delete_password();
    println!("deleted tokens from keyring");
    Ok(())
}

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: set_keyring <set|del>");
        std::process::exit(2);
    }
    let cmd = &args[1];
    let res = match cmd.as_str() {
        "set" => set_tokens(),
        "del" => del_tokens(),
        _ => Err("unknown command".to_string()),
    };
    if let Err(e) = res {
        eprintln!("error: {}", e);
        std::process::exit(1);
    }
}
