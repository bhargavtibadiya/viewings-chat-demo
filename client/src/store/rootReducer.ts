import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer, type PersistConfig } from 'redux-persist';
import authReducer from '@/store/auth/auth.slice';
import type { AuthSliceInterface } from '@/store/auth/auth.types';
import { persistStorage } from '@/store/persistStorage';
import propertiesReducer from '@/store/properties/properties.slice';
import chatReducer from '@/store/chat/chat.slice';
import bookingsReducer from '@/store/bookings/bookings.slice';
import listerReducer from '@/store/lister/lister.slice';
import demoReducer from '@/store/demo/demo.slice';

// [SEC] Persist only credentials needed to restore the session; request state must be fresh.
const authPersistConfig: PersistConfig<AuthSliceInterface> = {
  key: 'auth',
  storage: persistStorage,
  whitelist: ['user', 'token'],
};

export const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  properties: propertiesReducer,
  chat: chatReducer,
  bookings: bookingsReducer,
  lister: listerReducer,
  demo: demoReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
