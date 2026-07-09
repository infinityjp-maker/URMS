import { useLifeState } from '../../hooks/useLifeState.js';
import { useTransportDeparture } from '../../hooks/useTransportDeparture.js';
import { screenHref } from '../../app/appRoute.js';

function transportStatusLine(
  apiOnline: boolean,
  dbReady: boolean,
  lifeLoading: boolean,
  transportLoading: boolean,
  transportError: boolean,
): string {
  if (lifeLoading || transportLoading) {
    return '出発時刻を読み込み中…';
  }
  if (!apiOnline) {
    return 'API 未起動 — start-dev-servers.bat';
  }
  if (!dbReady) {
    return 'DB 未接続 — 予定データは取得不可';
  }
  if (transportError) {
    return '交通取得失敗 — 15 秒ごとに再試行中';
  }
  return '出発 · ルートへ';
}

export function TransportHubPreview() {
  const life = useLifeState();
  const transport = useTransportDeparture({ apiOnline: life.apiOnline });
  const advice = transport.payload?.advice;
  const route = transport.payload?.route;
  const ready = life.apiOnline && life.dbReady && !transport.loading && !transport.error;

  return (
    <a href={screenHref('M-TRN-DEP')} className="glass-card glass-card--link transport-hub">
      <p className="card-kicker">交通 · 出発へ</p>
      {ready && advice ? (
        <>
          <p className="metric-large transport-hub__headline">{advice.headline}</p>
          <p className="metric-detail">
            {advice.eventTitle} · {advice.stationName} {advice.recommendedTrainDeparture} 発
          </p>
          {route ? (
            <p className="hint-line">
              到着予想 {route.estimatedArrival}
              {route.transferCount > 0 ? ` · 乗換 ${route.transferCount}` : ''}
            </p>
          ) : null}
        </>
      ) : (
        <p className="hint-line">
          {transport.payload?.note ??
            transportStatusLine(
              life.apiOnline,
              life.dbReady,
              life.loading,
              transport.loading,
              transport.error,
            )}
        </p>
      )}
    </a>
  );
}
