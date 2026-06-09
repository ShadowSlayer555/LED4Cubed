import { LEDFrame } from '../types';

interface Coord { p: number; r: number; c: number; }

export function getCoordsFromLeds(leds: boolean[]): Coord[] {
  const coords: Coord[] = [];
  for (let i = 0; i < 64; i++) {
    if (leds[i]) {
      const p = Math.floor(i / 16);
      const r = Math.floor((i % 16) / 4);
      const c = i % 4;
      coords.push({ p, r, c });
    }
  }
  return coords;
}

export function distNode(a: Coord, b: Coord) {
  // Use Manhattan distance for grid movement estimation
  return Math.abs(a.p - b.p) + Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

export function interpolateLeds(activeLeds: boolean[], nextLeds: boolean[], t: number): boolean[] {
  const A = getCoordsFromLeds(activeLeds);
  const B = getCoordsFromLeds(nextLeds);
  const displayLeds = Array(64).fill(false);

  if (A.length === 0 || B.length === 0) {
    const src = t >= 0.5 ? nextLeds : activeLeds;
    for(let i = 0; i < 64; i++) displayLeds[i] = src[i];
    return displayLeds;
  }

  const paths: { from: Coord; to: Coord }[] = [];
  const unassignedB = [...B];
  
  // Match each A to closest available B
  for (const a of A) {
    if (unassignedB.length > 0) {
      unassignedB.sort((b1, b2) => distNode(a, b1) - distNode(a, b2));
      paths.push({ from: a, to: unassignedB.shift()! });
    } else {
      const allB = [...B];
      allB.sort((b1, b2) => distNode(a, b1) - distNode(a, b2));
      paths.push({ from: a, to: allB[0] });
    }
  }
  
  // Match remaining B to closest A
  for (const b of unassignedB) {
    const allA = [...A];
    allA.sort((a1, a2) => distNode(b, a1) - distNode(b, a2));
    paths.push({ from: allA[0], to: b });
  }

  for (const path of paths) {
    const currP = Math.round(path.from.p + (path.to.p - path.from.p) * t);
    const currR = Math.round(path.from.r + (path.to.r - path.from.r) * t);
    const currC = Math.round(path.from.c + (path.to.c - path.from.c) * t);
    
    const safeP = Math.max(0, Math.min(3, currP));
    const safeR = Math.max(0, Math.min(3, currR));
    const safeC = Math.max(0, Math.min(3, currC));
    
    const idx = safeP * 16 + safeR * 4 + safeC;
    displayLeds[idx] = true;
  }

  return displayLeds;
}
