// Backend/src-tauri/src/subsystems/finance/finance_manager.rs
// FinanceManager - 財務管理
// Version: v4.0

use serde::{Deserialize, Serialize};

/// 支出記録構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Expense {
    pub id: String,
    pub manager_id: String,
    pub description: String,
    pub amount: f64,
    pub category: String,
    pub date: u64,
}

/// 予算構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Budget {
    pub category: String,
    pub limit: f64,
    pub spent: f64,
}

/// 月次レポート構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonthlyReport {
    pub month: u32,
    pub year: u32,
    pub total_spent: f64,
    pub by_category: std::collections::HashMap<String, f64>,
}

/// FinanceManager 構造体
pub struct FinanceManager {
    #[allow(dead_code)]
    name: String,
    expenses: Vec<Expense>,
    budgets: std::collections::HashMap<String, f64>,
}

impl FinanceManager {
    /// 新規作成
    pub fn new() -> Self {
        let mut budgets = std::collections::HashMap::new();
        budgets.insert("food".to_string(), 500.0);
        budgets.insert("transport".to_string(), 300.0);
        budgets.insert("utilities".to_string(), 200.0);
        budgets.insert("entertainment".to_string(), 150.0);
        budgets.insert("other".to_string(), 100.0);

        Self {
            name: "FinanceManager".to_string(),
            expenses: Vec::new(),
            budgets,
        }
    }

    /// 初期化
    pub async fn initialize(&mut self) -> Result<(), String> {
        Ok(())
    }

    /// 支出を記録
    pub async fn record_expense(
        &mut self,
        manager_id: &str,
        description: &str,
        amount: f64,
        category: &str,
    ) -> Result<Expense, String> {
        let expense = Expense {
            id: format!("expense_{}", self.expenses.len() + 1),
            manager_id: manager_id.to_string(),
            description: description.to_string(),
            amount,
            category: category.to_string(),
            date: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };

        self.expenses.push(expense.clone());
        Ok(expense)
    }

    /// 予算を設定
    pub async fn set_budget(&mut self, category: &str, limit: f64) -> Result<Budget, String> {
        self.budgets.insert(category.to_string(), limit);

        let spent = self
            .expenses
            .iter()
            .filter(|e| e.category == category)
            .map(|e| e.amount)
            .sum::<f64>();

        Ok(Budget {
            category: category.to_string(),
            limit,
            spent,
        })
    }

    /// 予算を取得
    pub async fn get_budgets(&self) -> Result<Vec<Budget>, String> {
        let mut budgets = Vec::new();

        for (category, limit) in &self.budgets {
            let spent = self
                .expenses
                .iter()
                .filter(|e| &e.category == category)
                .map(|e| e.amount)
                .sum::<f64>();

            budgets.push(Budget {
                category: category.clone(),
                limit: *limit,
                spent,
            });
        }

        Ok(budgets)
    }

    /// 月次レポートを取得
    pub async fn get_monthly_report(&self) -> Result<MonthlyReport, String> {
        let now = std::time::SystemTime::now();
        let duration = now
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap();

        let secs_per_month = 30 * 24 * 60 * 60;
        let current_month_start = duration.as_secs() - (duration.as_secs() % secs_per_month);

        let mut by_category = std::collections::HashMap::new();
        let mut total_spent = 0.0;

        for expense in &self.expenses {
            if expense.date >= current_month_start {
                *by_category
                    .entry(expense.category.clone())
                    .or_insert(0.0) += expense.amount;
                total_spent += expense.amount;
            }
        }

        Ok(MonthlyReport {
            month: 1,
            year: 2026,
            total_spent,
            by_category,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_finance_manager() {
        let manager = FinanceManager::new();
        assert_eq!(manager.name, "FinanceManager");
        assert_eq!(manager.expenses.len(), 0);
        assert!(manager.budgets.len() > 0);
    }

    #[test]
    fn test_default_budgets() {
        let manager = FinanceManager::new();
        
        assert_eq!(manager.budgets.get("food"), Some(&500.0));
        assert_eq!(manager.budgets.get("transport"), Some(&300.0));
        assert_eq!(manager.budgets.get("utilities"), Some(&200.0));
        assert_eq!(manager.budgets.get("entertainment"), Some(&150.0));
        assert_eq!(manager.budgets.get("other"), Some(&100.0));
    }

    #[tokio::test]
    async fn test_initialize() {
        let mut manager = FinanceManager::new();
        let result = manager.initialize().await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_record_expense() {
        let mut manager = FinanceManager::new();
        
        let expense = manager.record_expense(
            "mgr_001",
            "Lunch at restaurant",
            25.50,
            "food",
        ).await.unwrap();

        assert_eq!(expense.manager_id, "mgr_001");
        assert_eq!(expense.description, "Lunch at restaurant");
        assert_eq!(expense.amount, 25.50);
        assert_eq!(expense.category, "food");
    }

    #[tokio::test]
    async fn test_record_multiple_expenses() {
        let mut manager = FinanceManager::new();
        
        manager.record_expense("mgr_001", "Lunch", 25.50, "food").await.unwrap();
        manager.record_expense("mgr_001", "Gas", 50.0, "transport").await.unwrap();
        manager.record_expense("mgr_001", "Movie", 15.0, "entertainment").await.unwrap();

        assert_eq!(manager.expenses.len(), 3);
    }

    #[tokio::test]
    async fn test_set_budget() {
        let mut manager = FinanceManager::new();
        
        let budget = manager.set_budget("dining", 400.0).await.unwrap();
        
        assert_eq!(budget.category, "dining");
        assert_eq!(budget.limit, 400.0);
        assert_eq!(budget.spent, 0.0);
    }

    #[tokio::test]
    async fn test_set_budget_with_existing_expenses() {
        let mut manager = FinanceManager::new();
        
        manager.record_expense("mgr_001", "Lunch", 25.50, "food").await.unwrap();
        manager.record_expense("mgr_001", "Dinner", 35.50, "food").await.unwrap();
        
        let budget = manager.set_budget("food", 500.0).await.unwrap();
        
        assert_eq!(budget.spent, 61.0);
    }

    #[tokio::test]
    async fn test_get_budgets_empty() {
        let manager = FinanceManager::new();
        let budgets = manager.get_budgets().await.unwrap();
        
        assert!(budgets.len() > 0);
        assert!(budgets.iter().any(|b| b.category == "food"));
    }

    #[tokio::test]
    async fn test_get_budgets_with_expenses() {
        let mut manager = FinanceManager::new();
        
        manager.record_expense("mgr_001", "Lunch", 25.50, "food").await.unwrap();
        manager.record_expense("mgr_001", "Gas", 50.0, "transport").await.unwrap();
        
        let budgets = manager.get_budgets().await.unwrap();
        
        let food_budget = budgets.iter().find(|b| b.category == "food").unwrap();
        assert_eq!(food_budget.spent, 25.50);
        assert_eq!(food_budget.limit, 500.0);
        
        let transport_budget = budgets.iter().find(|b| b.category == "transport").unwrap();
        assert_eq!(transport_budget.spent, 50.0);
        assert_eq!(transport_budget.limit, 300.0);
    }

    #[tokio::test]
    async fn test_monthly_report_empty() {
        let manager = FinanceManager::new();
        let report = manager.get_monthly_report().await.unwrap();
        
        assert_eq!(report.total_spent, 0.0);
        assert_eq!(report.by_category.len(), 0);
    }

    #[tokio::test]
    async fn test_monthly_report_with_expenses() {
        let mut manager = FinanceManager::new();
        
        manager.record_expense("mgr_001", "Lunch", 25.50, "food").await.unwrap();
        manager.record_expense("mgr_001", "Dinner", 35.50, "food").await.unwrap();
        manager.record_expense("mgr_001", "Gas", 50.0, "transport").await.unwrap();
        
        let report = manager.get_monthly_report().await.unwrap();
        
        assert_eq!(report.total_spent, 111.0);
        assert_eq!(report.by_category.get("food"), Some(&61.0));
        assert_eq!(report.by_category.get("transport"), Some(&50.0));
    }

    #[test]
    fn test_expense_structure() {
        let expense = Expense {
            id: "expense_001".to_string(),
            manager_id: "mgr_001".to_string(),
            description: "Lunch".to_string(),
            amount: 25.50,
            category: "food".to_string(),
            date: 1700000000,
        };

        assert_eq!(expense.id, "expense_001");
        assert_eq!(expense.description, "Lunch");
        assert_eq!(expense.amount, 25.50);
        assert_eq!(expense.category, "food");
    }

    #[test]
    fn test_budget_structure() {
        let budget = Budget {
            category: "food".to_string(),
            limit: 500.0,
            spent: 100.0,
        };

        assert_eq!(budget.category, "food");
        assert_eq!(budget.limit, 500.0);
        assert_eq!(budget.spent, 100.0);
    }

    #[test]
    fn test_monthly_report_structure() {
        let mut by_category = std::collections::HashMap::new();
        by_category.insert("food".to_string(), 100.0);
        by_category.insert("transport".to_string(), 50.0);

        let report = MonthlyReport {
            month: 1,
            year: 2026,
            total_spent: 150.0,
            by_category,
        };

        assert_eq!(report.month, 1);
        assert_eq!(report.year, 2026);
        assert_eq!(report.total_spent, 150.0);
    }

    #[tokio::test]
    async fn test_multiple_categories() {
        let mut manager = FinanceManager::new();
        
        manager.record_expense("mgr_001", "Lunch", 25.0, "food").await.unwrap();
        manager.record_expense("mgr_001", "Gas", 50.0, "transport").await.unwrap();
        manager.record_expense("mgr_001", "Electric", 100.0, "utilities").await.unwrap();
        manager.record_expense("mgr_001", "Movie", 15.0, "entertainment").await.unwrap();

        let report = manager.get_monthly_report().await.unwrap();
        assert_eq!(report.total_spent, 190.0);
        assert_eq!(report.by_category.len(), 4);
    }

    #[tokio::test]
    async fn test_budget_percentage_calculation() {
        let mut manager = FinanceManager::new();
        
        // Food budget: 500, spend 250 (50%)
        manager.record_expense("mgr_001", "Lunch", 250.0, "food").await.unwrap();
        
        let budgets = manager.get_budgets().await.unwrap();
        let food_budget = budgets.iter().find(|b| b.category == "food").unwrap();
        
        let percentage = (food_budget.spent / food_budget.limit) * 100.0;
        assert_eq!(percentage, 50.0);
    }
}
