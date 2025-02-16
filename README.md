# React TypeScript Asteroids

A classic Asteroids game implementation as a React component, written in TypeScript.

## Installation

```bash
npm install react-ts-asteroids
```

## Quick Start

1. Import the Asteroids component:

```typescript
import { Asteroids } from 'react-ts-asteroids';
```

2. Add it to your React application:

```typescript
function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Asteroids />
    </div>
  );
}
```

Note: The container element must have a defined width and height for the game to render properly.

## Controls

- Use [A][S][W][D] or [←][↑][↓][→] to move the ship
- Use [SPACE] to shoot

## Features

- Classic Asteroids gameplay
- Responsive design - adapts to container size
- Score tracking with local storage for high scores
- Particle effects for explosions and thrusters
- Written in TypeScript with React

## License

ISC
```
