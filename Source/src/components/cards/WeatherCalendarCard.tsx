import { useEffect, useState } from 'react';
import './WeatherCalendarCard.css';

type Weather = {
  temperature?: number;
  weathercode?: number | null;
};

type EventItem = {
  id?: string;
  summary?: string;
  start?: any;
  end?: any;
};

export default function WeatherCalendarCard() {
  const [weather, setWeather] = useState<Weather>({});
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [recentlyUpdated, setRecentlyUpdated] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const fetchWeather = async () => {
    try {
      const mod = await import('@tauri-apps/api/tauri');
      const tauri = mod.default || mod;
      const res = await tauri.invoke('get_weather', { lat: 35.6895, lon: 139.6917 });
      if (res && res.current_weather) {
        setWeather({ temperature: res.current_weather.temperature, weathercode: res.current_weather.weathercode });
      }
    } catch (e) {
      console.warn('weather fetch failed', e);
    }
  };

  const fetchEvents = async () => {
    try {
      const mod = await import('@tauri-apps/api/tauri');
      const tauri = mod.default || mod;
      // Prefer OAuth-based sync if tokens exist
      try {
        const tok = await tauri.invoke('calendar_get_oauth_tokens');
        if (tok && Object.keys(tok).length) {
          const creds: any = await tauri.invoke('settings_get_google_credentials');
          const calendarId = creds?.google_calendar_id || 'primary';
          const res = await tauri.invoke('calendar_sync_with_oauth', { calendar_id: calendarId, max_results: 5 });
          if (Array.isArray(res)) { setEvents(res as EventItem[]); return; }
        }
      } catch (e) {
        // fallback to non-OAuth fetch
      }

      const res2 = await tauri.invoke('calendar_get_events', { max_results: 5 });
      if (Array.isArray(res2)) {
        setEvents(res2 as EventItem[]);
      }
    } catch (e) {
      console.warn('calendar fetch failed', e);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await Promise.all([fetchWeather(), fetchEvents()]);

      // load saved settings and attempt auto-sync if credentials present
      try {
        const mod = await import('@tauri-apps/api/tauri');
        const tauri = mod.default || mod;
        const creds: any = await tauri.invoke('settings_get_google_credentials', {});
        const apiKey = creds?.google_api_key;
        const calendarId = creds?.google_calendar_id || 'primary';
        // prefer OAuth if available
        const tok = await tauri.invoke('calendar_get_oauth_tokens');
        if (tok && Object.keys(tok).length) {
          setSyncing(true);
          try {
            await tauri.invoke('calendar_sync_with_oauth', { calendar_id: calendarId, max_results: 10 });
            await fetchEvents();
          } catch (e) {
            console.warn('auto oauth sync failed', e);
          } finally {
            setSyncing(false);
          }
        } else if (apiKey && calendarId) {
          setSyncing(true);
          try {
            await tauri.invoke('calendar_sync_with_google', { api_key: apiKey, calendar_id: calendarId, max_results: 10 });
            await fetchEvents();
          } catch (e) {
            console.warn('auto sync failed', e);
          } finally {
            setSyncing(false);
          }
        }
      } catch (e) {
        console.warn('load settings failed', e);
      }

      // schedule periodic sync based on saved interval (minutes)
      try {
        const mod = await import('@tauri-apps/api/tauri');
        const tauri = mod.default || mod;
        const iv: any = await tauri.invoke('settings_get_sync_interval', {});
        const mins = iv?.sync_interval_minutes;
        if (typeof mins === 'number' && mins > 0) {
          const ms = mins * 60 * 1000;
          const id = setInterval(async () => {
            try {
              setSyncing(true);
              await tauri.invoke('calendar_sync_with_google', { api_key: (await tauri.invoke('settings_get_google_credentials', {}))?.google_api_key, calendar_id: (await tauri.invoke('settings_get_google_credentials', {}))?.google_calendar_id, max_results: 10 });
              await fetchEvents();
            } catch (e) {
              console.warn('interval sync failed', e);
            } finally {
              setSyncing(false);
            }
          }, ms);
          // attach to window for cleanup reference
          (window as any).__urms_wc_sync_interval = id;
        }
      } catch (e) {
        console.warn('failed to schedule interval', e);
      }
      if (mounted) setLoading(false);
    })();
    // subscribe to backend calendar updates
    (async () => {
      try {
        const evtMod = await import('@tauri-apps/api/event');
        const unlisten = await evtMod.listen('calendar:updated', (e: any) => {
          try {
            if (e && e.payload && Array.isArray(e.payload)) {
              setEvents(e.payload as EventItem[]);
              setRecentlyUpdated(true);
              setShowToast(true);
              setTimeout(() => setShowToast(false), 3000);
              setTimeout(() => setRecentlyUpdated(false), 4000);
            }
          } catch (err) { console.warn('calendar:updated handler error', err); }
        });
        (window as any).__urms_unlisten_calendar = unlisten;
      } catch (e) {
        console.warn('failed to subscribe calendar:updated', e);
      }
    })();
    return () => {
      mounted = false;
      const id = (window as any).__urms_wc_sync_interval;
      if (id) clearInterval(id);
      const u = (window as any).__urms_unlisten_calendar;
      if (u) {
        try { u(); } catch (_) {}
      }
    };
  }, []);

  const handleSyncGoogle = async () => {
    try {
      const apiKey = window.prompt('Enter Google API Key (or leave empty):', '');
      if (!apiKey) return alert('API key required to sync');
      const calendarId = window.prompt('Enter Calendar ID (e.g., your email):', 'primary');
      if (!calendarId) return alert('Calendar ID required');
      setSyncing(true);
      const mod = await import('@tauri-apps/api/tauri');
      const tauri = mod.default || mod;
      await tauri.invoke('calendar_sync_with_google', { api_key: apiKey, calendar_id: calendarId, max_results: 10 });
      await fetchEvents();
    } catch (e) {
      console.warn('sync failed', e);
      alert('Sync failed: ' + (e && e.toString()));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="weather-calendar-card">
      <div className={`card-header ${recentlyUpdated ? 'wc-header-highlight' : ''}`}>
        <h3>Weather & Calendar</h3>
        {recentlyUpdated && (
          <span style={{marginLeft:12, color:'#0a0', fontWeight:600}}>Updated</span>
        )}
        <div className="card-actions">
          <button onClick={() => { fetchWeather(); fetchEvents(); }}>Refresh</button>
          <button onClick={handleSyncGoogle} disabled={syncing}>{syncing ? 'Syncing...' : 'Sync Google'}</button>
        </div>
      </div>
      {showToast && (
        <div className={`wc-toast ${showToast ? 'show' : ''}`}>Calendar updated</div>
      )}
      <div className="card-body">
        {loading ? <div>Loading…</div> : (
          <div className="wc-grid">
            <div className="weather-box">
              <div className="weather-temp">{weather.temperature !== undefined ? `${weather.temperature}°C` : '—'}</div>
              <div className="weather-code">Code: {weather.weathercode ?? '—'}</div>
            </div>
            <div className="events-box">
              <ul>
                {events.length === 0 && <li>No upcoming events</li>}
                {events.map((ev) => (
                  <li key={ev.id || JSON.stringify(ev)}>
                    <div className="ev-title">{ev.summary || '(no title)'}</div>
                    <div className="ev-time">{ev.start?.dateTime || ev.start?.date || ''}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
