import type { VideoDetail, VideoKind, VideoSummary } from '@urms/shared';

export type VideoCatalogEntry = VideoDetail;

/** S9 — 動画カタログ（製品表示用 · 許可リスト） */
export const VIDEO_CATALOG: readonly VideoCatalogEntry[] = [
  {
    id: 'vid-urms-demo',
    title: 'URMS 製品デモ（2026-07）',
    kind: 'export',
    path: 'E:\\Media\\Exports\\urms-demo-202607.mp4',
    durationMin: 4,
    sizeGb: 0.8,
    resolution: '1920x1080',
    summary: 'ハブ · モジュール遷移の screencast',
    codec: 'H.264 · AAC',
    capturedAt: '2026-07-05',
    tags: ['urms', 'demo', 'screencast'],
    storageHint: 'export は D: プロジェクト配下に symlink 可 · 原本は E: に保管',
    relatedVolumeId: 'vol-media',
  },
  {
    id: 'vid-trip-raw',
    title: '旅行 raw 2025 秋',
    kind: 'raw',
    path: 'E:\\Media\\Raw\\trip-2025-fall',
    durationMin: 240,
    sizeGb: 186,
    resolution: '3840x2160',
    summary: 'GoPro + スマホ · 未編集クリップ 48 本',
    codec: 'H.265 · PCM',
    capturedAt: '2025-10-12',
    tags: ['travel', 'raw', '4k'],
    storageHint: 'raw は E: 専用 · 編集後 export を D: へ移動（S8 ストレージ連携）',
    relatedVolumeId: 'vol-media',
  },
  {
    id: 'vid-dev-log',
    title: '開発ログ週次まとめ',
    kind: 'project',
    path: 'D:\\GitHub\\URMS\\docs\\media\\dev-log-w27.mp4',
    durationMin: 12,
    sizeGb: 1.2,
    resolution: '1920x1080',
    summary: 'Sprint 進捗 · 画面キャプチャ合成',
    codec: 'H.264 · AAC',
    capturedAt: '2026-07-01',
    tags: ['urms', 'dev-log'],
    storageHint: 'プロジェクト配下 · リポジトリ外の LFS 候補',
    relatedVolumeId: 'vol-projects',
  },
  {
    id: 'vid-archive-2024',
    title: '2024 アーカイブ（世代 3）',
    kind: 'archive',
    path: 'F:\\Backup\\Video\\2024-gen3',
    durationMin: 720,
    sizeGb: 420,
    resolution: 'mixed',
    summary: '年次バックアップ · 90 日超の世代整理対象',
    codec: 'mixed',
    tags: ['archive', 'backup'],
    storageHint: '外付け HDD · 90 日超世代は cold storage へ（ストレージ整理ヒント参照）',
    relatedVolumeId: 'vol-external',
  },
] as const;

export const VIDEO_STORAGE_POLICIES: readonly string[] = [
  'raw と export を同一フォルダに混在させない',
  '4K raw は E: · 編集プロキシは D: · 公開 export は別パス',
  'メタデータ（撮影日 · タグ）は Resource metadata.videoKind で SSOT 化',
  '90 日未アクセスの raw はアーカイブボリュームへ移動を検討',
] as const;

export function findVideoEntry(id: string): VideoCatalogEntry | undefined {
  return VIDEO_CATALOG.find((entry) => entry.id === id);
}

export function catalogVideos(): readonly VideoSummary[] {
  return VIDEO_CATALOG.map((entry) => ({
    id: entry.id,
    title: entry.title,
    kind: entry.kind,
    path: entry.path,
    durationMin: entry.durationMin,
    sizeGb: entry.sizeGb,
    resolution: entry.resolution,
    summary: entry.summary,
  }));
}

export function isVideoKind(value: unknown): value is VideoKind {
  return value === 'raw' || value === 'export' || value === 'project' || value === 'archive';
}

export function kindLabel(kind: VideoKind): string {
  if (kind === 'raw') return 'raw 素材';
  if (kind === 'export') return 'export';
  if (kind === 'project') return 'プロジェクト';
  return 'アーカイブ';
}

export function sumSizeGb(items: readonly VideoSummary[]): number {
  return items.reduce((total, item) => total + item.sizeGb, 0);
}

export function sumDurationMin(items: readonly VideoSummary[]): number {
  return items.reduce((total, item) => total + item.durationMin, 0);
}
