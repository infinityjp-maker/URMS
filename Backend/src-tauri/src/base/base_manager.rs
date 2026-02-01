/**
 * base_manager.rs
 * URMS Manager 基底クラス（Rust）
 * 
 * すべての Rust-side Manager はこのモジュールを参照すべき
 * 
 * Version: v4.0
 */

use log::{info, error};
use serde::{Deserialize, Serialize};

/// Manager の初期化状態
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ManagerState {
    Uninitialized,
    Initializing,
    Ready,
    Shutdown,
}

/// エラーハンドリング用の統一エラー構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManagerError {
    pub manager: String,
    pub operation: String,
    pub message: String,
    pub error_type: String,
}

impl ManagerError {
    pub fn new(manager: &str, operation: &str, message: &str, error_type: &str) -> Self {
        ManagerError {
            manager: manager.to_string(),
            operation: operation.to_string(),
            message: message.to_string(),
            error_type: error_type.to_string(),
        }
    }

    pub fn log(&self) {
        error!(
            "[{}] {} failed: {} ({})",
            self.manager, self.operation, self.message, self.error_type
        );
    }
}

/// Result 型エイリアス
pub type ManagerResult<T> = Result<T, ManagerError>;

/// Manager ライフサイクル trait
#[allow(async_fn_in_trait)]
pub trait BaseManager: Send + Sync {
    /// Manager 名
    fn name(&self) -> &str;

    /// 初期化処理
    async fn initialize(&mut self) -> ManagerResult<()> {
        info!("[{}] Initializing Manager...", self.name());
        Ok(())
    }

    /// シャットダウン処理
    async fn shutdown(&mut self) -> ManagerResult<()> {
        info!("[{}] Shutting down Manager...", self.name());
        Ok(())
    }

    /// ヘルスチェック
    async fn health_check(&self) -> ManagerResult<()> {
        Ok(())
    }
}

/// Manager コンテナ
pub struct ManagerRegistry {
    managers: std::collections::HashMap<String, ManagerState>,
}

impl ManagerRegistry {
    pub fn new() -> Self {
        ManagerRegistry {
            managers: std::collections::HashMap::new(),
        }
    }

    pub fn register(&mut self, name: &str) {
        self.managers.insert(name.to_string(), ManagerState::Uninitialized);
    }

    pub fn get_state(&self, name: &str) -> Option<ManagerState> {
        self.managers.get(name).copied()
    }

    pub fn set_state(&mut self, name: &str, state: ManagerState) {
        self.managers.insert(name.to_string(), state);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_manager_error_creation() {
        let err = ManagerError::new("TestManager", "test_op", "test message", "TestError");
        assert_eq!(err.manager, "TestManager");
        assert_eq!(err.operation, "test_op");
    }

    #[test]
    fn test_manager_registry() {
        let mut registry = ManagerRegistry::new();
        registry.register("TestManager");
        assert_eq!(registry.get_state("TestManager"), Some(ManagerState::Uninitialized));
    }
}
