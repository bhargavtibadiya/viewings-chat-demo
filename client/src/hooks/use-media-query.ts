import { useEffect, useState } from 'react';

/**
 * Reports whether the active viewport matches a CSS media query.
 *
 * @param query - CSS media query to observe
 * @returns True while the query matches the current viewport
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = (): void => setMatches(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

/**
 * Reports whether the viewport is within the application's mobile breakpoint.
 *
 * @returns True when the viewport is 767 pixels wide or narrower
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}
