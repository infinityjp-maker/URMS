import { invoke } from "@tauri-apps/api/core";

export interface SystemInfo {
  cpu_name: string;
  cpu_speed_ghz: number;
  cpu_usage: number;
  cpu_cores: number;
  memory_usage: number;
  memory_used_gb: number;
  memory_total_gb: number;
  disk_usage: number;
  disk_name: string;
  disks: {
    mount_point: string;
    drive_letter: string;
    device_name: string;
    total_gb: number;
    used_gb: number;
    usage: number;
    is_network: boolean;
  }[];
  gpus: {
    name: string;
    usage: number;
    memory_used_mb: number;
    memory_total_mb: number;
    memory_usage: number;
  }[];
  network_status: string;
}

export interface ProcessInfo {
  name: string;
  pid: number;
  cpu_usage: number;
  memory_mb: number;
}

export interface NetworkInfo {
  devices_online: number;
  devices_offline: number;
  average_latency: number;
  network_status: string;
  interfaces: string[];
  top_cpu_processes: ProcessInfo[];
  top_memory_processes: ProcessInfo[];
}

export async function getSystemInfo(): Promise<SystemInfo> {
  try {
    const info = await invoke<SystemInfo>("get_system_info");
    return info;
  } catch (error) {
    console.warn("Failed to get system info, using mock data:", error);
    // Fallback to mock data if Tauri command fails
    return {
      cpu_name: "Intel Core i7-12700K",
      cpu_speed_ghz: 3.6,
      cpu_usage: Math.random() * 100,
      cpu_cores: 8,
      memory_usage: Math.random() * 100,
      memory_used_gb: 8,
      memory_total_gb: 16,
      disk_usage: Math.random() * 100,
      disk_name: "C:\\",
      disks: [
        {
          mount_point: "C:\\",
          drive_letter: "C:",
          device_name: "SAMSUNG SSD 970",
          total_gb: 512,
          used_gb: 256,
          usage: 50,
          is_network: false
        }
      ],
      gpus: [
        {
          name: "NVIDIA GeForce RTX 3070",
          usage: 0,
          memory_used_mb: 0,
          memory_total_mb: 8192,
          memory_usage: 0
        }
      ],
      network_status: "connected"
    };
  }
}

export async function getNetworkInfo(): Promise<NetworkInfo> {
  try {
    return await invoke<NetworkInfo>("get_network_info");
  } catch (error) {
    console.warn("Failed to get network info:", error);
    return {
      devices_online: 4,
      devices_offline: 1,
      average_latency: 9,
      network_status: "connected",
      interfaces: ["Ethernet", "Wi-Fi"],
      top_cpu_processes: [
        { name: "PowerShell", pid: 1234, cpu_usage: 12, memory_mb: 680 },
        { name: "VS Code", pid: 5678, cpu_usage: 2, memory_mb: 420 }
      ],
      top_memory_processes: [
        { name: "PowerShell", pid: 1234, cpu_usage: 12, memory_mb: 680 },
        { name: "VS Code", pid: 5678, cpu_usage: 2, memory_mb: 420 }
      ]
    };
  }
}
