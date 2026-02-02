import { useState } from "react";
import { useNavigate } from "react-router-dom";
import VirtualizedList from "../../components/VirtualizedList";
import "./style.css";

export default function Logs() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');

  const allLogs = [
    { timestamp: "14:32:15 JST", level: "INFO", manager: "SystemManager", message: "システム起動完了" },
    { timestamp: "14:32:22 JST", level: "INFO", manager: "NetworkManager", message: "ネットワークインターフェース初期化" },
    { timestamp: "14:32:45 JST", level: "INFO", manager: "DashboardManager", message: "すべてのサブシステム読み込み完了" },
    { timestamp: "14:33:01 JST", level: "WARN", manager: "SystemManager", message: "高いCPU使用率を検出" },
    { timestamp: "14:33:15 JST", level: "ERROR", manager: "FileManager", message: "バックアップデバイスへの接続失敗" },
    { timestamp: "14:34:02 JST", level: "INFO", manager: "ScheduleManager", message: "バックアップ再試行予約完了" },
  ];

  const filteredLogs = allLogs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'info') return log.level === 'INFO';
    if (filter === 'warn') return log.level === 'WARN';
    if (filter === 'error') return log.level === 'ERROR';
    return true;
  });

  return (
    <div className="page-container logs-page">
      <header className="page-header">
        <button className="nav-button" onClick={() => navigate('/')}>← 戻る</button>
        <h1 className="page-title">📋 ログ管理</h1>
      </header>

      <main className="page-content">
        <div className="logs-section">
          <div className="logs-filter">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              すべて ({allLogs.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'info' ? 'active' : ''}`}
              onClick={() => setFilter('info')}
            >
              情報 ({allLogs.filter(l => l.level === 'INFO').length})
            </button>
            <button 
              className={`filter-btn ${filter === 'warn' ? 'active' : ''}`}
              onClick={() => setFilter('warn')}
            >
              警告 ({allLogs.filter(l => l.level === 'WARN').length})
            </button>
            <button 
              className={`filter-btn ${filter === 'error' ? 'active' : ''}`}
              onClick={() => setFilter('error')}
            >
              エラー ({allLogs.filter(l => l.level === 'ERROR').length})
            </button>
          </div>

          <div className="logs-list">
            {/* Use VirtualizedList for large log sets */}
            <VirtualizedList
              items={filteredLogs}
              height={400}
              itemHeight={48}
              renderItem={(log: any, idx: number) => (
                <div key={idx} className={`log-entry log-${log.level.toLowerCase()}`}>
                  <span className="log-time">{log.timestamp}</span>
                  <span className="log-manager">{log.manager}</span>
                  <span className="log-level">[{log.level}]</span>
                  <span className="log-message">{log.message}</span>
                </div>
              )}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
