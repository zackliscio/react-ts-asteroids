/**
 * Generates vertices for asteroid polygon with certain count and radius
 * @param  {Number} count   Number of vertices
 * @param  {Number} rad     Maximal radius of polygon
 * @return {Array}        Array of vertices: {x: Number, y: Number}
 */
export function asteroidVertices(count: number, rad: number): { x: number; y: number }[] {
  let p = [];
  for (let i = 0; i < count; i++) {
    p[i] = {
      x: (-Math.sin((360 / count) * i * Math.PI / 180) + Math.round(Math.random() * 2 - 1) * Math.random() / 3) * rad,
      y: (-Math.cos((360 / count) * i * Math.PI / 180) + Math.round(Math.random() * 2 - 1) * Math.random() / 3) * rad,
    };
  }
  return p;
}

/**
 * Rotate point around center on certain angle
 * @param {Object} p        {x: Number, y: Number}
 * @param {Object} center   {x: Number, y: Number}
 * @param {Number} angle    Angle in radians
 */
export function rotatePoint(p: { x: number; y: number }, center: { x: number; y: number }, angle: number): { x: number; y: number } {
  return {
    x: ((p.x - center.x) * Math.cos(angle) - (p.y - center.y) * Math.sin(angle)) + center.x,
    y: ((p.x - center.x) * Math.sin(angle) + (p.y - center.y) * Math.cos(angle)) + center.y,
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