// Backend/src-tauri/src/subsystems/finance/commands.rs
// Tauri commands for FinanceManager

use std::sync::LazyLock;
use tokio::sync::Mutex;

use super::{Budget, Expense, FinanceManager, MonthlyReport};

static FINANCE_MANAGER: LazyLock<Mutex<FinanceManager>> =
    LazyLock::new(|| Mutex::new(FinanceManager::new()));

#[tauri::command]
pub async fn finance_manager_record_expense(
    manager_id: String,
    description: String,
    amount: f64,
    category: String,
) -> Result<Expense, String> {
    let mut manager = FINANCE_MANAGER.lock().await;
    manager
        .record_expense(&manager_id, &description, amount, &category)
        .await
}

#[tauri::command]
pub async fn finance_manager_set_budget(
    category: String,
    limit: f64,
) -> Result<Budget, String> {
    let mut manager = FINANCE_MANAGER.lock().await;
    manager.set_budget(&category, limit).await
}

#[tauri::command]
pub async fn finance_manager_get_budgets() -> Result<Vec<Budget>, String> {
    let manager = FINANCE_MANAGER.lock().await;
    manager.get_budgets().await
}

#[tauri::command]
pub async fn finance_manager_get_monthly_report() -> Result<MonthlyReport, String> {
    let manager = FINANCE_MANAGER.lock().await;
    manager.get_monthly_report().await
}
