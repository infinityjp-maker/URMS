// Backend module declarations
pub mod base;
pub mod error;
pub mod core;
pub mod system;
pub mod subsystems;

// Single instance mutex for Windows
#[cfg(target_os = "windows")]
static SINGLE_INSTANCE: std::sync::OnceLock<()> = std::sync::OnceLock::new();

#[cfg(target_os = "windows")]
fn check_single_instance() -> bool {
    use winapi::um::synchapi::{CreateMutexW, CreateEventW, OpenEventW, SetEvent};
    use winapi::um::handleapi::CloseHandle;
    use winapi::shared::minwindef::FALSE;
    use winapi::um::winnt::EVENT_MODIFY_STATE;
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    
    unsafe {
        let mutex_name: Vec<u16> = OsStr::new("URMS_APP_MUTEX")
            .encode_wide()
            .chain(Some(0))
            .collect();
        let event_name: Vec<u16> = OsStr::new("URMS_INSTANCE_EVENT")
            .encode_wide()
            .chain(Some(0))
            .collect();
        
        let handle = CreateMutexW(std::ptr::null_mut(), FALSE, mutex_name.as_ptr() as *const _);
        if handle.is_null() {
            return false; // Failed to create mutex handle
        }

        let last_error = std::io::Error::last_os_error().raw_os_error().unwrap_or(0);
        if last_error == 183 { // ERROR_ALREADY_EXISTS
            // Notify the existing instance to bring its window to front by signaling the named event.
            let ev = OpenEventW(EVENT_MODIFY_STATE, FALSE, event_name.as_ptr() as *const _);
            if !ev.is_null() {
                let _ = SetEvent(ev);
                let _ = CloseHandle(ev);
            }

            // Close our mutex handle and exit
            let _ = CloseHandle(handle);
            return false; // Already running
        }

        // Create a named event that other instances can signal to request focus.
        let _ev_handle = CreateEventW(std::ptr::null_mut(), FALSE, FALSE, event_name.as_ptr() as *const _);

        // Keep handle alive for the lifetime of the application
        let _ = SINGLE_INSTANCE.set(());
        let _ = handle;
        true
    }
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Check for single instance on Windows
    #[cfg(target_os = "windows")]
    {
        if !check_single_instance() {
            eprintln!("URMS is already running!");
            return;
        }
    }

    // Initialize logging with rotation: console + rotating file `logs/urms.log`.
    {
        use flexi_logger::{Criterion, Duplicate, LogSpecBuilder, Logger, Naming, Cleanup, FileSpec};

        let _ = std::fs::create_dir_all("logs");

        let mut spec_builder = LogSpecBuilder::new();
        spec_builder.default(flexi_logger::LevelFilter::Info);

        let file_spec = FileSpec::default()
            .directory("logs")
            .basename("urms")
            .suffix("log");

        let _ = Logger::with(spec_builder.build())
            .duplicate_to_stderr(Duplicate::Info)
            .log_to_file(file_spec)
            .rotate(
                Criterion::Size(10_000_000), // 10 MB
                Naming::Numbers,
                Cleanup::KeepLogFiles(10),
            )
            .start()
            .map_err(|e| eprintln!("failed to init logger: {}", e));
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
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
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
        ])
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
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
