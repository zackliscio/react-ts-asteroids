import { Point, GameObject, GameState } from './types';

interface ParticleArgs {
  position: Point;
  velocity: Point;
  size: number;
  lifeSpan: number;
}

export default class Particle implements GameObject {
  position: Point;
  velocity: Point;
  radius: number;
  lifeSpan: number;
  inertia: number;
  delete?: boolean;
  rotation: number; // Required by GameObject interface

  constructor(args: ParticleArgs) {
    this.position = args.position;
    this.velocity = args.velocity;
    this.radius = args.size;
    this.lifeSpan = args.lifeSpan;
    this.inertia = 0.98;
    this.rotation = 0; // Particles don't rotate but needed for GameObject interface
  }

  destroy(): void {
    this.delete = true;
  }

  render(state: GameState): void {
    // Move
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.velocity.x *= this.inertia;
    this.velocity.y *= this.inertia;

    // Shrink
    this.radius -= 0.1;
    if(this.radius < 0.1) {
      this.radius = 0.1;
    }
    if(this.lifeSpan-- < 0){
      this.destroy();
    }

    // Draw
    const context = state.context;
    context.save();
    context.translate(this.position.x, this.position.y);
    context.fillStyle = '#ffffff';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, -this.radius);
    context.arc(0, 0, this.radius, 0, 2 * Math.PI);
    context.closePath();
    context.fill();
    context.restore();
  }
} 