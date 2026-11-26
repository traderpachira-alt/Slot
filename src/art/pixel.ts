// Küçük bir piksel çizim kütüphanesi. Tüm oyun görselleri bununla kodla üretilir.

export type RGB = number;

export function shade(c: RGB, f: number): RGB {
  const r = Math.max(0, Math.min(255, Math.round(((c >> 16) & 255) * f)));
  const g = Math.max(0, Math.min(255, Math.round(((c >> 8) & 255) * f)));
  const b = Math.max(0, Math.min(255, Math.round((c & 255) * f)));
  return (r << 16) | (g << 8) | b;
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  const r = Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t);
  const g = Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t);
  const bl = Math.round((a & 255) * (1 - t) + (b & 255) * t);
  return (r << 16) | (g << 8) | bl;
}

/** Deterministik rastgele sayı üreteci */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

function hash2(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Değer gürültüsü 0..1 */
export function noise(x: number, y: number, seed = 1): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x: number, y: number, seed = 1, oct = 3): number {
  let t = 0;
  let amp = 0.5;
  let f = 1;
  let norm = 0;
  for (let i = 0; i < oct; i++) {
    t += noise(x * f, y * f, seed + i * 17) * amp;
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return t / norm;
}

export class Buf {
  readonly w: number;
  readonly h: number;
  readonly px: Int32Array; // -1 = saydam, aksi halde RGB

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.px = new Int32Array(w * h).fill(-1);
  }

  inside(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  set(x: number, y: number, c: RGB) {
    x |= 0;
    y |= 0;
    if (this.inside(x, y)) this.px[y * this.w + x] = c;
  }

  get(x: number, y: number): number {
    x |= 0;
    y |= 0;
    return this.inside(x, y) ? this.px[y * this.w + x] : -1;
  }

  clear(x: number, y: number) {
    if (this.inside(x, y)) this.px[(y | 0) * this.w + (x | 0)] = -1;
  }

  rect(x: number, y: number, w: number, h: number, c: RGB) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }

  hline(x: number, y: number, w: number, c: RGB) {
    this.rect(x, y, w, 1, c);
  }

  vline(x: number, y: number, h: number, c: RGB) {
    this.rect(x, y, 1, h, c);
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: RGB | ((x: number, y: number, nx: number, ny: number) => RGB | -1)) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        if (nx * nx + ny * ny <= 1) {
          const col = typeof c === 'function' ? c(x, y, nx, ny) : c;
          if (col >= 0) this.set(x, y, col);
        }
      }
    }
  }

  disc(cx: number, cy: number, r: number, c: RGB | ((x: number, y: number, nx: number, ny: number) => RGB | -1)) {
    this.ellipse(cx, cy, r, r, c);
  }

  line(x0: number, y0: number, x1: number, y1: number, c: RGB) {
    x0 |= 0;
    y0 |= 0;
    x1 |= 0;
    y1 |= 0;
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  /** Saydam olmayan piksellerin etrafına 1px kontur çizer. */
  outline(c: RGB, diagonal = false) {
    const copy = this.px.slice();
    const w = this.w;
    const at = (x: number, y: number) => (x >= 0 && y >= 0 && x < w && y < this.h ? copy[y * w + x] : -1);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < w; x++) {
        if (copy[y * w + x] !== -1) continue;
        let n = at(x - 1, y) !== -1 || at(x + 1, y) !== -1 || at(x, y - 1) !== -1 || at(x, y + 1) !== -1;
        if (!n && diagonal) n = at(x - 1, y - 1) !== -1 || at(x + 1, y - 1) !== -1 || at(x - 1, y + 1) !== -1 || at(x + 1, y + 1) !== -1;
        if (n) this.px[y * w + x] = c;
      }
    }
  }

  /** Paletli dize ızgarasını çizer. '.' ve ' ' saydamdır. */
  grid(ox: number, oy: number, rows: string[], pal: Record<string, RGB>, flip = false) {
    for (let j = 0; j < rows.length; j++) {
      const r = rows[j];
      for (let i = 0; i < r.length; i++) {
        const ch = r[i];
        if (ch === '.' || ch === ' ') continue;
        const c = pal[ch];
        if (c === undefined) continue;
        this.set(flip ? ox + r.length - 1 - i : ox + i, oy + j, c);
      }
    }
  }

  blit(src: Buf, ox: number, oy: number, flip = false) {
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        const c = src.px[y * src.w + x];
        if (c !== -1) this.set(flip ? ox + src.w - 1 - x : ox + x, oy + y, c);
      }
  }

  /** Her pikseli dönüştürür */
  map(fn: (c: RGB, x: number, y: number) => RGB | -1) {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const i = y * this.w + x;
        if (this.px[i] !== -1) this.px[i] = fn(this.px[i], x, y);
      }
  }

  toCanvas(): HTMLCanvasElement {
    const cv = document.createElement('canvas');
    cv.width = this.w;
    cv.height = this.h;
    const ctx = cv.getContext('2d')!;
    const img = ctx.createImageData(this.w, this.h);
    const d = img.data;
    for (let i = 0; i < this.px.length; i++) {
      const c = this.px[i];
      if (c === -1) continue;
      d[i * 4] = (c >> 16) & 255;
      d[i * 4 + 1] = (c >> 8) & 255;
      d[i * 4 + 2] = c & 255;
      d[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return cv;
  }
}

// Ortak palet
export const PAL = {
  outline: 0x2a1d2e,
  outlineSoft: 0x4a3340,
  white: 0xfff8ec,
  cream: 0xf4e4c4,
  parchment: 0xeed9a8,
  parchmentDark: 0xc9a86a,
  wood: 0x9a6038,
  woodLight: 0xc0844a,
  woodDark: 0x6a3e26,
  woodDarker: 0x4a2a1c,
  stone: 0x9a9aa8,
  stoneLight: 0xc4c4cc,
  stoneDark: 0x6a6a7a,
  grass1: 0x5fa548,
  grass2: 0x6fb850,
  grass3: 0x4e8f3e,
  grassDark: 0x3c7434,
  grassLight: 0x8fd060,
  dirt: 0xd9925f,
  dirtLight: 0xe8ab78,
  dirtDark: 0xb87448,
  water: 0x3f8fd0,
  waterLight: 0x6cb8e8,
  waterDark: 0x2c6aa8,
  leaf: 0x3f8a4a,
  leafLight: 0x5fae5a,
  leafDark: 0x2a6438,
  pine: 0x2f7a5a,
  pineLight: 0x4a9a6a,
  pineDark: 0x1f5444,
  roofOrange: 0xe0803a,
  roofPurple: 0x7a4a9a,
  gold: 0xf2c040,
  goldDark: 0xc08a20,
};
