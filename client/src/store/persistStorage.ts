import createWebStorage from 'redux-persist/es/storage/createWebStorage';
import type { WebStorage } from 'redux-persist/es/types';

// [WHY] The CommonJS storage default can resolve to a namespace object after Vite prebundling.
export const persistStorage: WebStorage = createWebStorage('local');
