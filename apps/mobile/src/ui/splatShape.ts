// Procedural paint splats: a soft blob with teardrop arms, flying droplets and drips.
// Everything lives in a 220x220 box centred on 0,0 (viewBox -110 -110 220 220).

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
  /** Body, arms and droplets as one path. Every sub-path winds the same way so they merge. */
  body: string;
  drips: string;
}

export const SPLAT_BOX = '-110 -110 220 220';

const cache = new Map<string, SplatShape>();
const f = (n: number) => n.toFixed(1);

/** Smooth closed path through points (Catmull-Rom to cubic Bezier). */
function smooth(pts: [number, number][]) {
  const n = pts.length;
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + 'Z';
}

const circle = (x: number, y: number, r: number) => `M${f(x - r)},${f(y)}a${f(r)},${f(r)} 0 1 1 ${f(r * 2)},0a${f(r)},${f(r)} 0 1 1 ${f(-r * 2)},0Z`;

export function splatShape(seed: number, opts: { arms?: number; dots?: number; drips?: number; radius?: number } = {}): SplatShape {
  const key = `${seed}|${opts.arms}|${opts.dots}|${opts.drips}|${opts.radius}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const r = rng(seed);
  const R = opts.radius ?? 46;
  const arms = opts.arms ?? 6;

  // A lumpy blob for the middle.
  const n = 12;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.25;
    const rad = R * (0.88 + r() * 0.27);
    pts.push([Math.cos(a) * rad, Math.sin(a) * rad]);
  }
  let body = smooth(pts);

  // Arms: a thin neck that swells into a round tip, with the odd droplet flung past it.
  const base = r() * Math.PI * 2;
  for (let i = 0; i < arms; i++) {
    const a = base + (i / arms) * Math.PI * 2 + (r() - 0.5) * 0.5;
    const len = R * (1.35 + r() * 0.55);
    const tip = 4 + r() * 5;
    const bw = 13 + r() * 9;
    const ca = Math.cos(a), sa = Math.sin(a);
    const px = -sa, py = ca;
    const b0 = R * 0.72;
    const bx = ca * b0, by = sa * b0;
    const tx = ca * len, ty = sa * len;
    const mid = b0 + (len - b0) * 0.45;
    const mx = ca * mid, my = sa * mid;
    const nw = tip * 0.55, tw = tip * 0.8;
    body +=
      `M${f(bx - px * bw)},${f(by - py * bw)}Q${f(mx - px * nw)},${f(my - py * nw)} ${f(tx - px * tw)},${f(ty - py * tw)}` +
      `L${f(tx + px * tw)},${f(ty + py * tw)}Q${f(mx + px * nw)},${f(my + py * nw)} ${f(bx + px * bw)},${f(by + py * bw)}Z`;
    body += circle(tx, ty, tip);
    if (r() > 0.35) {
      const far = len + tip + 6 + r() * 10;
      body += circle(ca * far, sa * far, 1.8 + r() * 3);
    }
  }
  const nd = opts.dots ?? 4;
  for (let i = 0; i < nd; i++) {
    const a = r() * Math.PI * 2, d = R * (1.5 + r() * 0.6);
    body += circle(Math.cos(a) * d, Math.sin(a) * d, 1.5 + r() * 3.5);
  }

  let drips = '';
  const ndr = opts.drips ?? 0;
  for (let i = 0; i < ndr; i++) {
    const x = (r() - 0.5) * R * 1.3;
    const w = 5 + r() * 7;
    const top = R * 0.4;
    const bottom = top + R * (0.6 + r() * 0.7);
    drips += `M${f(x - w / 2)},${f(top)}L${f(x - w / 2)},${f(bottom)}A${f(w / 2)},${f(w / 2)} 0 0 0 ${f(x + w / 2)},${f(bottom)}L${f(x + w / 2)},${f(top)}Z`;
  }
  const shape = { body, drips };
  cache.set(key, shape);
  return shape;
}

/** A brush swipe with a wobbly edge and a ragged dry end. Lives in a 300x80 box. */
export const BRUSH_BOX = '0 0 300 80';
export const BRUSH_STROKE =
  'M6,40.0Q2,16.0 12.0,10.6Q25.5,9.7 39.0,13.2Q52.5,12.7 66.0,9.4Q79.5,7.3 93.0,14.3Q106.5,11.3 120.0,13.0Q133.5,12.2 147.0,8.3Q160.5,4.7 174.0,10.9Q187.5,9.1 201.0,14.7Q214.5,13.1 228.0,12.8Q241.5,11.4 255.0,17.0Q268.5,14.3 282.0,10.7L302.1,13.4L300.1,17.0L283.7,19.6L295.6,22.3L293.6,25.8L283.2,28.5L296.9,31.1L294.9,34.7L281.5,37.4L298.0,40.0L296.0,43.6L284.5,46.2L293.4,48.9L291.4,52.4L280.1,55.1L301.5,57.8L299.5,61.3L283.1,64.0Q268.5,61.2 255.0,69.8Q241.5,66.6 228.0,64.8Q214.5,66.5 201.0,66.1Q187.5,65.1 174.0,67.4Q160.5,64.5 147.0,63.6Q133.5,62.7 120.0,65.4Q106.5,64.7 93.0,66.2Q79.5,69.1 66.0,71.9Q52.5,68.4 39.0,63.5Q25.5,65.5 12.0,71.3Q2,64.0 6,40.0Z';
