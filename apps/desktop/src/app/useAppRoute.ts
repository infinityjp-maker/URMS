import { useEffect, useState } from 'react';

import { parseAppRoute, type AppRoute } from './appRoute.js';

export function useAppRoute(): AppRoute {
  const [route, setRoute] = useState<AppRoute>(() => parseAppRoute());

  useEffect(() => {
    const sync = () => setRoute(parseAppRoute());
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  return route;
}
