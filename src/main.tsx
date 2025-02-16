import React from 'react';
import ReactDOM from 'react-dom/client';
import '../lib/style.css';
import { Asteroids } from '../lib/Asteroids';

const rootElement = document.getElementById('root');

document.body.style.padding = '0';
document.body.style.margin = '0';

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <div style={{ width: '100%', height: '100vh', padding: 0, margin: 0 }}>
      <Asteroids />
    </div>
  );
} 