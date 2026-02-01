// Backend/src-tauri/src/subsystems/file/mod.rs
pub mod file_manager;
pub mod commands;

pub use file_manager::{FileInfo, FileManager, StorageStats};
