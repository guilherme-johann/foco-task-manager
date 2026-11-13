import { useEffect, useState } from 'react';

import { getLocalDate } from './date';

export function useToday(): string {
  const [today, setToday] = useState(getLocalDate);
  useEffect(() => {
    const refresh = () => setToday(getLocalDate());
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  return today;
}
