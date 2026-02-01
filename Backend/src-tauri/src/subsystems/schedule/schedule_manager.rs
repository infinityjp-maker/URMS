// Backend/src-tauri/src/subsystems/schedule/schedule_manager.rs
// ScheduleManager - スケジュール管理
// Version: v4.0

use serde::{Deserialize, Serialize};

/// スケジュール構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Schedule {
    pub id: String,
    pub manager_id: String,
    pub title: String,
    pub description: String,
    pub due_date: u64,
    pub recurrence: String, // daily, weekly, monthly, yearly, once
    pub priority: String,   // low, medium, high
    pub completed: bool,
}

/// ScheduleManager 構造体
pub struct ScheduleManager {
    #[allow(dead_code)]
    name: String,
    schedules: Vec<Schedule>,
}

impl ScheduleManager {
    /// 新規作成
    pub fn new() -> Self {
        Self {
            name: "ScheduleManager".to_string(),
            schedules: Vec::new(),
        }
    }

    /// 初期化
    pub async fn initialize(&mut self) -> Result<(), String> {
        Ok(())
    }

    /// スケジュールを作成
    pub async fn create_schedule(
        &mut self,
        manager_id: &str,
        title: &str,
        due_date: u64,
        recurrence: &str,
        priority: &str,
    ) -> Result<Schedule, String> {
        let schedule = Schedule {
            id: format!("schedule_{}", self.schedules.len() + 1),
            manager_id: manager_id.to_string(),
            title: title.to_string(),
            description: String::new(),
            due_date,
            recurrence: recurrence.to_string(),
            priority: priority.to_string(),
            completed: false,
        };

        self.schedules.push(schedule.clone());
        Ok(schedule)
    }

    /// スケジュールを更新
    pub async fn update_schedule(
        &mut self,
        id: &str,
        title: Option<&str>,
        priority: Option<&str>,
    ) -> Result<Schedule, String> {
        let schedule = self
            .schedules
            .iter_mut()
            .find(|s| s.id == id)
            .ok_or_else(|| format!("Schedule {} not found", id))?;

        if let Some(t) = title {
            schedule.title = t.to_string();
        }
        if let Some(p) = priority {
            schedule.priority = p.to_string();
        }

        Ok(schedule.clone())
    }

    /// スケジュールを削除
    pub async fn delete_schedule(&mut self, id: &str) -> Result<bool, String> {
        if let Some(pos) = self.schedules.iter().position(|s| s.id == id) {
            self.schedules.remove(pos);
            Ok(true)
        } else {
            Err(format!("Schedule {} not found", id))
        }
    }

    /// 今後のスケジュールを取得（n 日間）
    pub async fn get_upcoming_schedules(&self, days: u32) -> Result<Vec<Schedule>, String> {
        let current_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let end_time = current_time + (days as u64 * 86400);

        let upcoming: Vec<Schedule> = self
            .schedules
            .iter()
            .filter(|s| s.due_date >= current_time && s.due_date <= end_time && !s.completed)
            .cloned()
            .collect();

        Ok(upcoming)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_schedule_manager() {
        let manager = ScheduleManager::new();
        assert_eq!(manager.name, "ScheduleManager");
        assert_eq!(manager.schedules.len(), 0);
    }

    #[tokio::test]
    async fn test_initialize() {
        let mut manager = ScheduleManager::new();
        let result = manager.initialize().await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_create_schedule() {
        let mut manager = ScheduleManager::new();
        
        let schedule = manager.create_schedule(
            "mgr_001",
            "Team Meeting",
            1700000000,
            "weekly",
            "high",
        ).await.unwrap();

        assert_eq!(schedule.manager_id, "mgr_001");
        assert_eq!(schedule.title, "Team Meeting");
        assert_eq!(schedule.recurrence, "weekly");
        assert_eq!(schedule.priority, "high");
        assert_eq!(schedule.completed, false);
    }

    #[tokio::test]
    async fn test_create_multiple_schedules() {
        let mut manager = ScheduleManager::new();
        
        manager.create_schedule("mgr_001", "Meeting 1", 1700000000, "daily", "high").await.unwrap();
        manager.create_schedule("mgr_002", "Meeting 2", 1700000100, "weekly", "medium").await.unwrap();
        manager.create_schedule("mgr_003", "Meeting 3", 1700000200, "monthly", "low").await.unwrap();

        assert_eq!(manager.schedules.len(), 3);
    }

    #[tokio::test]
    async fn test_update_schedule_title() {
        let mut manager = ScheduleManager::new();
        
        let schedule = manager.create_schedule(
            "mgr_001",
            "Old Title",
            1700000000,
            "weekly",
            "high",
        ).await.unwrap();

        let updated = manager.update_schedule(&schedule.id, Some("New Title"), None).await.unwrap();
        assert_eq!(updated.title, "New Title");
    }

    #[tokio::test]
    async fn test_update_schedule_priority() {
        let mut manager = ScheduleManager::new();
        
        let schedule = manager.create_schedule(
            "mgr_001",
            "Task",
            1700000000,
            "weekly",
            "low",
        ).await.unwrap();

        let updated = manager.update_schedule(&schedule.id, None, Some("high")).await.unwrap();
        assert_eq!(updated.priority, "high");
    }

    #[tokio::test]
    async fn test_update_schedule_nonexistent() {
        let mut manager = ScheduleManager::new();
        
        let result = manager.update_schedule("nonexistent", Some("Title"), None).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_delete_schedule_success() {
        let mut manager = ScheduleManager::new();
        
        let schedule = manager.create_schedule(
            "mgr_001",
            "Task",
            1700000000,
            "once",
            "low",
        ).await.unwrap();

        let deleted = manager.delete_schedule(&schedule.id).await.unwrap();
        assert_eq!(deleted, true);
        assert_eq!(manager.schedules.len(), 0);
    }

    #[tokio::test]
    async fn test_delete_schedule_nonexistent() {
        let mut manager = ScheduleManager::new();
        
        let result = manager.delete_schedule("nonexistent").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_get_upcoming_schedules_future() {
        let mut manager = ScheduleManager::new();
        
        let future_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() + 86400; // 1 day in the future

        manager.create_schedule(
            "mgr_001",
            "Future Task",
            future_time,
            "once",
            "high",
        ).await.unwrap();

        let upcoming = manager.get_upcoming_schedules(7).await.unwrap();
        assert!(upcoming.len() > 0);
    }

    #[tokio::test]
    async fn test_get_upcoming_schedules_past() {
        let mut manager = ScheduleManager::new();
        
        let past_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() - 86400; // 1 day in the past

        manager.create_schedule(
            "mgr_001",
            "Past Task",
            past_time,
            "once",
            "high",
        ).await.unwrap();

        let upcoming = manager.get_upcoming_schedules(7).await.unwrap();
        assert_eq!(upcoming.len(), 0);
    }

    #[tokio::test]
    async fn test_get_upcoming_schedules_completed() {
        let mut manager = ScheduleManager::new();
        
        let future_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() + 86400;

        let schedule = manager.create_schedule(
            "mgr_001",
            "Future Task",
            future_time,
            "once",
            "high",
        ).await.unwrap();

        // Mark as completed
        let mut completed = schedule.clone();
        completed.completed = true;
        if let Some(idx) = manager.schedules.iter().position(|s| s.id == schedule.id) {
            manager.schedules[idx].completed = true;
        }

        let upcoming = manager.get_upcoming_schedules(7).await.unwrap();
        assert_eq!(upcoming.len(), 0);
    }

    #[test]
    fn test_schedule_structure() {
        let schedule = Schedule {
            id: "schedule_001".to_string(),
            manager_id: "mgr_001".to_string(),
            title: "Team Meeting".to_string(),
            description: "Weekly sync".to_string(),
            due_date: 1700000000,
            recurrence: "weekly".to_string(),
            priority: "high".to_string(),
            completed: false,
        };

        assert_eq!(schedule.id, "schedule_001");
        assert_eq!(schedule.title, "Team Meeting");
        assert_eq!(schedule.recurrence, "weekly");
        assert_eq!(schedule.priority, "high");
    }

    #[tokio::test]
    async fn test_recurrence_patterns() {
        let mut manager = ScheduleManager::new();
        
        let daily = manager.create_schedule("mgr_001", "Daily", 1700000000, "daily", "low").await.unwrap();
        let weekly = manager.create_schedule("mgr_002", "Weekly", 1700000000, "weekly", "low").await.unwrap();
        let monthly = manager.create_schedule("mgr_003", "Monthly", 1700000000, "monthly", "low").await.unwrap();
        let yearly = manager.create_schedule("mgr_004", "Yearly", 1700000000, "yearly", "low").await.unwrap();
        let once = manager.create_schedule("mgr_005", "Once", 1700000000, "once", "low").await.unwrap();

        assert_eq!(daily.recurrence, "daily");
        assert_eq!(weekly.recurrence, "weekly");
        assert_eq!(monthly.recurrence, "monthly");
        assert_eq!(yearly.recurrence, "yearly");
        assert_eq!(once.recurrence, "once");
    }

    #[tokio::test]
    async fn test_priority_levels() {
        let mut manager = ScheduleManager::new();
        
        let low = manager.create_schedule("mgr_001", "Low", 1700000000, "once", "low").await.unwrap();
        let medium = manager.create_schedule("mgr_002", "Medium", 1700000000, "once", "medium").await.unwrap();
        let high = manager.create_schedule("mgr_003", "High", 1700000000, "once", "high").await.unwrap();

        assert_eq!(low.priority, "low");
        assert_eq!(medium.priority, "medium");
        assert_eq!(high.priority, "high");
    }
}
