import React, { useEffect, useRef, useState, useCallback } from 'react';
import Ship from './Ship';
import Asteroid from './Asteroid';
import { GameObject, GameState } from './types';
import { randomNumBetweenExcluding } from './helpers'

const KEY = {
  LEFT:  37,
  RIGHT: 39,
  UP: 38,
  A: 65,
  D: 68,
  W: 87,
  SPACE: 32
} as const;

interface GameScreen {
  width: number;
  height: number;
  ratio: number;
}

interface GameKeys {
  left: number;
  right: number;
  up: number;
  down: number;
  space: number;
}

// Create a state that matches the GameState interface
const createGameState = (screen: GameScreen, context: CanvasRenderingContext2D, keys: GameKeys): GameState => ({
  screen,
  context,
  keys
});

export const Asteroids: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Game objects stored in refs since they don't need to trigger re-renders
  const shipRef = useRef<Ship[]>([]);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const bulletsRef = useRef<GameObject[]>([]);
  const particlesRef = useRef<GameObject[]>([]);

  // Add a ref to track the animation frame
  const animationFrameId = useRef<number>();

  const [screen, setScreen] = useState<GameScreen>({
    width: window.innerWidth,
    height: window.innerHeight,
    ratio: window.devicePixelRatio || 1,
  });

  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [keys, setKeys] = useState<GameKeys>({
    left: 0,
    right: 0,
    up: 0,
    down: 0,
    space: 0,
  });
  const [asteroidCount] = useState(3);
  const [currentScore, setCurrentScore] = useState(0);
  const [topScore, setTopScore] = useState(() => Number(localStorage['topscore']) || 0);
  const [inGame, setInGame] = useState(false);

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setScreen({
        width,
        height,
        ratio: window.devicePixelRatio || 1,
      });
    }
  }, []);

  const handleKeys = useCallback((value: number, e: KeyboardEvent) => {
    const { keyCode } = e;
    setKeys(prevKeys => ({
      ...prevKeys,
      left: keyCode === KEY.LEFT || keyCode === KEY.A ? value : prevKeys.left,
      right: keyCode === KEY.RIGHT || keyCode === KEY.D ? value : prevKeys.right,
      up: keyCode === KEY.UP || keyCode === KEY.W ? value : prevKeys.up,
      space: keyCode === KEY.SPACE ? value : prevKeys.space,
    }));
  }, []);

  const createObject = useCallback((item: GameObject, group: string) => {
    if (group === 'ship') shipRef.current.push(item as Ship);
    if (group === 'asteroids') asteroidsRef.current.push(item as Asteroid);
    if (group === 'bullets') bulletsRef.current.push(item);
    if (group === 'particles') particlesRef.current.push(item);
  }, []);

  const addScore = useCallback((points: number) => {
    if (inGame) {
      setCurrentScore(prev => prev + points);
    }
  }, [inGame]);

  const gameOver = useCallback(() => {
    setInGame(false);
    if (currentScore > topScore) {
      setTopScore(currentScore);
      localStorage['topscore'] = currentScore;
    }
  }, [currentScore, topScore]);

  const generateAsteroids = useCallback((howMany: number) => {
    for (let i = 0; i < howMany; i++) {
      const asteroid = new Asteroid({
        size: 80,
        position: {
          x: randomNumBetweenExcluding(0, screen.width, screen.width/2-60, screen.width/2+60),
          y: randomNumBetweenExcluding(0, screen.height, screen.height/2-60, screen.height/2+60)
        },
        create: createObject,
        addScore
      });
      createObject(asteroid, 'asteroids');
    }
  }, [screen.width, screen.height, createObject, addScore]);

  const startGame = useCallback(() => {
    setInGame(true);
    setCurrentScore(0);

    // Reset game objects
    shipRef.current = [];
    asteroidsRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];

    // Get current container dimensions
    const width = containerRef.current?.getBoundingClientRect().width ?? screen.width;
    const height = containerRef.current?.getBoundingClientRect().height ?? screen.height;

    // Make ship
    const ship = new Ship({
      position: {
        x: width/2,
        y: height/2
      },
      create: createObject,
      onDie: gameOver
    });
    createObject(ship, 'ship');

    // Make asteroids
    generateAsteroids(asteroidCount);
  }, [asteroidCount, createObject, gameOver, generateAsteroids, screen.width, screen.height]);

  const checkCollision = useCallback((obj1: GameObject, obj2: GameObject): boolean => {
    const dx = obj1.position.x - obj2.position.x;
    const dy = obj1.position.y - obj2.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < obj1.radius + obj2.radius;
  }, []);

  const updateObjects = useCallback((items: GameObject[]) => {
    let index = 0;
    for (const item of items) {
      if (item.delete) {
        items.splice(index, 1);
      } else {
        // Only call render if context exists
        if (context) {
          items[index].render(createGameState(screen, context, keys));
        }
      }
      index++;
    }
  }, [screen, context, keys]);

  const checkCollisionsWith = useCallback((items1: GameObject[], items2: GameObject[]) => {
    let a = items1.length - 1;
    let b;
    for(a; a > -1; --a){
      b = items2.length - 1;
      for(b; b > -1; --b){
        const item1 = items1[a];
        const item2 = items2[b];
        if (checkCollision(item1, item2)) {
          item1.destroy();
          item2.destroy();
        }
      }
    }
  }, [checkCollision]);

  const update = useCallback(() => {
    if (context) {
      context.save();
      context.scale(screen.ratio, screen.ratio);

      // Motion trail
      context.fillStyle = '#000';
      context.globalAlpha = 0.4;
      context.fillRect(0, 0, screen.width, screen.height);
      context.globalAlpha = 1;

      // Update game objects
      if (inGame) {
        updateObjects(shipRef.current);
        updateObjects(asteroidsRef.current);
        updateObjects(bulletsRef.current);
        updateObjects(particlesRef.current);
        checkCollisionsWith(bulletsRef.current, asteroidsRef.current);
        checkCollisionsWith(shipRef.current, asteroidsRef.current);
      }

      context.restore();
    }

    // Store the animation frame ID
    animationFrameId.current = requestAnimationFrame(update);
  }, [context, screen, inGame, updateObjects, checkCollisionsWith]);

  // Replace handleResize with updateDimensions
  useEffect(() => {
    // Initial size update
    updateDimensions();

    // Create ResizeObserver to watch container size changes
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, [updateDimensions]);

  // Remove the window resize event listener from the original useEffect
  useEffect(() => {
    const keyUpHandler = (e: KeyboardEvent) => handleKeys(0, e);
    const keyDownHandler = (e: KeyboardEvent) => handleKeys(1, e);

    window.addEventListener('keyup', keyUpHandler);
    window.addEventListener('keydown', keyDownHandler);

    return () => {
      window.removeEventListener('keyup', keyUpHandler);
      window.removeEventListener('keydown', keyDownHandler);
    };
  }, [handleKeys]);

  // Separate effect for game initialization
  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (context) {
      setContext(context);
      startGame(); // Initial game start
    }
  }, []); // Empty dependency array since this should only run once

  // Separate effect for the animation loop
  useEffect(() => {
    if (!context) return;

    animationFrameId.current = requestAnimationFrame(update);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [context, update]);

  return (
    <div 
      ref={containerRef}
      style={{
        height: '100%', 
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {!inGame && (
        <div className="endgame" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: 'white',
          zIndex: 1
        }}>
          <p>Game over!</p>
          <p>Score: {currentScore}</p>
          <button onClick={startGame}>Try again?</button>
        </div>
      )}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: 'white',
        zIndex: 1
      }}>
        <div className="score current-score">Score: {currentScore}</div>
        <div className="score top-score">Top Score: {topScore}</div>
      </div>
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        color: 'white',
        zIndex: 1
      }}>
        <span className="controls">
          Use [A][S][W][D] or [←][↑][↓][→] to MOVE<br/>
          Use [SPACE] to SHOOT
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={screen.width * screen.ratio}
        height={screen.height * screen.ratio}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          backgroundColor: '#000'
        }}
      />
    </div>
  );
};