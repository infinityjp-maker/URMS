export type VideoKind = 'raw' | 'export' | 'project' | 'archive';

export type VideoSummary = {
  readonly id: string;
  readonly title: string;
  readonly kind: VideoKind;
  readonly path: string;
  readonly durationMin: number;
  readonly sizeGb: number;
  readonly resolution: string;
  readonly summary: string;
};

export type VideoDetail = VideoSummary & {
  readonly codec: string;
  readonly capturedAt?: string;
  readonly tags: readonly string[];
  readonly storageHint: string;
  readonly relatedVolumeId?: string;
};

export type VideoLibraryPayload = {
  readonly items: readonly VideoSummary[];
  readonly totalSizeGb: number;
  readonly totalDurationMin: number;
  readonly source: 'catalog' | 'resource';
};

export type VideoLibraryResponse = {
  readonly data: VideoLibraryPayload;
};

export type VideoDetailResponse = {
  readonly data: VideoDetail;
};
