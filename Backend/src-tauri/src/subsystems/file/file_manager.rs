// Backend/src-tauri/src/subsystems/file/file_manager.rs
// FileManager - ファイルシステム管理
// Version: v4.0

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

/// ファイル情報構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub file_type: String,
    pub modified: u64,
}

/// ストレージ統計構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageStats {
    pub total_size: u64,
    pub used_size: u64,
    pub free_size: u64,
    pub file_count: u64,
    pub category_breakdown: HashMap<String, u64>,
}

/// FileManager 構造体
pub struct FileManager {
    #[allow(dead_code)]
    name: String,
    files: Vec<FileInfo>,
    #[allow(dead_code)]
    storage_stats: StorageStats,
}

impl FileManager {
    /// 新規作成
    pub fn new() -> Self {
        Self {
            name: "FileManager".to_string(),
            files: Vec::new(),
            storage_stats: StorageStats {
                total_size: 0,
                used_size: 0,
                free_size: 0,
                file_count: 0,
                category_breakdown: HashMap::new(),
            },
        }
    }

    /// ディレクトリをスキャン
    pub async fn scan_directory(&mut self, path: &str) -> Result<Vec<FileInfo>, String> {
        let path_obj = Path::new(path);
        
        if !path_obj.exists() {
            return Err(format!("Directory not found: {}", path));
        }

        let mut files = Vec::new();

        if let Ok(entries) = fs::read_dir(path_obj) {
            for entry in entries.flatten() {
                if let Ok(metadata) = entry.metadata() {
                    if metadata.is_file() {
                        let file_path = entry.path();
                        let file_name = entry.file_name();
                        let file_name_str = file_name.to_string_lossy().to_string();

                        files.push(FileInfo {
                            path: file_path.to_string_lossy().to_string(),
                            name: file_name_str,
                            size: metadata.len(),
                            file_type: self.classify_file(file_path.as_os_str()),
                            modified: metadata
                                .modified()
                                .ok()
                                .and_then(|t| t.elapsed().ok())
                                .map(|d| d.as_secs())
                                .unwrap_or(0),
                        });
                    }
                }
            }
        }

        self.files = files.clone();
        Ok(files)
    }

    /// ファイルを分類
    pub fn classify_file(&self, path: &std::ffi::OsStr) -> String {
        let path_str = path.to_string_lossy().to_lowercase();

        if path_str.ends_with(".pdf") || path_str.ends_with(".doc") || path_str.ends_with(".docx") 
            || path_str.ends_with(".txt") || path_str.ends_with(".xls") || path_str.ends_with(".xlsx") {
            "document".to_string()
        } else if path_str.ends_with(".jpg") || path_str.ends_with(".png") 
            || path_str.ends_with(".gif") || path_str.ends_with(".bmp") {
            "image".to_string()
        } else if path_str.ends_with(".mp4") || path_str.ends_with(".avi") 
            || path_str.ends_with(".mkv") || path_str.ends_with(".mov") {
            "video".to_string()
        } else if path_str.ends_with(".mp3") || path_str.ends_with(".wav") 
            || path_str.ends_with(".flac") || path_str.ends_with(".aac") {
            "audio".to_string()
        } else if path_str.ends_with(".zip") || path_str.ends_with(".rar") 
            || path_str.ends_with(".7z") || path_str.ends_with(".tar") {
            "archive".to_string()
        } else {
            "other".to_string()
        }
    }

    /// ストレージ統計を取得
    pub async fn get_storage_stats(&self) -> Result<StorageStats, String> {
        let mut stats = StorageStats {
            total_size: 0,
            used_size: 0,
            free_size: 0,
            file_count: 0,
            category_breakdown: HashMap::new(),
        };

        stats.total_size = 1024 * 1024 * 1024; // 1GB (シミュレーション)
        stats.file_count = self.files.len() as u64;

        let mut total_used = 0u64;
        for file in &self.files {
            total_used += file.size;
            let category = self.classify_file(std::ffi::OsStr::new(&file.name));
            *stats.category_breakdown.entry(category).or_insert(0) += file.size;
        }

        stats.used_size = total_used;
        stats.free_size = stats.total_size.saturating_sub(stats.used_size);

        Ok(stats)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_file_manager() {
        let manager = FileManager::new();
        assert_eq!(manager.name, "FileManager");
        assert_eq!(manager.files.len(), 0);
        assert_eq!(manager.storage_stats.total_size, 0);
    }

    #[test]
    fn test_classify_file_document() {
        let manager = FileManager::new();
        
        assert_eq!(
            manager.classify_file(std::ffi::OsStr::new("document.pdf")),
            "document"
        );
        assert_eq!(
            manager.classify_file(std::ffi::OsStr::new("report.docx")),
            "document"
        );
        assert_eq!(
            manager.classify_file(std::ffi::OsStr::new("spreadsheet.xlsx")),
            "document"
        );
    }

    #[test]
    fn test_classify_file_image() {
        let manager = FileManager::new();
        
        assert_eq!(
            manager.classify_file(std::ffi::OsStr::new("photo.jpg")),
            "image"
        );
        assert_eq!(
            manager.classify_file(std::ffi::OsStr::new("screenshot.png")),
            "image"
        );
        assert_eq!(
            manager.classify_file(std::ffi::OsStr::new("animation.gif")),
            "image"
        );
    }

    #[test]
    fn test_classify_file_video() {
        let manager = FileManager::new();
        
        assert_eq!(
            manager.classify_file(std::ffi::OsStr::new("movie.mp4")),
            "video"
        );
        assert_eq!(
            manager.classify_file(std::ffi::OsStr::new("clip.mkv")),
            "video"
        );
    }

    #[test]
    fn test_classify_file_audio() {
        let manager = FileManager::new();
        
        assert_eq!(
            manager.classify_file(std::ffi::OsStr::new("song.mp3")),
            "audio"
        );
        assert_eq!(
            manager.classify_file(std::ffi::OsStr::new("sound.wav")),
            "audio"
        );
    }

    #[test]
    fn test_classify_file_archive() {
        let manager = FileManager::new();
        
        assert_eq!(
            manager.classify_file(std::ffi::OsStr::new("archive.zip")),
            "archive"
        );
        assert_eq!(
            manager.classify_file(std::ffi::OsStr::new("backup.rar")),
            "archive"
        );
        assert_eq!(
            manager.classify_file(std::ffi::OsStr::new("package.7z")),
            "archive"
        );
    }

    #[test]
    fn test_classify_file_other() {
        let manager = FileManager::new();
        
        assert_eq!(
            manager.classify_file(std::ffi::OsStr::new("random.xyz")),
            "other"
        );
        assert_eq!(
            manager.classify_file(std::ffi::OsStr::new("executable.exe")),
            "other"
        );
    }

    #[test]
    fn test_classify_file_case_insensitive() {
        let manager = FileManager::new();
        
        assert_eq!(
            manager.classify_file(std::ffi::OsStr::new("DOCUMENT.PDF")),
            "document"
        );
        assert_eq!(
            manager.classify_file(std::ffi::OsStr::new("Photo.JPG")),
            "image"
        );
    }

    #[tokio::test]
    async fn test_get_storage_stats_empty() {
        let manager = FileManager::new();
        let stats = manager.get_storage_stats().await.unwrap();
        
        assert_eq!(stats.total_size, 1024 * 1024 * 1024); // 1GB
        assert_eq!(stats.used_size, 0);
        assert_eq!(stats.free_size, 1024 * 1024 * 1024);
        assert_eq!(stats.file_count, 0);
    }

    #[tokio::test]
    async fn test_scan_directory_nonexistent() {
        let mut manager = FileManager::new();
        let result = manager.scan_directory("/nonexistent/path/that/does/not/exist").await;
        
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[test]
    fn test_file_info_structure() {
        let file_info = FileInfo {
            path: "/tmp/test.pdf".to_string(),
            name: "test.pdf".to_string(),
            size: 1024,
            file_type: "document".to_string(),
            modified: 123456789,
        };

        assert_eq!(file_info.path, "/tmp/test.pdf");
        assert_eq!(file_info.name, "test.pdf");
        assert_eq!(file_info.size, 1024);
        assert_eq!(file_info.file_type, "document");
    }
}
