import { ApiClientError } from '../lib/api-client.js';

interface ErrorBannerProps {
  error: unknown;
  onRetry?: () => void;
}

export function ErrorBanner({ error, onRetry }: ErrorBannerProps) {
  const message =
    error instanceof ApiClientError
      ? `${error.code}: ${error.message}`
      : error instanceof Error
        ? error.message
        : 'エラーが発生しました';

  return (
    <div className="error-banner" role="alert">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry}>
          再試行
        </button>
      ) : null}
    </div>
  );
}
