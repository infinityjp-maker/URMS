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

  return (
    <div
      className={cls}
      style={{ '--accent': accent } as React.CSSProperties}
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
