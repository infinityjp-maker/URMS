import type {
  AssetDetail,
  AssetSummary,
  AssetsListPayload,
  PcPartsPayload,
  ResourceEntity,
  UrmsMode,
} from '@urms/shared';

import type { ResourceService } from '../resource/resource-service.js';
import {
  ASSET_CATALOG,
  PC_ROADMAP,
  catalogAssets,
  findAssetCatalogEntry,
  isAssetCategory,
  isPcPartType,
} from './asset-catalog.js';

const PHYSICAL_RESOURCE_TYPE = 'physical';
const LIST_LIMIT = 64;

export interface AssetService {
  listAssets(mode: UrmsMode): Promise<AssetsListPayload>;
  getAsset(id: string, mode: UrmsMode): Promise<AssetDetail | null>;
  listPcParts(mode: UrmsMode): Promise<PcPartsPayload>;
}

export type AssetServiceOptions = {
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
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function mapPhysicalResource(entity: ResourceEntity): AssetSummary | null {
  const metadata = entity.metadata ?? {};
  const location = readMetadataString(metadata, 'location') ?? '—';
  const categoryRaw = readMetadataString(metadata, 'category');
  const category = isAssetCategory(categoryRaw) ? categoryRaw : 'other';
  const partTypeRaw = readMetadataString(metadata, 'partType');
  const partType = isPcPartType(partTypeRaw) ? partTypeRaw : undefined;
  const assetTag = readMetadataString(metadata, 'assetTag');
  const budgetJpy = readMetadataNumber(metadata, 'budgetJpy');
  const notes = readMetadataString(metadata, 'notes');
  const summary = notes ?? `${location} · ${entity.status}`;

  return {
    id: entity.resourceId,
    name: entity.name,
    status: entity.status,
    location,
    category,
    ...(partType ? { partType } : {}),
    ...(assetTag ? { assetTag } : {}),
    ...(budgetJpy !== undefined ? { budgetJpy } : {}),
    summary,
  };
}

function mapPhysicalDetail(entity: ResourceEntity): AssetDetail | null {
  const summary = mapPhysicalResource(entity);
  if (!summary) {
    return null;
  }

  const metadata = entity.metadata ?? {};
  return {
    ...summary,
    ...(readMetadataString(metadata, 'notes') ? { notes: readMetadataString(metadata, 'notes') } : {}),
    ...(readMetadataString(metadata, 'purchasedAt') ? { purchasedAt: readMetadataString(metadata, 'purchasedAt') } : {}),
    ...(readMetadataString(metadata, 'roadmapNote') ? { roadmapNote: readMetadataString(metadata, 'roadmapNote') } : {}),
  };
}

function sumBudget(assets: readonly AssetSummary[]): number {
  return assets.reduce((total, asset) => total + (asset.budgetJpy ?? 0), 0);
}

export class ResourceAssetService implements AssetService {
  private readonly resourceService: ResourceService;

  constructor(options: AssetServiceOptions) {
    this.resourceService = options.resourceService;
  }

  private async loadResourceAssets(mode: UrmsMode): Promise<AssetSummary[]> {
    try {
      const { items } = await this.resourceService.list(
        {
          resourceType: PHYSICAL_RESOURCE_TYPE,
          limit: LIST_LIMIT,
        },
        mode,
      );

      return items
        .map((item) => mapPhysicalResource(item))
        .filter((item): item is AssetSummary => item !== null);
    } catch {
      return [];
    }
  }

  async listAssets(mode: UrmsMode): Promise<AssetsListPayload> {
    const resourceAssets = await this.loadResourceAssets(mode);
    if (resourceAssets.length > 0) {
      return { assets: resourceAssets, source: 'resource' };
    }

    return { assets: catalogAssets(), source: 'catalog' };
  }

  async getAsset(id: string, mode: UrmsMode): Promise<AssetDetail | null> {
    try {
      const entity = await this.resourceService.getByRef(PHYSICAL_RESOURCE_TYPE, id, mode);
      const mapped = mapPhysicalDetail(entity);
      if (mapped) {
        return mapped;
      }
    } catch {
      // fall through to catalog
    }

    return findAssetCatalogEntry(id) ?? null;
  }

  async listPcParts(mode: UrmsMode): Promise<PcPartsPayload> {
    const payload = await this.listAssets(mode);
    const parts = payload.assets.filter((asset) => asset.category === 'pc-part');
    const roadmap = payload.source === 'catalog' ? PC_ROADMAP : PC_ROADMAP;

    return {
      parts,
      roadmap,
      totalBudgetJpy: sumBudget(parts),
    };
  }
}

export function createAssetService(options: AssetServiceOptions): AssetService {
  return new ResourceAssetService(options);
}

export { ASSET_CATALOG, PC_ROADMAP };
