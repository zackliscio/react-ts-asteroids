import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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

interface GameColors {
  text: string;
  background: string;
  border: string;
}

// Create a state that matches the GameState interface
const createGameState = (screen: GameScreen, context: CanvasRenderingContext2D, keys: GameKeys, colors: GameColors): GameState => ({
  screen,
  context,
  keys,
  colors
});

export const Asteroids: React.FC<{ darkMode?: boolean }> = ({ darkMode = false }) => {
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

  // Modify the initialization effects to use a ref to track first load
  const isFirstLoad = useRef(true);

  // Add a ref to track game state to avoid stale closures
  const gameStateRef = useRef({ inGame: false });

  // Add state for button hover
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  // Replace the direct colors object with memoized version
  const colors = useMemo(() => ({
    text: darkMode ? '#ffffff' : '#000000',
    background: darkMode ? '#000000' : '#ffffff', 
    border: darkMode ? '#ffffff' : '#000000'
  }), [darkMode]);

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
    if (gameStateRef.current.inGame) {
      setCurrentScore(prevScore => prevScore + points);
    }
  }, []);

  // Add a useEffect to monitor inGame state
  useEffect(() => {
    gameStateRef.current.inGame = inGame;
  }, [inGame]);

  // Add a useEffect to monitor currentScore state
  useEffect(() => {
  }, [currentScore]);

  const gameOver = useCallback(() => {
    // Update ref first
    gameStateRef.current.inGame = false;
    setInGame(false);
    
    setTopScore((currentTopScore) => {
      const newTopScore = Math.max(currentScore, currentTopScore);
      if (newTopScore > currentTopScore) {
        localStorage['topscore'] = newTopScore;
      }
      return newTopScore;
    });
  }, [currentScore]);

  const generateAsteroids = useCallback((howMany: number) => {
    const asteroidAddScore = (points: number) => {
      addScore(points);
    };

    for (let i = 0; i < howMany; i++) {
      const asteroid = new Asteroid({
        size: 80,
        position: {
          x: randomNumBetweenExcluding(0, screen.width, screen.width/2-60, screen.width/2+60),
          y: randomNumBetweenExcluding(0, screen.height, screen.height/2-60, screen.height/2+60)
        },
        create: createObject,
        addScore: asteroidAddScore  // Use the wrapped version
      });
      createObject(asteroid, 'asteroids');
    }
  }, [screen.width, screen.height, createObject, addScore]);

  const startGame = useCallback(() => {
    // Set game state first and update ref
    gameStateRef.current.inGame = true;
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

    const ship = new Ship({
      position: {
        x: width/2,
        y: height/2
      },
      create: createObject,
      onDie: gameOver
    });
    createObject(ship, 'ship');

    generateAsteroids(asteroidCount);
  }, [asteroidCount, createObject, gameOver, generateAsteroids, screen.width, screen.height]);

  const checkCollision = useCallback((obj1: GameObject, obj2: GameObject): boolean => {
    const dx = obj1.position.x - obj2.position.x;
    const dy = obj1.position.y - obj2.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const willCollide = distance < obj1.radius + obj2.radius;
    return willCollide;
  }, []);

  const updateObjects = useCallback((items: GameObject[]) => {
    items.forEach(item => {
      if (!item.delete && context) {
        item.render(createGameState(screen, context, keys, colors));
      }
    });

    // Then filter out deleted items
    const remainingItems = items.filter(item => !item.delete);
    if (remainingItems.length !== items.length) {
      items.length = 0;  // Clear the array
      items.push(...remainingItems);  // Add back the remaining items
    }
  }, [screen, context, keys, colors]);

  const checkCollisionsWith = useCallback((items1: GameObject[], items2: GameObject[]) => {
    let a = items1.length - 1;
    let b;
    for(a; a > -1; --a){
      b = items2.length - 1;
      for(b; b > -1; --b){
        const item1 = items1[a];
        const item2 = items2[b];
        if (checkCollision(item1, item2)) {
          // First destroy the objects
          item1.destroy();
          item2.destroy();
          // Then mark them for deletion
          item1.delete = true;
          item2.delete = true;
        }
      }
    }
  }, [checkCollision]);

  const update = useCallback(() => {
    if (context) {
      context.save();
      context.scale(screen.ratio, screen.ratio);

      // Motion trail
      context.fillStyle = colors.background;
      context.globalAlpha = 0.4;
      context.fillRect(0, 0, screen.width, screen.height);
      context.globalAlpha = 1;

      // Update game objects
      if (inGame) {
        updateObjects(shipRef.current);
        updateObjects(asteroidsRef.current);
        updateObjects(bulletsRef.current);
        updateObjects(particlesRef.current);

        // Check if arrays have content before collision check
        if (bulletsRef.current.length > 0 && asteroidsRef.current.length > 0) {
          checkCollisionsWith(bulletsRef.current, asteroidsRef.current);
        }
        if (shipRef.current.length > 0 && asteroidsRef.current.length > 0) {
          checkCollisionsWith(shipRef.current, asteroidsRef.current);
        }
      }

      context.restore();

      // Store the animation frame ID
      animationFrameId.current = requestAnimationFrame(update);
    }
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

  // Initialize context only
  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (context) {
      setContext(context);
    }
  }, []); // Only run once on mount

  // Start game only on first context set
  useEffect(() => {
    if (context && isFirstLoad.current) {
      isFirstLoad.current = false;
      startGame();
    }
  }, [context, startGame]);

  // Keep animation loop separate
  useEffect(() => {
    if (!context) return;
    
    animationFrameId.current = requestAnimationFrame(update);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [context, update]);

  // Keep the game state monitoring effect
  useEffect(() => {
  }, [inGame, currentScore]);

  return (
    <div 
      ref={containerRef}
      id="react-ts-asteroids"
      style={{
        height: '100%', 
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        color: colors.text,
        padding: 0
      }}
    >
      {!inGame && (
        <div className="endgame" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '16px',
          zIndex: 1,
          textAlign: 'center'
        }}>
          <p>Game over!</p>
          <p>Score: {currentScore}</p>
          <button 
            onClick={startGame}
            onMouseEnter={() => setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
            style={{
              border: `4px solid ${colors.border}`,
              backgroundColor: isButtonHovered ? colors.text : 'transparent',
              color: isButtonHovered ? colors.background : colors.text,
              fontSize: '20px',
              padding: '10px 20px',
              margin: '10px',
              cursor: 'pointer'
            }}
          >
            Try again?
          </button>
        </div>
      )}
      <div style={{
        position: 'absolute',
        top: 15,
        left: 20,
        zIndex: 1,
        fontSize: 20
      }}>
        <div className="score current-score">Score: {currentScore}</div>
      </div>
      <div style={{
        position: 'absolute',
        top: 15,
        right: 20,
        zIndex: 1,
        fontSize: 20
      }}>
        <div className="score top-score">Top Score: {topScore}</div>
      </div>
      <div style={{
        position: 'absolute',
        top: 15,
        left: '50%',
        transform: 'translate(-50%, 0)',
        zIndex: 1,
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 1.6
      }}>
        <span className="controls">
          Use [A][S][W][D] or [←][↑][↓][→] to MOVE<br/>
          Use [SPACE] to SHOOT
        </span>
      </div>
      <canvas
        ref={canvasRef}
        id="react-ts-asteroids--canvas"
        width={screen.width * screen.ratio}
        height={screen.height * screen.ratio}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          backgroundColor: colors.background,
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        }}
      />
    </div>
  );
};