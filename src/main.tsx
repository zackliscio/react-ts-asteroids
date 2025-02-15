import React from 'react';
import ReactDOM from 'react-dom/client';
import '../lib/style.css';
import { Asteroids }from '../dist/react-ts-asteroids.js';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <div style={{ width: '100%', height: '100vh' }}>
        <Asteroids />
      </div>
    </React.StrictMode>
  );
} 