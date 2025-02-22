export interface Point {
  x: number;
  y: number;
}

export interface GameState {
  screen: {
    width: number;
    height: number;
    ratio: number;
  };
  context: CanvasRenderingContext2D;
  keys: {
    left: number;
    right: number;
    up: number;
    down: number;
    space: number;
  };
  colors: {
    text: string;
    background: string;
    border: string;
  };
}

export type CreateObject = (item: GameObject, group: string) => void;

export interface GameObject {
  position: Point;
  velocity: Point;
  radius: number;
  delete?: boolean;
  rotation: number;
  render: (state: GameState) => void;
  destroy: () => void;
} 