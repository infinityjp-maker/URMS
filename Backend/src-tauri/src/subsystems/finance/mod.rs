// Backend/src-tauri/src/subsystems/finance/mod.rs
pub mod finance_manager;
pub mod commands;

pub use finance_manager::{Budget, Expense, FinanceManager, MonthlyReport};
