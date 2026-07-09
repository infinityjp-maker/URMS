export type OperationFlowStatus = 'ok' | 'warn' | 'error';

export type OperationFlowId =
  | 'api-server'
  | 'database'
  | 'perception'
  | 'schedule-ssot'
  | 'transport'
  | 'integrations';

export type OperationFlowSummary = {
  readonly id: OperationFlowId;
  readonly name: string;
  readonly status: OperationFlowStatus;
  readonly summary: string;
};

export type OperationFlowCheck = {
  readonly label: string;
  readonly status: OperationFlowStatus;
  readonly detail: string;
};

export type OperationFlowDetail = OperationFlowSummary & {
  readonly checks: readonly OperationFlowCheck[];
  readonly nextAction: string;
  readonly logs: readonly string[];
};

export type OperationsListPayload = {
  readonly checkedAt: string;
  readonly flows: readonly OperationFlowSummary[];
  readonly alertCount: number;
};

export type OperationsListResponse = {
  readonly data: OperationsListPayload;
};

export type OperationsDetailPayload = {
  readonly flow: OperationFlowDetail;
};

export type OperationsDetailResponse = {
  readonly data: OperationsDetailPayload;
};
