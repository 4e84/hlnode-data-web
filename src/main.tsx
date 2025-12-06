import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CoinProvider } from './context/CoinContext';
import { DisplayConfigProvider } from './context/DisplayConfigContext';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CoinProvider>
      <DisplayConfigProvider>
        <App />
      </DisplayConfigProvider>
    </CoinProvider>
  </StrictMode>
);
