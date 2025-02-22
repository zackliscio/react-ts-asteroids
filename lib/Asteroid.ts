import { Point, GameObject, GameState, CreateObject } from './types';
import Particle from './Particle';
import { asteroidVertices, randomNumBetween } from './helpers';

interface AsteroidArgs {
  position: Point;
  size: number;
  create: CreateObject;
  addScore: (score: number) => void;
}

export default class Asteroid implements GameObject {
  position: Point;
  velocity: Point;
  rotation: number;
  rotationSpeed: number;
  radius: number;
  score: number;
  create: CreateObject;
  addScore: (score: number) => void;
  vertices: Point[];
  delete?: boolean;

  constructor(args: AsteroidArgs) {
    this.position = args.position;
    this.velocity = {
      x: randomNumBetween(-1.5, 1.5),
      y: randomNumBetween(-1.5, 1.5)
    };
    this.rotation = 0;
    this.rotationSpeed = randomNumBetween(-1, 1);
    this.radius = args.size;
    this.score = (80/this.radius)*5;
    this.create = args.create;
    this.addScore = args.addScore;
    this.vertices = asteroidVertices(8, args.size);
  }

  destroy(): void {
    this.addScore(this.score);
    // Explode
    for (let i = 0; i < this.radius; i++) {
      const particle = new Particle({
        lifeSpan: randomNumBetween(60, 100),
        size: randomNumBetween(1, 3),
        position: {
          x: this.position.x + randomNumBetween(-this.radius/4, this.radius/4),
          y: this.position.y + randomNumBetween(-this.radius/4, this.radius/4)
        },
        velocity: {
          x: randomNumBetween(-1.5, 1.5),
          y: randomNumBetween(-1.5, 1.5)
        }
      });
      this.create(particle, 'particles');
    }

    // Break into smaller asteroids
    if(this.radius > 10){
      for (let i = 0; i < 2; i++) {
        const asteroid = new Asteroid({
          size: this.radius/2,
          position: {
            x: randomNumBetween(-10, 20)+this.position.x,
            y: randomNumBetween(-10, 20)+this.position.y
          },
          create: this.create,
          addScore: this.addScore
        });
        this.create(asteroid, 'asteroids');
      }
    }
  }

  render(state: GameState): void {
    // Move
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Rotation
    this.rotation += this.rotationSpeed;
    if (this.rotation >= 360) {
      this.rotation -= 360;
    }
    if (this.rotation < 0) {
      this.rotation += 360;
    }

    // Screen edges
    if(this.position.x > state.screen.width + this.radius) this.position.x = -this.radius;
    else if(this.position.x < -this.radius) this.position.x = state.screen.width + this.radius;
    if(this.position.y > state.screen.height + this.radius) this.position.y = -this.radius;
    else if(this.position.y < -this.radius) this.position.y = state.screen.height + this.radius;

    // Draw
    const context = state.context;
    context.save();
    context.translate(this.position.x, this.position.y);
    context.rotate(this.rotation * Math.PI / 180);
    context.strokeStyle = state.colors.text;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, -this.radius);
    for (let i = 1; i < this.vertices.length; i++) {
      context.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    context.closePath();
    context.stroke();
    context.restore();
  }
} 