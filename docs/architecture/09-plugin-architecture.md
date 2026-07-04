# URMS Plugin アーキテクチャ

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-plugin  
> **version:** 1.0  
> **phase:** 2

## 参照

- [ADR-009](../project/decisions/ADR-009-plugin-architecture.md)
- [08-resource-management.md](./08-resource-management.md)

---

## 1. 目的

Resource Type 追加時に **コア変更を最小化** し、10年保守可能な拡張点を提供する（NFR-010）。

---

## 2. Plugin 種別

| 種別 | 説明 | MVP |
|------|------|-----|
| **ResourceTypePlugin** | Type 別バリデーション・メタデータ | ✅ 組込 |
| **AiProviderPlugin** | AI Provider Adapter 登録 | Phase 3 |
| **ModeExtensionPlugin** | Mode 追加（将来） | ❌ |
| **IntegrationPlugin** | 外部連携（将来） | ❌ |

---

## 3. Registry パターン

```typescript
class PluginRegistry {
  register(plugin: ResourceTypePlugin): void;
  get(type: string): ResourceTypePlugin | undefined;
  list(): ResourceTypePlugin[];
}
```

- 起動時: 組込 Plugin を register
- 将来: `packages/plugins/*` から動的 load（develop Mode）

---

## 4. 組込 Plugin 配置

```
packages/domain/src/plugins/
├── physical.plugin.ts
├── digital.plugin.ts
├── human.plugin.ts
├── knowledge.plugin.ts
└── system/                    # role, rule, command, etc.
    ├── role.plugin.ts
packages/plugins/ai-providers/   # ADR-016 — OpenAI, Anthropic, etc.
```

AiProviderPlugin 詳細: [18-ai-provider-architecture.md](./18-ai-provider-architecture.md)

---

## 5. 拡張手順（将来）

1. `packages/plugins/my-type/` 作成
2. `ResourceTypePlugin` 実装
3. ADR 作成 → PM 承認
4. Registry に register（develop Mode）
5. resource-catalog.md 更新（KM）

---

## 6. 制約

- Plugin は domain 層のみ。DB 直接アクセス禁止（Repository 経由）
- Plugin 間依存禁止
- 外部 npm 依存は ADR 必須

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
| 2026-07-05 | v1.1 — AiProviderPlugin 参照追加 |
