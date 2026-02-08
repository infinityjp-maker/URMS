// Backend module declarations
pub mod base;
pub mod error;
pub mod core;
pub mod system;
pub mod subsystems;
use base64::Engine;

// Single instance mutex for Windows
                    if dist.exists() {
                        if let Some(dist_str) = dist.to_str() {
                            let file_url = format!("file:///{}", dist_str.replace('\\', "/").trim_start_matches('/'));
                            let script = format!("(function(){{try{{const o=(window.location&&window.location.origin)?window.location.origin:(window.location&&window.location.href)?window.location.href:''; if(typeof o==='string' && o.indexOf('localhost')!==-1) {{ try {{ window.location.replace('{}'); }} catch(e) {{ try {{ window.location.href='{}'; }} catch(_) {{}} }} }} }}catch(e){{}} }})();", file_url, file_url);
                            let _ = window.eval(&script);
                            log::info!("on_page_load attempted navigation to {}", file_url);
                        }

                // Emit a rich DOM / environment snapshot to backend logs and also
                // attempt multiple delivery paths so diagnostics reach native side
                // even when the usual Tauri JS bridge is not present.
                let _ = window.eval(r#"(function(){
                    try {
                        function safeJSON(o){ try { return JSON.stringify(o); } catch(e) { return String(o); } }

                        var payload = {
                            inlineAttr: document.documentElement.getAttribute('data-urms-inline-entry') || null,
                            bundleAttr: document.documentElement.getAttribute('data-urms-bundle-entry') || null,
                            inlineTs: (window.__URMS_INLINE_ENTRY_TS !== undefined) ? window.__URMS_INLINE_ENTRY_TS : null,
                            bundleTs: (window.__URMS_BUNDLE_ENTRY_TS !== undefined) ? window.__URMS_BUNDLE_ENTRY_TS : null,
                            readyFlag: !!window.__URMS_READY,
                            tauriPresent: !!(window.__TAURI__ && typeof window.__TAURI__.invoke === 'function'),
                            scripts: Array.prototype.slice.call(document.scripts || []).map(function(s){ return { src: s.src||null, type: s.type||null, nomodule: !!s.noModule }; }),
                            dashboardExists: !!document.querySelector('.dashboard-grid'),
                            cardCount: (document.querySelectorAll ? document.querySelectorAll('.floating-card').length : 0),
                            userAgent: (navigator && navigator.userAgent) ? navigator.userAgent : null
                        };

                        var json = safeJSON(payload);
                        try { document.documentElement.setAttribute('data-urms-inject', json); } catch(e) {}

                        // Try multiple channels to deliver diagnostics to native/test harness
                        try {
                            if (window.__TAURI__ && typeof window.__TAURI__.invoke === 'function') {
                                window.__TAURI__.invoke('frontend_log', { level: 'info', msg: JSON.stringify({ type: 'webview-diagnostics', payload: payload }) });
                            } else if (window.chrome && chrome.webview && typeof chrome.webview.postMessage === 'function') {
                                try { chrome.webview.postMessage({ type: 'webview-diagnostics', payload: payload }); } catch(e) {}
                            } else if (console && console.log) {
                                try { console.log('URMS_INJECT:' + json); } catch(e) {}
                            } else {
                                try { document.title = 'URMS_INJECT:' + (json && json.substr ? json.substr(0, 1200) : json); } catch(e) {}
                            }
                        } catch(e) {}

                        // Set a short ready flag to help polling clients
                        try { window.__URMS_READY = !!window.__URMS_READY || true; } catch(e) {}

                        // Also preserve the previous light-weight delayed ready event
                        try {
                            setTimeout(function(){ try { window.__URMS_READY = true; window.dispatchEvent(new Event('urms-ready')); } catch(e) {} }, 800);
                        } catch(e) {}

                    } catch(e) {}
                })();"#);
                // Attempt a direct dynamic import of the first module script to surface import errors
                let _ = window.eval(r#"(function(){
                    try {
                        var scripts = Array.prototype.slice.call(document.querySelectorAll('script[type="module"][src]')).map(function(s){ return s.src || null; }).filter(Boolean);
                        if (scripts && scripts.length) {
                            var p = scripts[0];
                            import(p).then(function(){
                                try { document.documentElement.setAttribute('data-urms-import-passed', '1'); } catch(e) {}
                                try { if (window.__TAURI__ && typeof window.__TAURI__.invoke === 'function') window.__TAURI__.invoke('frontend_log', { level: 'info', msg: 'import-ok:' + p }); } catch(e) {}
                                try { console && console.log && console.log('URMS_IMPORT_OK:' + p); } catch(e) {}
                            }).catch(function(err){
                                try { document.documentElement.setAttribute('data-urms-import-error', (err && (err.stack || err.message)) ? String(err.stack || err.message) : String(err)); } catch(e) {}
                                try { if (window.__TAURI__ && typeof window.__TAURI__.invoke === 'function') window.__TAURI__.invoke('frontend_log', { level: 'error', msg: 'import-failed:' + String(err && (err.stack || err.message) || err) }); } catch(e) {}
                                try { console && console.error && console.error('URMS_IMPORT_ERR:' + String(err && (err.stack || err.message) || err)); } catch(e) {}
                            });
                        }
                    } catch(e) {}
                })();"#);
        if !check_single_instance() {
            eprintln!("URMS is already running!");
            return;
        }
    }

    // Initialize logging with rotation: console + rotating file `logs/urms.log`.
    {
        use flexi_logger::{Criterion, Duplicate, LogSpecBuilder, Logger, Naming, Cleanup, FileSpec};
        use std::io::Write;

        // Ensure logs directory exists
        let _ = std::fs::create_dir_all("logs");

        let mut spec_builder = LogSpecBuilder::new();
        spec_builder.default(flexi_logger::LevelFilter::Info);

        let file_spec = FileSpec::default()
            .directory("logs")
            .basename("urms")
            .suffix("log");

        let logger_result = Logger::with(spec_builder.build())
            .duplicate_to_stderr(Duplicate::Info)
            .log_to_file(file_spec)
            .rotate(
                Criterion::Size(10_000_000), // 10 MB
                Naming::Numbers,
                Cleanup::KeepLogFiles(10),
            )
            .start();

        if let Err(e) = logger_result {
            // Fall back: try to write an error note to stderr and to a plain file
            eprintln!("failed to init logger: {}", e);
            if let Ok(mut f) = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open("logs/urms-fallback.log")
            {
                let _ = writeln!(f, "failed to init logger: {}", e);
            }
        } else {
            log::info!("logger initialized");
        }

        // Install a panic hook that appends panic information to logs/panic.log for post-mortem.
        {
            let panic_path = std::path::PathBuf::from("logs").join("panic.log");
            std::panic::set_hook(Box::new(move |info| {
                let _ = std::fs::OpenOptions::new()
                    .create(true)
                    .append(true)
                    .open(&panic_path)
                    .and_then(|mut f| {
                        let _ = writeln!(f, "PANIC: {:?}\n", info);
                        Ok(())
                    });
                // Also log via log crate if initialized
                let _ = log::error!("PANIC: {:?}", info);
            }));
        }
    }

    // Simple WebView2 runtime presence check on Windows — logs a warning if likely missing
    #[cfg(target_os = "windows")]
    {
        use log::warn;
        use std::path::Path;
        let candidates = [
            "C:\\Program Files (x86)\\Microsoft\\EdgeWebView\\Application",
            "C:\\Program Files\\Microsoft\\EdgeWebView\\Application",
        ];
        let mut found = false;
        for p in candidates.iter() {
            if Path::new(p).exists() {
                found = true;
                break;
            }
        }
        if !found {
            warn!("WebView2 runtime not detected in common paths — user may need to install WebView2 runtime.");
        }
    }

    // Ensure WebView2 remote debugging port is exposed when requested: set env var
    // This helps automated tools attach via CDP (e.g., http://127.0.0.1:9222).
    #[cfg(target_os = "windows")]
    {
        use log::info;
        use std::env;
        // Only set if not already present (allow override)
        if env::var_os("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS").is_none() {
            // Use a conservative default port 9222 for remote debugging
            env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--remote-debugging-port=9222");
            info!("Set WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222");
        } else {
            info!("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS already set");
        }
    }

    // If a local `dist` folder exists in the repository root, prefer loading bundled assets
    // and avoid accidentally pointing the runtime to a dev server. This unsets TAURI dev
    // related env vars when a usable `dist` is available to prevent "localhost" connection errors.
    {
        use std::env;

        // Try to locate repo root relative to current executable. Typical layout:
        // <repo>/Backend/src-tauri/target/release/urms.exe
        if let Ok(exe) = std::env::current_exe() {
            if let Some(mut p) = exe.parent().map(|s| s.to_path_buf()) {
                // Walk up: target/release -> target -> src-tauri -> Backend -> repo root
                for _ in 0..4 {
                    if let Some(pp) = p.parent() {
                        p = pp.to_path_buf();
                    }
                }
                let dist = p.join("dist");
                if dist.exists() {
                    // If TAURI dev envs are set, and dist exists, remove them so the app loads static files.
                    let dev_vars = ["TAURI_DEV", "TAURI_DEV_SERVER_URL", "TAURI_DIST_DIR", "TAURI_DEV_PATH"];
                    let mut removed = Vec::new();
                    for v in dev_vars.iter() {
                        if env::var_os(v).is_some() {
                            env::remove_var(v);
                            removed.push(*v);
                        }
                    }
                    if !removed.is_empty() {
                        log::info!("Found local dist at {:?}; unset env vars: {:?}", dist, removed);
                    } else {
                        log::info!("Found local dist at {:?}; no TAURI dev env vars set", dist);
                    }
                }
            }
        }
    }
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            frontend_log,
            system::commands::get_system_info,
            system::commands::get_network_info,
            subsystems::asset::commands::asset_manager_add_asset,
            subsystems::asset::commands::asset_manager_get_asset,
            subsystems::asset::commands::asset_manager_get_all_assets,
            subsystems::asset::commands::asset_manager_update_asset,
            subsystems::asset::commands::asset_manager_delete_asset,
            subsystems::asset::commands::asset_manager_count_assets,
            subsystems::asset::commands::asset_manager_count_by_status,
            subsystems::file::commands::file_manager_scan_directory,
            subsystems::file::commands::file_manager_classify_file,
            subsystems::file::commands::file_manager_get_storage_stats,
            subsystems::finance::commands::finance_manager_record_expense,
            subsystems::finance::commands::finance_manager_set_budget,
            subsystems::finance::commands::finance_manager_get_budgets,
            subsystems::finance::commands::finance_manager_get_monthly_report,
            subsystems::iot::commands::iot_manager_initialize,
            subsystems::iot::commands::iot_manager_discover_devices,
            subsystems::iot::commands::iot_manager_control_device,
            subsystems::iot::commands::iot_manager_get_device_status,
            subsystems::network::commands::network_manager_scan_network,
            subsystems::network::commands::network_manager_ping_device,
            subsystems::network::commands::network_manager_get_network_stats,
            subsystems::schedule::commands::schedule_manager_create_schedule,
            subsystems::schedule::commands::schedule_manager_update_schedule,
            subsystems::schedule::commands::schedule_manager_delete_schedule,
            subsystems::schedule::commands::schedule_manager_get_upcoming_schedules
            ,
            subsystems::weather::commands::get_weather,
            subsystems::calendar::commands::calendar_sync_with_google,
            subsystems::calendar::commands::calendar_get_events,
            subsystems::calendar::commands::calendar_start_oauth,
            subsystems::calendar::commands::calendar_get_oauth_tokens,
            subsystems::calendar::commands::calendar_disconnect_oauth,
            subsystems::calendar::commands::calendar_sync_with_oauth
            ,
            subsystems::settings::commands::settings_set_google_credentials,
            subsystems::settings::commands::settings_get_google_credentials
        ])
        .on_page_load(|window, _payload| {
            // If a local `dist` exists relative to the executable, attempt to
            // redirect the webview to the file:// URL as early as possible.
            // Using on_page_load lets us intercept the initial load and
            // avoid a visible race where the webview briefly shows localhost.
            if let Ok(exe) = std::env::current_exe() {
                if let Some(mut p) = exe.parent().map(|s| s.to_path_buf()) {
                    for _ in 0..4 {
                        if let Some(pp) = p.parent() { p = pp.to_path_buf(); }
                    }
                    let dist = p.join("dist");
                    if dist.exists() {
                        if let Some(dist_str) = dist.to_str() {
                            let file_url = format!("file:///{}", dist_str.replace('\\', "/").trim_start_matches('/'));
                            let script = format!("(function(){{try{{const o=(window.location&&window.location.origin)?window.location.origin:(window.location&&window.location.href)?window.location.href:''; if(typeof o==='string' && o.indexOf('localhost')!==-1) {{ try {{ window.location.replace('{}'); }} catch(e) {{ try {{ window.location.href='{}'; }} catch(_) {{}} }} }} }}catch(e){{}} }})();", file_url, file_url);
                            let _ = window.eval(&script);
                            log::info!("on_page_load attempted navigation to {}", file_url);
                        }
                    }
                }
<<<<<<< HEAD
                // Emit a rich DOM / environment snapshot to backend logs and also
                // attempt multiple delivery paths so diagnostics reach native side
                // even when the usual Tauri JS bridge is not present.
                let _ = window.eval(r#"(function(){
                    try {
                        function safeJSON(o){ try { return JSON.stringify(o); } catch(e) { return String(o); } }

                        var payload = {
                            inlineAttr: document.documentElement.getAttribute('data-urms-inline-entry') || null,
                            bundleAttr: document.documentElement.getAttribute('data-urms-bundle-entry') || null,
                            inlineTs: (window.__URMS_INLINE_ENTRY_TS !== undefined) ? window.__URMS_INLINE_ENTRY_TS : null,
                            bundleTs: (window.__URMS_BUNDLE_ENTRY_TS !== undefined) ? window.__URMS_BUNDLE_ENTRY_TS : null,
                            readyFlag: !!window.__URMS_READY,
                            tauriPresent: !!(window.__TAURI__ && typeof window.__TAURI__.invoke === 'function'),
                            scripts: Array.prototype.slice.call(document.scripts || []).map(function(s){ return { src: s.src||null, type: s.type||null, nomodule: !!s.noModule }; }),
                            dashboardExists: !!document.querySelector('.dashboard-grid'),
                            cardCount: (document.querySelectorAll ? document.querySelectorAll('.floating-card').length : 0),
                            userAgent: (navigator && navigator.userAgent) ? navigator.userAgent : null
                        };

                        var json = safeJSON(payload);
                        try { document.documentElement.setAttribute('data-urms-inject', json); } catch(e) {}

                        // Try multiple channels to deliver diagnostics to native/test harness
                        try {
                            if (window.__TAURI__ && typeof window.__TAURI__.invoke === 'function') {
                                window.__TAURI__.invoke('frontend_log', { level: 'info', msg: JSON.stringify({ type: 'webview-diagnostics', payload: payload }) });
                            } else if (window.chrome && chrome.webview && typeof chrome.webview.postMessage === 'function') {
                                try { chrome.webview.postMessage({ type: 'webview-diagnostics', payload: payload }); } catch(e) {}
                            } else if (console && console.log) {
                                try { console.log('URMS_INJECT:' + json); } catch(e) {}
                            } else {
                                try { document.title = 'URMS_INJECT:' + (json && json.substr ? json.substr(0, 1200) : json); } catch(e) {}
                            }
                        } catch(e) {}

                        // Set a short ready flag to help polling clients
                        try { window.__URMS_READY = !!window.__URMS_READY || true; } catch(e) {}

                        // Also preserve the previous light-weight delayed ready event
                        try {
                            setTimeout(function(){ try { window.__URMS_READY = true; window.dispatchEvent(new Event('urms-ready')); } catch(e) {} }, 800);
                        } catch(e) {}

                    } catch(e) {}
                })();"#);
                // Attempt a direct dynamic import of the first module script to surface import errors
                let _ = window.eval(r#"(function(){
                    try {
                        var scripts = Array.prototype.slice.call(document.querySelectorAll('script[type="module"][src]')).map(function(s){ return s.src || null; }).filter(Boolean);
                        if (scripts && scripts.length) {
                            var p = scripts[0];
                            import(p).then(function(){
                                try { document.documentElement.setAttribute('data-urms-import-passed', '1'); } catch(e) {}
                                try { if (window.__TAURI__ && typeof window.__TAURI__.invoke === 'function') window.__TAURI__.invoke('frontend_log', { level: 'info', msg: 'import-ok:' + p }); } catch(e) {}
                                try { console && console.log && console.log('URMS_IMPORT_OK:' + p); } catch(e) {}
                            }).catch(function(err){
                                try { document.documentElement.setAttribute('data-urms-import-error', (err && (err.stack || err.message)) ? String(err.stack || err.message) : String(err)); } catch(e) {}
                                try { if (window.__TAURI__ && typeof window.__TAURI__.invoke === 'function') window.__TAURI__.invoke('frontend_log', { level: 'error', msg: 'import-failed:' + String(err && (err.stack || err.message) || err) }); } catch(e) {}
                                try { console && console.error && console.error('URMS_IMPORT_ERR:' + String(err && (err.stack || err.message) || err)); } catch(e) {}
                            });
                        }
                    } catch(e) {}
                })();"#);
=======
>>>>>>> origin/main
            }
        })
        .setup(|app| {
            use tauri::Manager;
            use tauri::Emitter;
            #[cfg(target_os = "windows")]
            {
                // Try to bring the existing window to the foreground instead of creating a new instance
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_focus();
                }
            }
            
            // Spawn a background async task to emit system and network updates periodically.
            // Use an interval and run heavy collectors in blocking threads in parallel,
            // with a longer interval to reduce CPU/io pressure and avoid overlapping work.
            {
                use std::time::Duration;
                use tokio::time::interval;
                let app_handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    let mut intv = interval(Duration::from_secs(2));
                    loop {
                        // wait for next tick
                        intv.tick().await;

                        // Run blockers in parallel on blocking threads
                        let sys_future = tauri::async_runtime::spawn_blocking(|| {
                            system::commands::collect_system_info_blocking()
                        });
                        let net_future = tauri::async_runtime::spawn_blocking(|| {
                            system::commands::collect_network_info_blocking()
                        });

                        // Await both results and emit if successful
                        if let Ok(sys_res) = sys_future.await {
                            let _ = app_handle.emit("system:update", &sys_res);
                        }
                        if let Ok(net_res) = net_future.await {
                            let _ = app_handle.emit("network:update", &net_res);
                        }
                    }
                });
            }

            // Spawn a background task to perform periodic calendar sync using OAuth tokens.
            {
                use std::time::Duration;
                let app_handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    loop {
                        // read desired sync interval
                        let mins = match crate::subsystems::settings::commands::settings_get_sync_interval() {
                            Ok(v) => v.get("sync_interval_minutes").and_then(|n| n.as_u64()).unwrap_or(0),
                            Err(_) => 0,
                        };
                        if mins == 0 {
                            // sleep short and retry
                            tokio::time::sleep(Duration::from_secs(60)).await;
                            continue;
                        }

                        // load calendar id from settings
                        let cal_id = match crate::subsystems::settings::commands::settings_get_google_credentials() {
                            Ok(v) => v.get("google_calendar_id").and_then(|s| s.as_str()).map(|s| s.to_string()),
                            Err(_) => None,
                        };

                        if let Some(calendar_id) = cal_id {
                            // attempt sync with OAuth tokens; ignore errors but emit on success
                            match crate::subsystems::calendar::commands::calendar_sync_with_oauth(calendar_id.clone(), Some(10)).await {
                                Ok(events) => {
                                    let _ = app_handle.emit("calendar:updated", &events);
                                    log::info!("Periodic calendar sync succeeded: {} events", events.len());
                                }
                                Err(e) => {
                                    log::warn!("Periodic calendar sync failed: {}", e);
                                }
                            }
                        }

                        tokio::time::sleep(Duration::from_secs(mins * 60)).await;
                    }
                });
            }

            // Spawn a watcher that monitors data/calendar_events.json and emits calendar:updated
            {
                use std::time::Duration;
                let app_handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    let mut last_mod: Option<std::time::SystemTime> = None;
                    loop {
                        // determine repo root relative to exe
                        if let Ok(exe) = std::env::current_exe() {
                            if let Some(mut p) = exe.parent().map(|s| s.to_path_buf()) {
                                for _ in 0..4 { if let Some(pp) = p.parent() { p = pp.to_path_buf(); } }
                                let events_path = p.join("data").join("calendar_events.json");
                                    let trigger_path = p.join("data").join("calendar_emit.trigger");
                                    if events_path.exists() {
                                        log::debug!("watcher: found events file at {}", events_path.display());
                                    if let Ok(meta) = std::fs::metadata(&events_path) {
                                        if let Ok(mtime) = meta.modified() {
                                            let changed = match last_mod {
                                                Some(t) => t != mtime,
                                                None => true,
                                            };
                                            if changed {
                                                // read file and attempt to parse JSON array
                                                    match std::fs::read_to_string(&events_path) {
                                                        Ok(s) => match serde_json::from_str::<serde_json::Value>(&s) {
                                                            Ok(json_val) => {
                                                                let _ = app_handle.emit("calendar:updated", &json_val);
                                                                log::info!("Emitted calendar:updated from events file");
                                                            }
                                                            Err(e) => {
                                                                log::warn!("watcher: failed to parse json: {}", e);
                                                            }
                                                        },
                                                        Err(e) => {
                                                            log::warn!("watcher: failed to read events file: {}", e);
                                                        }
                                                    }
                                                last_mod = Some(mtime);
                                            }
                                        }
                                    }
                                }
                                // trigger file check: if present, force emit
                                if trigger_path.exists() {
                                    log::info!("watcher: trigger found, forcing emit");
                                    match std::fs::read_to_string(&events_path) {
                                        Ok(s) => match serde_json::from_str::<serde_json::Value>(&s) {
                                            Ok(json_val) => {
                                                let _ = app_handle.emit("calendar:updated", &json_val);
                                                log::info!("Emitted calendar:updated from trigger");
                                            }
                                            Err(e) => log::warn!("watcher: trigger parse failed: {}", e),
                                        },
                                        Err(e) => log::warn!("watcher: trigger read failed: {}", e),
                                    }
                                    let _ = std::fs::remove_file(&trigger_path);
                                }
                            }
                        }
                        tokio::time::sleep(Duration::from_secs(2)).await;
                    }
                });
            }

            // Windows: spawn a thread to wait for focus requests from secondary instances.
            #[cfg(target_os = "windows")]
            {
                use std::ffi::OsStr;
                use std::os::windows::ffi::OsStrExt;
                use winapi::um::synchapi::OpenEventW;
                use winapi::um::synchapi::WaitForSingleObject;
                use winapi::um::winnt::SYNCHRONIZE;
                use winapi::um::winbase::INFINITE;
                use winapi::shared::minwindef::FALSE;
                use tauri::Manager;

                let app_handle = app.handle().clone();
                let event_name: Vec<u16> = OsStr::new("URMS_INSTANCE_EVENT")
                    .encode_wide()
                    .chain(Some(0))
                    .collect();

                std::thread::spawn(move || {
                    loop {
                        // Try to open the named event and wait for it.
                        let ev = unsafe { OpenEventW(SYNCHRONIZE, FALSE, event_name.as_ptr() as *const _) };
                        if ev.is_null() {
                            // If event not yet created, sleep and retry
                            std::thread::sleep(std::time::Duration::from_millis(500));
                            continue;
                        }

                        // Wait until signaled
                        unsafe { WaitForSingleObject(ev, INFINITE) };

                        // Bring main window to front
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let _ = window.set_focus();
                        }

                        // Small sleep to avoid tight loop
                        std::thread::sleep(std::time::Duration::from_millis(200));
                    }
                });
            }

            // Post-setup: small dev-only diagnostics and helpers (eval injection, ping server, devtools opener)
            // These are potentially risky for production and are gated behind the `URMS_DEV` env var.
            let dev_mode = std::env::var("URMS_DEV").is_ok();

            if dev_mode {
                if let Some(win) = app.get_webview_window("main") {
                    // Also ensure window is shown/focused (best-effort)
                    let _ = win.show();
                    let _ = win.set_focus();

                    let script = r#"
                      setTimeout(() => {
                        try {
                          if (window.__TAURI__ && typeof window.__TAURI__.invoke === 'function') {
                            window.__TAURI__.invoke('frontend_log', { level: 'info', msg: 'frontend: direct __TAURI__ invoke test' });
                            return;
                          }
                          if (window.__TAURI__ && window.__TAURI__.tauri && typeof window.__TAURI__.tauri.invoke === 'function') {
                            window.__TAURI__.tauri.invoke('frontend_log', { level: 'info', msg: 'frontend: direct __TAURI__.tauri invoke test' });
                            return;
                          }
                          if (typeof window.invoke === 'function') {
                            window.invoke('frontend_log', { level: 'info', msg: 'frontend: direct global invoke test' });
                            return;
                          }
                          console.log('URMS: no __TAURI__ bridge found');
                        } catch (e) {
                          console.log('URMS: eval direct invoke failed', e && e.toString());
                        }
                      }, 1200);
                    "#;
                    let _ = win.eval(script);

                    let script2 = r#"
                        setTimeout(() => {
                            try {
                                (import('@tauri-apps/api/tauri')
                                    .then((m) => {
                                        if (m && typeof m.invoke === 'function') {
                                            return m.invoke('frontend_log', { level: 'info', msg: 'frontend: eval import->invoke test' });
                                        }
                                        console.log('URMS: eval import present but no invoke');
                                    })
                                    .catch((e) => console.log('URMS: eval import failed', e && e.toString())));
                            } catch (e) {
                                console.log('URMS: eval import exception', e && e.toString());
                            }
                        }, 1600);
                    "#;
                    let _ = win.eval(script2);

                    let script_capture_fetch = r#"
                        (function(){
                            try {
                                const orig = window.fetch.bind(window);
                                window.fetch = function(input, init){
                                    try {
                                        const url = (input && input.url) ? input.url : String(input);
                                        if (typeof url === 'string' && url.indexOf('127.0.0.1:8765/ux-ping') !== -1) {
                                            return orig.apply(this, arguments);
                                        }

                                        const sendCaptured = (s) => {
                                            try {
                                                orig('http://127.0.0.1:8765/ux-ping', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ captured: s, url: url })
                                                }).catch(()=>{});
                                            } catch(e){}
                                        };

                                        if (init && init.body) {
                                            try {
                                                if (typeof init.body === 'string') {
                                                    sendCaptured(init.body);
                                                } else if (init.body instanceof Blob) {
                                                    init.body.text().then(t => sendCaptured(t)).catch(()=>{});
                                                } else if (init.body instanceof FormData) {
                                                    const obj = {};
                                                    for (const p of init.body.entries()) { obj[p[0]] = p[1]; }
                                                    sendCaptured(JSON.stringify(obj));
                                                } else {
                                                    try { sendCaptured(JSON.stringify(init.body)); } catch(e){ sendCaptured(String(init.body)); }
                                                }
                                            } catch(e){}
                                        } else if (input && input instanceof Request) {
                                            try {
                                                const req = input;
                                                req.clone().text().then(t => sendCaptured(t)).catch(()=>{});
                                            } catch(e){}
                                        }
                                    } catch(e) {}
                                    return orig.apply(this, arguments);
                                };
                                console.log('URMS: fetch wrapped for body capture');
                            } catch(e) {
                                console.log('URMS: fetch wrap failed', e && e.toString());
                            }
                        })();
                    "#;
                    let _ = win.eval(script_capture_fetch);

                    let script_loc = r#"
                        setTimeout(() => {
                            try {
                                const o = { href: window.location.href, origin: window.location.origin, baseURI: document.baseURI };
                                try {
                                    if (window.__TAURI__ && typeof window.__TAURI__.invoke === 'function') {
                                        window.__TAURI__.invoke('frontend_log', { level: 'info', msg: 'webview-location: ' + JSON.stringify(o) });
                                    } else {
                                        console.log('webview-location: ' + JSON.stringify(o));
                                    }
                                } catch (e) {
                                    console.log('webview-location-ex', e && e.toString());
                                }
                            } catch (e) {
                                console.log('webview-location-ex-top', e && e.toString());
                            }
                        }, 500);
                    "#;
                    let _ = win.eval(script_loc);

                    if let Some(dist_path) = {
                        if let Ok(exe) = std::env::current_exe() {
                            if let Some(mut p) = exe.parent().map(|s| s.to_path_buf()) {
                                for _ in 0..4 { if let Some(pp) = p.parent() { p = pp.to_path_buf(); } }
                                let dist = p.join("dist");
                                if dist.exists() { Some(dist) } else { None }
                            } else { None }
                        } else { None }
                    } {
                        if let Some(dist_str) = dist_path.to_str() {
                            let file_url = format!("file:///{}", dist_str.replace('\\', "/").trim_start_matches('/'));
                            let mut nav_script = String::new();
                            nav_script.push_str("(function(){const target='");
                            nav_script.push_str(&file_url);
                            nav_script.push_str("';for (let i=0;i<6;i++){setTimeout(function(){try{const origin=(window.location&&window.location.origin)?window.location.origin:(window.location&&window.location.href)?window.location.href:'';if(typeof origin==='string'&&origin.indexOf('localhost')!==-1){try{if(window.__TAURI__&&typeof window.__TAURI__.invoke==='function')window.__TAURI__.invoke('frontend_log',{level:'info',msg:'forcing-navigation-attempt:'+target+' (attempt '+i+')'}).catch(()=>{});}catch(e){}try{window.location.replace(target);}catch(e){try{window.location.href=target;}catch(e){}}}else{try{if(window.__TAURI__&&typeof window.__TAURI__.invoke==='function')window.__TAURI__.invoke('frontend_log',{level:'info',msg:'origin-ok:'+origin}).catch(()=>{});}catch(e){}}}catch(e){try{console.log('nav-ex',e&&e.toString());}catch(_){} }},400*i);} }})();");
                            let _ = win.eval(&nav_script);

                            if let Ok(index_path) = std::path::Path::new(dist_str).join("index.html").canonicalize() {
                                if let Ok(html) = std::fs::read_to_string(&index_path) {
                                    let encoded = base64::engine::general_purpose::STANDARD.encode(html.as_bytes());
                                    let data_url = format!("data:text/html;base64,{}", encoded);
                                    let mut inject = String::new();
                                    inject.push_str("(function(){try{window.location.replace('");
                                    inject.push_str(&data_url);
                                    inject.push_str("');}catch(e){} })();");
                                    let _ = win.eval(&inject);
                                }

                                log::warn!("WindowBuilder fallback disabled; skipping creation of new window.");
                            }
                        }

                    // Additionally, always attempt a forced navigation to the local `dist` if present.
                    // This helps avoid the WebView briefly showing the dev server (localhost) error
                    // when static files are available. Run this regardless of `URMS_DEV`.
                    if let Some(win) = app.get_webview_window("main") {
                        if let Some(dist_path) = {
<<<<<<< HEAD
                                if let Ok(exe) = std::env::current_exe() {
                                    if let Some(mut p) = exe.parent().map(|s| s.to_path_buf()) {
                                        for _ in 0..4 { if let Some(pp) = p.parent() { p = pp.to_path_buf(); } }
                                        let dist = p.join("dist");
                                        if dist.exists() { Some(dist) } else { None }
                                    } else { None }
                                } else { None }
                            } {
                                if let Some(dist_str) = dist_path.to_str() {
                                    let file_url = format!("file:///{}", dist_str.replace('\\', "/").trim_start_matches('/'));
                                    // More robust: explicitly try to navigate to index.html repeatedly
                                    // from a background thread until success. This reduces race
                                    // where the webview shows a dev-server error before eval runs.
                                    let index_url = format!("{}/index.html", file_url.trim_end_matches('/'));
                                    let idx = index_url.clone();
                                    let w = win.clone();
                                    std::thread::spawn(move || {
                                        for attempt in 0..12 {
                                            let script = format!("(function(){{try{{window.location.replace('{}');}}catch(e){{try{{window.location.href='{}';}}catch(_){{}}}}}})();", idx, idx);
                                            match w.eval(&script) {
                                                Ok(_) => log::info!("nav-attempt success to {} (attempt {})", idx, attempt),
                                                Err(e) => log::warn!("nav-attempt failed (attempt {}): {}", attempt, e),
                                            }
                                            std::thread::sleep(std::time::Duration::from_millis(250));
                                        }
                                        log::info!("nav-attempts finished for {}", idx);
                                    });
                                }
                            }
                        }
=======
                            if let Ok(exe) = std::env::current_exe() {
                                if let Some(mut p) = exe.parent().map(|s| s.to_path_buf()) {
                                    for _ in 0..4 { if let Some(pp) = p.parent() { p = pp.to_path_buf(); } }
                                    let dist = p.join("dist");
                                    if dist.exists() { Some(dist) } else { None }
                                } else { None }
                            } else { None }
                        } {
                            if let Some(dist_str) = dist_path.to_str() {
                                let file_url = format!("file:///{}", dist_str.replace('\\', "/").trim_start_matches('/'));
                                let mut nav_script = String::new();
                                nav_script.push_str("(function(){const target='");
                                nav_script.push_str(&file_url);
                                nav_script.push_str("';for (let i=0;i<6;i++){setTimeout(function(){try{const origin=(window.location&&window.location.origin)?window.location.origin:(window.location&&window.location.href)?window.location.href:'';if(typeof origin==='string'&&origin.indexOf('localhost')!==-1){try{window.location.replace(target);}catch(e){try{window.location.href=target;}catch(e){}}}else{} }catch(e){} },400*i);} }})();");
                                let _ = win.eval(&nav_script);
                                log::info!("Attempted forced navigation to local dist: {}", file_url);
                            }
                        }
                    }
>>>>>>> origin/main
                    }
                }

                // Spawn a tiny HTTP ping server on localhost to detect frontend JS execution
                std::thread::spawn(|| {
                    use std::net::TcpListener;
                    use std::io::{Read, Write};

                    if let Ok(listener) = TcpListener::bind(("127.0.0.1", 8765)) {
                        log::info!("Frontend ping server listening on 127.0.0.1:8765");
                        for stream in listener.incoming() {
                                match stream {
                                    Ok(mut s) => {
                                        use std::time::Duration;
                                        let _ = s.set_read_timeout(Some(Duration::from_millis(500)));

                                        let mut buf = Vec::new();
                                        let mut tmp = [0u8; 4096];
                                        let mut header_str = String::new();
                                        let mut content_len: usize = 0;
                                        loop {
                                            match s.read(&mut tmp) {
                                                Ok(0) => break,
                                                Ok(n) => {
                                                    buf.extend_from_slice(&tmp[..n]);
                                                    if let Ok(as_str) = std::str::from_utf8(&buf) {
                                                        if let Some(pos) = as_str.find("\r\n\r\n") {
                                                            header_str = as_str[..pos].to_string();
                                                            for line in header_str.lines() {
                                                                if let Some(idx) = line.to_ascii_lowercase().find("content-length:") {
                                                                    if let Ok(v) = line[idx+15..].trim().parse::<usize>() {
                                                                        content_len = v;
                                                                    }
                                                                }
                                                            }
                                                            break;
                                                        }
                                                    }
                                                    if buf.len() > 64 * 1024 { break; }
                                                }
                                                Err(_) => break,
                                            }
                                        }

                                        let mut body_bytes = Vec::new();
                                        if !header_str.is_empty() {
                                            if let Ok(as_str) = std::str::from_utf8(&buf) {
                                                if let Some(pos) = as_str.find("\r\n\r\n") {
                                                    let body_start = pos + 4;
                                                    if body_start < buf.len() {
                                                        body_bytes.extend_from_slice(&buf[body_start..]);
                                                    }
                                                }
                                            }
                                        }

                                        if content_len > body_bytes.len() {
                                            let mut remaining = content_len - body_bytes.len();
                                            while remaining > 0 {
                                                match s.read(&mut tmp) {
                                                    Ok(0) => break,
                                                    Ok(n) => {
                                                        let take = std::cmp::min(n, remaining);
                                                        body_bytes.extend_from_slice(&tmp[..take]);
                                                        remaining = remaining.saturating_sub(take);
                                                    }
                                                    Err(_) => break,
                                                }
                                            }
                                        }

                                        let body_str = match String::from_utf8(body_bytes.clone()) {
                                            Ok(b) => b,
                                            Err(_) => String::new(),
                                        };
                                        if body_str.is_empty() {
                                            log::info!("Received frontend HTTP ping: ");
                                        } else {
                                            log::info!("Received frontend HTTP ping: {}", body_str);
                                        }

                                        let resp = "HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nOK";
                                        let _ = s.write_all(resp.as_bytes());
                                    }
                                    Err(e) => {
                                        log::warn!("Ping server accept error: {:?}", e);
                                    }
                                }
                            }
                    } else {
                        log::warn!("Failed to bind frontend ping server on 127.0.0.1:8765");
                    }
                });

                // As a fallback, ask the WebView to open DevTools via common host bridges (Edge WebView2 / chrome.webview)
                if let Some(win) = app.get_webview_window("main") {
                    let script3 = r#"
                        (function(){
                            try {
                                const attempts = 12;
                                for (let i=0;i<attempts;i++) {
                                    setTimeout(()=>{
                                        try {
                                            if (window.chrome && window.chrome.webview && typeof window.chrome.webview.openDevTools === 'function') {
                                                window.chrome.webview.openDevTools();
                                                console.log('URMS: requested chrome.webview.openDevTools');
                                                return;
                                            }
                                            if (window.externalHost && typeof window.externalHost.openDevTools === 'function') {
                                                window.externalHost.openDevTools();
                                                console.log('URMS: requested externalHost.openDevTools');
                                                return;
                                            }
                                            if (window.chrome && window.chrome.webview && window.chrome.webview.postMessage) {
                                                try { window.chrome.webview.postMessage({type:'urms:openDevTools'}); } catch(e){}
                                            }
                                            if (window.external && typeof window.external.notify === 'function') {
                                                try { window.external.notify('urms:openDevTools'); } catch(e){}
                                            }
                                            if (i===attempts-1) console.log('URMS: openDevTools attempts finished');
                                        } catch(e) { console.log('URMS: openDevTools inner error', e && e.toString()) }
                                    }, 500 * i);
                                }
                            } catch (e) { console.log('URMS: openDevTools setup failed', e && e.toString()) }
                        })();
                    "#;
                    let _ = win.eval(script3);
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
