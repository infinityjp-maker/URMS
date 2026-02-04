use keyring::Entry;
use serde_json::json;
use serde_json::Value;
use std::fs::{self, OpenOptions};
use std::io::Write;

fn settings_path() -> std::path::PathBuf {
    let dir = std::path::Path::new("data");
    let _ = std::fs::create_dir_all(dir);
    dir.join("settings.json")
}

#[tauri::command]
pub fn settings_set_google_credentials(api_key: String, calendar_id: String) -> Result<(), String> {
    // store api_key into OS keychain via keyring
    let kr = Entry::new("URMS", "google_api_key");
    if let Err(e) = kr.set_password(&api_key) {
        return Err(format!("failed to store api_key in keyring: {}", e));
    }

    // persist non-secret calendar_id in settings file
    let p = settings_path();
    let mut settings = if p.exists() {
        match std::fs::read_to_string(&p) {
            Ok(s) => serde_json::from_str::<Value>(&s).unwrap_or(json!({})),
            Err(_) => json!({}),
        }
    } else {
        json!({})
    };

    settings["google_calendar_id"] = Value::String(calendar_id);

    let data = match serde_json::to_string_pretty(&settings) {
        Ok(s) => s,
        Err(e) => return Err(format!("failed to serialize settings: {}", e)),
    };

    match OpenOptions::new().create(true).write(true).truncate(true).open(&p) {
        Ok(mut f) => {
            if let Err(e) = f.write_all(data.as_bytes()) {
                return Err(format!("failed to write settings: {}", e));
            }
        }
        Err(e) => return Err(format!("failed to open settings file: {}", e)),
    }

    Ok(())
}

#[tauri::command]
pub fn settings_get_google_credentials() -> Result<Value, String> {
    let mut res = json!({});

    // attempt to read api_key from keyring; ignore if missing
    let kr = Entry::new("URMS", "google_api_key");
    match kr.get_password() {
        Ok(k) => {
            res["google_api_key"] = Value::String(k);
        }
        Err(_) => {
            // treat missing/failed retrieval as absent rather than fatal
        }
    }

    // read calendar_id from settings file if present
    let p = settings_path();
    if p.exists() {
        match std::fs::read_to_string(&p) {
            Ok(s) => match serde_json::from_str::<Value>(&s) {
                Ok(v) => {
                    if let Some(cal) = v.get("google_calendar_id") {
                        res["google_calendar_id"] = cal.clone();
                    }
                }
                Err(e) => return Err(format!("failed to parse settings: {}", e)),
            },
            Err(e) => return Err(format!("failed to read settings: {}", e)),
        }
    }

    Ok(res)
}

#[tauri::command]
pub fn settings_delete_google_credentials() -> Result<(), String> {
    // delete api_key from keyring (ignore not-found)
    let kr = Entry::new("URMS", "google_api_key");
    let _ = kr.delete_password();

    // remove google_calendar_id from settings.json
    let p = settings_path();
    if p.exists() {
        match std::fs::read_to_string(&p) {
            Ok(s) => match serde_json::from_str::<Value>(&s) {
                Ok(mut v) => {
                    v.as_object_mut().map(|m| m.remove("google_calendar_id"));
                    let data = match serde_json::to_string_pretty(&v) {
                        Ok(s2) => s2,
                        Err(e) => return Err(format!("failed to serialize settings: {}", e)),
                    };
                    match OpenOptions::new().create(true).write(true).truncate(true).open(&p) {
                        Ok(mut f) => {
                            if let Err(e) = f.write_all(data.as_bytes()) {
                                return Err(format!("failed to write settings: {}", e));
                            }
                        }
                        Err(e) => return Err(format!("failed to open settings file: {}", e)),
                    }
                }
                Err(e) => return Err(format!("failed to parse settings: {}", e)),
            },
            Err(e) => return Err(format!("failed to read settings: {}", e)),
        }
    }

    Ok(())
}

#[tauri::command]
pub fn settings_set_sync_interval(sync_minutes: u64) -> Result<(), String> {
    let p = settings_path();
    let mut settings = if p.exists() {
        match std::fs::read_to_string(&p) {
            Ok(s) => serde_json::from_str::<Value>(&s).unwrap_or(json!({})),
            Err(_) => json!({}),
        }
    } else {
        json!({})
    };

    settings["sync_interval_minutes"] = Value::Number(serde_json::Number::from(sync_minutes));

    let data = match serde_json::to_string_pretty(&settings) {
        Ok(s) => s,
        Err(e) => return Err(format!("failed to serialize settings: {}", e)),
    };

    match OpenOptions::new().create(true).write(true).truncate(true).open(&p) {
        Ok(mut f) => {
            if let Err(e) = f.write_all(data.as_bytes()) {
                return Err(format!("failed to write settings: {}", e));
            }
        }
        Err(e) => return Err(format!("failed to open settings file: {}", e)),
    }

    Ok(())
}

#[tauri::command]
pub fn settings_get_sync_interval() -> Result<Value, String> {
    let p = settings_path();
    if !p.exists() {
        return Ok(json!({}));
    }
    match std::fs::read_to_string(&p) {
        Ok(s) => match serde_json::from_str::<Value>(&s) {
            Ok(v) => {
                if let Some(n) = v.get("sync_interval_minutes") {
                    Ok(json!({ "sync_interval_minutes": n }))
                } else {
                    Ok(json!({}))
                }
            }
            Err(e) => Err(format!("failed to parse settings: {}", e)),
        },
        Err(e) => Err(format!("failed to read settings: {}", e)),
    }
}
