use serde_json::Value;
use std::sync::OnceLock;

use crate::subsystems::calendar::google_adapter;

pub struct CalendarManager {
    events: Vec<Value>,
}

impl CalendarManager {
    pub fn new() -> Self {
        Self { events: Vec::new() }
    }

    pub async fn sync_with_google(&mut self, api_key: &str, calendar_id: &str, max_results: u32) -> Result<Vec<Value>, String> {
        match google_adapter::fetch_google_events(api_key, calendar_id, max_results).await {
            Ok(json) => {
                // store raw items if present
                if let Some(items) = json.get("items").and_then(|v| v.as_array()) {
                    self.events = items.clone();
                }
                Ok(self.events.clone())
            }
            Err(e) => Err(e),
        }
    }

    pub fn get_events(&self, max_results: usize) -> Vec<Value> {
        let mut out = Vec::new();
        for (i, ev) in self.events.iter().enumerate() {
            if i >= max_results { break; }
            out.push(ev.clone());
        }
        out
    }
}

static CAL_MANAGER: OnceLock<tokio::sync::Mutex<CalendarManager>> = OnceLock::new();

pub fn instance() -> &'static tokio::sync::Mutex<CalendarManager> {
    CAL_MANAGER.get_or_init(|| tokio::sync::Mutex::new(CalendarManager::new()))
}
