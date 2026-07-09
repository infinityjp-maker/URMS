export type KnowledgeDocumentSummary = {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly summary: string;
};

export type KnowledgeDocumentDetail = KnowledgeDocumentSummary & {
  readonly path: string;
  readonly content: string;
};

export type KnowledgeListPayload = {
  readonly documents: readonly KnowledgeDocumentSummary[];
};

export type KnowledgeListResponse = {
  readonly data: KnowledgeListPayload;
};

export type KnowledgeDocumentResponse = {
  readonly data: KnowledgeDocumentDetail;
};

export type GoogleCalendarStatusPayload = {
  readonly connected: boolean;
  readonly statusNote: string | null;
};

export type GoogleCalendarStatusResponse = {
  readonly data: GoogleCalendarStatusPayload;
};
