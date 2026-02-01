# Network Manager – Specification Document  
### URMS / 資産統合管理システム  
### Version: v3.3.2

Network Manager は LAN / ネットワーク状態の監視・デバイス検出・通信状態の可視化を担当する  
URMS のネットワーク統合コンポーネントである。

本書は Network Manager の責務・UI構成・データ構造・Rust 連携仕様を定義する。

---

# 1. 目的（Purpose）

Network Manager の目的は以下の通り。

- LAN 内のデバイスを検出し一覧化する  
- Ping / 応答速度 / オフライン状態を可視化する  
- ネットワークの送受信量を監視する  
- 異常（遅延・断線）を検知し Dashboard に通知する  
- 事故ゼロのためのネットワーク状態監視基盤を提供する

---

# 2. 責務（Responsibilities）

### ✔ デバイススキャン  
- LAN 内のデバイスを検出  
- IP / MAC / ホスト名の取得  
- オンライン / オフライン判定

### ✔ Ping / 応答速度測定  
- 各デバイスへの Ping  
- 応答速度（ms）  
- パケットロス率

### ✔ ネットワークトラフィック監視  
- 上り（upload）  
- 下り（download）  
- リアルタイム更新（Sparkline）

### ✔ 異常検知  
- 遅延  
- パケットロス  
- オフライン  
- 高負荷

### ✔ Dashboard への統合  
- Network Status カードを提供  
- デバイス一覧カードを提供

---

# 3. UI 構成（UI Structure）

Network Manager は Dashboard に以下のカードを提供する。

## 3.1 Network Status Card（必須）
表示内容：
- 上り / 下り速度  
- Ping（ルーター）  
- パケットロス  
- ネットワーク状態（normal / warn / error）  
- Sparkline（リアルタイム）

## 3.2 Device List Card（任意）
表示内容：
- デバイス名  
- IP アドレス  
- MAC アドレス  
- 応答速度  
- オンライン / オフライン  
- 種別（PC / スマホ / IoT / 不明）

---

# 4. データ構造（Data Structure）

## 4.1 ネットワーク状態
```ts
interface NetworkStatus {
  up: number        // upload kbps
  down: number      // download kbps
  ping: number      // ms
  packetLoss: number
  status: "normal" | "warn" | "error"
}
```

## 4.2 デバイス情報
```ts
interface NetworkDevice {
  id: string
  name: string
  ip: string
  mac: string
  ping: number
  online: boolean
  type: "pc" | "mobile" | "iot" | "unknown"
}
```

---

# 5. Rust コマンド（Tauri Commands）

| コマンド名 | 説明 |
|------------|------|
| `network_manager_scan` | LAN デバイススキャン |
| `network_manager_ping` | Ping 測定 |
| `network_manager_get_status` | ネットワーク状態取得 |
| `network_manager_get_devices` | デバイス一覧取得 |

---

# 6. 異常判定（Thresholds）

例：

| 項目 | WARN | ERROR |
|------|------|--------|
| Ping | 50ms | 150ms |
| Packet Loss | 5% | 20% |
| Upload/Download | 低速化時に WARN | 断続的切断で ERROR |

※ 実際の閾値は環境に応じて調整可能。

---

# 7. Dashboard 連携

Network Manager は Dashboard に以下を提供する。

### ✔ Network Status Card  
- 上り / 下り  
- Ping  
- パケットロス  
- 状態（normal / warn / error）

### ✔ Device List Card  
- デバイス一覧  
- オンライン / オフライン  
- Ping  
- 種別

---

# 8. エラー処理（Error Handling）

- Rust 側で例外を握りつぶさない  
- ERROR 状態は Dashboard に即時反映  
- Log Manager に記録  
- Progress Manager と連携（スキャン中の進捗表示）

---

# 9. 将来拡張（Future Enhancements）

- デバイスの自動分類（AI）  
- ネットワークマップ（Topology View）  
- ポートスキャン（安全な範囲で）  
- IoT デバイスとの連携強化  
- 通信量の履歴保存  
- 異常予測（AI）

---

# ✔ 本 SpecDoc は URMS_MasterSpec に従う  
Network Manager の実装は、  
**URMS_MasterSpec.md の思想・命名規則・責務分離**に従うこと。

