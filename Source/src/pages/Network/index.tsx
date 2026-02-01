import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Environment/style.css";
import { getNetworkInfo, NetworkInfo } from "../../utils/systemInfo";

export default function Network() {
  const navigate = useNavigate();
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    devices_online: 0,
    devices_offline: 0,
    average_latency: 0,
    network_status: "disconnected",
    interfaces: [],
    top_cpu_processes: [],
    top_memory_processes: []
  });

  const fetchInFlight = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!isMounted || fetchInFlight.current || document.visibilityState !== "visible") return;
      fetchInFlight.current = true;
      try {
        const info = await getNetworkInfo();
        if (!isMounted) return;
        setNetworkInfo(info);
      } finally {
        fetchInFlight.current = false;
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchData();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <div className="page-container environment-page">
      <header className="page-header">
        <button className="nav-button" onClick={() => navigate('/')}>
          ← 戻る
        </button>
        <h1 className="page-title">🌐 ネットワーク</h1>
      </header>

      <main className="page-content">
        <div className="section-card">
          <h2>ネットワーク状態</h2>
          <div className="env-list">
            <div className="env-item">
              <span className="env-icon">📡</span>
              <span className="env-label">接続状態</span>
              <span className="env-value">{networkInfo.network_status}</span>
            </div>
            <div className="env-item">
              <span className="env-icon">⚡</span>
              <span className="env-label">平均遅延</span>
              <span className="env-value">{networkInfo.average_latency}ms</span>
            </div>
            <div className="env-item">
              <span className="env-icon">📶</span>
              <span className="env-label">信号強度</span>
              <span className="env-value">{networkInfo.devices_online > 0 ? "強" : "弱"}</span>
            </div>
            <div className="env-item">
              <span className="env-icon">🔌</span>
              <span className="env-label">アクティブ接続</span>
              <span className="env-value">{networkInfo.devices_online}</span>
            </div>
          </div>
        </div>

        <div className="section-card">
          <h2>接続デバイス</h2>
          <ul className="process-list">
            {networkInfo.interfaces.length === 0 && (
              <li>インターフェース未検出</li>
            )}
            {networkInfo.interfaces.map((name) => (
              <li key={name}><strong>{name}</strong> - インターフェース</li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
