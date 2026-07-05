import { useMode } from './mode-context.js';
import { getModeLabel } from './mode-ui.js';

export function ModeSwitcher() {
  const { mode, setMode, modes } = useMode();

  return (
    <div className="mode-switcher" role="group" aria-label="操作モード">
      {modes.map((item) => (
        <button
          key={item}
          type="button"
          className={item === mode ? 'mode-button active' : 'mode-button'}
          aria-pressed={item === mode}
          onClick={() => setMode(item)}
        >
          {getModeLabel(item)}
        </button>
      ))}
    </div>
  );
}
