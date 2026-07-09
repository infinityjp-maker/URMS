export type StorageVolumeKind = 'system' | 'data' | 'archive' | 'external';

export type StorageVolumeSummary = {
  readonly id: string;
  readonly name: string;
  readonly kind: StorageVolumeKind;
  readonly path: string;
  readonly totalGb: number;
  readonly usedGb: number;
  readonly freeGb: number;
  readonly usagePct: number;
  readonly summary: string;
};

export type StorageLargeItem = {
  readonly label: string;
  readonly sizeGb: number;
};

export type StorageVolumeDetail = StorageVolumeSummary & {
  readonly largestItems: readonly StorageLargeItem[];
  readonly cleanupHint: string;
};

export type StorageOverviewPayload = {
  readonly volumes: readonly StorageVolumeSummary[];
  readonly totalUsedGb: number;
  readonly totalCapacityGb: number;
  readonly source: 'catalog' | 'resource';
};

export type StorageOverviewResponse = {
  readonly data: StorageOverviewPayload;
};

export type StorageVolumeResponse = {
  readonly data: StorageVolumeDetail;
};
