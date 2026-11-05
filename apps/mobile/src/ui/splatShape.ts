// Procedural paint splats: a lumpy blob, some arms, flying droplets and drips.
// Everything lives in a 200x200 box centred on 0,0 (viewBox -100 -100 200 200).

export function rng(seed: number) {
  let t = seed >>> 0 || 1;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SplatShape {
  body: string;
  dots: { cx: number; cy: number; r: number }[];
  drips: string;
}

const cache = new Map<string, SplatShape>();

/** Smooth closed path through points (Catmull-Rom to cubic Bezier). */
function smooth(pts: [number, number][]) {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}

export function splatShape(seed: number, opts: { arms?: number; dots?: number; drips?: number; radius?: number } = {}): SplatShape {
  const key = `${seed}|${opts.arms}|${opts.dots}|${opts.drips}|${opts.radius}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const r = rng(seed);
  const R = opts.radius ?? 52;
  const arms = opts.arms ?? 7;
  const N = 28;
  const armAt = new Set<number>();
  while (armAt.size < arms) armAt.add(Math.floor(r() * N));
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    let rad = R * (0.82 + r() * 0.22);
    if (armAt.has(i)) rad = R * (1.25 + r() * 0.45);
    pts.push([Math.cos(a) * rad, Math.sin(a) * rad]);
  }
  const dots: SplatShape['dots'] = [];
  const nd = opts.dots ?? 9;
  for (let i = 0; i < nd; i++) {
    const a = r() * Math.PI * 2;
    const d = R * (1.35 + r() * 0.5);
    dots.push({ cx: Math.cos(a) * d, cy: Math.sin(a) * d, r: 2 + r() * 6 });
  }
  let drips = '';
  const ndr = opts.drips ?? 3;
  for (let i = 0; i < ndr; i++) {
    const x = (r() - 0.5) * R * 1.3;
    const w = 5 + r() * 7;
    const len = R * (0.5 + r() * 0.75);
    const top = R * 0.4;
    const bottom = top + len;
    drips += `M${(x - w / 2).toFixed(1)},${top.toFixed(1)}L${(x - w / 2).toFixed(1)},${bottom.toFixed(1)}A${(w / 2).toFixed(1)},${(w / 2).toFixed(1)} 0 0 0 ${(x + w / 2).toFixed(1)},${bottom.toFixed(1)}L${(x + w / 2).toFixed(1)},${top.toFixed(1)}Z`;
  }
  const shape = { body: smooth(pts), dots, drips };
  cache.set(key, shape);
  return shape;
}
