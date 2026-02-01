/**
 * error.rs
 * URMS 統一エラー型
 * 
 * すべての Rust 処理は URMSError を使用してエラーハンドリングを統一
 * 
 * Version: v4.0
 */

use serde::{Deserialize, Serialize};
use std::fmt;

/// URMS 統一エラー型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum URMSError {
    /// I/O エラー
    IoError {
        message: String,
        #[serde(skip)]
        context: Option<String>,
    },

    /// ネットワークエラー
    NetworkError {
        message: String,
    },

    /// リソースが見つからない
    NotFound {
        resource: String,
    },

    /// 権限エラー
    PermissionDenied {
        resource: String,
    },

    /// タイムアウト
    Timeout {
        operation: String,
    },

    /// 内部エラー
    Internal {
        message: String,
    },

    /// バリデーションエラー
    ValidationError {
        field: String,
        reason: String,
    },

    /// 設定エラー
    ConfigError {
        message: String,
    },
}

impl fmt::Display for URMSError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            URMSError::IoError { message, .. } => write!(f, "IO Error: {}", message),
            URMSError::NetworkError { message } => write!(f, "Network Error: {}", message),
            URMSError::NotFound { resource } => write!(f, "Not Found: {}", resource),
            URMSError::PermissionDenied { resource } => write!(f, "Permission Denied: {}", resource),
            URMSError::Timeout { operation } => write!(f, "Timeout: {}", operation),
            URMSError::Internal { message } => write!(f, "Internal Error: {}", message),
            URMSError::ValidationError { field, reason } => {
                write!(f, "Validation Error - {}: {}", field, reason)
            }
            URMSError::ConfigError { message } => write!(f, "Config Error: {}", message),
        }
    }
}

impl From<std::io::Error> for URMSError {
    fn from(err: std::io::Error) -> Self {
        URMSError::IoError {
            message: err.to_string(),
            context: None,
        }
    }
}

impl From<String> for URMSError {
    fn from(err: String) -> Self {
        URMSError::Internal { message: err }
    }
}

impl From<&str> for URMSError {
    fn from(err: &str) -> Self {
        URMSError::Internal {
            message: err.to_string(),
        }
    }
}

/// Result 型のエイリアス
pub type Result<T> = std::result::Result<T, URMSError>;

/// エラーログ出力
pub fn log_error(manager: &str, operation: &str, error: &URMSError) {
    log::error!(
        "[{}] Operation '{}' failed: {}",
        manager,
        operation,
        error.to_string()
    );
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_io_error_conversion() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "file not found");
        let urms_err: URMSError = io_err.into();
        match urms_err {
            URMSError::IoError { .. } => (),
            _ => panic!("Expected IoError"),
        }
    }

    #[test]
    fn test_validation_error_display() {
        let err = URMSError::ValidationError {
            field: "email".to_string(),
            reason: "Invalid format".to_string(),
        };
        assert!(err.to_string().contains("email"));
    }
}
