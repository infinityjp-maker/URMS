use serde::{Deserialize, Serialize};
use sysinfo::{Disks, Networks, System};
use std::process::Command;
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, Instant};

#[derive(Debug, Serialize, Deserialize)]
pub struct DiskInfo {
    pub mount_point: String,
    pub drive_letter: String,  // New: e.g., "C:"
    pub device_name: String,   // New: e.g., "SAMSUNG SSD 970"
    pub total_gb: f32,
    pub used_gb: f32,
    pub usage: f32,
    pub is_network: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GpuInfo {
    pub name: String,
    pub usage: f32,
    pub memory_used_mb: u64,
    pub memory_total_mb: u64,
    pub memory_usage: f32,  // New: percentage of GPU memory used
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub cpu_name: String,      // New: e.g., "Intel Core i7-12700K"
    pub cpu_speed_ghz: f32,    // New: CPU frequency in GHz
    pub cpu_usage: f32,
    pub cpu_cores: usize,
    pub memory_usage: f32,
    pub memory_used_gb: f32,
    pub memory_total_gb: f32,
    pub disk_usage: f32,
    pub disk_name: String,
    pub disks: Vec<DiskInfo>,
    pub gpus: Vec<GpuInfo>,
    pub network_status: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProcessInfo {
    pub name: String,
    pub pid: u32,
    pub cpu_usage: f32,
    pub memory_mb: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NetworkInfo {
    pub devices_online: u32,
    pub devices_offline: u32,
    pub average_latency: u32,
    pub network_status: String,
    pub interfaces: Vec<String>,
    pub top_cpu_processes: Vec<ProcessInfo>,  // New: top 5 CPU users
    pub top_memory_processes: Vec<ProcessInfo>,  // New: top 5 memory users
}

#[tauri::command]
pub async fn get_system_info() -> SystemInfo {
    let result = tauri::async_runtime::spawn_blocking(move || collect_system_info_blocking()).await;

    match result {
        Ok(info) => info,
        Err(_) => SystemInfo {
            cpu_name: "Unknown".to_string(),
            cpu_speed_ghz: 0.0,
            cpu_usage: 0.0,
            cpu_cores: 0,
            memory_usage: 0.0,
            memory_used_gb: 0.0,
            memory_total_gb: 0.0,
            disk_usage: 0.0,
            disk_name: "不明".to_string(),
            disks: Vec::new(),
            gpus: Vec::new(),
            network_status: "unknown".to_string(),
        },
    }
}

pub fn collect_system_info_blocking() -> SystemInfo {
    let mut sys = System::new_all();
    sys.refresh_all();

    // Need a second refresh for accurate CPU usage
    std::thread::sleep(std::time::Duration::from_millis(100));
    sys.refresh_all();

    // CPU info: name and frequency
    let cpu_name = sys.cpus()
        .first()
        .map(|cpu| cpu.brand().trim().to_string())
        .unwrap_or_else(|| "Unknown CPU".to_string());
    let cpu_frequency = sys.cpus()
        .first()
        .map(|cpu| cpu.frequency() as f32 / 1000.0)
        .unwrap_or(0.0);
    
    // CPU usage (average across all cores) - need second refresh for accuracy
    let cpu_usage = sys.global_cpu_usage();
    let cpu_cores = sys.cpus().len();

    // Memory usage percentage (bytes to GB: divide by 1024^3)
    let total_memory = sys.total_memory() as f32;
    let used_memory = sys.used_memory() as f32;
    let memory_usage = if total_memory > 0.0 {
        (used_memory / total_memory) * 100.0
    } else {
        0.0
    };
    let memory_total_gb = total_memory / 1024.0 / 1024.0 / 1024.0;
    let memory_used_gb = used_memory / 1024.0 / 1024.0 / 1024.0;

    // Disk usage (all disks) - use sysinfo only, no external commands
    let disks = Disks::new_with_refreshed_list();
    let mut disk_list: Vec<DiskInfo> = disks
        .iter()
        .map(|disk| {
            let total = disk.total_space() as f32;
            let available = disk.available_space() as f32;
            let used = total - available;
            let usage = if total > 0.0 { (used / total) * 100.0 } else { 0.0 };
            let mount_point = disk.mount_point().to_string_lossy().to_string();
            let fs = disk.file_system().to_string_lossy().to_lowercase();
            let is_network = mount_point.starts_with("\\\\")
                || fs.contains("smb")
                || fs.contains("cifs")
                || fs.contains("nfs");

            // Extract drive letter (e.g., "C:" from "C:\\")
            let drive_letter = if mount_point.len() >= 2 && mount_point.ends_with('\\') {
                mount_point[0..2].to_string()
            } else if mount_point.len() >= 2 {
                mount_point[0..2].to_string()
            } else {
                mount_point.clone()
            };

            // Get device name from sysinfo
            let device_name = disk.name().to_string_lossy().to_string();

            DiskInfo {
                mount_point: mount_point.clone(),
                drive_letter,
                device_name,
                total_gb: total / 1024.0 / 1024.0 / 1024.0,
                used_gb: used / 1024.0 / 1024.0 / 1024.0,
                usage,
                is_network,
            }
        })
        .collect();

    // Ensure stable order (mount point)
    disk_list.sort_by(|a, b| a.mount_point.cmp(&b.mount_point));

    let primary_disk = disk_list
        .iter()
        .find(|d| !d.is_network)
        .or_else(|| disk_list.first());

    let (disk_usage, disk_name) = if let Some(disk) = primary_disk {
        (disk.usage, disk.mount_point.clone())
    } else {
        (0.0, "不明".to_string())
    };

    // GPU info (best-effort)
    let gpus: Vec<GpuInfo> = fetch_gpu_info();

    SystemInfo {
        cpu_name,
        cpu_speed_ghz: cpu_frequency,
        cpu_usage,
        cpu_cores,
        memory_usage,
        memory_used_gb,
        memory_total_gb,
        disk_usage,
        disk_name,
        disks: disk_list,
        gpus,
        network_status: "connected".to_string(),
    }
}

#[tauri::command]
pub async fn get_network_info() -> NetworkInfo {
    let result = tauri::async_runtime::spawn_blocking(move || collect_network_info_blocking()).await;

    match result {
        Ok(info) => info,
        Err(_) => NetworkInfo {
            devices_online: 0,
            devices_offline: 0,
            average_latency: 0,
            network_status: "unknown".to_string(),
            interfaces: Vec::new(),
            top_cpu_processes: Vec::new(),
            top_memory_processes: Vec::new(),
        },
    }
}

pub fn collect_network_info_blocking() -> NetworkInfo {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    let networks = Networks::new_with_refreshed_list();
    
    // Count active network interfaces
    let devices_online = networks.iter().count() as u32;
    let interfaces = networks.iter().map(|(name, _)| name.to_string()).collect();
    
    // Get top CPU and memory processes
    let mut processes: Vec<ProcessInfo> = sys.processes()
        .iter()
        .map(|(_, p)| ProcessInfo {
            name: p.name().to_string_lossy().to_string(),
            pid: p.pid().as_u32(),
            cpu_usage: p.cpu_usage().min(100.0), // Clamp to 100% (multi-core can exceed in cumulative)
            memory_mb: (p.memory() / (1024 * 1024)) as u64, // Convert bytes to MB correctly
        })
        .collect();
    
    // Sort by CPU usage
    processes.sort_by(|a, b| b.cpu_usage.partial_cmp(&a.cpu_usage).unwrap_or(std::cmp::Ordering::Equal));
    let top_cpu_processes = processes.iter().take(5).cloned().collect();
    
    // Sort by memory usage
    processes.sort_by(|a, b| b.memory_mb.cmp(&a.memory_mb));
    let top_memory_processes = processes.iter().take(5).cloned().collect();
    
    NetworkInfo {
        devices_online,
        devices_offline: 0,
        average_latency: 5,
        network_status: "connected".to_string(),
        interfaces,
        top_cpu_processes,
        top_memory_processes,
    }
    }

static GPU_CACHE: OnceLock<Arc<Mutex<(Instant, Vec<GpuInfo>)>>> = OnceLock::new();

fn fetch_gpu_info() -> Vec<GpuInfo> {
    let cache_arc = GPU_CACHE.get_or_init(|| {
        Arc::new(Mutex::new((Instant::now() - Duration::from_secs(120), Vec::new())))
    }).clone();

    // Try to get the cache without blocking; if fresh data exists, return it immediately.
    if let Ok(mut cached) = cache_arc.try_lock() {
        if cached.0.elapsed() < Duration::from_secs(60) && !cached.1.is_empty() {
            return cached.1.clone();
        }

        // No fresh data: return current cached value (may be empty) and spawn a background
        // thread to refresh the GPU info so we don't block the caller.
        let current = cached.1.clone();
        // Throttle refresh attempts by updating the timestamp now.
        cached.0 = Instant::now();

        let cache_for_thread = cache_arc.clone();
        std::thread::spawn(move || {
            let fresh = fetch_gpu_info_inner();
            if let Ok(mut locked) = cache_for_thread.lock() {
                locked.0 = Instant::now();
                locked.1 = fresh;
            }
        });

        return current;
    }

    // If we couldn't acquire try_lock (another refresh in progress), return whatever is available.
    if let Ok(locked) = cache_arc.lock() {
        return locked.1.clone();
    }

    // Fallback: perform a direct fetch (should be rare).
    fetch_gpu_info_inner()
}

fn fetch_gpu_info_inner() -> Vec<GpuInfo> {
    #[cfg(target_os = "windows")]
    {
        // Get GPU memory info from WMIC.
        // Use CREATE_NO_WINDOW to avoid flashing a console window and add a short timeout
        // to avoid hangs on slow systems.
        let mut gpus = Vec::new();

        let cmd = Command::new("wmic")
            .args(["path", "win32_VideoController", "get", "Name,AdapterRAM", "/format:csv"])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::piped())
            .spawn();

        if let Ok(mut child) = cmd {
            let start = Instant::now();
            let timeout = Duration::from_secs(2);

            loop {
                match child.try_wait() {
                    Ok(Some(_)) => break,
                    Ok(None) => {
                        if start.elapsed() > timeout {
                            let _ = child.kill();
                            break;
                        }
                        std::thread::sleep(Duration::from_millis(50));
                    }
                    Err(_) => break,
                }
            }

            if let Ok(output) = child.wait_with_output() {
                let stdout = String::from_utf8_lossy(&output.stdout);

                for line in stdout.lines() {
                    let line = line.trim();
                    if line.is_empty() || line.starts_with("Node") {
                        continue;
                    }

                    let parts: Vec<&str> = line.split(',').collect();
                    if parts.len() >= 3 {
                        let name = parts[2].trim();
                        let ram_bytes = parts[1].trim().parse::<u64>().unwrap_or(0);
                        let memory_total_mb = ram_bytes / 1024 / 1024;
                        gpus.push(GpuInfo {
                            name: if name.is_empty() { "GPU".to_string() } else { name.to_string() },
                            usage: 0.0,
                            memory_used_mb: 0,
                            memory_total_mb,
                            memory_usage: 0.0,
                        });
                    }
                }
            }
        }

        if !gpus.is_empty() {
            return gpus;
        }

        vec![GpuInfo {
            name: "GPU".to_string(),
            usage: 0.0,
            memory_used_mb: 0,
            memory_total_mb: 0,
            memory_usage: 0.0,
        }]
    }

    #[cfg(not(target_os = "windows"))]
    {
        vec![GpuInfo {
            name: "GPU".to_string(),
            usage: 0.0,
            memory_used_mb: 0,
            memory_total_mb: 0,
            memory_usage: 0.0,
        }]
    }
}
