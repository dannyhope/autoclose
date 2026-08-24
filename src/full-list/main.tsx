if (import.meta.env.DEV) {
  await import('../dev/chrome-shim');
}
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { FullListApp } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FullListApp />
  </StrictMode>
);
