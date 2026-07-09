import { useLifeState } from '../../hooks/useLifeState.js';
import { useTransportDeparture } from '../../hooks/useTransportDeparture.js';
import { ModuleScreenLayout } from '../ModuleScreenLayout.js';
import { screenHref } from '../../app/appRoute.js';

export function TransportDeparturePage() {
  const life = useLifeState();
  const transport = useTransportDeparture({ apiOnline: life.apiOnline });
  const advice = transport.payload?.advice;
  const route = transport.payload?.route;

  return (
    <ModuleScreenLayout screenId="M-TRN-DEP" title="出発 · 駅発時刻" moduleLabel="交通">
      <section className="glass-card">
        <p className="card-kicker">次の外出予定</p>
        {transport.loading ? (
          <p className="hint-line">出発アドバイスを取得中…</p>
        ) : advice ? (
          <>
            <p className="metric-large">{advice.headline}</p>
            <p className="metric-detail">
              {advice.eventTitle} · {advice.eventTime} 開始
            </p>
            <p className="hint-line">{advice.detail}</p>
            <ul className="transport-detail-list">
              <li>
                <span>家を出る</span>
                <strong>{advice.leaveHomeBy}</strong>
              </li>
              <li>
                <span>{advice.stationName} 発</span>
                <strong>{advice.recommendedTrainDeparture}</strong>
              </li>
              <li>
                <span>あと</span>
                <strong>{advice.leaveInMinutes} 分</strong>
              </li>
            </ul>
            {advice.spareSuggestion ? <p className="hint-line transport-spare">{advice.spareSuggestion}</p> : null}
          </>
        ) : (
          <p className="hint-line">
            {transport.payload?.note ??
              (transport.error
                ? 'API 未起動 — start-dev-servers.bat で起動してください'
                : '外出/通勤予定がありません')}
          </p>
        )}
      </section>

      <section className="glass-card">
        <p className="card-kicker">連動</p>
        <p className="hint-line">
          schedule SSOT の外出/通勤予定から自動算出。
          {transport.payload?.timetableSource === 'odpt'
            ? ' 駅時刻表: ODPT'
            : ' 駅時刻表: 簡易間隔（ODPT 未設定時）'}
        </p>
        <a href={screenHref('M-CAL-MON')} className="module-shortcuts__link">
          カレンダーで予定を確認
        </a>
        {route ? (
          <a href={screenHref('M-TRN-ROUTE')} className="module-shortcuts__link">
            ルート · 到着予想
          </a>
        ) : null}
      </section>
    </ModuleScreenLayout>
  );
}
