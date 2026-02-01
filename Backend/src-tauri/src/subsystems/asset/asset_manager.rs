/**
 * asset_manager.rs
 * URMS Asset Manager (Rust)
 * 
 * デバイス・資産情報の管理
 * 
 * Version: v4.0
 */

use log::info;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::base::base_manager::{BaseManager, ManagerResult, ManagerError, ManagerState};

/// 資産情報
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Asset {
    pub id: String,
    pub name: String,
    pub asset_type: String, // "device", "software", "license"
    pub location: Option<String>,
    pub purchase_date: Option<String>,
    pub warranty: Option<String>,
    pub status: String, // "active", "inactive", "maintenance"
    pub metadata: Option<HashMap<String, String>>,
}

/// Asset Manager 実装
pub struct AssetManager {
    state: ManagerState,
    assets: HashMap<String, Asset>,
}

impl AssetManager {
    /// 新規インスタンス作成
    pub fn new() -> Self {
        AssetManager {
            state: ManagerState::Uninitialized,
            assets: HashMap::new(),
        }
    }

    /// 資産追加
    pub fn add_asset(&mut self, asset: Asset) -> ManagerResult<()> {
        if self.assets.contains_key(&asset.id) {
            return Err(ManagerError::new(
                "AssetManager",
                "add_asset",
                &format!("Asset with ID {} already exists", asset.id),
                "DuplicateId",
            ));
        }

        info!("[AssetManager] Adding asset: {} ({})", asset.name, asset.asset_type);
        self.assets.insert(asset.id.clone(), asset);

        Ok(())
    }

    /// 資産取得
    pub fn get_asset(&self, id: &str) -> ManagerResult<Asset> {
        self.assets
            .get(id)
            .cloned()
            .ok_or_else(|| {
                ManagerError::new(
                    "AssetManager",
                    "get_asset",
                    &format!("Asset with ID {} not found", id),
                    "NotFound",
                )
            })
    }

    /// すべての資産を取得
    pub fn get_all_assets(&self) -> Vec<Asset> {
        self.assets.values().cloned().collect()
    }

    /// 資産更新
    pub fn update_asset(&mut self, id: &str, asset: Asset) -> ManagerResult<()> {
        if !self.assets.contains_key(id) {
            return Err(ManagerError::new(
                "AssetManager",
                "update_asset",
                &format!("Asset with ID {} not found", id),
                "NotFound",
            ));
        }

        info!("[AssetManager] Updating asset: {} ", asset.name);
        self.assets.insert(id.to_string(), asset);

        Ok(())
    }

    /// 資産削除
    pub fn delete_asset(&mut self, id: &str) -> ManagerResult<()> {
        if self.assets.remove(id).is_none() {
            return Err(ManagerError::new(
                "AssetManager",
                "delete_asset",
                &format!("Asset with ID {} not found", id),
                "NotFound",
            ));
        }

        info!("[AssetManager] Asset deleted: {}", id);
        Ok(())
    }

    /// 資産数取得
    pub fn count_assets(&self) -> usize {
        self.assets.len()
    }

    /// ステータス別資産カウント
    pub fn count_by_status(&self, status: &str) -> usize {
        self.assets
            .values()
            .filter(|a| a.status == status)
            .count()
    }
}

/// BaseManager トレイト実装
impl BaseManager for AssetManager {
    fn name(&self) -> &str {
        "AssetManager"
    }

    async fn initialize(&mut self) -> ManagerResult<()> {
        info!("[AssetManager] Initializing...");
        self.state = ManagerState::Initializing;

        // 資産情報をデータベースから初期ロード
        // let assets = load_assets_from_db().await?;
        // for asset in assets {
        //     self.add_asset(asset)?;
        // }

        self.state = ManagerState::Ready;
        info!("[AssetManager] Initialized successfully");
        Ok(())
    }

    async fn shutdown(&mut self) -> ManagerResult<()> {
        info!("[AssetManager] Shutting down, saving {} assets...", self.assets.len());
        // 資産情報をデータベースに保存
        // save_assets_to_db(&self.assets).await?;
        
        self.state = ManagerState::Shutdown;
        Ok(())
    }

    async fn health_check(&self) -> ManagerResult<()> {
        if self.state != ManagerState::Ready {
            return Err(ManagerError::new(
                "AssetManager",
                "health_check",
                "Manager not in Ready state",
                "NotReady",
            ));
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_asset_manager_creation() {
        let manager = AssetManager::new();
        assert_eq!(manager.state, ManagerState::Uninitialized);
        assert_eq!(manager.count_assets(), 0);
    }

    #[test]
    fn test_add_asset() {
        let mut manager = AssetManager::new();
        let asset = Asset {
            id: "asset1".to_string(),
            name: "Test Device".to_string(),
            asset_type: "device".to_string(),
            location: Some("Office".to_string()),
            purchase_date: None,
            warranty: None,
            status: "active".to_string(),
            metadata: None,
        };

        let result = manager.add_asset(asset);
        assert!(result.is_ok());
        assert_eq!(manager.count_assets(), 1);
    }

    #[test]
    fn test_duplicate_asset_id() {
        let mut manager = AssetManager::new();
        let asset = Asset {
            id: "asset1".to_string(),
            name: "Test Device".to_string(),
            asset_type: "device".to_string(),
            location: None,
            purchase_date: None,
            warranty: None,
            status: "active".to_string(),
            metadata: None,
        };

        let _ = manager.add_asset(asset.clone());
        let result = manager.add_asset(asset);
        assert!(result.is_err());
    }

    #[test]
    fn test_count_by_status() {
        let mut manager = AssetManager::new();
        
        let active_asset = Asset {
            id: "asset1".to_string(),
            name: "Active Device".to_string(),
            asset_type: "device".to_string(),
            location: None,
            purchase_date: None,
            warranty: None,
            status: "active".to_string(),
            metadata: None,
        };

        let maintenance_asset = Asset {
            id: "asset2".to_string(),
            name: "Maintenance Device".to_string(),
            asset_type: "device".to_string(),
            location: None,
            purchase_date: None,
            warranty: None,
            status: "maintenance".to_string(),
            metadata: None,
        };

        let _ = manager.add_asset(active_asset);
        let _ = manager.add_asset(maintenance_asset);

        assert_eq!(manager.count_by_status("active"), 1);
        assert_eq!(manager.count_by_status("maintenance"), 1);
        assert_eq!(manager.count_by_status("inactive"), 0);
    }
}
