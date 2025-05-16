// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import OnchainProviders from './providers/OnchainProviders';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <OnchainProviders>
      <App />
    </OnchainProviders>
  </React.StrictMode>
);