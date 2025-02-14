import React, { Component } from 'react';
import Ship from './Ship';
import Asteroid from './Asteroid';
import { randomNumBetweenExcluding } from './helpers';

const KEY = {
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  A: 65,
  D: 68,
  W: 87,
  SPACE: 32,
};

interface Screen {
  width: number;
  height: number;
  ratio: number;
}

interface Keys {
  left: number;
  right: number;
  up: number;
  down: number;
  space: number;
}

interface ReacteroidsState {
  screen: Screen;
  context: CanvasRenderingContext2D | null;
  keys: Keys;
  asteroidCount: number;
  currentScore: number;
  topScore: number;
  inGame: boolean;
}

export class Reacteroids extends Component<{}, ReacteroidsState> {
  ship: Ship[];
  asteroids: Asteroid[];
  bullets: any[];
  particles: any[];

  constructor(props: {}) {
    super(props);
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
      topScore: parseInt(localStorage['topscore'] || '0', 10),
      inGame: false,
    };
    this.ship = [];
    this.asteroids = [];
    this.bullets = [];
    this.particles = [];
  }

  handleResize = () => {
    this.setState({
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      },
    });
  };

  handleKeys = (value: number, e: KeyboardEvent) => {
    let keys = this.state.keys;
    if (e.keyCode === KEY.LEFT || e.keyCode === KEY.A) keys.left = value;
    if (e.keyCode === KEY.RIGHT || e.keyCode === KEY.D) keys.right = value;
    if (e.keyCode === KEY.UP || e.keyCode === KEY.W) keys.up = value;
    if (e.keyCode === KEY.SPACE) keys.space = value;
    this.setState({ keys });
  };

  componentDidMount() {
    window.addEventListener('keyup', (e) => this.handleKeys(0, e));
    window.addEventListener('keydown', (e) => this.handleKeys(1, e));
    window.addEventListener('resize', this.handleResize);

    const context = (this.refs.canvas as HTMLCanvasElement).getContext('2d');
    this.setState({ context });
    this.startGame();
    requestAnimationFrame(() => {
      this.update();
    });
  }

  componentWillUnmount() {
    window.removeEventListener('keyup', (e) => this.handleKeys(0, e));
    window.removeEventListener('keydown', (e) => this.handleKeys(1, e));
    window.removeEventListener('resize', this.handleResize);
  }

  update() {
    const context = this.state.context;
    const keys = this.state.keys;
    const ship = this.ship[0];

    if (context) {
      context.save();
      context.scale(this.state.screen.ratio, this.state.screen.ratio);

      // Motion trail
      context.fillStyle = '#000';
      context.globalAlpha = 0.4;
      context.fillRect(0, 0, this.state.screen.width, this.state.screen.height);
      context.globalAlpha = 1;

      // Next set of asteroids
      if (!this.asteroids.length) {
        let count = this.state.asteroidCount + 1;
        this.setState({ asteroidCount: count });
        this.generateAsteroids(count);
      }

      // Check for collisions
      this.checkCollisionsWith(this.bullets, this.asteroids);
      this.checkCollisionsWith(this.ship, this.asteroids);

      // Remove or render
      this.updateObjects(this.particles, 'particles');
      this.updateObjects(this.asteroids, 'asteroids');
      this.updateObjects(this.bullets, 'bullets');
      this.updateObjects(this.ship, 'ship');

      context.restore();
    }

    // Next frame
    requestAnimationFrame(() => {
      this.update();
    });
  }

  addScore(points: number) {
    if (this.state.inGame) {
      this.setState({
        currentScore: this.state.currentScore + points,
      });
    }
  }

  startGame() {
    this.setState({
      inGame: true,
      currentScore: 0,
    });

    // Make ship
    let ship = new Ship({
      position: {
        x: this.state.screen.width / 2,
        y: this.state.screen.height / 2,
      },
      create: this.createObject.bind(this),
      onDie: this.gameOver.bind(this),
    });
    this.createObject(ship, 'ship');

    // Make asteroids
    this.asteroids = [];
    this.generateAsteroids(this.state.asteroidCount);
  }

  gameOver() {
    this.setState({
      inGame: false,
    });

    // Replace top score
    if (this.state.currentScore > this.state.topScore) {
      this.setState({
        topScore: this.state.currentScore,
      });
      localStorage['topscore'] = this.state.currentScore.toString();
    }
  }

  generateAsteroids(howMany: number) {
    let asteroids = [];
    let ship = this.ship[0];
    for (let i = 0; i < howMany; i++) {
      let asteroid = new Asteroid({
        size: 80,
        position: {
          x: randomNumBetweenExcluding(0, this.state.screen.width, ship.position.x - 60, ship.position.x + 60),
          y: randomNumBetweenExcluding(0, this.state.screen.height, ship.position.y - 60, ship.position.y + 60),
        },
        create: this.createObject.bind(this),
        addScore: this.addScore.bind(this),
      });
      this.createObject(asteroid, 'asteroids');
    }
  }

  createObject(item: any, group: string) {
    this[group].push(item);
  }

  updateObjects(items: any[], group: string) {
    let index = 0;
    for (let item of items) {
      if (item.delete) {
        this[group].splice(index, 1);
      } else {
        items[index].render(this.state);
      }
      index++;
    }
  }

  checkCollisionsWith(items1: any[], items2: any[]) {
    var a = items1.length - 1;
    var b;
    for (a; a > -1; --a) {
      b = items2.length - 1;
      for (b; b > -1; --b) {
        var item1 = items1[a];
        var item2 = items2[b];
        if (this.checkCollision(item1, item2)) {
          item1.destroy();
          item2.destroy();
        }
      }
    }
  }

  checkCollision(obj1: any, obj2: any) {
    var vx = obj1.position.x - obj2.position.x;
    var vy = obj1.position.y - obj2.position.y;
    var length = Math.sqrt(vx * vx + vy * vy);
    if (length < obj1.radius + obj2.radius) {
      return true;
    }
    return false;
  }

  render() {
    let endgame;
    let message;

    if (this.state.currentScore <= 0) {
      message = '0 points... So sad.';
    } else if (this.state.currentScore >= this.state.topScore) {
      message = 'Top score with ' + this.state.currentScore + ' points. Woo!';
    } else {
      message = this.state.currentScore + ' Points though :)';
    }

    if (!this.state.inGame) {
      endgame = (
        <div className="endgame">
          <p>Game over, man!</p>
          <p>{message}</p>
          <button onClick={this.startGame.bind(this)}>try again?</button>
        </div>
      );
    }

    return (
      <div>
        {endgame}
        <span className="score current-score">Score: {this.state.currentScore}</span>
        <span className="score top-score">Top Score: {this.state.topScore}</span>
        <span className="controls">
          Use [A][S][W][D] or [←][↑][↓][→] to MOVE<br />
          Use [SPACE] to SHOOT
        </span>
        <canvas
          ref="canvas"
          width={this.state.screen.width * this.state.screen.ratio}
          height={this.state.screen.height * this.state.screen.ratio}
        />
      </div>
    );
  }
} 