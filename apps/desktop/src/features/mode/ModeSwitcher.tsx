import { useMode } from './mode-context.js';
import { getModeLabel } from './mode-ui.js';

export function ModeSwitcher() {
  const { mode, setMode, modes, modesLoading } = useMode();

  if (modesLoading || modes.length <= 1) {
    return null;
  }

  return (
    <div className="mode-switcher" role="group" aria-label="操作モード">
      {modes.map((item) => (
        <button
          key={item}
          type="button"
          className={item === mode ? 'mode-switcher__button mode-switcher__button--active' : 'mode-switcher__button'}
          aria-pressed={item === mode}
          onClick={() => setMode(item)}
        >
          {getModeLabel(item)}
        </button>
      ))}
    </div>
  );
}
