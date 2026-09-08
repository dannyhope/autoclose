import React from 'react';
import ReactDOM from 'react-dom/client';
import { FullListApp } from './App';
import '@/styles/globals.css';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <FullListApp />
    </React.StrictMode>
  );
}
