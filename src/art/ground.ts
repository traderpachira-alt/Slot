import { Buf, PAL, fbm, noise, rng, shade } from './pixel';

export type Shape =
  | { t: 'blob'; x: number; y: number; rx: number; ry: number }
  | { t: 'path'; pts: [number, number][]; r: number };

export interface TerrainSpec {
  seed: number;
  theme: 'town' | 'meadow' | 'forest';
  dirt?: Shape[];
  water?: Shape[];
  stone?: Shape[];
  flowers?: number; // 0..1 yoğunluk
}

const THEMES = {
  town: { g: [0x5fa548, 0x6fb850, 0x4e9a40], tuft: 0x8fd060, tuftDark: 0x3c7434 },
  meadow: { g: [0x6ab44c, 0x7cc456, 0x5aa444], tuft: 0x9ada68, tuftDark: 0x447c34 },
  forest: { g: [0x3f8444, 0x4a9248, 0x36763e], tuft: 0x6aae58, tuftDark: 0x2a5a32 },
};

function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + t * dx - px;
  const qy = ay + t * dy - py;
  return Math.sqrt(qx * qx + qy * qy);
}

/** Şekillerin alanı: >0 ise içeride */
function field(shapes: Shape[], x: number, y: number): number {
  let best = -9;
  for (const s of shapes) {
    let v: number;
    if (s.t === 'blob') {
      const nx = (x - s.x) / s.rx;
      const ny = (y - s.y) / s.ry;
      v = 1 - Math.sqrt(nx * nx + ny * ny);
    } else {
      let d = 1e9;
      for (let i = 0; i < s.pts.length - 1; i++) d = Math.min(d, distToSeg(x, y, s.pts[i][0], s.pts[i][1], s.pts[i + 1][0], s.pts[i + 1][1]));
      v = 1 - d / s.r;
    }
    if (v > best) best = v;
  }
  return best;
}

export interface TerrainResult {
  buf: Buf;
  water: Uint8Array; // 1 = su (collision için)
}

export function paintTerrain(w: number, h: number, spec: TerrainSpec): TerrainResult {
  const b = new Buf(w, h);
  const th = THEMES[spec.theme];
  const r = rng(spec.seed);
  const S = spec.seed;
  const kind = new Uint8Array(w * h); // 0 çim, 1 toprak, 2 su, 3 taş, 4 kıyı

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = fbm(x / 22, y / 22, S, 3);
      const jitter = (fbm(x / 7, y / 7, S + 9, 2) - 0.5) * 0.5;
      let k = 0;
      if (spec.water && field(spec.water, x, y) + jitter * 0.4 > 0) k = 2;
      else if (spec.water && field(spec.water, x, y) + jitter * 0.4 > -0.12) k = 4;
      else if (spec.stone && field(spec.stone, x, y) > 0) k = 3;
      else if (spec.dirt && field(spec.dirt, x, y) + jitter > 0) k = 1;
      kind[y * w + x] = k;
      // temel çim
      const gi = n < 0.42 ? 2 : n > 0.6 ? 1 : 0;
      b.set(x, y, th.g[gi]);
    }
  }

  // çim dokusu: küçük tutamlar
  for (let i = 0; i < w * h * 0.035; i++) {
    const x = Math.floor(r() * w);
    const y = Math.floor(r() * h);
    if (kind[y * w + x] !== 0) continue;
    b.set(x, y, th.tuftDark);
    b.set(x, y - 1, th.tuft);
    if (r() < 0.5) {
      b.set(x - 1, y, th.tuftDark);
      b.set(x + 1, y - 1, th.tuft);
    }
  }

  // toprak
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = kind[y * w + x];
      if (k === 1) {
        const edge =
          kind[(y - 1) * w + x] === 0 || kind[(y + 1) * w + x] === 0 || kind[y * w + x - 1] === 0 || kind[y * w + x + 1] === 0;
        const n = noise(x / 5, y / 5, S + 3);
        let c = n > 0.62 ? PAL.dirtLight : n < 0.3 ? PAL.dirtDark : PAL.dirt;
        if (edge) c = PAL.dirtDark;
        if (y > 0 && kind[(y - 1) * w + x] === 0) c = shade(PAL.dirtDark, 0.85); // çim gölgesi
        b.set(x, y, c);
      } else if (k === 3) {
        // arnavut kaldırımı
        const cx = Math.floor((x + (Math.floor(y / 6) % 2) * 4) / 8);
        const cy = Math.floor(y / 6);
        const lx = (x + (Math.floor(y / 6) % 2) * 4) % 8;
        const ly = y % 6;
        const tone = noise(cx, cy, S + 7);
        let c = tone > 0.6 ? PAL.stoneLight : tone < 0.3 ? 0x8a8a98 : PAL.stone;
        if (lx === 0 || ly === 0) c = PAL.stoneDark;
        else if (lx === 1 || ly === 1) c = shade(c, 1.08);
        b.set(x, y, c);
      } else if (k === 2) {
        const n = fbm(x / 10, y / 6, S + 5, 2);
        let c = n > 0.62 ? PAL.waterLight : n < 0.35 ? PAL.waterDark : PAL.water;
        // kıyı gölgesi
        if (y > 2 && (kind[(y - 1) * w + x] === 4 || kind[(y - 2) * w + x] === 4)) c = PAL.waterDark;
        b.set(x, y, c);
      } else if (k === 4) {
        const below = y + 1 < h ? kind[(y + 1) * w + x] : 0;
        b.set(x, y, below === 2 ? 0xc89a6a : 0xe0c08a);
      }
    }
  }

  // su parıltıları
  for (let i = 0; i < w * h * 0.004; i++) {
    const x = Math.floor(r() * w);
    const y = Math.floor(r() * h);
    if (kind[y * w + x] === 2 && kind[y * w + x + 3] === 2) {
      b.hline(x, y, 3, 0xbfe4ff);
    }
  }

  // toprak üstü çakıllar
  for (let i = 0; i < w * h * 0.006; i++) {
    const x = Math.floor(r() * w);
    const y = Math.floor(r() * h);
    if (kind[y * w + x] !== 1) continue;
    b.set(x, y, 0xb0a090);
    b.set(x + 1, y, 0x8a7a6a);
  }

  // çiçekler
  const fd = spec.flowers ?? 0.3;
  const fcols = spec.theme === 'forest' ? [0xb8a4e8, 0xf0f0d8] : [0xffffff, 0xf8d848, 0xf07a9a, 0xb8a4e8];
  for (let i = 0; i < w * h * 0.004 * fd; i++) {
    const x = Math.floor(r() * w);
    const y = Math.floor(r() * h);
    if (kind[y * w + x] !== 0) continue;
    const c = fcols[Math.floor(r() * fcols.length)];
    // küçük öbek
    for (let j = 0; j < 3; j++) {
      const fx = x + Math.floor(r() * 7) - 3;
      const fy = y + Math.floor(r() * 5) - 2;
      if (kind[fy * w + fx] !== 0) continue;
      b.set(fx, fy, c);
      b.set(fx, fy + 1, th.tuftDark);
    }
  }

  const water = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) water[i] = kind[i] === 2 ? 1 : 0;
  return { buf: b, water };
}

/** İç mekân zemini: ahşap döşeme + arka duvar */
export function paintInterior(w: number, h: number, wallH: number): Buf {
  const b = new Buf(w, h);
  const r = rng(77);
  // döşeme
  for (let y = wallH; y < h; y++) {
    const plank = Math.floor((y - wallH) / 8);
    for (let x = 0; x < w; x++) {
      const off = (plank * 23) % 32;
      const seam = (x + off) % 32 === 0;
      let c = plank % 2 ? 0xb07a4a : 0xa87044;
      if ((y - wallH) % 8 === 7) c = 0x7a4e30;
      else if (seam) c = 0x7a4e30;
      else if ((y - wallH) % 8 === 0) c = 0xc08a58;
      if (r() < 0.02) c = shade(c, 0.9);
      b.set(x, y, c);
    }
  }
  // duvar kağıdı
  for (let y = 0; y < wallH; y++)
    for (let x = 0; x < w; x++) {
      let c = 0x6a4a7a;
      if ((x + Math.floor(y / 6) * 3) % 12 === 0 && y % 6 === 2) c = 0x8a6a9a;
      if (y > wallH - 14) c = (x % 6 === 0 ? 0x5a3a26 : 0x7a5034); // lambri
      if (y === wallH - 14) c = 0x9a6a44;
      if (y === wallH - 1) c = 0x3a2418;
      b.set(x, y, c);
    }
  // tavan kirişi
  b.rect(0, 0, w, 4, 0x4a2e1e);
  b.hline(0, 3, w, 0x3a2418);
  // pencere
  const wx = Math.floor(w / 2) - 10;
  b.rect(wx - 2, 8, 24, 20, 0x4a2e1e);
  b.rect(wx, 10, 20, 16, 0x8ac4e8);
  b.rect(wx, 20, 20, 6, 0x6aa848);
  b.rect(wx + 2, 11, 5, 3, 0xd8f0ff);
  b.vline(wx + 10, 10, 16, 0x4a2e1e);
  b.hline(wx, 18, 20, 0x4a2e1e);
  b.rect(wx - 3, 28, 26, 2, 0x9a6a44);
  // duvar dibi gölge
  b.hline(0, wallH, w, 0x6a4028);
  b.hline(0, wallH + 1, w, 0x8a5a38);
  // kenar duvarları
  b.rect(0, 0, 4, h, 0x3a2418);
  b.rect(w - 4, 0, 4, h, 0x3a2418);
  b.rect(0, h - 4, w, 4, 0x3a2418);
  // kapı boşluğu ve paspas
  const dx = Math.floor(w / 2) - 10;
  b.rect(dx, h - 4, 20, 4, 0x2a1a12);
  b.rect(dx + 1, h - 14, 18, 9, 0x6a8a4a);
  b.rect(dx + 2, h - 13, 16, 7, 0x8aa85a);
  return b;
}

/** Collision için su maskesinden dikdörtgenler çıkarır (8px hücreler, yatay birleştirilmiş) */
export function waterRects(mask: Uint8Array, w: number, h: number, cell = 8): [number, number, number, number][] {
  const out: [number, number, number, number][] = [];
  for (let cy = 0; cy < Math.floor(h / cell); cy++) {
    let run = -1;
    for (let cx = 0; cx <= Math.floor(w / cell); cx++) {
      let solid = false;
      if (cx < Math.floor(w / cell)) {
        let n = 0;
        for (let y = 0; y < cell; y++) for (let x = 0; x < cell; x++) n += mask[(cy * cell + y) * w + cx * cell + x];
        solid = n > cell * cell * 0.45;
      }
      if (solid && run < 0) run = cx;
      if (!solid && run >= 0) {
        out.push([run * cell, cy * cell, (cx - run) * cell, cell]);
        run = -1;
      }
    }
  }
  return out;
}
