# System Manager – Specification Document  
### URMS / 資産統合管理システム  
### Version: v3.3.2

System Manager は PC / OS の状態監視を担当するコンポーネントであり、  
URMS の「健康状態」をリアルタイムで把握するための基盤となる。

---

# 1. 目的（Purpose）

- CPU / RAM / Disk / Network の状態を監視  
- 異常を検知し Dashboard に通知  
- File Manager へ容量逼迫情報を提供  
- 事故ゼロのための「状態監視基盤」を提供

---

# 2. 責務（Responsibilities）

### ✔ CPU 監視  
- 使用率  
- 温度（取得可能な場合）

### ✔ RAM 監視  
- 使用量  
- 空き容量

### ✔ Disk 監視  
- 使用量  
- 空き容量  
- 容量逼迫時の警告  
- File Manager への連携

### ✔ Network 監視  
- 送受信量  
- 接続状態  
- Ping（任意）

### ✔ 異常検知  
- WARN / ERROR の閾値を SpecDoc で定義  
- Dashboard に即時反映

---

# 3. データ構造（Data Structure）

```ts
interface SystemStatus {
  cpu: number
  ram: number
  disk: {
    used: number
    free: number
    total: number
  }
  network: {
    up: number
    down: number
  }
  status: "normal" | "warn" | "error"
}
```

---

# 4. Rust コマンド（Tauri Commands）

| コマンド名 | 説明 |
|------------|------|
| `system_manager_get_status` | システム状態取得 |
| `system_manager_get_cpu` | CPU 使用率 |
| `system_manager_get_ram` | RAM 使用量 |
| `system_manager_get_disk` | ディスク情報 |
| `system_manager_get_network` | ネットワーク情報 |

---

# 5. UI 連携（Dashboard）

System Status カードに以下を提供：

- CPU / RAM / Disk / Network  
- Sparkline（リアルタイム）  
- WARN / ERROR の強調  

---

# 6. 異常判定（Thresholds）

例：

| 項目 | WARN | ERROR |
|------|------|--------|
| CPU | 80% | 95% |
| RAM | 80% | 95% |
| Disk | 85% | 95% |
| Network | パケットロス 5% | 20% |

※ 実際の閾値は環境に応じて調整可能。

---

# 7. エラー処理

- Rust 側で例外を握りつぶさない  
- ERROR 状態は Dashboard に即時反映  
- Log Manager に記録  
- File Manager に容量逼迫を通知  

---

# 8. 将来拡張

- 温度監視（CPU / GPU）  
- SMART 情報取得  
- ネットワークデバイス検出  
- AI による異常予測  
