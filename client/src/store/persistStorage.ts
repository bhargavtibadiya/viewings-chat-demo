import createWebStorage from 'redux-persist/es/storage/createWebStorage';
import type { WebStorage } from 'redux-persist/es/types';

/**
 * redux-persist/lib/storage uses CommonJS. Vite's dependency prebundle exposes the
 * module namespace object as the default export in dev, so getItem/setItem are missing.
 * The ESM createWebStorage helper wraps localStorage with the WebStorage API.
 */
export const persistStorage: WebStorage = createWebStorage('local');
