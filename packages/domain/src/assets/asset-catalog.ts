import type { AssetCategory, AssetDetail, AssetSummary, PcPartType, PcRoadmapItem } from '@urms/shared';

export type AssetCatalogEntry = AssetDetail;

/** S7 — 資産カタログ（DB 未投入時の製品表示用 · 許可リスト） */
export const ASSET_CATALOG: readonly AssetCatalogEntry[] = [
  {
    id: 'gpu-rtx4070',
    name: 'NVIDIA RTX 4070',
    status: 'active',
    location: 'デスク PC · メイン',
    category: 'pc-part',
    partType: 'gpu',
    assetTag: 'GPU-01',
    budgetJpy: 85000,
    summary: '1440p ゲーム · 開発用 GPU',
    notes: '2025 年購入 · 消費電力 200W クラス',
    purchasedAt: '2025-11-20',
    roadmapNote: '次世代 GPU は 2027 以降を検討',
  },
  {
    id: 'cpu-ryzen7',
    name: 'AMD Ryzen 7 7800X3D',
    status: 'active',
    location: 'デスク PC · メイン',
    category: 'pc-part',
    partType: 'cpu',
    assetTag: 'CPU-01',
    budgetJpy: 52000,
    summary: '8C/16T · ゲーム/ビルド向け',
    purchasedAt: '2025-11-20',
  },
  {
    id: 'ram-32gb',
    name: 'DDR5 32GB (2x16)',
    status: 'active',
    location: 'デスク PC · メイン',
    category: 'pc-part',
    partType: 'ram',
    assetTag: 'RAM-01',
    budgetJpy: 18000,
    summary: '5600MHz · 開発 + コンテナ余裕',
    purchasedAt: '2025-11-20',
  },
  {
    id: 'ssd-2tb',
    name: 'NVMe SSD 2TB',
    status: 'active',
    location: 'デスク PC · メイン',
    category: 'pc-part',
    partType: 'storage',
    assetTag: 'SSD-01',
    budgetJpy: 22000,
    summary: 'OS + プロジェクト + Docker ボリューム',
    purchasedAt: '2025-11-20',
  },
  {
    id: 'monitor-27',
    name: '27" 4K モニター',
    status: 'active',
    location: 'デスク',
    category: 'peripheral',
    assetTag: 'MON-01',
    budgetJpy: 65000,
    summary: 'URMS 開発 · 設計レビュー用',
    purchasedAt: '2026-01-10',
  },
  {
    id: 'laptop-dev',
    name: '開発ノート PC',
    status: 'active',
    location: 'モバイル',
    category: 'other',
    assetTag: 'NB-01',
    budgetJpy: 180000,
    summary: '外出先 · サーバー疎通確認',
    notes: 'Docker Desktop · Cursor 利用',
    purchasedAt: '2024-06-01',
  },
] as const;

export const PC_ROADMAP: readonly PcRoadmapItem[] = [
  {
    phase: 'Phase 1',
    title: 'ストレージ拡張',
    detail: 'NVMe 2TB 追加 — Docker / 動画素材用',
    estimatedJpy: 24000,
  },
  {
    phase: 'Phase 2',
    title: 'RAM 64GB 化',
    detail: 'DDR5 32GB キット追加 — ローカル DB + 複数 Agent',
    estimatedJpy: 20000,
  },
  {
    phase: 'Phase 3',
    title: 'GPU 世代更新',
    detail: '電力効率 · VRAM 増 — 2027 以降に再評価',
    estimatedJpy: 120000,
  },
] as const;

export function findAssetCatalogEntry(id: string): AssetCatalogEntry | undefined {
  return ASSET_CATALOG.find((entry) => entry.id === id);
}

export function catalogAssets(): readonly AssetSummary[] {
  return ASSET_CATALOG.map((entry) => ({
    id: entry.id,
    name: entry.name,
    status: entry.status,
    location: entry.location,
    category: entry.category,
    ...(entry.partType ? { partType: entry.partType } : {}),
    ...(entry.assetTag ? { assetTag: entry.assetTag } : {}),
    ...(entry.budgetJpy !== undefined ? { budgetJpy: entry.budgetJpy } : {}),
    summary: entry.summary,
  }));
}

export function catalogPcParts(): readonly AssetSummary[] {
  return catalogAssets().filter((asset) => asset.category === 'pc-part');
}

export function isPcPartType(value: unknown): value is PcPartType {
  return value === 'cpu' || value === 'gpu' || value === 'ram' || value === 'storage' || value === 'motherboard' || value === 'psu';
}

export function isAssetCategory(value: unknown): value is AssetCategory {
  return value === 'pc-part' || value === 'peripheral' || value === 'other';
}
