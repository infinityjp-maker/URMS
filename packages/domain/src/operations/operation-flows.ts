export type OperationFlowStatus = 'ok' | 'warn' | 'error';

export type OperationFlowId =
  | 'api-server'
  | 'database'
  | 'perception'
  | 'schedule-ssot'
  | 'transport'
  | 'integrations';

export type OperationFlowCheck = {
  readonly label: string;
  readonly status: OperationFlowStatus;
  readonly detail: string;
};

export type OperationFlowSummary = {
  readonly id: OperationFlowId;
  readonly name: string;
  readonly status: OperationFlowStatus;
  readonly summary: string;
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

export type OperationsDetailPayload = {
  readonly flow: OperationFlowDetail;
};

export type OperationsSnapshot = {
  readonly checkedAt: Date;
  readonly apiHealthy: boolean;
  readonly database: 'ok' | 'unavailable';
  readonly weather: 'live' | 'empty';
  readonly scheduleEnabled: boolean;
  readonly transportEnabled: boolean;
  readonly transportHasAdvice: boolean;
  readonly timetableSource: 'odpt' | 'interval' | 'unknown';
  readonly integrations: readonly { integrationId: string; name: string; healthy: boolean; detail: string }[];
};

function worstStatus(statuses: readonly OperationFlowStatus[]): OperationFlowStatus {
  if (statuses.includes('error')) return 'error';
  if (statuses.includes('warn')) return 'warn';
  return 'ok';
}

function buildApiServerFlow(snapshot: OperationsSnapshot): OperationFlowDetail {
  const checks: OperationFlowCheck[] = [
    {
      label: 'API プロセス',
      status: snapshot.apiHealthy ? 'ok' : 'error',
      detail: snapshot.apiHealthy ? 'ヘルスチェック応答あり' : 'API が応答していません',
    },
  ];

  return {
    id: 'api-server',
    name: 'API サーバー',
    status: worstStatus(checks.map((item) => item.status)),
    summary: snapshot.apiHealthy ? '正常稼働中' : 'API 未応答',
    checks,
    nextAction: snapshot.apiHealthy
      ? '特になし — 定期監視を継続'
      : 'start-dev-servers.bat で API を起動',
    logs: [`checkedAt ${snapshot.checkedAt.toISOString()}`],
  };
}

function buildDatabaseFlow(snapshot: OperationsSnapshot): OperationFlowDetail {
  const checks: OperationFlowCheck[] = [
    {
      label: 'PostgreSQL',
      status: snapshot.database === 'ok' ? 'ok' : 'error',
      detail: snapshot.database === 'ok' ? 'DB 接続 OK' : 'DB 未接続',
    },
  ];

  return {
    id: 'database',
    name: 'データベース',
    status: worstStatus(checks.map((item) => item.status)),
    summary: snapshot.database === 'ok' ? '接続正常' : 'DB 未起動',
    checks,
    nextAction:
      snapshot.database === 'ok'
        ? '特になし'
        : 'Docker PostgreSQL を起動し pnpm db:migrate を実行',
    logs: [`database=${snapshot.database}`],
  };
}

function buildPerceptionFlow(snapshot: OperationsSnapshot): OperationFlowDetail {
  const checks: OperationFlowCheck[] = [
    {
      label: '天気データ',
      status: snapshot.weather === 'live' ? 'ok' : 'warn',
      detail: snapshot.weather === 'live' ? 'Open-Meteo live' : '天気未取得',
    },
  ];

  return {
    id: 'perception',
    name: '知覚 · 天気',
    status: worstStatus(checks.map((item) => item.status)),
    summary: snapshot.weather === 'live' ? '天気 live' : '天気データなし',
    checks,
    nextAction:
      snapshot.weather === 'live'
        ? '特になし'
        : '位置情報または location SSOT · Open-Meteo 接続を確認',
    logs: [`weather=${snapshot.weather}`],
  };
}

function buildScheduleFlow(snapshot: OperationsSnapshot): OperationFlowDetail {
  const checks: OperationFlowCheck[] = [
    {
      label: 'schedule SSOT',
      status: snapshot.scheduleEnabled ? 'ok' : 'warn',
      detail: snapshot.scheduleEnabled ? '有効' : 'URMS_SCHEDULE_ENABLED=false',
    },
  ];

  return {
    id: 'schedule-ssot',
    name: '予定 · カレンダー',
    status: worstStatus(checks.map((item) => item.status)),
    summary: snapshot.scheduleEnabled ? 'schedule 有効' : 'schedule 無効',
    checks,
    nextAction: snapshot.scheduleEnabled ? '予定 Resource を SSOT に同期' : 'URMS_SCHEDULE_ENABLED=true を確認',
    logs: [`scheduleEnabled=${snapshot.scheduleEnabled}`],
  };
}

function buildTransportFlow(snapshot: OperationsSnapshot): OperationFlowDetail {
  const timetableStatus: OperationFlowStatus =
    snapshot.timetableSource === 'odpt'
      ? 'ok'
      : snapshot.timetableSource === 'interval'
        ? 'warn'
        : 'warn';

  const checks: OperationFlowCheck[] = [
    {
      label: '交通モジュール',
      status: snapshot.transportEnabled ? 'ok' : 'warn',
      detail: snapshot.transportEnabled ? '有効' : 'URMS_TRANSPORT_ENABLED=false',
    },
    {
      label: '駅時刻表',
      status: timetableStatus,
      detail:
        snapshot.timetableSource === 'odpt'
          ? 'ODPT 駅時刻表'
          : snapshot.timetableSource === 'interval'
            ? '簡易間隔時刻表（ODPT 未設定）'
            : '時刻表ソース不明',
    },
    {
      label: '出発アドバイス',
      status: snapshot.transportHasAdvice ? 'ok' : 'warn',
      detail: snapshot.transportHasAdvice ? '外出予定あり' : '本日の外出予定なし',
    },
  ];

  return {
    id: 'transport',
    name: '交通 · 出発',
    status: worstStatus(checks.map((item) => item.status)),
    summary:
      snapshot.timetableSource === 'odpt'
        ? 'ODPT 時刻表で算出'
        : '簡易時刻表で算出',
    checks,
    nextAction:
      snapshot.timetableSource === 'odpt'
        ? 'ODPT 設定済み — 路線 ID を見直して精度を上げる'
        : 'URMS_ODPT_CONSUMER_KEY と URMS_TRANSPORT_ODPT_STATION_ID を設定',
    logs: [`timetableSource=${snapshot.timetableSource}`],
  };
}

function buildIntegrationsFlow(snapshot: OperationsSnapshot): OperationFlowDetail {
  const checks: OperationFlowCheck[] =
    snapshot.integrations.length > 0
      ? snapshot.integrations.map((item) => ({
          label: item.name,
          status: item.healthy ? ('ok' as const) : ('error' as const),
          detail: item.detail,
        }))
      : [
          {
            label: '連携',
            status: 'warn' as const,
            detail: '登録済み連携なし',
          },
        ];

  const unhealthy = checks.filter((item) => item.status !== 'ok').length;

  return {
    id: 'integrations',
    name: '外部連携',
    status: worstStatus(checks.map((item) => item.status)),
    summary:
      snapshot.integrations.length === 0
        ? '連携未登録'
        : unhealthy === 0
          ? `${snapshot.integrations.length} 件すべて正常`
          : `${unhealthy} 件に異常`,
    checks,
    nextAction:
      unhealthy > 0
        ? '開発パネルで連携ヘルスチェックを再実行'
        : '定期 sync / export を継続',
    logs: snapshot.integrations.map((item) => `${item.integrationId}: ${item.detail}`),
  };
}

const FLOW_BUILDERS: Record<OperationFlowId, (snapshot: OperationsSnapshot) => OperationFlowDetail> = {
  'api-server': buildApiServerFlow,
  database: buildDatabaseFlow,
  perception: buildPerceptionFlow,
  'schedule-ssot': buildScheduleFlow,
  transport: buildTransportFlow,
  integrations: buildIntegrationsFlow,
};

export function buildOperationFlows(snapshot: OperationsSnapshot): OperationsListPayload {
  const flows = (Object.keys(FLOW_BUILDERS) as OperationFlowId[]).map((id) => {
    const detail = FLOW_BUILDERS[id](snapshot);
    return {
      id: detail.id,
      name: detail.name,
      status: detail.status,
      summary: detail.summary,
    };
  });

  const alertCount = flows.filter((flow) => flow.status !== 'ok').length;

  return {
    checkedAt: snapshot.checkedAt.toISOString(),
    flows,
    alertCount,
  };
}

export function buildOperationFlowDetail(
  flowId: OperationFlowId,
  snapshot: OperationsSnapshot,
): OperationFlowDetail | undefined {
  const builder = FLOW_BUILDERS[flowId];
  return builder ? builder(snapshot) : undefined;
}

export function isOperationFlowId(value: string): value is OperationFlowId {
  return value in FLOW_BUILDERS;
}
