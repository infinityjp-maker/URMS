# URMS AI Provider Architecture（生成AI切替アーキテクチャ）

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-ai-provider  
> **version:** 1.1 — Architecture Freeze（2026-07-05）  
> **status:** frozen  
> **owner:** Architect

## 参照

- [VISION.md](../project/VISION.md)
- [ADR-016](../project/decisions/ADR-016-ai-provider-abstraction.md)
- [09-plugin-architecture.md](./09-plugin-architecture.md)
- [17-ai-integration.md](./17-ai-integration.md)

---

## 1. 設計目的

生成AIを **交換可能なコンポーネント** として扱い、URMS 本体は特定 AI サービスに依存しない。

| 原則 | 説明 |
|------|------|
| AI Provider 非依存 | Core は Adapter Interface のみ利用 |
| Adapter Pattern | Provider 固有 API を Adapter で吸収 |
| Plugin First | Provider 追加・削除で Core 変更不要 |
| Resource First | Provider / Model / Capability を Resource 化 |
| Capability Based | モデル差異を Capability で吸収 |
| Provider Switching | Task → Role → Project → System 優先 |
| Automatic Routing | タスク種別に応じた Provider 選択 |
| Fallback | 障害時に次順位 Provider へ自動切替 |
| Cost 可視化 | Token / Cost / Latency を集計 |
| 長期保守性 | 新 Provider 追加時 Core 変更なし |

---

## 2. 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                         URMS Core                                │
│  Resource │ Mode │ Context Engine │ Audit │ API                  │
└────────────────────────────┬────────────────────────────────────┘
                             │ **AiManagerInterface のみ**（Provider 直接参照禁止）
┌────────────────────────────▼────────────────────────────────────┐
│                        AI Manager                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │ Provider     │ │ Routing      │ │ Fallback                 │ │
│  │ Registry     │ │ Engine       │ │ Chain                    │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │ Config       │ │ Cost         │ │ Audit / Log              │ │
│  │ Resolver     │ │ Tracker      │ │ (prompt hash)            │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ Adapter Interface
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ OpenAI        │   │ Anthropic     │   │ Google        │
│ Adapter       │   │ Adapter       │   │ Adapter       │
└───────────────┘   └───────────────┘   └───────────────┘
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ xAI           │   │ Ollama        │   │ LM Studio     │
│ Adapter       │   │ Adapter       │   │ Adapter       │
└───────────────┘   └───────────────┘   └───────────────┘
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐
│ vLLM          │   │ Custom        │
│ Adapter       │   │ Adapter       │
└───────────────┘   └───────────────┘
```

**呼び出しフロー（PM 経由）:**

```
PM (plan Mode)
  │
  ▼
AI Manager.resolve(task, role, project)
  │  1. Provider Switching（Task → Role → Project → System）
  │  2. Routing Policy（タスク種別 → 推奨 Model）
  │  3. Capability 検証
  │  4. Adapter 実行
  │  5. Fallback（失敗時）
  │  6. Cost / Audit 記録
  ▼
AiProviderAdapter.chat(...) / stream(...) / ...
```

---

## 3. Provider Interface

すべての Adapter は `AiProviderAdapter` を実装する。

**不変ルール:** URMS Core → **AI Manager** → **Provider Registry** → **AiProviderAdapter** のみ。Core が Adapter / Provider SDK を直接 import することを禁止。

```typescript
interface AiProviderAdapter {
  /** Provider 識別子 — resource_id と一致 */
  readonly providerId: string;

  /** 必須機能 */
  chat(request: ChatRequest): Promise<ChatResponse>;
  stream(request: ChatRequest): AsyncIterable<StreamChunk>;
  embed(request: EmbedRequest): Promise<EmbedResponse>;
  generateImage(request: ImageRequest): Promise<ImageResponse>;
  vision(request: VisionRequest): Promise<VisionResponse>;
  transcribe(request: AudioRequest): Promise<AudioResponse>;
  callTools(request: ToolCallRequest): Promise<ToolCallResponse>;
  structuredOutput<T>(request: StructuredRequest<T>): Promise<T>;

  /** 運用 */
  getTokenUsage(sessionId?: string): Promise<TokenUsage>;
  getCostInfo(sessionId?: string): Promise<CostInfo>;
  healthCheck(): Promise<HealthStatus>;

  /** Provider 固有 — Capability として公開 */
  getCapabilities(modelId: string): CapabilitySet;
  getProviderCapabilities(): ProviderCapability[];
}
```

### 3.1 共通リクエスト/レスポンス

```typescript
interface ChatRequest {
  modelId: string;
  messages: Message[];
  options?: GenerationOptions;
  taskType?: AiTaskType;
  metadata?: { userId?: string; projectId?: string; taskId?: string };
}

interface GenerationOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  timeout?: number;
  retry?: RetryPolicy;
}

interface ChatResponse {
  content: string;
  usage: TokenUsage;
  cost?: CostInfo;
  latencyMs: number;
  modelId: string;
  providerId: string;
}
```

Provider 未対応機能は `CapabilityNotSupportedError` を返す（Fallback トリガー可）。

---

## 4. Provider Registry

```typescript
interface AiProviderRegistry {
  register(adapter: AiProviderAdapter, plugin: AiProviderPlugin): void;
  unregister(providerId: string): void;
  get(providerId: string): AiProviderAdapter | undefined;
  list(): AiProviderAdapter[];
  listByCapability(cap: Capability): AiProviderAdapter[];
}
```

**配置（Phase 3 実装）:**

```
packages/domain/src/ai/
├── ai-manager.ts
├── provider-registry.ts
├── routing-engine.ts
├── fallback-chain.ts
├── config-resolver.ts
└── cost-tracker.ts

packages/plugins/ai-providers/
├── openai/
├── anthropic/
├── google/
├── xai/
├── ollama/
├── lmstudio/
├── vllm/
└── custom/
```

起動時: 組込 Adapter を register。develop Mode で動的追加（ADR-009 拡張）。

---

## 5. Resource 化

### 5.1 Resource Type

| resource_type | 説明 | 例 resource_id |
|---------------|------|----------------|
| `ai-provider` | AI サービス Provider | `openai`, `anthropic`, `ollama` |
| `ai-model` | Chat / Vision モデル | `gpt-5.5`, `claude-opus` |
| `embedding-model` | Embedding 専用（Chat と分離） | `text-embedding-3-large` |
| `generated-image` | 画像生成結果 | `img-20260705-001` |
| `ai-usage` | AI 利用履歴（Cost） | `usage-20260705-001` |

**Provider と Model は別 Resource。** Model は Provider に **依存しない** 独立 Resource。`provided_by` リレーションで関連付け。

Provider は **Chat / Vision / Embedding / Audio** モデルを別 Resource として複数保持可能。

```json
{
  "resource_type": "ai-model",
  "resource_id": "gpt-5.5",
  "metadata": {
    "modelKind": "chat",
    "capabilities": ["chat", "streaming", "tools", "vision", "structured-output"]
  }
}
```

```json
{
  "resource_type": "embedding-model",
  "resource_id": "text-embedding-3-large",
  "metadata": {
    "modelKind": "embedding",
    "capabilities": ["embedding"]
  }
}
```

```json
{
  "resource_type": "generated-image",
  "resource_id": "img-20260705-001",
  "metadata": {
    "prompt": "共通 Prompt（Core 生成）",
    "negative_prompt": "",
    "seed": 42,
    "size": "1024x1024",
    "providerId": "openai",
    "modelId": "dall-e-3",
    "parameters": {},
    "parentResourceId": "digital:design-asset-001"
  }
}
```

### 5.2 旧 Resource 例（ai-provider）

```json
{
  "resource_type": "ai-provider",
  "resource_id": "openai",
  "name": "OpenAI",
  "status": "active",
  "metadata": {
    "adapterPlugin": "openai",
    "secretRef": "secret://ai-provider/openai"
  }
}
```

**API Key は Resource metadata に含めない。** Secret Store 参照（`secretRef`）のみ。

### 5.3 リレーション

| relationType | 例 |
|--------------|-----|
| `provided_by` | ai-model:gpt-5.5 → ai-provider:openai |
| `fallback_to` | ai-model:gpt-5.5 → ai-model:claude-opus |
| `default_for_task` | ai-model:* → task:requirements |

---

## 6. Capability Matrix

各 Model の能力を Capability として保持。AI 差異を Matrix で吸収。

### 6.1 標準 Capability（Architecture Freeze — kebab-case）

| Capability | 説明 |
|------------|------|
| `chat` | テキスト対話 |
| `streaming` | ストリーミング応答 |
| `reasoning` | 推論拡張モード |
| `tools` | Tool Calling |
| `structured-output` | 構造化出力 / JSON |
| `vision` | 画像入力理解 |
| `image-generation` | 画像生成 |
| `image-edit` | 画像編集 |
| `image-variation` | 画像バリエーション |
| `speech-to-text` | 音声→テキスト |
| `text-to-speech` | テキスト→音声 |
| `realtime-audio` | リアルタイム音声 |
| `audio` | 音声（汎合） |
| `embedding` | ベクトル埋め込み |

将来 Capability（ProviderCapability 拡張、Core 不変）: `background-removal`, `upscaling`

Provider 固有機能は **ProviderCapability** として追加（例: `openai:assistants`）。**Capability 追加で Core を変更してはならない。**

### 6.2 Capability Matrix（例）

| Model | chat | stream | embed | vision | img-gen | tools | reason | audio |
|-------|------|--------|-------|--------|---------|-------|--------|-------|
| gpt-5.5 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| claude-opus | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ |
| text-embedding-3 | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

Matrix 正本: Resource `ai-model` metadata + 将来 `docs/architecture/capability-matrix.md` 自動生成（Phase 3）。

### 6.3 検証

AI Manager はリクエスト前に Capability を検証。不足時:

1. Routing で代替 Model 探索
2. 不可なら Fallback Chain
3. 全失敗 → `AI_CAPABILITY_UNAVAILABLE`

---

## 7. Provider Switching

### 7.1 切替レベル

| レベル | 設定場所 | 例 |
|--------|----------|-----|
| System | グローバル設定 Resource | 既定: openai |
| Project | project metadata | URMS 本体: anthropic |
| Role | role metadata | role:architect → claude-opus |
| Task | タスク単位 override | 設計タスク → gemini-2.5-pro |
| Manual | User 手動選択 | UI / API override |
| Auto | Routing Engine | タスク種別から自動 |

### 7.2 優先順位

```
Task（最高）
  ↓
Role
  ↓
Project
  ↓
System（最低）
```

Manual override は Task 相当として扱う。

```typescript
interface ProviderSwitchConfig {
  system?: ProviderModelRef;
  project?: ProviderModelRef;
  role?: Record<string, ProviderModelRef>;
  task?: Record<string, ProviderModelRef>;
}

interface ProviderModelRef {
  providerId: string;
  modelId: string;
}
```

---

## 8. Routing Policy

AI Manager はタスク内容に応じて最適 Provider を選択。将来 **Routing Engine** を独立モジュール化。

### 8.1 タスク種別（AiTaskType）

| TaskType | 推奨 Model 例 | 備考 |
|----------|---------------|------|
| `requirements` | claude-opus, gpt-5.5 | 長文理解 |
| `design` | claude-opus, gemini-2.5-pro | 構造化出力 |
| `coding` | gpt-5.5, claude-opus | Tool Calling |
| `testing` | gpt-5.5 | コード生成 |
| `review` | claude-opus | 批判的分析 |
| `documentation` | gpt-5.5, gemini-2.5-pro | 日本語品質 |
| `ocr` | gemini-2.5-pro, gpt-5.5 | Vision |
| `speech` | openai-whisper | Audio |
| `image_generation` | dall-e, gemini-image | ImageGen |

### 8.2 Routing Engine インターフェース

```typescript
interface RoutingEngine {
  select(context: RoutingContext): ProviderModelRef;
}

interface RoutingContext {
  taskType: AiTaskType;
  requiredCapabilities: Capability[];
  switchConfig: ProviderSwitchConfig;
  availableModels: AiModelResource[];
}
```

MVP 実装: ルールベース + Task→Role→Project→System。

**将来 Routing 因子:** Cost, Latency, Availability, Capability, User Policy

---

## 8.1 画像生成 AI

### Capability

`image-generation`, `image-edit`, `image-variation`（将来: `background-removal`, `upscaling`）

### 対応 Provider（Adapter 追加のみ）

OpenAI Images, Google Imagen, Stable Diffusion, FLUX, ComfyUI, Automatic1111, Forge, その他画像生成 API

### Prompt 互換

Core は **共通 Prompt**（prompt, negative_prompt, size, seed 等）のみ生成。Provider 固有形式は Adapter が変換。

### 結果

`generated-image` Resource として永続化（§5.1）。

---

## 8.2 音声 AI

### Capability

`speech-to-text`, `text-to-speech`, `realtime-audio`, `audio`

将来 Provider: OpenAI, ElevenLabs, Google, Azure, Whisper 等 — Adapter のみ追加。

---

## 8.3 Embedding

- `embedding-model` Resource（Chat Model と分離）
- Provider は Chat / Vision / Embedding / Audio を **別モデル Resource** として保持

---

## 9. Fallback Policy

Provider 利用不可時、次順位へ自動切替。

### 9.1 Fallback Chain（標準機能）

```
Primary（例: GPT-5.5 / OpenAI）
  ↓
Secondary（例: Claude / Anthropic）
  ↓
Local LLM（例: Ollama / llama3）
  ↓
Failure（AI_ALL_PROVIDERS_FAILED）
```

```yaml
chain:
  - provider: openai
    model: gpt-5.5
  - provider: anthropic
    model: claude-opus
  - provider: ollama
    model: llama3-local
```

### 9.2 トリガー条件

| 条件 | 動作 |
|------|------|
| Timeout | リトライ → 次 Provider |
| API Error | 次 Provider |
| Rate Limit (429) | 指数バックオフ → 次 Provider |
| Capability 不足 | Routing 再試行 → Fallback |
| Cost Policy 超過 | 次 Provider |
| 5xx エラー | 次 Provider |

```typescript
interface FallbackPolicy {
  chain: ProviderModelRef[];
  maxRetries: number;
  retryDelayMs: number;
  skipOnCapabilityMismatch: boolean;
}
```

---

## 10. Provider Configuration

Provider 設定は Resource metadata + **Secret Store** で保持。**API Key は Resource に保存しない。**

| 設定項目 | 保存先 |
|----------|--------|
| apiKey | **Secret Store**（`secretRef` のみ Resource） |
| endpoint, organization, project, region | metadata |
| timeout, retry, maxTokens, temperature, topP, rateLimit | metadata |

```typescript
interface ProviderConfig {
  providerId: string;
  secretRef: string;           // Secret Store 参照（apiKey 等）
  settings: ProviderSettings;    // 非秘密設定
  permissions: ProviderPermission[];
}
```

Config Resolver は Switching 優先順位と同様に Task → Role → Project → System で merge。

---

## 11. Cost Management

### 11.1 必須保持項目（Architecture Freeze）

Provider, Model, Prompt Tokens, Completion Tokens, Cost, Latency, Timestamp

`ai-usage` Resource としても参照可能。

### 11.2 Cost Tracker

```typescript
interface CostTracker {
  record(event: AiUsageEvent): Promise<void>;
  aggregate(filter: CostFilter): Promise<CostSummary>;
  byProvider(providerId: string): Promise<CostSummary>;
  byProject(projectId: string): Promise<CostSummary>;
}
```

Phase 3: `ai_usage_logs` テーブル。Phase 4: ダッシュボード UI。

---

## 12. ログ・監査

AI 呼び出しは **監査対象**（NFR-032 拡張）。

### 12.1 保持項目

| 項目 | 必須 | 説明 |
|------|------|------|
| providerId | ✅ | Provider |
| modelId | ✅ | Model |
| promptHash | ✅ | SHA-256（本文非保存時） |
| responseHash | ✅ | SHA-256 |
| cost | ✅ | コスト |
| latencyMs | ✅ | レイテンシ |
| userId | ✅ | User |
| projectId | Should | Project |
| taskId | Should | Task |
| timestamp | ✅ | 日時 |
| promptBody | 設定依存 | `storePromptBody: true/false` |
| responseBody | 設定依存 | `storeResponseBody: true/false` |

### 12.2 設定

```typescript
interface AiAuditConfig {
  storePromptBody: boolean;   // デフォルト: false
  storeResponseBody: boolean; // デフォルト: false
  retentionDays: number;      // デフォルト: 90
}
```

Application Log への API Key 平文出力 **禁止**。

---

## 13. セキュリティ

| 要件 | 実装 |
|------|------|
| API Key | **Secret Store** — Resource に平文保存禁止 |
| secretRef | ai-provider metadata に参照のみ |
| ログマスク | apiKey, authorization ヘッダ除外 |
| Provider 権限 | Role ごとに利用可能 Provider 制限 |
| 監査 | 全呼出を ai_audit_logs / ai-usage に記録 |

```typescript
interface ProviderPermission {
  roleId: string;
  allowedProviders: string[];
  allowedModels?: string[];
  maxCostPerDay?: number;
}
```

---

## 14. Plugin Registration

AI Provider は **AiProviderPlugin** として追加・削除可能。

```typescript
interface AiProviderPlugin {
  id: string;                          // e.g. "openai"
  version: string;
  createAdapter(config: ProviderConfig): AiProviderAdapter;
  supportedModels(): ModelDefinition[];
  defaultCapabilities(): Record<string, Capability[]>;
}
```

### 14.1 登録手順

1. `packages/plugins/ai-providers/{provider}/` 作成
2. `AiProviderAdapter` + `AiProviderPlugin` 実装
3. ADR 作成（新 Provider 追加時）→ PM 承認
4. Provider Registry に register
5. Resource `ai-provider`, `ai-model` seed
6. capability-matrix 更新（KM）

**Core 変更不要** — Registry + Plugin のみ。

### 14.2 組込 Provider（Phase 3 計画）

| Plugin ID | Adapter | 備考 |
|-----------|---------|------|
| openai | OpenAIAdapter | Chat, Vision, Image, Audio, Tools |
| anthropic | AnthropicAdapter | Chat, Tools, Vision |
| google | GoogleAdapter | Gemini 系 |
| xai | XaiAdapter | Grok 系 |
| ollama | OllamaAdapter | ローカル |
| lmstudio | LMStudioAdapter | OpenAI 互換 API |
| vllm | VllmAdapter | OpenAI 互換 API |
| custom | CustomAdapter | 設定駆動 |

### 14.3 将来 Provider（Adapter + Plugin のみ）

Azure OpenAI, AWS Bedrock, Vertex AI, Hugging Face, OpenRouter, DeepSeek, Mistral, Groq, Cohere, Perplexity, OpenAI Compatible API — **Core 変更禁止**

---

## 15. API エンドポイント（Phase 3 追加予定）

| Method | Path | 説明 |
|--------|------|------|
| GET | `/v1/ai/providers` | Provider 一覧 |
| GET | `/v1/ai/models` | Model 一覧 + Capability |
| POST | `/v1/ai/chat` | Chat（Routing + Fallback） |
| POST | `/v1/ai/images/generate` | 画像生成 → generated-image Resource |
| POST | `/v1/ai/audio/transcribe` | speech-to-text |
| POST | `/v1/ai/audio/synthesize` | text-to-speech |
| GET | `/v1/ai/usage` | Cost / Usage 集計 |
| GET | `/v1/ai/health` | Provider Health |

---

## 16. パッケージ構成（Phase 3）

```
packages/domain/src/ai/          # AI Manager, Registry, Routing, Fallback
packages/plugins/ai-providers/   # 各 Adapter Plugin
packages/db/prisma/              # ai_usage_logs, ai_audit_logs
apps/api/src/routes/ai/          # REST endpoints
apps/web/src/features/ai/        # Provider 切替 UI, Cost Dashboard（Phase 4）
```

---

## 17. 関連 ADR / 文書

| 文書 | 関係 |
|------|------|
| ADR-002 | Resource モデル — ai-provider, ai-model |
| ADR-009 | Plugin Registry 拡張 |
| ADR-015 | AI 連携 — API 消費との統合 |
| ADR-016 | 本設計の正式決定 |

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
| 2026-07-05 | v1.1 — Architecture Freeze。Capability kebab-case、Secret Store、画像/音声/Embedding、generated-image |
