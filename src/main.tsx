import React from 'react';
import ReactDOM from 'react-dom/client';
import '../lib/style.css';
import { Asteroids }from '../dist/react-ts-asteroids.js';

const rootElement = document.getElementById('root');

document.body.style.padding = '0';
document.body.style.margin = '0';

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <div style={{ width: '100%', height: '100vh', padding: 0, margin: 0 }}>
        <Asteroids />
      </div>
    </React.StrictMode>
  );
} 