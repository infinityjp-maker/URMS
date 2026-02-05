use serde_json::Value;
use std::sync::OnceLock;
use futures::future::BoxFuture;

/// Provider trait for fetching Google calendar events using API key
pub trait GoogleProvider: Send + Sync + 'static {
    fn fetch_google_events(&self, api_key: String, calendar_id: String, max_results: u32) -> BoxFuture<'static, Result<Value, String>>;
}

/// Provider trait for OAuth-based calendar sync/refresh
pub trait OAuthProvider: Send + Sync + 'static {
    fn sync_with_oauth(&self, calendar_id: String, max_results: Option<u32>) -> BoxFuture<'static, Result<Vec<Value>, String>>;
}

pub struct CalendarManager {
    events: Vec<Value>,
    google_provider: Box<dyn GoogleProvider>,
    oauth_provider: Box<dyn OAuthProvider>,
}

impl CalendarManager {
    pub fn new(google: Box<dyn GoogleProvider>, oauth: Box<dyn OAuthProvider>) -> Self {
        Self { events: Vec::new(), google_provider: google, oauth_provider: oauth }
    }

    pub async fn sync_with_google(&mut self, api_key: &str, calendar_id: &str, max_results: u32) -> Result<Vec<Value>, String> {
        match self.google_provider.fetch_google_events(api_key.to_string(), calendar_id.to_string(), max_results).await {
            Ok(json) => {
                if let Some(items) = json.get("items").and_then(|v| v.as_array()) {
                    self.events = items.clone();
                }
                Ok(self.events.clone())
            }
            Err(e) => Err(e),
        }
    }

    pub async fn sync_with_oauth(&mut self, calendar_id: &str, max_results: Option<u32>) -> Result<Vec<Value>, String> {
        match self.oauth_provider.sync_with_oauth(calendar_id.to_string(), max_results).await {
            Ok(items) => {
                self.events = items.clone();
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

/// Initialize or return the singleton CalendarManager using default providers.
pub fn instance() -> &'static tokio::sync::Mutex<CalendarManager> {
    use crate::subsystems::calendar::google_adapter;
    use crate::subsystems::calendar::auth_adapter;

    struct DefaultGoogle;
    impl GoogleProvider for DefaultGoogle {
        fn fetch_google_events(&self, api_key: String, calendar_id: String, max_results: u32) -> BoxFuture<'static, Result<Value, String>> {
            Box::pin(async move { google_adapter::fetch_google_events(&api_key, &calendar_id, max_results).await })
        }
    }

    struct DefaultOAuth;
    impl OAuthProvider for DefaultOAuth {
        fn sync_with_oauth(&self, calendar_id: String, max_results: Option<u32>) -> BoxFuture<'static, Result<Vec<Value>, String>> {
            Box::pin(async move { auth_adapter::sync_with_oauth(calendar_id, max_results).await })
        }
    }

    CAL_MANAGER.get_or_init(|| {
        let google: Box<dyn GoogleProvider> = Box::new(DefaultGoogle);
        let oauth: Box<dyn OAuthProvider> = Box::new(DefaultOAuth);
        tokio::sync::Mutex::new(CalendarManager::new(google, oauth))
    })
}
