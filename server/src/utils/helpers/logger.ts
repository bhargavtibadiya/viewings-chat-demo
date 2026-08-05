export function createLogger(scope: string) {
  const prefix = `[${scope}]`;
  return {
    info: (message: string): void => {
      console.log(`${prefix} ${message}`);
    },
    warn: (message: string): void => {
      console.warn(`${prefix} ${message}`);
    },
    error: (message: string, error?: unknown): void => {
      const detail = error instanceof Error ? error.message : '';
      console.error(`${prefix} ${message}${detail ? `: ${detail}` : ''}`);
    },
    debug: (message: string): void => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`${prefix} ${message}`);
      }
    },
  };
}
