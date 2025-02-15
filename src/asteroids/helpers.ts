import { Point } from './types';

/**
 * Rotate point around center on certain angle
 * @param {Object} p        {x: Number, y: Number}
 * @param {Object} center   {x: Number, y: Number}
 * @param {Number} angle    Angle in radians
 */
export function rotatePoint(p: Point, center: Point, angle: number): Point {
  return {
    x: ((p.x-center.x)*Math.cos(angle) - (p.y-center.y)*Math.sin(angle)) + center.x,
    y: ((p.x-center.x)*Math.sin(angle) + (p.y-center.y)*Math.cos(angle)) + center.y
  };
}

/**
 * Random Number between 2 numbers
 */
export function randomNumBetween(min: number, max: number): number {
  return Math.random() * (max - min + 1) + min;
}

/**
 * Random Number between 2 numbers excluding a certain range
 */
export function randomNumBetweenExcluding(min: number, max: number, exMin: number, exMax: number): number {
  let random = randomNumBetween(min, max);
  while (random > exMin && random < exMax) {
    random = Math.random() * (max - min + 1) + min;
  }
  return random;
}

/**
 * Generate vertices for asteroid polygon with certain count and radius
 */
export function asteroidVertices(count: number, rad: number): Point[] {
  const p: Point[] = [];
  for (let i = 0; i < count; i++) {
    p[i] = {
      x: (-Math.sin((360/count)*i*Math.PI/180) + Math.random()*0.2)*rad,
      y: (-Math.cos((360/count)*i*Math.PI/180) + Math.random()*0.2)*rad
    };
  }
  return p;
} 