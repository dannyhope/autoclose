if (import.meta.env.DEV) {
  await import('../dev/chrome-shim');
}
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
