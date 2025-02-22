import { Point, GameObject, GameState } from './types';
import { rotatePoint } from './helpers';

interface BulletArgs {
  ship: {
    position: Point;
    rotation: number;
  };
}

export default class Bullet implements GameObject {
  position: Point;
  velocity: Point;
  rotation: number;
  radius: number;
  delete?: boolean;

  constructor(args: BulletArgs) {
    const posDelta = rotatePoint({x:0, y:-20}, {x:0,y:0}, args.ship.rotation * Math.PI / 180);
    this.position = {
      x: args.ship.position.x + posDelta.x,
      y: args.ship.position.y + posDelta.y
    };
    this.rotation = args.ship.rotation;
    this.velocity = {
      x: posDelta.x / 2,
      y: posDelta.y / 2
    };
    this.radius = 2;
  }

  destroy(): void {
    this.delete = true;
  }

  render(state: GameState): void {
    // Move
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Delete if it goes out of bounds
    if ( this.position.x < 0
      || this.position.y < 0
      || this.position.x > state.screen.width
      || this.position.y > state.screen.height ) {
        this.destroy();
    }

    // Draw
    const context = state.context;
    context.save();
    context.translate(this.position.x, this.position.y);
    context.rotate(this.rotation * Math.PI / 180);
    context.fillStyle = state.colors.text;
    context.lineWidth = 0.5;
    context.beginPath();
    context.arc(0, 0, 2, 0, 2 * Math.PI);
    context.closePath();
    context.fill();
    context.restore();
  }
} 