import { catalogHref, currentDashboardHref, hubHref, screenHref } from './appRoute.js';
import { AppNav } from './AppNav.js';
import { DAY_PHASE_LABELS, previewPhaseHref } from '../perception/previewPhase.js';
import { screensByModule } from '../modules/screen-registry.js';



const PHASE_SCREENS = [

  { id: 'D-01a', phase: 'morning' as const, when: '5:00–10:59' },

  { id: 'D-01b', phase: 'day' as const, when: '11:00–16:59' },

  { id: 'D-01c', phase: 'evening' as const, when: '17:00–21:59' },

  { id: 'D-01d', phase: 'night' as const, when: '22:00–4:59' },

];



export function ScreenCatalog() {

  const byModule = screensByModule();



  return (

    <div className="screen-catalog">

      <header className="screen-catalog__header">

        <a className="screen-catalog__back" href={hubHref()}>

          ← ハブに戻る

        </a>

        <h1 className="screen-catalog__title">画面一覧 · v0.2</h1>

        <p className="screen-catalog__lead">

          ハブ + モジュール画面。時間帯は窓の出し分け、M-* は機能画面です。

        </p>

      </header>



      <section className="screen-catalog__section">

        <h2 className="screen-catalog__section-title">ハブ · 時間帯</h2>

        <ul className="screen-catalog__list">

          <li className="screen-catalog__item">

            <a className="screen-catalog__link" href={currentDashboardHref()}>

              <span className="screen-catalog__id">D-01</span>

              <span className="screen-catalog__name">知覚の窓 · 現在</span>

              <span className="screen-catalog__when">常時</span>

              <span className="screen-catalog__note screen-catalog__note--live">live</span>

            </a>

          </li>

          {PHASE_SCREENS.map((item) => (

            <li key={item.id} className="screen-catalog__item">

              <a className="screen-catalog__link" href={previewPhaseHref(item.phase)}>

                <span className="screen-catalog__id">{item.id}</span>

                <span className="screen-catalog__name">知覚の窓 · {DAY_PHASE_LABELS[item.phase]}</span>

                <span className="screen-catalog__when">{item.when}</span>

                <span className="screen-catalog__note screen-catalog__note--live">live</span>

              </a>

            </li>

          ))}

        </ul>

      </section>



      {[...byModule.entries()].map(([module, screens]) => {

        const moduleScreens = screens.filter((s) => s.id.startsWith('M-'));

        if (moduleScreens.length === 0) return null;

        return (

          <section key={module} className="screen-catalog__section">

            <h2 className="screen-catalog__section-title">{moduleScreens[0]?.moduleLabel ?? module}</h2>

            <ul className="screen-catalog__list">

              {moduleScreens.map((screen) => (

                <li key={screen.id} className="screen-catalog__item">

                  <a className="screen-catalog__link" href={screenHref(screen.id)}>

                    <span className="screen-catalog__id">{screen.id}</span>

                    <span className="screen-catalog__name">{screen.name}</span>

                    <span className="screen-catalog__when">{screen.when}</span>

                    <span

                      className={`screen-catalog__note screen-catalog__note--${screen.status}`}

                    >

                      {screen.status}

                    </span>

                  </a>

                </li>

              ))}

            </ul>

          </section>

        );

      })}



      <nav className="screen-catalog__nav" aria-label="時間帯ショートカット">

        <span className="screen-catalog__nav-label">時間帯</span>

        {(['morning', 'day', 'evening', 'night'] as const).map((phase) => (

          <a key={phase} className="screen-catalog__nav-link" href={previewPhaseHref(phase)}>

            {DAY_PHASE_LABELS[phase]}

          </a>

        ))}

        <a className="screen-catalog__nav-link" href={hubHref()}>

          現在

        </a>

      </nav>



      <footer className="screen-catalog__footer">
        <a href={catalogHref()}>この一覧</a>
        <span>1420 · URMS v0.2</span>
      </footer>

      <AppNav />
    </div>
  );
}

