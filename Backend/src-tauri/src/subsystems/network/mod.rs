// Backend/src-tauri/src/subsystems/network/mod.rs
pub mod network_manager;
pub mod commands;

pub use network_manager::{NetworkDevice, NetworkManager, NetworkStats};
