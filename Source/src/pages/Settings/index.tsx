import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";

export default function Settings() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'dark-neon' | 'dark' | 'light'>(() => {
    const saved = localStorage.getItem('urms-theme');
    if (saved === 'light') return 'light';
    if (saved === 'dark') return 'dark';
    return 'dark-neon';
  });

  useEffect(() => {
    // Apply theme on mount and when it changes
    if (theme === 'light') {
      document.body.className = 'light-theme';
    } else if (theme === 'dark') {
      document.body.className = 'dark-theme';
    } else {
      document.body.className = '';
    }
    // hook up settings load/save buttons
    const loadBtn = document.getElementById('load-google-settings');
    const saveBtn = document.getElementById('save-google-settings');
    const keyInput = document.getElementById('google-api-key') as HTMLInputElement | null;
    const calInput = document.getElementById('google-calendar-id') as HTMLInputElement | null;

    const loadHandler = async () => {
      try {
        const mod = await import('@tauri-apps/api/tauri');
        const tauri = mod.default || mod;
        const res = await tauri.invoke('settings_get_google_credentials');
        if (res) {
          if (keyInput && res.google_api_key) keyInput.value = res.google_api_key;
          if (calInput && res.google_calendar_id) calInput.value = res.google_calendar_id;
        }
      } catch (e) { console.warn('load settings failed', e); }
    };

    const saveHandler = async () => {
      try {
        if (!keyInput || !calInput) return;
        const apiKey = keyInput.value.trim();
        const calId = calInput.value.trim();
        const mod = await import('@tauri-apps/api/tauri');
        const tauri = mod.default || mod;
        await tauri.invoke('settings_set_google_credentials', { api_key: apiKey, calendar_id: calId });
        // optionally set sync interval if provided
        const intervalInput = document.getElementById('sync-interval') as HTMLInputElement | null;
        if (intervalInput) {
          const mins = parseInt(intervalInput.value || '0', 10);
          if (!isNaN(mins) && mins > 0) {
            await tauri.invoke('settings_set_sync_interval', { sync_minutes: mins });
          }
        }
        alert('Saved');
      } catch (e) { console.warn('save settings failed', e); alert('Save failed'); }
    };

    const deleteBtn = document.getElementById('delete-google-settings');
    const oauthBtn = document.getElementById('start-google-oauth');
    const clientIdInput = document.getElementById('google-client-id') as HTMLInputElement | null;
    const clientSecretInput = document.getElementById('google-client-secret') as HTMLInputElement | null;
    const oauthStatus = document.getElementById('oauth-status');

    const deleteHandler = async () => {
      try {
        const mod = await import('@tauri-apps/api/tauri');
        const tauri = mod.default || mod;
        await tauri.invoke('settings_delete_google_credentials');
        if (keyInput) keyInput.value = '';
        if (calInput) calInput.value = '';
        alert('Deleted');
      } catch (e) { console.warn('delete failed', e); alert('Delete failed'); }
    };

    const oauthHandler = async () => {
      try {
        if (!clientIdInput || !clientSecretInput) return;
        const clientId = clientIdInput.value.trim();
        const clientSecret = clientSecretInput.value.trim();
        if (!clientId || !clientSecret) {
          alert('Please enter client_id and client_secret');
          return;
        }
        const mod = await import('@tauri-apps/api/tauri');
        const tauri = mod.default || mod;
        if (oauthStatus) oauthStatus.textContent = 'Starting OAuth...';
        await tauri.invoke('calendar_start_oauth', { client_id: clientId, client_secret: clientSecret });
        // refresh token display
        const tok = await tauri.invoke('calendar_get_oauth_tokens');
        if (oauthStatus) oauthStatus.textContent = tok && Object.keys(tok).length ? 'Connected' : 'Not connected';
        alert('OAuth flow completed (tokens stored).');
      } catch (e) { console.warn('oauth failed', e); alert('OAuth failed'); if (oauthStatus) oauthStatus.textContent = 'Error'; }
    };

    loadBtn?.addEventListener('click', loadHandler);
    saveBtn?.addEventListener('click', saveHandler);
    deleteBtn?.addEventListener('click', deleteHandler);
    oauthBtn?.addEventListener('click', oauthHandler);
    // auto-load on mount
    loadHandler();

    return () => {
      loadBtn?.removeEventListener('click', loadHandler);
      saveBtn?.removeEventListener('click', saveHandler);
      deleteBtn?.removeEventListener('click', deleteHandler);
      oauthBtn?.removeEventListener('click', oauthHandler);
    };
  }, [theme]);

  const handleThemeChange = (newTheme: 'dark-neon' | 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('urms-theme', newTheme);
    if (newTheme === 'light') {
      document.body.className = 'light-theme';
    } else if (newTheme === 'dark') {
      document.body.className = 'dark-theme';
    } else {
      document.body.className = '';
    }
  };

  return (
    <div className="page-container settings-page">
      <header className="page-header">
        <button className="nav-button" onClick={() => navigate('/')}>
          ← 戻る
        </button>
        <h1 className="page-title">⚙️ 設定</h1>
      </header>

      <main className="page-content">
        <div className="settings-section">
          <h2>表示設定</h2>
          <div className="setting-item">
            <label className="setting-label">言語</label>
            <select className="setting-select">
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="setting-item">
            <label className="setting-label">テーマ</label>
            <select 
              className="setting-select"
              value={theme}
              onChange={(e) => handleThemeChange(e.target.value as 'dark-neon' | 'dark' | 'light')}
            >
              <option value="dark-neon">ダーク ネオン</option>
              <option value="dark">ダーク</option>
              <option value="light">ライト</option>
            </select>
          </div>
          <div className="setting-item">
            <label className="setting-label">アニメーション</label>
            <input 
              type="checkbox" 
              className="setting-checkbox"
              defaultChecked
            />
            <span className="setting-text">アニメーション有効</span>
          </div>
        </div>

        <div className="settings-section">
          <h2>システム設定</h2>
          <div className="setting-item">
            <label className="setting-label">自動更新間隔（分）</label>
            <input id="sync-interval" className="setting-input" placeholder="例: 30" />
          </div>
          <div className="setting-item">
            <label className="setting-label">更新確認</label>
            <button className="setting-button">今すぐ確認</button>
          </div>
        </div>

        <div className="settings-section">
          <h2>バージョン情報</h2>
          <div className="about-info">
            <p><strong>バージョン</strong></p>
            <p>URMS v4.0 - 統合資産管理システム</p>
            <p>© 2026 URMS Team</p>
          </div>
        </div>
        <div className="settings-section">
          <h2>Google Calendar 設定</h2>
          <div className="setting-item">
            <label className="setting-label">API Key</label>
            <input id="google-api-key" className="setting-input" placeholder="Enter API key" />
          </div>
          <div className="setting-item">
            <label className="setting-label">Calendar ID</label>
            <input id="google-calendar-id" className="setting-input" placeholder="primary or your email" />
          </div>
          <div className="setting-item">
            <button className="setting-button" id="save-google-settings">保存</button>
            <button className="setting-button" id="load-google-settings">読み込み</button>
            <button className="setting-button" id="delete-google-settings">削除</button>
          </div>
          <div className="setting-item">
            <label className="setting-label">OAuth Client ID</label>
            <input id="google-client-id" className="setting-input" placeholder="Enter OAuth client_id" />
          </div>
          <div className="setting-item">
            <label className="setting-label">OAuth Client Secret</label>
            <input id="google-client-secret" className="setting-input" placeholder="Enter client_secret" />
          </div>
          <div className="setting-item">
            <button className="setting-button" id="start-google-oauth">Google OAuth 認可</button>
            <span id="oauth-status" style={{marginLeft:12}}>Unknown</span>
          </div>
        </div>
      </main>
    </div>
  );
}
