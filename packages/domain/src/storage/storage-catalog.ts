import type { StorageLargeItem, StorageVolumeDetail, StorageVolumeKind, StorageVolumeSummary } from '@urms/shared';

export type StorageCatalogEntry = StorageVolumeDetail;

/** S8 — ストレージカタログ（製品表示用 · 許可リスト） */
export const STORAGE_CATALOG: readonly StorageCatalogEntry[] = [
  {
    id: 'vol-system',
    name: 'システム SSD (C:)',
    kind: 'system',
    path: 'C:\\',
    totalGb: 512,
    usedGb: 318,
    freeGb: 194,
    usagePct: 62,
    summary: 'OS · アプリ · Cursor · Node キャッシュ',
    largestItems: [
      { label: 'Windows + アプリ', sizeGb: 142 },
      { label: 'node_modules (ワークスペース)', sizeGb: 68 },
      { label: 'Docker Desktop データ', sizeGb: 54 },
    ],
    cleanupHint: 'pnpm store prune · Docker 未使用イメージ削除で 10–20 GB 回収見込み',
  },
  {
    id: 'vol-projects',
    name: 'プロジェクト (D:)',
    kind: 'data',
    path: 'D:\\GitHub',
    totalGb: 1024,
    usedGb: 412,
    freeGb: 612,
    usagePct: 40,
    summary: 'URMS · その他リポジトリ · ビルド成果物',
    largestItems: [
      { label: 'URMS リポジトリ', sizeGb: 4.2 },
      { label: 'Git オブジェクト (全リポ)', sizeGb: 28 },
      { label: 'アーカイブ ZIP', sizeGb: 12 },
    ],
    cleanupHint: 'tmp-* · dist キャッシュの定期削除を推奨',
  },
  {
    id: 'vol-media',
    name: 'メディア・アーカイブ (E:)',
    kind: 'archive',
    path: 'E:\\Media',
    totalGb: 2048,
    usedGb: 1560,
    freeGb: 488,
    usagePct: 76,
    summary: '動画素材 · 写真 · 長期保管',
    largestItems: [
      { label: '動画プロジェクト (raw)', sizeGb: 820 },
      { label: '写真ライブラリ', sizeGb: 410 },
      { label: 'バックアップ ISO', sizeGb: 180 },
    ],
    cleanupHint: '76% 使用 — 古い raw 素材のアーカイブ移動を検討（S8+ 動画整理連携）',
  },
  {
    id: 'vol-external',
    name: '外付け HDD',
    kind: 'external',
    path: 'F:\\Backup',
    totalGb: 4096,
    usedGb: 2100,
    freeGb: 1996,
    usagePct: 51,
    summary: '週次バックアップ · スナップショット',
    largestItems: [
      { label: 'URMS バックアップ', sizeGb: 120 },
      { label: 'Documents ミラー', sizeGb: 340 },
      { label: 'VM スナップショット', sizeGb: 890 },
    ],
    cleanupHint: '世代管理 — 90 日超のスナップショット整理余地あり',
  },
] as const;

export const STORAGE_CLEANUP_TIPS: readonly string[] = [
  'Docker: docker system prune で未使用レイヤーを削除',
  'Node: pnpm store prune / 古い node_modules の棚卸し',
  'URMS: tmp-* スクリーンショット · ログの定期削除',
  '動画: raw と export を分離保管（動画整理モジュール予定）',
] as const;

export function findStorageVolume(id: string): StorageCatalogEntry | undefined {
  return STORAGE_CATALOG.find((entry) => entry.id === id);
}

export function catalogVolumes(): readonly StorageVolumeSummary[] {
  return STORAGE_CATALOG.map((entry) => ({
    id: entry.id,
    name: entry.name,
    kind: entry.kind,
    path: entry.path,
    totalGb: entry.totalGb,
    usedGb: entry.usedGb,
    freeGb: entry.freeGb,
    usagePct: entry.usagePct,
    summary: entry.summary,
  }));
}

export function isStorageVolumeKind(value: unknown): value is StorageVolumeKind {
  return value === 'system' || value === 'data' || value === 'archive' || value === 'external';
}

export function kindLabel(kind: StorageVolumeKind): string {
  if (kind === 'system') return 'システム';
  if (kind === 'data') return 'データ';
  if (kind === 'archive') return 'アーカイブ';
  return '外付け';
}

export function sumUsedGb(volumes: readonly StorageVolumeSummary[]): number {
  return volumes.reduce((total, volume) => total + volume.usedGb, 0);
}

export function sumTotalGb(volumes: readonly StorageVolumeSummary[]): number {
  return volumes.reduce((total, volume) => total + volume.totalGb, 0);
}

export function largestItemsForVolume(id: string): readonly StorageLargeItem[] {
  return findStorageVolume(id)?.largestItems ?? [];
}
