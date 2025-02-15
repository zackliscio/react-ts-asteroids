import React, { Component } from 'react';
import Ship from './Ship';
import Asteroid from './Asteroid';
import { GameObject, Point } from './types';
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

interface ReacteroidsState {
  screen: {
    width: number;
    height: number;
    ratio: number;
  };
  context: CanvasRenderingContext2D | null;
  keys: {
    left: number;
    right: number;
    up: number;
    down: number;
    space: number;
  };
  asteroidCount: number;
  currentScore: number;
  topScore: number;
  inGame: boolean;
}

export class Reacteroids extends Component<{}, ReacteroidsState> {
  private canvasRef: React.RefObject<HTMLCanvasElement>;
  private ship: Ship[];
  private asteroids: Asteroid[];
  private bullets: GameObject[];
  private particles: GameObject[];

  constructor(props: {}) {
    super(props);
    this.canvasRef = React.createRef();
    this.state = {
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      },
      context: null,
      keys: {
        left: 0,
        right: 0,
        up: 0,
        down: 0,
        space: 0,
      },
      asteroidCount: 3,
      currentScore: 0,
      topScore: Number(localStorage['topscore']) || 0,
      inGame: false
    };

    this.ship = [];
    this.asteroids = [];
    this.bullets = [];
    this.particles = [];
  }

  handleResize = (): void => {
    this.setState({
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      }
    });
  };

  handleKeys = (value: number, e: KeyboardEvent): void => {
    const keys = this.state.keys;
    const { keyCode } = e;

    if (keyCode === KEY.LEFT || keyCode === KEY.A) keys.left = value;
    if (keyCode === KEY.RIGHT || keyCode === KEY.D) keys.right = value;
    if (keyCode === KEY.UP || keyCode === KEY.W) keys.up = value;
    if (keyCode === KEY.SPACE) keys.space = value;

    this.setState({ keys });
  };

  componentDidMount(): void {
    window.addEventListener('keyup', ((e) => this.handleKeys(0, e)));
    window.addEventListener('keydown', ((e) => this.handleKeys(1, e)));
    window.addEventListener('resize', this.handleResize);

    const context = this.canvasRef.current?.getContext('2d');
    if (context) {
      this.setState({ context });
      this.startGame();
      requestAnimationFrame(() => this.update());
    }
  }

  componentWillUnmount(): void {
    window.removeEventListener('keyup', ((e) => this.handleKeys(0, e)));
    window.removeEventListener('keydown', ((e) => this.handleKeys(1, e)));
    window.removeEventListener('resize', this.handleResize);
  }

  update(): void {
    const { context, screen } = this.state;

    if (context) {
      context.save();
      context.scale(screen.ratio, screen.ratio);

      // Motion trail
      context.fillStyle = '#000';
      context.globalAlpha = 0.4;
      context.fillRect(0, 0, screen.width, screen.height);
      context.globalAlpha = 1;

      // Update game objects
      if (this.state.inGame) {
        this.updateObjects(this.ship, 'ship');
        this.updateObjects(this.asteroids, 'asteroids');
        this.updateObjects(this.bullets, 'bullets');
        this.updateObjects(this.particles, 'particles');
        this.checkCollisionsWith(this.bullets, this.asteroids);
        this.checkCollisionsWith(this.ship, this.asteroids);
      }

      context.restore();
    }

    // Next frame
    requestAnimationFrame(() => this.update());
  }

  addScore(points: number): void {
    if (this.state.inGame) {
      this.setState({
        currentScore: this.state.currentScore + points,
      });
    }
  }

  startGame(): void {
    this.setState({
      inGame: true,
      currentScore: 0,
    });

    // Make ship
    const ship = new Ship({
      position: {
        x: this.state.screen.width/2,
        y: this.state.screen.height/2
      },
      create: this.createObject.bind(this),
      onDie: this.gameOver.bind(this)
    });
    this.createObject(ship, 'ship');

    // Make asteroids
    this.asteroids = [];
    this.generateAsteroids(this.state.asteroidCount);
  }

  gameOver(): void {
    this.setState({
      inGame: false,
    });

    // Replace top score
    if (this.state.currentScore > this.state.topScore) {
      this.setState({
        topScore: this.state.currentScore,
      }, () => {
        localStorage['topscore'] = this.state.currentScore;
      });
    }
  }

  generateAsteroids(howMany: number): void {
    const { screen } = this.state;
    for (let i = 0; i < howMany; i++) {
      const asteroid = new Asteroid({
        size: 80,
        position: {
          x: randomNumBetweenExcluding(0, screen.width, screen.width/2-60, screen.width/2+60),
          y: randomNumBetweenExcluding(0, screen.height, screen.height/2-60, screen.height/2+60)
        },
        create: this.createObject.bind(this),
        addScore: this.addScore.bind(this)
      });
      this.createObject(asteroid, 'asteroids');
    }
  }

  createObject(item: GameObject, group: string): void {
    if (group === 'ship') this.ship.push(item as Ship);
    if (group === 'asteroids') this.asteroids.push(item as Asteroid);
    if (group === 'bullets') this.bullets.push(item);
    if (group === 'particles') this.particles.push(item);
  }

  updateObjects(items: GameObject[], group: string): void {
    let index = 0;
    for (const item of items) {
      if (item.delete) {
        items.splice(index, 1);
      } else {
        items[index].render(this.state);
      }
      index++;
    }
  }

  checkCollisionsWith(items1: GameObject[], items2: GameObject[]): void {
    let a = items1.length - 1;
    let b;
    for(a; a > -1; --a){
      b = items2.length - 1;
      for(b; b > -1; --b){
        const item1 = items1[a];
        const item2 = items2[b];
        if (this.checkCollision(item1, item2)) {
          item1.destroy();
          item2.destroy();
        }
      }
    }
  }

  checkCollision(obj1: GameObject, obj2: GameObject): boolean {
    const dx = obj1.position.x - obj2.position.x;
    const dy = obj1.position.y - obj2.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < obj1.radius + obj2.radius;
  }

  render(): JSX.Element {
    const { currentScore, topScore } = this.state;

    return (
      <div>
        { !this.state.inGame &&
          <div className="endgame">
            <p>Game over!</p>
            <p>Score: {currentScore}</p>
            <button onClick={() => this.startGame()}>Try again?</button>
          </div>
        }
        <span className="score current-score">Score: {currentScore}</span>
        <span className="score top-score">Top Score: {topScore}</span>
        <span className="controls">
          Use [A][S][W][D] or [←][↑][↓][→] to MOVE<br/>
          Use [SPACE] to SHOOT
        </span>
        <canvas
          ref={this.canvasRef}
          width={this.state.screen.width * this.state.screen.ratio}
          height={this.state.screen.height * this.state.screen.ratio}
        />
      </div>
    );
  }
}
