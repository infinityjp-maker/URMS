import type {
  ResourceEntity,
  UrmsMode,
  VideoDetail,
  VideoLibraryPayload,
  VideoSummary,
} from '@urms/shared';

import type { ResourceService } from '../resource/resource-service.js';
import {
  VIDEO_STORAGE_POLICIES,
  catalogVideos,
  findVideoEntry,
  isVideoKind,
  sumDurationMin,
  sumSizeGb,
} from './video-catalog.js';

const DIGITAL_RESOURCE_TYPE = 'digital';
const LIST_LIMIT = 64;

export interface VideoService {
  getLibrary(mode: UrmsMode): Promise<VideoLibraryPayload>;
  getVideo(id: string, mode: UrmsMode): Promise<VideoDetail | null>;
  listStoragePolicies(): readonly string[];
}

export type VideoServiceOptions = {
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

function readMetadataStringArray(metadata: Record<string, unknown>, key: string): readonly string[] {
  const value = metadata[key];
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function mapDigitalVideoResource(entity: ResourceEntity): VideoSummary | null {
  const metadata = entity.metadata ?? {};
  const kindRaw = readMetadataString(metadata, 'videoKind');
  const kind = isVideoKind(kindRaw) ? kindRaw : 'project';
  const durationMin = readMetadataNumber(metadata, 'durationMin');
  const sizeGb = readMetadataNumber(metadata, 'sizeGb');
  const resolution = readMetadataString(metadata, 'resolution');
  if (durationMin === undefined || sizeGb === undefined || !resolution) {
    return null;
  }

  const path = readMetadataString(metadata, 'path') ?? readMetadataString(metadata, 'vendor') ?? '—';

  return {
    id: entity.resourceId,
    title: entity.name,
    kind,
    path,
    durationMin,
    sizeGb,
    resolution,
    summary: readMetadataString(metadata, 'notes') ?? `${path} · ${durationMin} 分`,
  };
}

function mapDigitalVideoDetail(entity: ResourceEntity): VideoDetail | null {
  const summary = mapDigitalVideoResource(entity);
  if (!summary) {
    return null;
  }

  const metadata = entity.metadata ?? {};
  const codec = readMetadataString(metadata, 'codec') ?? 'unknown';

  return {
    ...summary,
    codec,
    capturedAt: readMetadataString(metadata, 'capturedAt'),
    tags: readMetadataStringArray(metadata, 'tags'),
    storageHint: readMetadataString(metadata, 'storageHint') ?? '保管方針未設定',
    relatedVolumeId: readMetadataString(metadata, 'relatedVolumeId'),
  };
}

export class ResourceVideoService implements VideoService {
  private readonly resourceService: ResourceService;

  constructor(options: VideoServiceOptions) {
    this.resourceService = options.resourceService;
  }

  private async loadResourceVideos(mode: UrmsMode): Promise<VideoSummary[]> {
    try {
      const { items } = await this.resourceService.list(
        {
          resourceType: DIGITAL_RESOURCE_TYPE,
          limit: LIST_LIMIT,
        },
        mode,
      );

      return items
        .filter((item) => readMetadataString(item.metadata ?? {}, 'videoKind') !== undefined)
        .map((item) => mapDigitalVideoResource(item))
        .filter((item): item is VideoSummary => item !== null);
    } catch {
      return [];
    }
  }

  async getLibrary(mode: UrmsMode): Promise<VideoLibraryPayload> {
    const resourceItems = await this.loadResourceVideos(mode);
    if (resourceItems.length > 0) {
      return {
        items: resourceItems,
        totalSizeGb: sumSizeGb(resourceItems),
        totalDurationMin: sumDurationMin(resourceItems),
        source: 'resource',
      };
    }

    const items = catalogVideos();
    return {
      items,
      totalSizeGb: sumSizeGb(items),
      totalDurationMin: sumDurationMin(items),
      source: 'catalog',
    };
  }

  async getVideo(id: string, mode: UrmsMode): Promise<VideoDetail | null> {
    try {
      const entity = await this.resourceService.getByRef(DIGITAL_RESOURCE_TYPE, id, mode);
      const mapped = mapDigitalVideoDetail(entity);
      if (mapped) {
        return mapped;
      }
    } catch {
      // fall through to catalog
    }

    return findVideoEntry(id) ?? null;
  }

  listStoragePolicies(): readonly string[] {
    return VIDEO_STORAGE_POLICIES;
  }
}

export function createVideoService(options: VideoServiceOptions): VideoService {
  return new ResourceVideoService(options);
}
