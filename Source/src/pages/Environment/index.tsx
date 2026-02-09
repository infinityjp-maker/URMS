import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";
import { getSystemInfo, SystemInfo, getNetworkInfo, NetworkInfo } from "../../utils/systemInfo";
import VirtualizedList from "../../components/VirtualizedList";

export default function Environment() {
  const navigate = useNavigate();
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
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
    gpus: [],
    network_status: "disconnected"
  });

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    devices_online: 0,
    devices_offline: 0,
    average_latency: 0,
    network_status: "disconnected",
    interfaces: [],
    top_cpu_processes: [],
    top_memory_processes: []
  });

  const [processTab, setProcessTab] = useState<'cpu' | 'memory'>('cpu');
  const systemFetchInFlight = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!isMounted || systemFetchInFlight.current || document.visibilityState !== "visible") return;
      systemFetchInFlight.current = true;
      try {
        const info = await getSystemInfo();
        const netInfo = await getNetworkInfo();
        if (!isMounted) return;
        
        // Only update if data has actually changed
        setSystemInfo((prev: any) => {
          const changed = JSON.stringify(prev) !== JSON.stringify(info);
          return changed ? info : prev;
        });
        
        setNetworkInfo((prev: any) => {
          const changed = JSON.stringify(prev) !== JSON.stringify(netInfo);
          return changed ? netInfo : prev;
        });
      } finally {
        systemFetchInFlight.current = false;
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

  const primaryGpu = systemInfo.gpus?.[0];
  const nasDisks = (systemInfo.disks || []).filter((d: any) => d.is_network);
  const nasUsage = nasDisks.length
    ? (nasDisks.reduce((sum: number, d: any) => sum + d.usage, 0) / nasDisks.length).toFixed(1)
    : "-";
  const diskLabel = systemInfo.disks?.length > 1
    ? `${systemInfo.disk_name} +${systemInfo.disks.length - 1}`
    : systemInfo.disk_name;
  
  const primaryDiskInfo = systemInfo.disks?.[0] ? 
    `${systemInfo.disks[0].drive_letter} (${systemInfo.disks[0].device_name || 'Unknown'})` : 'Unknown';

  const resources = [
    { key: 'cpu', label: `CPU (${systemInfo.cpu_name || 'Unknown'})`, subtitle: `${systemInfo.cpu_cores} cores @ ${systemInfo.cpu_speed_ghz.toFixed(1)}GHz`, value: `${systemInfo.cpu_usage.toFixed(1)}%`, icon: '⚙️' },
    { key: 'gpu', label: `GPU (${primaryGpu?.name || 'None'})`, subtitle: primaryGpu ? `${primaryGpu.memory_total_mb} MB` : '', value: primaryGpu ? `${primaryGpu.memory_usage?.toFixed(1) || 0}%` : '-', icon: '🖥️' },
    { key: 'memory', label: `メモリ`, subtitle: `${systemInfo.memory_used_gb.toFixed(1)}GB / ${systemInfo.memory_total_gb.toFixed(1)}GB`, value: `${systemInfo.memory_usage.toFixed(1)}%`, icon: '💾' },
    { key: 'disk', label: `ディスク (${diskLabel})`, subtitle: primaryDiskInfo, value: `${systemInfo.disk_usage.toFixed(1)}%`, icon: '💿' },
    { key: 'nas', label: 'NAS使用率', subtitle: `${nasDisks.length} drive(s)`, value: nasDisks.length ? `${nasUsage}%` : '未検出', icon: '🗄️' },
    { key: 'network', label: 'ネットワーク', subtitle: systemInfo.network_status, value: systemInfo.network_status, icon: '🌐' }
  ];

  return (
    <div className="page-container environment-page">
      <header className="page-header">
        <button className="nav-button" onClick={() => navigate('/')}>
          ← 戻る
        </button>
        <h1 className="page-title">🌍 環境</h1>
      </header>

      <main className="page-content">
        <div className="section-card">
          <h2>システム環境 - クリックで詳細表示</h2>
          <div className="env-list">
            {resources.map(resource => (
              <div 
                key={resource.key}
                className="env-item clickable" 
                onClick={() => navigate(`/Environment/${resource.key}`)}
              >
                <span className="env-icon">{resource.icon}</span>
                <div className="env-label-wrapper">
                  <span className="env-label">{resource.label}</span>
                  {(resource as any).subtitle && <span className="env-subtitle">{(resource as any).subtitle}</span>}
                </div>
                <span className="env-value">{resource.value}</span>
                <span className="env-arrow">→</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section-card">
          <div className="process-header">
            <h2>プロセス情報</h2>
            <div className="process-tabs">
              <button 
                className={`tab-button ${processTab === 'cpu' ? 'active' : ''}`}
                onClick={() => setProcessTab('cpu')}
              >
                CPU使用順
              </button>
              <button 
                className={`tab-button ${processTab === 'memory' ? 'active' : ''}`}
                onClick={() => setProcessTab('memory')}
              >
                メモリ使用順
              </button>
            </div>
          </div>
          <div className="process-list">
            {((processTab === 'cpu' ? networkInfo.top_cpu_processes : networkInfo.top_memory_processes).length === 0) && (
              <div>プロセス情報を取得中...</div>
            )}
            <VirtualizedList
              items={(processTab === 'cpu' ? networkInfo.top_cpu_processes : networkInfo.top_memory_processes)}
              height={240}
              itemHeight={40}
              renderItem={(p: any, idx: number) => (
                <div key={idx} className="list-item-padding">
                  <strong>{p.name}</strong> (PID: {p.pid}) - {p.cpu_usage.toFixed(1)}% CPU | {p.memory_mb} MB メモリ
                </div>
              )}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
