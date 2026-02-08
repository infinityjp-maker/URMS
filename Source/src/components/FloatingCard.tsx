import { useRef } from 'react';
import './FloatingCard.css';

type Props = {
  title: string;
  children?: React.ReactNode;
  accent?: string;
  variant?: 'default' | 'neon';
  size?: 'sm' | 'md' | 'lg';
  headerRight?: React.ReactNode;
  onClick?: () => void;
};

export default function FloatingCard({
  title,
  children,
  accent = '#7c3aed',
  variant = 'default',
  size = 'md',
  headerRight,
  onClick,
}: Props) {
  const cls = ['floating-card', variant, size].join(' ');
  const innerRef = useRef<HTMLDivElement | null>(null);

  function onMove() {
    // Tilt effect disabled for better text visibility
  }

  function onLeave() {
    // No transform cleanup needed
  }

  // map known accent colors to classes to avoid inline styles
  const accentMap: Record<string, string> = {
    '#06b6d4': 'accent-cyan',
    '#22c55e': 'accent-green',
    '#f59e0b': 'accent-amber',
    '#ef4444': 'accent-red',
    '#14b8a6': 'accent-teal',
    '#a855f7': 'accent-purple',
    '#60a5fa': 'accent-blue'
  };
  const accentClass = accentMap[accent.toLowerCase()] || '';

  return (
    <div
      className={[cls, accentClass].filter(Boolean).join(' ')}
      {...(accentClass ? {} : { style: { ['--accent' as any]: accent } as React.CSSProperties })}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyPress={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          onClick();
        }
      }}
    >
      <div className="card-inner" ref={innerRef}>
        <div className="card-header">
          <h3>{title}</h3>
          {headerRight && <div className="header-right">{headerRight}</div>}
        </div>
        <div className="card-body">{children}</div>
      </div>
      <div className="card-ghost" aria-hidden="true" />
    </div>
  );
}
