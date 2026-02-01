import { useNavigate, useParams } from "react-router-dom";
import "../Environment/style.css";

const subsystemMap: Record<string, { title: string; icon: string; description: string }> = {
  asset: { title: "資産管理", icon: "📦", description: "資産の登録、棚卸、状態管理を行います。" },
  file: { title: "ファイル管理", icon: "🗂️", description: "ファイル分類、スキャン、ストレージ状況を管理します。" },
  finance: { title: "財務管理", icon: "💹", description: "支出管理、予算設定、月次レポートを確認します。" },
  iot: { title: "IoT管理", icon: "📡", description: "IoTデバイスの検出、制御、状態監視を行います。" },
  network: { title: "ネットワーク管理", icon: "🌐", description: "ネットワークスキャン、疎通確認、統計を管理します。" },
  schedule: { title: "スケジュール管理", icon: "🗓️", description: "スケジュール作成、更新、実行管理を行います。" }
};

export default function SubsystemDetail() {
  const navigate = useNavigate();
  const { subsystem } = useParams<{ subsystem: string }>();
  const data = subsystemMap[subsystem || ""] || { title: "不明", icon: "❓", description: "サブシステムが見つかりません。" };

  return (
    <div className="page-container environment-page">
      <header className="page-header">
        <button className="nav-button" onClick={() => navigate('/Subsystems')}>← 戻る</button>
        <h1 className="page-title">{data.icon} {data.title}</h1>
      </header>

      <main className="page-content">
        <div className="section-card">
          <h2>概要</h2>
          <p style={{ opacity: 0.85 }}>{data.description}</p>
        </div>

        <div className="section-card">
          <h2>操作</h2>
          <div className="env-list">
            <div className="env-item">
              <span className="env-icon">▶️</span>
              <span className="env-label">起動</span>
              <span className="env-value">準備中</span>
            </div>
            <div className="env-item">
              <span className="env-icon">📊</span>
              <span className="env-label">ステータス</span>
              <span className="env-value">準備中</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
