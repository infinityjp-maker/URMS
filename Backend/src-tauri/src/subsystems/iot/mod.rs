// Backend/src-tauri/src/subsystems/iot/mod.rs
pub mod iot_manager;
pub mod commands;

pub use iot_manager::{ControlResult, IoTDevice, IoTManager};
