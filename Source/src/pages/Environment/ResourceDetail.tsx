import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ResourceDetail.css";
import { getNetworkInfo, getSystemInfo, NetworkInfo, SystemInfo } from "../../utils/systemInfo";

type HistoryMap = Record<string, number[]>;

export default function ResourceDetail() {
  const navigate = useNavigate();
  const { resource } = useParams<{ resource: string }>();

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

  const [history, setHistory] = useState<HistoryMap>({
    cpu: Array(10).fill(0),
    gpu: Array(10).fill(0),
    memory: Array(10).fill(0),
    disk: Array(10).fill(0),
    nas: Array(10).fill(0),
    network: Array(10).fill(0)
  });

  const fetchInFlight = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!isMounted || fetchInFlight.current || document.visibilityState !== "visible") return;
      fetchInFlight.current = true;
      try {
        const sys = await getSystemInfo();
        const net = await getNetworkInfo();
        if (!isMounted) return;
        
        // Only update if data has actually changed
        setSystemInfo((prev: any) => {
          const changed = JSON.stringify(prev) !== JSON.stringify(sys);
          return changed ? sys : prev;
        });
        
        setNetworkInfo((prev: any) => {
          const changed = JSON.stringify(prev) !== JSON.stringify(net);
          return changed ? net : prev;
        });

        const nasDisks = sys.disks.filter(d => d.is_network);
        const nasUsage = nasDisks.length
          ? nasDisks.reduce((sum, d) => sum + d.usage, 0) / nasDisks.length
          : 0;
        const primaryGpu = sys.gpus[0];
        const gpuUsage = primaryGpu ? primaryGpu.usage : 0;
        const netValue = Math.min(100, net.average_latency);

        setHistory(prev => {
          const push = (arr: number[], value: number) => [...arr.slice(1), value];
          return {
            cpu: push(prev.cpu, sys.cpu_usage),
            gpu: push(prev.gpu, gpuUsage),
            memory: push(prev.memory, sys.memory_usage),
            disk: push(prev.disk, sys.disk_usage),
            nas: push(prev.nas, nasUsage),
            network: push(prev.network, netValue)
          };
        });
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

  const nasDisks = systemInfo.disks.filter(d => d.is_network);
  const primaryGpu = systemInfo.gpus[0];
  const nasUsage = nasDisks.length
    ? (nasDisks.reduce((sum, d) => sum + d.usage, 0) / nasDisks.length).toFixed(1)
    : "0.0";

  const resourceData: Record<string, any> = useMemo(() => ({
    cpu: {
      title: 'CPU',
      icon: '⚙️',
      current: `${systemInfo.cpu_usage.toFixed(1)}%`,
      history: history.cpu,
      details: [
        { label: 'CPU名', value: systemInfo.cpu_name || 'Unknown' },
        { label: '周波数', value: `${systemInfo.cpu_speed_ghz.toFixed(1)} GHz` },
        { label: 'コア数', value: `${systemInfo.cpu_cores}` },
        { label: '使用率', value: `${systemInfo.cpu_usage.toFixed(1)}%` },
        { label: '状態', value: systemInfo.cpu_usage > 80 ? '高負荷' : '正常' }
      ]
    },
    gpu: {
      title: 'GPU',
      icon: '🖥️',
      current: primaryGpu ? `${primaryGpu.memory_usage?.toFixed(1) || 0}%` : '未検出',
      history: history.gpu,
      details: primaryGpu ? [
        { label: 'GPU名', value: primaryGpu.name },
        { label: 'VRAM使用', value: `${primaryGpu.memory_used_mb} MB / ${primaryGpu.memory_total_mb} MB` },
        { label: 'VRAM使用率', value: `${primaryGpu.memory_usage?.toFixed(1) || 0}%` },
        { label: '状態', value: '正常' }
      ] : [
        { label: 'GPU名', value: '未検出' },
        { label: 'VRAM使用', value: '-' },
        { label: 'VRAM使用率', value: '-' },
        { label: '状態', value: '接続なし' }
      ]
    },
    memory: {
      title: 'メモリ',
      icon: '💾',
      current: `${systemInfo.memory_usage.toFixed(1)}%`,
      history: history.memory,
      details: [
        { label: '使用量', value: `${systemInfo.memory_used_gb.toFixed(1)} GB` },
        { label: '総容量', value: `${systemInfo.memory_total_gb.toFixed(1)} GB` },
        { label: '使用率', value: `${systemInfo.memory_usage.toFixed(1)}%` },
        { label: '更新間隔', value: '10秒' }
      ]
    },
    disk: {
      title: 'ディスク',
      icon: '💿',
      current: `${systemInfo.disk_usage.toFixed(1)}%`,
      history: history.disk,
      details: systemInfo.disks.length
        ? systemInfo.disks.map(d => ({
            label: d.is_network ? `NAS ${d.drive_letter || d.mount_point}` : `${d.drive_letter || d.mount_point} (${d.device_name || 'Unknown'})`,
            value: `${d.usage.toFixed(1)}% (${d.used_gb.toFixed(1)}/${d.total_gb.toFixed(1)} GB)`
          }))
        : [
            { label: 'ディスク', value: '未検出' }
          ]
    },
    nas: {
      title: 'NAS',
      icon: '🗄️',
      current: nasDisks.length ? `${nasUsage}%` : '未検出',
      history: history.nas,
      details: nasDisks.length
        ? nasDisks.map(d => ({
            label: `NAS ${d.mount_point}`,
            value: `${d.usage.toFixed(1)}% (${d.used_gb.toFixed(1)}/${d.total_gb.toFixed(1)} GB)`
          }))
        : [
            { label: 'NAS', value: '未検出' }
          ]
    },
    network: {
      title: 'ネットワーク',
      icon: '🌐',
      current: `${networkInfo.network_status}`,
      history: history.network,
      details: [
        { label: 'オンラインIF', value: `${networkInfo.devices_online}` },
        { label: 'オフラインIF', value: `${networkInfo.devices_offline}` },
        { label: '平均レイテンシ', value: `${networkInfo.average_latency} ms` },
        { label: 'インターフェース', value: networkInfo.interfaces.join(', ') || '-' }
      ]
    }
  }), [systemInfo, networkInfo, history, nasUsage, nasDisks, primaryGpu]);

  const data = resourceData[resource || 'cpu'];

  return (
    <div className="page-container resource-detail-page">
      <header className="page-header">
        <button className="nav-button" onClick={() => navigate('/Environment')}>
          ← 戻る
        </button>
        <h1 className="page-title">{data.icon} {data.title} 詳細</h1>
      </header>

      <main className="page-content">
        <div className="section-card">
          <h2>現在値</h2>
          <div className="current-value">
            <div className="value-large">{data.current}</div>
            <div className="value-description">
              {resource === 'cpu' && 'CPU使用率'}
              {resource === 'gpu' && 'GPU使用率'}
              {resource === 'memory' && 'メモリ使用率'}
              {resource === 'disk' && 'ディスク使用率'}
              {resource === 'nas' && 'NAS使用率'}
              {resource === 'network' && 'ネットワーク状態'}
            </div>
          </div>
        </div>

        <div className="section-card">
          <h2>グラフ（過去10分）</h2>
          <div className="chart-container">
            <div className="sparkline-bars">
              {data.history.map((value: number, idx: number) => (
                <div
                  key={idx}
                  className="bar"
                  style={{
                    height: `${Math.max(10, (value / 100) * 150)}px`,
                    backgroundColor: value > 80 ? '#ef4444' : value > 50 ? '#f59e0b' : '#22c55e'
                  }}
                  title={`${value}%`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="section-card">
          <h2>詳細情報</h2>
          <div className="details-grid">
            {data.details.map((detail: any, idx: number) => (
              <div key={idx} className="detail-item">
                <span className="detail-label">{detail.label}</span>
                <span className="detail-value">{detail.value}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
