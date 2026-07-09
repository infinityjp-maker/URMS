import { weatherIllustrationLabel } from '@urms/domain/perception';
import type { WeatherIllustrationId } from '@urms/shared';

import { WeatherIcon } from './WeatherIcon.js';

type Props = {
  illustrationId: WeatherIllustrationId;
  /** コンパクト表示（ダッシュボードカード用） */
  compact?: boolean;
  className?: string;
};

export function WeatherIllustration({ illustrationId, compact = false, className }: Props) {
  const label = weatherIllustrationLabel(illustrationId);
  const size = compact ? 'md' : 'lg';

  return (
    <figure
      className={['weather-illustration', compact ? 'weather-illustration--compact' : 'weather-illustration--detail', className]
        .filter(Boolean)
        .join(' ')}
      aria-label={label}
    >
      <WeatherIcon illustrationId={illustrationId} size={size} />
      {!compact ? <figcaption className="weather-illustration__caption">{label}</figcaption> : null}
    </figure>
  );
}
