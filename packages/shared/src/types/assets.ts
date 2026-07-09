export type AssetCategory = 'pc-part' | 'peripheral' | 'other';

export type PcPartType = 'cpu' | 'gpu' | 'ram' | 'storage' | 'motherboard' | 'psu';

export type AssetSummary = {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly location: string;
  readonly category: AssetCategory;
  readonly partType?: PcPartType;
  readonly assetTag?: string;
  readonly budgetJpy?: number;
  readonly summary: string;
};

export type AssetDetail = AssetSummary & {
  readonly notes?: string;
  readonly purchasedAt?: string;
  readonly roadmapNote?: string;
};

export type AssetsListPayload = {
  readonly assets: readonly AssetSummary[];
  readonly source: 'resource' | 'catalog';
};

export type AssetsListResponse = {
  readonly data: AssetsListPayload;
};

export type AssetDetailResponse = {
  readonly data: AssetDetail;
};

export type PcRoadmapItem = {
  readonly phase: string;
  readonly title: string;
  readonly detail: string;
  readonly estimatedJpy?: number;
};

export type PcPartsPayload = {
  readonly parts: readonly AssetSummary[];
  readonly roadmap: readonly PcRoadmapItem[];
  readonly totalBudgetJpy: number;
};

export type PcPartsResponse = {
  readonly data: PcPartsPayload;
};
