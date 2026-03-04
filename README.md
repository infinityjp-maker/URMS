# URMS – Unified Resource Management System  
### （日本語正式名称：資産統合管理システム）

未来的で美しく、合理的で、事故ゼロの運用を実現する統合管理システム。

---

## 🚀 概要（Overview）

URMS（Unified Resource Management System / 資産統合管理システム）は、  
生活・開発環境に存在する **「情報・資産・状態・操作」** を統合し、  
未来的で美しく、合理的で、事故ゼロの運用を実現するための  
**次世代型ダッシュボードシステム**です。

URMS は以下の 3 層構造で構成されます。

- **Core Layer**：Dashboard / Log / Progress  
- **System Layer**：PC・OS 状態監視  
- **Subsystem Layer**：Asset / File / Network / IoT / Schedule など

---

## 🎯 設計思想（Philosophy）

URMS は次の 4 本柱を中心に設計されています。

### 1. 美観（Aesthetics）  
UI・構造・命名・レイアウトすべてにおいて美しさを追求。

### 2. 合理性（Efficiency）  
冗長・重複・無駄を排除し、最小の構造で最大の効果を得る。

### 3. 構造美（Structural Elegance）  
役割分離・階層化・責務の明確化を徹底し、長期運用でも破綻しない。

### 4. 事故ゼロ（Zero Failure）  
誤操作・不整合・破損・不正を未然に防ぐ仕組みを組み込む。

---

## 📁 ディレクトリ構成（v3.3.2）

```
URMS/
├─ src/
│   ├─ core/
│   │   ├─ dashboard-manager/
│   │   ├─ log-manager/
│   │   └─ progress-manager/
│   │
│   ├─ system/
│   │   └─ system-manager/
│   │
│   ├─ subsystems/
│   │   ├─ asset-manager/
│   │   ├─ link-manager/
│   │   ├─ finance-manager/
│   │   ├─ network-manager/
│   │   ├─ iot-manager/
│   │   ├─ schedule-manager/
│   │   └─ file-manager/          ← 新規追加
│   │
│   ├─ components/
│   ├─ hooks/
│   ├─ utils/
│   ├─ styles/
│   └─ app.tsx / main.tsx
│
├─ src-tauri/
│   ├─ src/
│   │   ├─ core/
│   │   ├─ system/
│   │   └─ subsystems/
│   │       ├─ asset-manager/
│   │       ├─ finance-manager/
│   │       ├─ network-manager/
│   │       ├─ iot-manager/
│   │       ├─ schedule-manager/
│   │       └─ file-manager/      ← 新規追加
│   │
│   ├─ icons/
│   ├─ tauri.conf.json
│   └─ Cargo.toml
│
├─ docs/
│   ├─ master/
│   │   └─ URMS_MasterSpec.md
│   │
│   └─ spec/
│       ├─ Dashboard_Manager.md
│       ├─ Log_Manager.md
│       ├─ Progress_Manager.md
│       ├─ System_Manager.md
│       ├─ Asset_Manager.md
│       ├─ Link_Manager.md
│       ├─ Finance_Manager.md
│       ├─ Network_Manager.md
│       ├─ IoT_Manager.md
│       ├─ Schedule_Manager.md
│       └─ File_Manager.md        ← 新規追加
│
├─ assets/
│   ├─ icons/
│   ├─ images/
│   └─ mockups/
│
├─ scripts/
│   ├─ build.ps1
│   ├─ clean.ps1
│   └─ generate-icons.ps1
│
├─ public/
├─ dist/
├─ .git/
├─ .vscode/
├─ .gitignore
├─ index.html
├─ package.json
├─ package-lock.json
└─ README.md
```

---

## 🛠 セットアップ（Setup）

URMS をローカル環境で動作させるための手順です。

### 1. 必要な環境

- Node.js（LTS 推奨）
- Rust（stable）
- Tauri CLI  
  ```bash
  cargo install tauri-cli
  ```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 開発モードで起動

```bash
npm run tauri dev
```

### 4. ビルド（実行ファイル生成）

```bash
npm run tauri build
```

---

## 🎨 画面設定（Display Settings）

URMS は複数の画面スタイル（テーマ）をサポートしています。

### デフォルトテーマ：**Future Mode（未来モード）**

| テーマ | 説明 |
|-------|------|
| **Future Mode（デフォルト）** | ネオン・ホログラフィック・3D UI を採用した URMS 専用テーマ |
| **ダークモード** | 目に優しい暗色テーマ |
| **ライトモード** | 明るくフラットな配色 |

---

## 🧩 開発ルール（Development Rules）

### 命名規則

- ディレクトリ：kebab-case  
- 型・クラス：PascalCase  
- 変数・関数：camelCase  
- Rust コマンド：snake_case

### Manager の追加ルール

1. `/src/subsystems/<manager-name>/` を作成  
2. `/src-tauri/src/subsystems/<manager-name>/` を作成  
3. `/docs/spec/<ManagerName>_Manager.md` を作成  
4. Dashboard へのカード追加は SpecDoc に従う

---

## 📘 仕様書（Documentation）

URMS の仕様は以下の 3 層で構成されています。

1. **URMS_MasterSpec.md**  
　URMS 全体の思想・構造・命名規則・責務分離の基準を定義した全体仕様書。

2. **各 Manager の SpecDoc（*_Manager.md）**  
　UI・データ構造・Rust コマンド・エラー処理などの詳細仕様。

3. **README.md（本書）**  
　プロジェクトの概要・セットアップ・ディレクトリ構造・開発ルール。

---

## 🤖 Copilot 連携（AI Integration）

URMS のコード生成は、  
**必ず `/docs/master/URMS_MasterSpec.md` と `/docs/spec` の SpecDoc に基づいて行われます。**

Copilot は以下を参照して動作します。

- Master Spec（全体仕様書）  
- 各 Manager の SpecDoc（詳細仕様書）  
- 命名規則  
- UI/UX 原則  
- エラー処理方針  
- データ構造

---

## 🗺 ロードマップ（Roadmap）

### v3.x  
- Dashboard / Log / Progress  
- System Manager  
- Network Manager  
- **Asset Manager（優先）**  
- **File Manager（新規）**  
- Future Mode UI

### v4.x  
- Finance Manager（後回し）  
- IoT Manager  
- 自動化ルール（Auto-Sort / Auto-Clean）  
- Asset Manager 拡張（構成図・電源系統）

### v5.x  
- AI 連携  
- 分散処理  
- 高度な予測分析  
- Finance Manager の高度化（AI分類・異常検知）

---

## ✔ 以上で README.md（v3.3.2）の完成です
## CI / Triage System

- Triage Workflow Consolidation Report: [Triage Workflow Consolidation Report](docs/triage-workflow-consolidation.md)

