import type {
  StorageOverviewPayload,
  StorageVolumeDetail,
  StorageVolumeSummary,
  UrmsMode,
} from '@urms/shared';
import type { ResourceEntity } from '@urms/shared';

import type { ResourceService } from '../resource/resource-service.js';
import {
  STORAGE_CLEANUP_TIPS,
  catalogVolumes,
  findStorageVolume,
  isStorageVolumeKind,
  sumTotalGb,
  sumUsedGb,
} from './storage-catalog.js';

const DIGITAL_RESOURCE_TYPE = 'digital';
const LIST_LIMIT = 64;

export interface StorageService {
  getOverview(mode: UrmsMode): Promise<StorageOverviewPayload>;
  getVolume(id: string, mode: UrmsMode): Promise<StorageVolumeDetail | null>;
  listCleanupTips(): readonly string[];
}

export type StorageServiceOptions = {
  resourceService: ResourceService;
};

function readMetadataString(metadata: Record<string, unknown>, key: string): string | undefined {
  const value = metadata[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function readMetadataNumber(metadata: Record<string, unknown>, key: string): number | undefined {
  const value = metadata[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function mapDigitalStorageResource(entity: ResourceEntity): StorageVolumeSummary | null {
  const metadata = entity.metadata ?? {};
  const kindRaw = readMetadataString(metadata, 'storageKind');
  const kind = isStorageVolumeKind(kindRaw) ? kindRaw : 'data';
  const totalGb = readMetadataNumber(metadata, 'totalGb');
  const usedGb = readMetadataNumber(metadata, 'usedGb');
  if (totalGb === undefined || usedGb === undefined || totalGb <= 0) {
    return null;
  }

  const freeGb = Math.max(0, totalGb - usedGb);
  const usagePct = Math.min(100, Math.round((usedGb / totalGb) * 100));
  const path = readMetadataString(metadata, 'path') ?? readMetadataString(metadata, 'vendor') ?? '—';

  return {
    id: entity.resourceId,
    name: entity.name,
    kind,
    path,
    totalGb,
    usedGb,
    freeGb,
    usagePct,
    summary: readMetadataString(metadata, 'notes') ?? `${path} · ${usagePct}% 使用中`,
  };
}

function mapDigitalStorageDetail(entity: ResourceEntity): StorageVolumeDetail | null {
  const summary = mapDigitalStorageResource(entity);
  if (!summary) {
    return null;
  }

  const metadata = entity.metadata ?? {};
  const largestItems = Array.isArray(metadata.largestItems)
    ? metadata.largestItems
        .filter((item): item is { label: string; sizeGb: number } => {
          return (
            typeof item === 'object' &&
            item !== null &&
            typeof (item as { label?: unknown }).label === 'string' &&
            typeof (item as { sizeGb?: unknown }).sizeGb === 'number'
          );
        })
        .map((item) => ({ label: item.label, sizeGb: item.sizeGb }))
    : [];

  return {
    ...summary,
    largestItems,
    cleanupHint: readMetadataString(metadata, 'cleanupHint') ?? '定期的なキャッシュ削除を推奨',
  };
}

export class ResourceStorageService implements StorageService {
  private readonly resourceService: ResourceService;

  constructor(options: StorageServiceOptions) {
    this.resourceService = options.resourceService;
  }

  private async loadResourceVolumes(mode: UrmsMode): Promise<StorageVolumeSummary[]> {
    try {
      const { items } = await this.resourceService.list(
        {
          resourceType: DIGITAL_RESOURCE_TYPE,
          limit: LIST_LIMIT,
        },
        mode,
      );

      return items
        .filter((item) => readMetadataString(item.metadata ?? {}, 'storageKind') !== undefined)
        .map((item) => mapDigitalStorageResource(item))
        .filter((item): item is StorageVolumeSummary => item !== null);
    } catch {
      return [];
    }
  }

  async getOverview(mode: UrmsMode): Promise<StorageOverviewPayload> {
    const resourceVolumes = await this.loadResourceVolumes(mode);
    if (resourceVolumes.length > 0) {
      return {
        volumes: resourceVolumes,
        totalUsedGb: sumUsedGb(resourceVolumes),
        totalCapacityGb: sumTotalGb(resourceVolumes),
        source: 'resource',
      };
    }

    const volumes = catalogVolumes();
    return {
      volumes,
      totalUsedGb: sumUsedGb(volumes),
      totalCapacityGb: sumTotalGb(volumes),
      source: 'catalog',
    };
  }

  async getVolume(id: string, mode: UrmsMode): Promise<StorageVolumeDetail | null> {
    try {
      const entity = await this.resourceService.getByRef(DIGITAL_RESOURCE_TYPE, id, mode);
      const mapped = mapDigitalStorageDetail(entity);
      if (mapped) {
        return mapped;
      }
    } catch {
      // fall through to catalog
    }

    return findStorageVolume(id) ?? null;
  }

  listCleanupTips(): readonly string[] {
    return STORAGE_CLEANUP_TIPS;
  }
}

export function createStorageService(options: StorageServiceOptions): StorageService {
  return new ResourceStorageService(options);
}
