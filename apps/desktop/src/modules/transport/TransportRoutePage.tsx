import { useLifeState } from '../../hooks/useLifeState.js';
import { useTransportDeparture } from '../../hooks/useTransportDeparture.js';
import { ModuleScreenLayout } from '../ModuleScreenLayout.js';
import { screenHref } from '../../app/appRoute.js';

export function TransportRoutePage() {
  const life = useLifeState();
  const transport = useTransportDeparture({ apiOnline: life.apiOnline });
  const route = transport.payload?.route;
  const advice = transport.payload?.advice;

  return (
    <ModuleScreenLayout screenId="M-TRN-ROUTE" title="ルート · 到着予想" moduleLabel="交通">
      <section className="glass-card">
        <p className="card-kicker">ルート</p>
        {transport.loading ? (
          <p className="hint-line">ルートを取得中…</p>
        ) : route && advice ? (
          <>
            <p className="metric-large">{route.headline}</p>
            <p className="metric-detail">
              {route.originStation} → {route.destinationLabel}
            </p>
            <p className="hint-line">{route.detail}</p>
            <ol className="transport-route-steps">
              {route.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <ul className="transport-detail-list">
              <li>
                <span>駅発</span>
                <strong>{route.trainDeparture}</strong>
              </li>
              <li>
                <span>到着予想</span>
                <strong>{route.estimatedArrival}</strong>
              </li>
              <li>
                <span>乗車</span>
                <strong>{route.rideMinutes} 分</strong>
              </li>
              <li>
                <span>乗換</span>
                <strong>{route.transferCount} 回</strong>
              </li>
            </ul>
          </>
        ) : (
          <p className="hint-line">
            {transport.payload?.note ??
              (transport.error
                ? 'API 未起動 — start-dev-servers.bat で起動してください'
                : '外出/通勤予定がないためルートを表示できません')}
          </p>
        )}
      </section>

      <section className="glass-card">
        <p className="card-kicker">連動</p>
        <a href={screenHref('M-TRN-DEP')} className="module-shortcuts__link">
          出発時刻を確認
        </a>
        <a href={screenHref('M-CAL-MON')} className="module-shortcuts__link">
          カレンダーで予定を確認
        </a>
      </section>
    </ModuleScreenLayout>
  );
}
