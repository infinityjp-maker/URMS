import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";
import { getNetworkInfo, NetworkInfo } from "../../utils/systemInfo";

export default function Security() {
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
    <div className="page-container security-page">
      <header className="page-header">
        <button className="nav-button" onClick={() => navigate('/')}>
          ← 戻る
        </button>
        <h1 className="page-title">🔐 セキュリティ</h1>
      </header>

      <main className="page-content">
        <div className="security-stats">
          <div className="stat-box">
            <div className="stat-label">オンラインデバイス</div>
            <div className="stat-large">{networkInfo.devices_online}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">オフラインデバイス</div>
            <div className="stat-large warning">{networkInfo.devices_offline}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">平均レイテンシ</div>
            <div className="stat-large">{networkInfo.average_latency}ms</div>
          </div>
        </div>

        <div className="devices-section">
          <h2>ネットワークデバイス</h2>
          <div className="devices-list">
            {networkInfo.interfaces.length === 0 && (
              <div className="device-card device-offline">
                <div className="device-header">
                  <span className="device-id">IF-000</span>
                  <span className="device-status offline">🔴 オフライン</span>
                </div>
                <div className="device-name">インターフェース未検出</div>
                <div className="device-latency">Latency: -</div>
              </div>
            )}
            {networkInfo.interfaces.map((name, idx) => (
              <div key={name} className="device-card device-online">
                <div className="device-header">
                  <span className="device-id">IF-{String(idx + 1).padStart(3, '0')}</span>
                  <span className="device-status online">🟢 オンライン</span>
                </div>
                <div className="device-name">{name}</div>
                <div className="device-latency">Latency: {networkInfo.average_latency}ms</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
