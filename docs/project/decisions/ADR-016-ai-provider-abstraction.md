# ADR-016: AI Provider Abstraction

> **resource_type:** decision  
> **resource_id:** decision:ADR-016  
> **status:** accepted — **Architecture Freeze**  
> **date:** 2026-07-05  
> **freeze_date:** 2026-07-05  
> **author:** Architect

## コンテキスト

URMS は10年以上保守可能なシステムであり、特定の生成AIに依存してはならない。テキスト LLM・画像生成・音声・Embedding を統合的に扱い、Provider 追加時も Core を変更しない構造が必要。

## 決定

### アクセス経路（不変）

URMS Core は Provider を **直接参照しない**。

```
URMS Core
  ↓
AI Manager
  ↓
Provider Registry
  ↓
AiProviderAdapter
```

### 標準 Provider（Phase 3 組込）

OpenAI, Anthropic, Google, xAI, Ollama, LM Studio, vLLM, Custom Provider

追加時は **Adapter + Plugin のみ**。Core 変更禁止。

### 将来 Provider（Adapter のみで対応）

Azure OpenAI, AWS Bedrock, Vertex AI, Hugging Face, OpenRouter, DeepSeek, Mistral, Groq, Cohere, Perplexity, その他 OpenAI Compatible API

### Resource（独立管理）

| resource_type | 説明 |
|---------------|------|
| `ai-provider` | Provider 定義 |
| `ai-model` | Chat / Vision 等モデル（Provider に非依存 Resource） |
| `embedding-model` | Embedding 専用モデル（Chat と分離） |
| `generated-image` | 画像生成結果 |
| `ai-usage` | AI 利用履歴（Cost 管理） |

Model は Provider への **リレーション** のみ持ち、Resource として独立。

Provider は Chat / Vision / Embedding / Audio モデルを **別々に** 持てる。

### 標準 Capability（kebab-case、Core 不変）

| Capability | 説明 |
|------------|------|
| `chat` | テキスト対話 |
| `streaming` | ストリーミング |
| `reasoning` | 推論拡張 |
| `tools` | Tool Calling |
| `structured-output` | 構造化出力 |
| `vision` | 画像入力理解 |
| `image-generation` | 画像生成 |
| `image-edit` | 画像編集 |
| `image-variation` | 画像バリエーション |
| `speech-to-text` | 音声→テキスト |
| `text-to-speech` | テキスト→音声 |
| `realtime-audio` | リアルタイム音声 |
| `audio` | 音声（汎合） |
| `embedding` | ベクトル埋め込み |

将来: `background-removal`, `upscaling`（ProviderCapability として拡張）

**判定は Provider 名ではなく Capability で行う。** Capability 追加で Core 変更禁止。

### Routing（不変）

優先: **Task → Role → Project → System Default**

将来拡張: Cost, Latency, Availability, Capability, User Policy による自動 Routing

### Fallback（標準機能）

Primary → Secondary → Local LLM → Failure

トリガー: Timeout, API Error, Rate Limit, Capability 不足, Cost Policy

### Cost

最低限保持: Provider, Model, Prompt Tokens, Completion Tokens, Cost, Latency, Timestamp

`ai-usage` Resource として管理可能な設計。

### Security（不変）

- API Key は **Resource に保存しない**
- **Secret Store**（暗号化ストア）を使用
- ログへの平文出力禁止

### 画像 / 音声 / Embedding

- 画像生成: Core は共通 Prompt のみ生成。Provider 差異は Adapter が吸収
- 画像結果: `generated-image` Resource
- Embedding: `embedding-model` Resource、Chat Model と分離

## 理由

- VISION「拡張可能」「AI 協調」「10年保守」
- ベンダーロックイン回避
- マルチモーダル（テキスト・画像・音声・Embedding）統合

## 影響

- [18-ai-provider-architecture.md](../../architecture/18-ai-provider-architecture.md) — 設計正本
- Architecture Freeze 対象（変更時は ADR + PM 承認必須）

## 関連

- [ADR-002](./ADR-002-resource-model.md)
- [ADR-009](./ADR-009-plugin-architecture.md)
- [ADR-015](./ADR-015-ai-integration.md)
