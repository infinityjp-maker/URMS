use std::env;
use urms_lib::subsystems::calendar::commands;
use serde_json::to_string_pretty;

#[tokio::main]
async fn main() {
    let args: Vec<String> = env::args().collect();
    let cal_id = args.get(1).cloned().unwrap_or_else(|| "primary".to_string());

    match commands::calendar_sync_with_oauth(cal_id.clone(), Some(5)).await {
        Ok(events) => {
            // write events to repository data/calendar_events.json for watcher
            if let Ok(s) = to_string_pretty(&events) {
                // compute repo root relative to exe
                if let Ok(exe) = std::env::current_exe() {
                    if let Some(mut p) = exe.parent().map(|s| s.to_path_buf()) {
                        for _ in 0..4 { if let Some(pp) = p.parent() { p = pp.to_path_buf(); } }
                        let out = p.join("data").join("calendar_events.json");
                        if let Err(e) = std::fs::write(&out, s.as_bytes()) {
                            eprintln!("failed write events: {}", e);
                        } else {
                            println!("WROTE_EVENTS: {}", out.display());
                            // write trigger file to request emit
                            let trigger = out.parent().unwrap_or_else(|| std::path::Path::new(".")).join("calendar_emit.trigger");
                            let _ = std::fs::write(&trigger, "1");
                            println!("WROTE_TRIGGER: {}", trigger.display());
                        }
                    }
                }
            }
        }
        Err(e) => eprintln!("SYNC ERR: {}", e),
    }
}
