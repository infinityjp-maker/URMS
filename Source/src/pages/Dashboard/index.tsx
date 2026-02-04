import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";
import FloatingCard from "../../components/FloatingCard";
import Sparkline from "../../components/Sparkline";
import WeatherCalendarCard from '../../components/cards/WeatherCalendarCard';
import { getSystemInfo, getNetworkInfo } from "../../utils/systemInfo";

export default function Dashboard() {
  const navigate = useNavigate();
  const [systemStats, setSystemStats] = useState<any>({
    cpu_name: "Unknown",
    cpu_speed_ghz: 0,
    cpu_usage: 0,
    cpu_cores: 0,
    memory_usage: 0,
    memory_used_gb: 0,
    memory_total_gb: 0,
    disk_usage: 0,
    disk_name: "C:\\",
    disks: [],
    gpus: []
  });
  const [networkStats, setNetworkStats] = useState<any>({
    devices_online: 0,
    devices_offline: 0,
    average_latency: 0,
    network_status: "disconnected"
  });

  const systemFetchInFlight = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const fetchSystemData = async () => {
      if (!isMounted || systemFetchInFlight.current || document.visibilityState !== "visible") return;
      systemFetchInFlight.current = true;
      try {
        const sysInfo = await getSystemInfo();
        const netInfo = await getNetworkInfo();
        if (!isMounted) return;
        
        // Only update if data has actually changed (deep comparison)
        setSystemStats((prev: any) => {
          const changed = JSON.stringify(prev) !== JSON.stringify(sysInfo);
          return changed ? sysInfo : prev;
        });
        
        setNetworkStats((prev: any) => {
          const changed = JSON.stringify(prev) !== JSON.stringify(netInfo);
          return changed ? netInfo : prev;
        });
      } finally {
        systemFetchInFlight.current = false;
      }
    };

    fetchSystemData();
    const interval = setInterval(fetchSystemData, 10000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchSystemData();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const [logStats] = useState<any>({
    today: 0,
    warnings: 0,
    errors: 0,
    last_event: "--:--:--"
  });

  const settingsStats = useMemo(() => {
    const theme = localStorage.getItem("urms-theme");
    let modeLabel = "ダーク ネオン";
    if (theme === "light") modeLabel = "ライト";
    else if (theme === "dark") modeLabel = "ダーク";
    
    return {
      profile: "運用",
      mode: modeLabel,
      updated: new Date().toLocaleTimeString("ja-JP", { hour12: false })
    };
  }, []);

  const sparkData = [8, 12, 9, 16, 12, 28, 24, 18, 22, 30];

  // Memoize computed values to prevent unnecessary re-renders
  const primaryGpu = useMemo(() => systemStats.gpus?.[0], [systemStats.gpus]);
  const gpuUsage = useMemo(() => primaryGpu ? `${primaryGpu.usage.toFixed(1)}%` : "-", [primaryGpu]);
  const nasDisks = useMemo(() => (systemStats.disks || []).filter((d: any) => d.is_network), [systemStats.disks]);
  const nasUsage = useMemo(() => 
    nasDisks.length
      ? (nasDisks.reduce((sum: number, d: any) => sum + d.usage, 0) / nasDisks.length).toFixed(1)
      : "-",
    [nasDisks]
  );
  const nasLabel = useMemo(() =>
    nasDisks.length
      ? `${nasDisks[0].mount_point}${nasDisks.length > 1 ? ` +${nasDisks.length - 1}` : ""}`
      : "なし",
    [nasDisks]
  );

  const handleCardClick = useCallback((cardType: string) => {
    navigate(`/${cardType}`);
  }, [navigate]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">⚡ URMS ダッシュボード</h1>
      </div>

      <div className="dashboard-grid neon-grid">
        <FloatingCard
          title="システム"
          variant="neon"
          accent="#06b6d4"
          size="lg"
          onClick={() => handleCardClick("Environment")}
        >
          <ul className="stat-list">
            <li>CPU <span style={{ fontWeight: "bold", color: "#06b6d4" }}>{systemStats.cpu_usage.toFixed(1)}%</span></li>
            <li>RAM <span style={{ fontWeight: "bold", color: "#06b6d4" }}>{systemStats.memory_usage.toFixed(1)}%</span></li>
            <li>DISK ({systemStats.disks?.[0]?.device_name || systemStats.disk_name}) <span style={{ fontWeight: "bold", color: "#06b6d4" }}>{systemStats.disk_usage.toFixed(1)}%</span></li>
            <li>GPU <span style={{ fontWeight: "bold", color: "#06b6d4" }}>{gpuUsage}</span></li>
            <li>NAS ({nasLabel}) <span style={{ fontWeight: "bold", color: "#06b6d4" }}>{nasUsage}%</span></li>
            <li>NET <span style={{ fontWeight: "bold", color: "#06b6d4" }}>{networkStats.network_status}</span></li>
          </ul>
          <Sparkline data={sparkData} accent="#06b6d4" />
        </FloatingCard>

        <FloatingCard
          title="ネットワーク"
          variant="default"
          accent="#22c55e"
          size="md"
          onClick={() => handleCardClick("Network")}
        >
          <ul className="stat-list">
            <li>オンライン <span>{networkStats.devices_online}</span></li>
            <li>オフライン <span>{networkStats.devices_offline}</span></li>
            <li>平均遅延 <span>{networkStats.average_latency}ms</span></li>
          </ul>
        </FloatingCard>

        <FloatingCard
          title="ログ"
          variant="default"
          accent="#f59e0b"
          size="md"
          onClick={() => handleCardClick("Logs")}
        >
          <ul className="stat-list">
            <li>本日 <span>{logStats.today}件</span></li>
            <li>警告 <span>{logStats.warnings}件</span></li>
            <li>エラー <span>{logStats.errors}件</span></li>
            <li>最終 <span>{logStats.last_event}</span></li>
          </ul>
        </FloatingCard>

        <FloatingCard
          title="セキュリティ"
          variant="default"
          accent="#ef4444"
          size="md"
          onClick={() => handleCardClick("Security")}
        >
          <ul className="stat-list">
            <li>オンライン <span>{networkStats.devices_online}</span></li>
            <li>オフライン <span>{networkStats.devices_offline}</span></li>
            <li>状態 <span>{networkStats.network_status}</span></li>
          </ul>
        </FloatingCard>

        <FloatingCard
          title="サブシステム"
          variant="default"
          accent="#14b8a6"
          size="md"
          onClick={() => handleCardClick("Subsystems")}
        >
          <ul className="stat-list">
            <li>資産 <span>管理</span></li>
            <li>ファイル <span>管理</span></li>
            <li>財務 <span>管理</span></li>
            <li>IoT <span>管理</span></li>
          </ul>
        </FloatingCard>

        <FloatingCard
          title="設定"
          variant="default"
          accent="#a855f7"
          size="md"
          onClick={() => handleCardClick("Settings")}
        >
          <ul className="stat-list">
            <li>プロファイル <span>{settingsStats.profile}</span></li>
            <li>モード <span>{settingsStats.mode}</span></li>
            <li>更新 <span>{settingsStats.updated}</span></li>
          </ul>
        </FloatingCard>

        <FloatingCard
          title="Weather + Calendar"
          variant="default"
          accent="#60a5fa"
          size="lg"
          onClick={() => handleCardClick("")}
        >
          <WeatherCalendarCard />
        </FloatingCard>
      </div>
    </div>
  );
} 
