import { useNavigate } from "react-router-dom";
import "../Environment/style.css";

const subsystems = [
  { key: "asset", label: "資産管理", icon: "📦" },
  { key: "file", label: "ファイル管理", icon: "🗂️" },
  { key: "finance", label: "財務管理", icon: "💹" },
  { key: "iot", label: "IoT管理", icon: "📡" },
  { key: "network", label: "ネットワーク管理", icon: "🌐" },
  { key: "schedule", label: "スケジュール管理", icon: "🗓️" }
];

export default function Subsystems() {
  const navigate = useNavigate();

  return (
    <div className="page-container environment-page">
      <header className="page-header">
        <button className="nav-button" onClick={() => navigate('/')}>← 戻る</button>
        <h1 className="page-title">🧩 サブシステム</h1>
      </header>

      <main className="page-content">
        <div className="section-card">
          <h2>サブシステム一覧</h2>
          <div className="env-list">
            {subsystems.map((s) => (
              <div
                key={s.key}
                className="env-item clickable"
                onClick={() => navigate(`/Subsystems/${s.key}`)}
              >
                <span className="env-icon">{s.icon}</span>
                <span className="env-label">{s.label}</span>
                <span className="env-value">詳細</span>
                <span className="env-arrow">→</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
