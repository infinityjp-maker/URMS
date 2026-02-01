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
            <label className="setting-label">自動更新間隔</label>
            <select className="setting-select">
              <option value="5">5秒ごと</option>
              <option value="10">10秒ごと</option>
              <option value="30">30秒ごと</option>
            </select>
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
      </main>
    </div>
  );
}
