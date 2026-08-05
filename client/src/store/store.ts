import { configureStore } from '@reduxjs/toolkit';
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from 'react-redux';
import { persistStore } from 'redux-persist';
import { rootReducer, type RootState } from '@/store/rootReducer';
import { setAuthToken } from '@/utils/api/axiosInstance';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store, null, () => {
  const token = store.getState().auth.token;
  setAuthToken(token);
});

store.subscribe(() => {
  const token = store.getState().auth.token;
  setAuthToken(token);
});

export type { RootState };
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
