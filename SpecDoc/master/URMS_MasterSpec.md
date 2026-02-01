# URMS_MasterSpec – Unified Resource Management System  
### （日本語正式名称：資産統合管理システム）

URMS の全体思想・構造・命名規則・責務分離・UI/UX 原則を定義する  
**最上位の仕様書（Master Specification）** です。

**最終更新**: v4.0 アーキテクチャ統一（2026-02-01）

---

# 1. 目的（Purpose）

URMS（Unified Resource Management System / 資産統合管理システム）は、  
生活・開発環境に存在する **情報・資産・状態・操作** を統合し、  
未来的で美しく、合理的で、事故ゼロの運用を実現するための  
**統合管理プラットフォーム**である。

本書は URMS 全体の思想・構造・ルールを定義し、  
各 Manager の SpecDoc（詳細仕様書）の基準となる。

---

# 2. 設計思想（Design Philosophy）

URMS は以下の 4 本柱を中心に設計される。

## 2.1 美観（Aesthetics）
- UI・構造・命名・レイアウトすべてにおいて美しさを追求する  
- 不要な情報・冗長な構造を排除し、視覚的に整った状態を維持する  
- Future Mode を基準とした未来的 UI を採用する

## 2.2 合理性（Efficiency）
- 最小の構造で最大の効果を得る  
- 重複・冗長・曖昧さを排除する  
- Manager 単位で責務を明確化し、変更の影響範囲を最小化する

## 2.3 構造美（Structural Elegance）
- 階層化・責務分離・命名規則を徹底する  
- UI / ロジック / データ / Rust / SpecDoc の整合性を保つ  
- 将来の拡張（IoT / AI / 自動化）に耐えられる構造を維持する

## 2.4 事故ゼロ（Zero Failure）
- 誤操作・不整合・破損・不正を未然に防ぐ  
- 進捗管理・ログ管理を全 Manager に統合  
- エラー処理を明確に定義し、例外を許容しない

---

# 3. システム構造（System Architecture）

URMS は 3 層構造で構成される。

## 3.1 Core Layer
URMS の中枢機能。

- Dashboard Manager  
- Log Manager  
- Progress Manager  

### 役割
- 全 Manager の状態を統合  
- UI の中心となるカード群を管理  
- ログ・進捗・通知を一元管理

---

## 3.2 System Layer
PC・OS の状態監視を担当。

- System Manager（CPU / RAM / Disk / Network）

### 役割
- 状態監視（Health Check）  
- 異常検知  
- 温度・容量・負荷の監視  
- File Manager への連携（容量逼迫時）

---

## 3.3 Subsystem Layer
生活・情報・資産・自動化などの機能群。

- Asset Manager  
- File Manager（新規）  
- Network Manager  
- IoT Manager  
- Schedule Manager  
- Finance Manager（v4 以降）

### 役割
- 各領域の専門処理  
- Core Layer との連携  
- Rust 側の処理を担当  
- SpecDoc に基づく明確な責務分離

---

# 4. 命名規則（Naming Rules）

URMS 全体で統一する。

| 種類 | 規則 |
|------|------|
| ディレクトリ | kebab-case |
| ファイル名 | kebab-case |
| 型・クラス | PascalCase |
| 変数・関数 | camelCase |
| Rust コマンド | snake_case |
| SpecDoc | PascalCase + `_Manager.md` |

---

# 5. UI/UX 原則（UI/UX Principles）

## 5.1 Future Mode を基準とする
URMS のデフォルトテーマは **Future Mode**。

特徴：
- 3D 浮遊カード  
- ネオンエッジ  
- HUD グリッド背景  
- パララックス効果  
- アニメーション Sparkline  
- 半透明ホログラフィック UI  

## 5.2 カード構成（Dashboard）
各 Manager は Dashboard にカードを提供する。

カードは以下を満たす：

- 情報は 3〜5 行以内  
- 状態・数値・進捗を明確に表示  
- 異常時は色・アニメーションで強調  
- Future Mode の UI ガイドラインに従う

---

# 6. Manager の責務分離（Responsibility Separation）

URMS の最重要ルール。

## 6.1 Core Manager
| Manager | 役割 |
|---------|------|
| Dashboard Manager | UI の中心。カード管理。 |
| Log Manager | 全ログの記録・分類・表示。 |
| Progress Manager | 全処理の進捗管理。 |

---

## 6.2 System Manager
| Manager | 役割 |
|---------|------|
| System Manager | CPU / RAM / Disk / Network の監視。異常検知。 |

---

## 6.3 Subsystem Manager
| Manager | 役割 |
|---------|------|
| Asset Manager | 資産・デバイス・構成情報の管理。 |
| File Manager | ファイル移動・分類・大容量処理。 |
| Network Manager | LAN / Ping / デバイス検出。 |
| IoT Manager | IoT デバイス連携。 |
| Schedule Manager | スケジュール管理。 |
| Finance Manager | 家計・支出管理（v4 以降）。 |

---

# 7. Rust / React の責務分離

## 7.1 Rust（src-tauri）
- ファイル操作  
- ネットワークスキャン  
- デバイス検出  
- 大容量処理  
- OS 情報取得  
- エラー処理  
- ログ出力  

## 7.2 React（src）
- UI 表示  
- 状態管理  
- カード構成  
- テーマ切替  
- Progress / Log の表示  
- Rust コマンドの呼び出し

---

# 8. 進捗管理（Progress Manager）

すべての Manager は Progress Manager と連携する。

進捗情報は以下を含む：

- taskId  
- title  
- percentage  
- elapsedTime  
- remainingTime  
- status（running / success / error）  

---

# 9. ログ管理（Log Manager）

すべての Manager は Log Manager にログを送信する。

ログは以下の形式：

- timestamp  
- level（INFO / WARN / ERROR）  
- manager  
- message  
- metadata（任意）

---

# 10. エラー処理（Error Handling）

URMS のエラー処理は以下を徹底する：

- Rust 側で例外を握りつぶさない  
- UI ではユーザーに明確なメッセージを表示  
- Log Manager に必ず記録  
- Progress Manager にエラー状態を反映  
- 再試行可能な処理は retry を提供

---

# 11. SpecDoc の役割（Subsystem Specifications）

各 Manager は独立した SpecDoc を持つ。

SpecDoc には以下を記載する：

- Manager の責務  
- UI（Dashboard カード構成）  
- データ構造  
- Rust コマンド一覧  
- エラー処理  
- Progress / Log との連携  
- 将来拡張

SpecDoc は `/docs/spec/` に配置する。

---

# 12. ロードマップ（Roadmap）

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

# 13. 本仕様書の位置づけ

本書（URMS_MasterSpec.md）は URMS の **最上位仕様書** であり、  
すべての SpecDoc と実装は本書に従う。

README.md → URMS_MasterSpec.md → 各 *_Manager.md  
という階層構造で URMS の仕様は維持される。

---

# 14. v4.0 アーキテクチャ統一（New）

## 14.1 ディレクトリ構成の標準化

v4.0 以降、URMS のディレクトリ構成は以下に統一される：

```
URMS/
├─ SpecDoc/               # 仕様書の一元化
├─ Source/                # TypeScript Frontend
├─ Backend/               # Rust Tauri Backend
├─ Work/                  # スクリプト・設定
├─ Tests/                 # テスト
└─ Assets/                # 画像・アイコン
```

詳細：`/Work/docs/DIRECTORY_SETUP.md` を参照

## 14.2 Manager 基底クラス導入

すべての Manager は `BaseManager` を継承し、以下を自動化する：

- ライフサイクル管理（initialize / shutdown）
- Log Manager 統合
- Progress Manager 統合
- エラーハンドリング統一

詳細：`/Source/src/core/base/BaseManager.ts` を参照

## 14.3 Manager 追加プロセスの標準化

新規 Manager 追加時は必ず以下のチェックリストに従う：

1. SpecDoc 作成
2. TypeScript 実装（BaseManager 継承）
3. Rust 実装（エラー型統一）
4. Dashboard カード実装
5. Log/Progress 連携
6. テスト実装（80% カバレッジ以上）
7. コードレビュー・PR

詳細：`/Work/docs/MANAGER_CHECKLIST.md` を参照

## 14.4 型安全性の強化

v4.0 では以下の型定義を統一：

- **ManagerTypes.ts**: 全 Manager で使用する共通型
- **error.rs**: Rust 側統一エラー型（URMSError）
- **base_manager.rs**: Rust 側 trait 定義

---

# ✔ 本仕様書の位置づけ

本書（URMS_MasterSpec.md）は URMS の **最上位仕様書** であり、  
すべての SpecDoc と実装は本書に従う。

参照ドキュメント階層：
```
README.md（概要・セットアップ）
    ↓
URMS_MasterSpec.md（全体思想・構造・命名規則）
    ↓
├─ SpecDoc/*_Manager.md（各 Manager 詳細仕様）
├─ DIRECTORY_SETUP.md（ディレクトリ構成ガイド）
├─ MANAGER_CHECKLIST.md（Manager 追加手順）
└─ SPECDOC_TEMPLATE.md（SpecDoc 作成テンプレート）
```

---

# ✔ URMS_MasterSpec.md v4.0 完成

このドキュメントは URMS v4.0 以降の全実装に適用される。
