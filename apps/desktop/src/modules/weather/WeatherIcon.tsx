import type { WeatherIllustrationId } from '@urms/shared';

type Props = {
  illustrationId: WeatherIllustrationId;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SIZE_PX = { sm: 28, md: 40, lg: 52 } as const;

function IconDefs() {
  return (
    <defs>
      <radialGradient id="wi-sun-core" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#fff7c2" />
        <stop offset="45%" stopColor="#ffd54a" />
        <stop offset="100%" stopColor="#ff9f1a" />
      </radialGradient>
      <radialGradient id="wi-sun-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffe082" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#ff9800" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="wi-cloud-light" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#c5d4ea" />
      </linearGradient>
      <linearGradient id="wi-cloud-dark" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#dbe4f2" />
        <stop offset="100%" stopColor="#8fa3bc" />
      </linearGradient>
      <linearGradient id="wi-cloud-storm" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#b8c5d9" />
        <stop offset="100%" stopColor="#4a5568" />
      </linearGradient>
      <linearGradient id="wi-moon" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f5f7ff" />
        <stop offset="100%" stopColor="#b8c4e8" />
      </linearGradient>
      <filter id="wi-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0b1220" floodOpacity="0.35" />
      </filter>
    </defs>
  );
}

function Cloud({ x, y, scale = 1, variant = 'light' }: { x: number; y: number; scale?: number; variant?: 'light' | 'dark' | 'storm' }) {
  const fill =
    variant === 'storm' ? 'url(#wi-cloud-storm)' : variant === 'dark' ? 'url(#wi-cloud-dark)' : 'url(#wi-cloud-light)';
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} filter="url(#wi-soft-shadow)">
      <ellipse cx="18" cy="22" rx="11" ry="8" fill={fill} />
      <ellipse cx="28" cy="18" rx="13" ry="10" fill={fill} />
      <ellipse cx="40" cy="22" rx="12" ry="9" fill={fill} />
      <rect x="10" y="20" width="36" height="10" fill={fill} />
    </g>
  );
}

function Sun({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 8} fill="url(#wi-sun-glow)" />
      <circle cx={cx} cy={cy} r={r} fill="url(#wi-sun-core)" filter="url(#wi-soft-shadow)" />
    </g>
  );
}

function RainDrops() {
  return (
    <g stroke="#5eb3ff" strokeLinecap="round" strokeWidth="2">
      <line x1="24" y1="36" x2="21" y2="46" opacity="0.85" />
      <line x1="32" y1="34" x2="29" y2="48" opacity="0.95" />
      <line x1="40" y1="36" x2="37" y2="46" opacity="0.8" />
      <line x1="48" y1="35" x2="45" y2="47" opacity="0.9" />
    </g>
  );
}

function SnowFlakes() {
  return (
    <g fill="#ffffff" opacity="0.95">
      <circle cx="26" cy="40" r="2" />
      <circle cx="34" cy="44" r="2.2" />
      <circle cx="42" cy="39" r="1.8" />
      <circle cx="48" cy="45" r="2" />
    </g>
  );
}

function Lightning() {
  return (
    <path
      d="M36 30 L32 40 L36 40 L33 52 L43 38 L39 38 L42 30 Z"
      fill="#ffe066"
      stroke="#f59e0b"
      strokeWidth="0.6"
      filter="url(#wi-soft-shadow)"
    />
  );
}

function IconArt({ id }: { id: WeatherIllustrationId }) {
  switch (id) {
    case 'clear-day':
      return <Sun cx={32} cy={30} r={14} />;
    case 'clear-night':
      return (
        <g>
          <circle cx="40" cy="26" r="12" fill="url(#wi-moon)" filter="url(#wi-soft-shadow)" />
          <circle cx="46" cy="22" r="10" fill="#101828" />
          <circle cx="18" cy="18" r="1.2" fill="#eef2ff" />
          <circle cx="24" cy="12" r="0.9" fill="#dbeafe" />
          <circle cx="14" cy="28" r="0.8" fill="#dbeafe" />
        </g>
      );
    case 'partly-cloudy':
      return (
        <g>
          <Sun cx={22} cy={22} r={10} />
          <Cloud x={16} y={18} scale={1.05} />
        </g>
      );
    case 'overcast':
      return (
        <g>
          <Cloud x={8} y={16} scale={1.05} variant="dark" />
          <Cloud x={20} y={24} scale={0.95} variant="dark" />
        </g>
      );
    case 'fog':
      return (
        <g opacity="0.92">
          <path d="M8 28 H56" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
          <path d="M12 36 H52" stroke="#e2e8f0" strokeWidth="5" strokeLinecap="round" opacity="0.75" />
          <path d="M10 44 H54" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
        </g>
      );
    case 'rain':
      return (
        <g>
          <Cloud x={10} y={10} scale={1.1} variant="dark" />
          <RainDrops />
        </g>
      );
    case 'snow':
      return (
        <g>
          <Cloud x={10} y={10} scale={1.1} />
          <SnowFlakes />
        </g>
      );
    case 'thunderstorm':
      return (
        <g>
          <Cloud x={8} y={8} scale={1.15} variant="storm" />
          <RainDrops />
          <Lightning />
        </g>
      );
    default:
      return (
        <g>
          <Cloud x={14} y={16} scale={1} variant="dark" />
          <circle cx="32" cy="48" r="2" fill="#94a3b8" />
        </g>
      );
  }
}

export function WeatherIcon({ illustrationId, size = 'md', className }: Props) {
  const px = SIZE_PX[size];
  const rootClass = ['weather-icon', `weather-icon--${size}`, className].filter(Boolean).join(' ');

  return (
    <span className={rootClass} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={px} height={px} role="presentation">
        <IconDefs />
        <IconArt id={illustrationId} />
      </svg>
    </span>
  );
}
