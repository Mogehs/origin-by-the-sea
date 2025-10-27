import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { store } from './store';
import { Provider } from 'react-redux';
import { AuthProvider } from './context/AuthContext';
import { registerServiceWorker } from './utils/serviceWorkerUtils';

// Register service worker for offline image caching
if (process.env.NODE_ENV === 'production') {
  registerServiceWorker();
}

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </Provider>
);
