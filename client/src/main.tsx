import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ToastProvider } from '@/components/ui';
import { AppRouter } from '@/router';
import { persistor, store } from '@/store/store';
import '@/styles/globals.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  // [WARN] Rendering without the host node would conceal a broken application shell.
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </PersistGate>
    </Provider>
  </StrictMode>,
);
