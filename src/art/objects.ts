import { Buf, PAL, mix, rng, shade } from './pixel';

// Işık sol üstten gelir. nx, ny: -1..1 normalize koordinat.
function litColor(nx: number, ny: number, light: number, mid: number, dark: number, x = 0, y = 0): number {
  const l = nx * 0.6 + ny * 0.8;
  if (l < -0.45) return light;
  if (l < -0.3 && (x + y) % 2 === 0) return light;
  if (l > 0.55) return dark;
  if (l > 0.38 && (x + y) % 2 === 0) return dark;
  return mid;
}

// ---------------- Ağaçlar ----------------

export function drawPine(seed = 1, colors = { l: PAL.pineLight, m: PAL.pine, d: PAL.pineDark }): Buf {
  const b = new Buf(32, 50);
  const r = rng(seed);
  // gövde
  b.rect(13, 38, 6, 10, PAL.woodDark);
  b.rect(13, 38, 2, 10, PAL.wood);
  b.rect(18, 38, 1, 10, PAL.woodDarker);
  b.set(12, 47, PAL.woodDark);
  b.set(19, 47, PAL.woodDark);
  const tiers = 4;
  for (let t = tiers - 1; t >= 0; t--) {
    const top = 2 + t * 8;
    const h = 16;
    const half = 5 + t * 3.3;
    for (let y = top; y < top + h; y++) {
      const k = (y - top) / h;
      const hw = half * (0.25 + 0.75 * k);
      for (let x = Math.floor(16 - hw); x <= Math.ceil(16 + hw); x++) {
        const nx = (x + 0.5 - 16) / (hw + 0.01);
        if (Math.abs(nx) > 1) continue;
        // tırtıklı alt kenar
        if (y > top + h - 3 && (x * 7 + t * 3) % 4 < (y - (top + h - 3)) + 1) continue;
        const ny = k * 2 - 1;
        let c = litColor(nx, ny * 0.6, colors.l, colors.m, colors.d, x, y);
        if (y > top + h - 5 && nx > -0.2) c = colors.d;
        if (r() < 0.04) c = colors.l;
        b.set(x, y, c);
      }
    }
  }
  b.outline(shade(colors.d, 0.55));
  return b;
}

export function drawOak(seed = 2, colors = { l: PAL.leafLight, m: PAL.leaf, d: PAL.leafDark }, w = 40, h = 46): Buf {
  const b = new Buf(w, h);
  const r = rng(seed);
  const cx = w / 2;
  // gövde
  b.rect(cx - 3, h - 16, 6, 14, PAL.woodDark);
  b.rect(cx - 3, h - 16, 2, 14, PAL.wood);
  b.set(cx - 4, h - 3, PAL.woodDark);
  b.set(cx + 3, h - 3, PAL.woodDark);
  b.set(cx - 5, h - 2, PAL.woodDark);
  b.set(cx + 4, h - 2, PAL.woodDark);
  // taç: kümeler
  const blobs: [number, number, number][] = [
    [cx, 15, 13],
    [cx - 9, 21, 9],
    [cx + 9, 21, 9],
    [cx - 5, 10, 8],
    [cx + 6, 9, 8],
    [cx, 25, 9],
  ];
  for (const [bx, by, br] of blobs) {
    b.disc(bx, by, br, (x, y, nx, ny) => litColor(nx, ny, colors.l, colors.m, colors.d, x, y));
  }
  // yaprak dokusu
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(r() * w);
    const y = Math.floor(r() * (h - 14));
    if (b.get(x, y) === colors.m) b.set(x, y, r() < 0.5 ? colors.l : colors.d);
  }
  b.outline(shade(colors.d, 0.55));
  return b;
}

export function drawBush(seed = 3, berries = false): Buf {
  const b = new Buf(20, 15);
  const r = rng(seed);
  for (const [x, y, rad] of [
    [6, 9, 5.5],
    [13, 9, 5.5],
    [10, 6, 5.5],
  ] as [number, number, number][]) {
    b.disc(x, y, rad, (px, py, nx, ny) => litColor(nx, ny, PAL.leafLight, PAL.leaf, PAL.leafDark, px, py));
  }
  if (berries)
    for (let i = 0; i < 5; i++) {
      const x = 4 + Math.floor(r() * 12);
      const y = 4 + Math.floor(r() * 8);
      if (b.get(x, y) !== -1) b.set(x, y, 0xe04a5a);
    }
  b.outline(shade(PAL.leafDark, 0.55));
  return b;
}

export function drawRock(big = false, mossy = false): Buf {
  const w = big ? 20 : 13;
  const h = big ? 15 : 10;
  const b = new Buf(w, h);
  b.ellipse(w / 2, h / 2 + 1, w / 2 - 1, h / 2 - 1, (x, y, nx, ny) => {
    const c = litColor(nx, ny, PAL.stoneLight, PAL.stone, PAL.stoneDark, x, y);
    if (mossy && ny < -0.2 && (x * 3 + y) % 4 !== 0) return nx < 0 ? 0x6aa048 : 0x4e8a3a;
    return c;
  });
  b.outline(PAL.outlineSoft);
  return b;
}

export function drawStump(): Buf {
  const b = new Buf(16, 12);
  b.rect(2, 4, 12, 7, PAL.woodDark);
  b.rect(2, 4, 3, 7, PAL.wood);
  b.ellipse(8, 4, 6, 2.5, PAL.woodLight);
  b.ellipse(8, 4, 3.5, 1.3, 0xd8a468);
  b.set(8, 4, PAL.woodDark);
  b.set(1, 10, PAL.woodDark);
  b.set(14, 10, PAL.woodDark);
  b.outline(PAL.outline);
  return b;
}

export function drawLog(): Buf {
  const b = new Buf(30, 12);
  b.rect(3, 2, 24, 8, PAL.wood);
  b.hline(3, 2, 24, PAL.woodLight);
  b.hline(3, 3, 24, PAL.woodLight);
  b.hline(3, 9, 24, PAL.woodDark);
  for (let x = 6; x < 26; x += 5) b.set(x, 5 + (x % 2), PAL.woodDark);
  b.ellipse(3, 6, 2.5, 4, 0xd8a468);
  b.set(3, 6, PAL.woodDark);
  // yosun
  for (let x = 10; x < 20; x++) if (x % 3) b.set(x, 2, 0x6aa048);
  b.outline(PAL.outline);
  return b;
}

// ---------------- Binalar ----------------

function shingleRoof(b: Buf, x0: number, y0: number, wTop: number, wBot: number, h: number, color: number, seed: number, damaged = 0) {
  const r = rng(seed);
  const light = shade(color, 1.18);
  const dark = shade(color, 0.72);
  const darker = shade(color, 0.55);
  const cx = x0 + wBot / 2;
  for (let y = 0; y < h; y++) {
    const k = y / (h - 1);
    const hw = (wTop + (wBot - wTop) * k) / 2;
    const row = Math.floor(y / 5);
    const inRow = y % 5;
    for (let x = Math.ceil(cx - hw); x < Math.floor(cx + hw); x++) {
      const sx = (x - Math.ceil(cx - hw) + (row % 2) * 3) % 6;
      let c = color;
      if (inRow === 4) c = dark;
      else if (inRow === 3 && (sx === 0 || sx === 5)) c = dark;
      else if (sx === 0) c = dark;
      else if (inRow === 0 && sx < 4) c = light;
      if (y < 2) c = light;
      b.set(x, y0 + y, c);
    }
    // kenar gölgesi
    b.set(Math.floor(cx + hw) - 1, y0 + y, darker);
  }
  // hasarlı kiremitler
  for (let i = 0; i < damaged; i++) {
    const yy = y0 + 6 + Math.floor(r() * (h - 12));
    const xx = Math.floor(cx - wTop / 2 + r() * wTop);
    b.rect(xx, yy, 4, 3, shade(color, 0.45));
    b.hline(xx, yy + 3, 4, PAL.woodDarker);
  }
  // saçak
  b.hline(Math.ceil(cx - wBot / 2), y0 + h, wBot, darker);
}

function plasterWall(b: Buf, x: number, y: number, w: number, h: number, color = 0xf0e0c0, seed = 5, cracks = 0) {
  const r = rng(seed);
  b.rect(x, y, w, h, color);
  b.rect(x, y, w, 2, shade(color, 0.8)); // saçak gölgesi
  b.rect(x, y + h - 3, w, 3, shade(color, 0.82));
  for (let i = 0; i < w * h * 0.03; i++) b.set(x + r() * w, y + 2 + r() * (h - 5), shade(color, 0.93));
  for (let i = 0; i < cracks; i++) {
    let cx = x + 4 + Math.floor(r() * (w - 8));
    let cy = y + 4 + Math.floor(r() * (h - 10));
    for (let k = 0; k < 6; k++) {
      b.set(cx, cy, shade(color, 0.6));
      cx += r() < 0.5 ? 1 : -1;
      cy += 1;
    }
  }
  // ahşap kirişler
  b.rect(x, y, 3, h, PAL.woodDark);
  b.rect(x + w - 3, y, 3, h, PAL.woodDark);
  b.vline(x, y, h, PAL.wood);
  b.vline(x + w - 3, y, h, PAL.wood);
}

function door(b: Buf, x: number, y: number, w = 14, h = 20) {
  b.rect(x - 1, y - 1, w + 2, h + 1, PAL.woodDarker);
  b.rect(x, y, w, h, PAL.wood);
  for (let i = 2; i < w; i += 4) b.vline(x + i, y, h, PAL.woodDark);
  b.hline(x, y + 4, w, PAL.woodDark);
  b.hline(x, y + h - 5, w, PAL.woodDark);
  b.set(x + w - 3, y + h / 2, PAL.gold);
  // üst kemer
  b.hline(x + 2, y - 2, w - 4, PAL.woodDarker);
}

function windowSq(b: Buf, x: number, y: number, w = 12, h = 12, lit = false) {
  b.rect(x - 1, y - 1, w + 2, h + 2, PAL.woodDarker);
  b.rect(x, y, w, h, lit ? 0xf8d878 : 0x4a6a9a);
  if (!lit) {
    b.rect(x + 1, y + 1, 3, 2, 0x8ab0d8);
    b.set(x + 1, y + 3, 0x8ab0d8);
  }
  b.vline(x + Math.floor(w / 2), y, h, PAL.woodDark);
  b.hline(x, y + Math.floor(h / 2), w, PAL.woodDark);
  b.hline(x - 2, y + h + 1, w + 4, PAL.woodLight);
}

function windowRound(b: Buf, cx: number, cy: number, rad: number) {
  b.disc(cx, cy, rad + 1.5, PAL.woodDarker);
  b.disc(cx, cy, rad, 0x4a6a9a);
  b.set(cx - 2, cy - 2, 0x8ab0d8);
  b.set(cx - 1, cy - 3, 0x8ab0d8);
  b.set(cx - 3, cy - 1, 0x8ab0d8);
  b.vline(cx, cy - rad, rad * 2, PAL.woodDark);
  b.hline(cx - rad, cy, rad * 2, PAL.woodDark);
}

export function drawHouse(roof: number, seed: number, wall = 0xf0e0c0, variant = 0): Buf {
  const b = new Buf(72, 72);
  // baca
  b.rect(50, 4, 8, 16, PAL.stoneDark);
  b.rect(50, 4, 3, 16, PAL.stone);
  b.rect(49, 3, 10, 3, PAL.stoneDark);
  plasterWall(b, 6, 38, 60, 32, wall, seed, 1);
  shingleRoof(b, 0, 10, 44, 72, 30, roof, seed);
  door(b, 29, 49, 14, 21);
  windowSq(b, 12, 46, 11, 10);
  windowSq(b, 49, 46, 11, 10);
  if (variant === 1) {
    // çiçek saksısı
    b.rect(12, 59, 11, 3, PAL.wood);
    for (let i = 0; i < 5; i++) b.set(13 + i * 2, 58, [0xe05a6a, 0xf0d040, 0xffffff][i % 3]);
  }
  b.outline(PAL.outline);
  return b;
}

export function drawShopBuilding(): Buf {
  const w = 104;
  const h = 96;
  const b = new Buf(w, h);
  const roof = PAL.roofPurple;
  // yan kule
  b.rect(76, 22, 22, 56, 0xe8d4b0);
  shingleRoof(b, 72, 6, 8, 30, 22, shade(roof, 0.95), 9, 1);
  // baca (bakır)
  b.rect(18, 2, 9, 20, 0xb06a3a);
  b.rect(18, 2, 3, 20, 0xd08a4a);
  b.rect(17, 1, 11, 3, 0x8a4a2a);
  // ana duvar
  plasterWall(b, 6, 50, 80, 44, 0xf2e2c2, 21, 3);
  // kule duvarı
  plasterWall(b, 76, 36, 22, 58, 0xe8d4b0, 22, 1);
  windowRound(b, 87, 52, 5);
  // ana çatı
  shingleRoof(b, 0, 16, 52, 92, 36, roof, 7, 3);
  // çatı penceresi
  windowRound(b, 46, 34, 6);
  // kapı (kemerli)
  const dx = 37;
  const dy = 66;
  b.rect(dx - 2, dy - 2, 22, 28, PAL.woodDarker);
  b.disc(dx + 9, dy + 2, 11, PAL.woodDarker);
  b.disc(dx + 9, dy + 3, 9, PAL.wood);
  b.rect(dx, dy + 3, 18, 25, PAL.wood);
  for (let i = 2; i < 18; i += 4) b.vline(dx + i, dy - 4, 32, PAL.woodDark);
  b.hline(dx, dy + 10, 18, PAL.woodDark);
  b.hline(dx, dy + 20, 18, PAL.woodDark);
  b.set(dx + 14, dy + 15, PAL.gold);
  b.set(dx + 14, dy + 14, PAL.goldDark);
  // vitrin pencereleri
  windowSq(b, 12, 62, 16, 13, true);
  windowSq(b, 62, 62, 12, 13, true);
  // vitrin içi şişeler
  for (let i = 0; i < 4; i++) {
    const c = [0xe0465b, 0x48b9d8, 0x7a6fd8, 0xf2d43c][i];
    b.rect(13 + i * 4, 70, 2, 4, c);
    b.set(13 + i * 4, 69, PAL.cream);
  }
  // tabela kolu
  b.hline(86, 44, 12, PAL.woodDarker);
  b.hline(86, 45, 12, PAL.woodDark);
  b.vline(90, 46, 2, PAL.woodDarker);
  b.vline(96, 46, 2, PAL.woodDarker);
  b.rect(87, 48, 14, 14, PAL.woodDark);
  b.rect(88, 49, 12, 12, 0x5a3a7a);
  // tabelada şişe
  b.rect(93, 51, 2, 2, PAL.cream);
  b.rect(91, 53, 6, 6, 0x6ae0a0);
  b.rect(92, 54, 1, 2, 0xc8ffe0);
  // çatlak sıva yaması
  b.rect(8, 84, 8, 6, 0xb88a5a);
  b.hline(8, 86, 8, 0x9a6a44);
  // basamak
  b.rect(dx - 3, h - 3, 24, 3, PAL.stone);
  b.hline(dx - 3, h - 3, 24, PAL.stoneLight);
  b.outline(PAL.outline);
  return b;
}

export function drawStall(): Buf {
  const b = new Buf(52, 46);
  // direkler
  b.rect(4, 12, 3, 32, PAL.woodDark);
  b.rect(45, 12, 3, 32, PAL.woodDark);
  // tente
  for (let x = 0; x < 52; x++) {
    const stripe = Math.floor(x / 6) % 2 === 0 ? 0xd84a4a : 0xf4e4c4;
    for (let y = 2; y < 14; y++) b.set(x, y, y < 4 ? shade(stripe, 1.1) : stripe);
    const scallop = Math.floor(x / 6) % 2 === 0 ? 0xb83a3a : 0xd8c8a8;
    const sy = 14 + (Math.abs((x % 6) - 3) < 2 ? 2 : 1);
    for (let y = 14; y < sy; y++) b.set(x, y, scallop);
  }
  // tezgah
  b.rect(2, 30, 48, 14, PAL.wood);
  b.hline(2, 30, 48, PAL.woodLight);
  b.hline(2, 31, 48, PAL.woodLight);
  for (let x = 8; x < 50; x += 8) b.vline(x, 33, 11, PAL.woodDark);
  // tezgah üstü ürünler
  b.rect(8, 25, 7, 5, 0x8a6a3a); // sepet
  b.rect(9, 24, 5, 2, 0xe05a4a);
  b.rect(20, 23, 3, 7, 0x48b9d8);
  b.rect(24, 24, 3, 6, 0xf2d43c);
  b.rect(28, 22, 3, 8, 0x7a6fd8);
  b.set(21, 22, PAL.cream);
  b.set(25, 23, PAL.cream);
  b.set(29, 21, PAL.cream);
  b.rect(35, 24, 10, 6, 0xb8844a); // sandık
  b.hline(35, 26, 10, PAL.woodDark);
  b.outline(PAL.outline);
  return b;
}

export function drawWell(): Buf {
  const b = new Buf(28, 34);
  // çatı
  b.vline(4, 6, 18, PAL.woodDark);
  b.vline(23, 6, 18, PAL.woodDark);
  for (let y = 0; y < 8; y++) {
    const hw = 4 + y * 1.6;
    for (let x = Math.ceil(14 - hw); x < 14 + hw; x++) b.set(x, y + 1, y % 3 === 2 ? shade(PAL.roofOrange, 0.75) : PAL.roofOrange);
  }
  b.hline(6, 12, 16, PAL.woodDark);
  b.rect(13, 12, 2, 6, 0x8a7a6a);
  b.rect(12, 17, 4, 3, PAL.wood);
  // taş halka
  b.ellipse(14, 26, 12, 7, (x, y, nx, ny) => {
    if (nx * nx + ny * ny < 0.45 && ny < 0.2) return 0x2a3a5a;
    return (x + Math.floor(y / 3)) % 5 === 0 ? PAL.stoneDark : ny < 0 ? PAL.stoneLight : PAL.stone;
  });
  b.ellipse(14, 24, 7, 3, 0x2a3a5a);
  b.ellipse(13, 24, 4, 1.5, 0x3f6a9a);
  b.outline(PAL.outline);
  return b;
}

export function drawLamp(): Buf {
  const b = new Buf(12, 32);
  b.rect(5, 10, 2, 20, 0x4a4050);
  b.vline(5, 10, 20, 0x6a6070);
  b.rect(3, 29, 6, 3, 0x4a4050);
  b.rect(2, 2, 8, 9, 0x3a3040);
  b.rect(3, 3, 6, 6, 0xf8d878);
  b.rect(4, 4, 2, 2, 0xfff4c0);
  b.hline(1, 1, 10, 0x3a3040);
  b.rect(4, 0, 4, 1, 0x3a3040);
  b.outline(PAL.outline);
  return b;
}

export function drawSign(): Buf {
  const b = new Buf(22, 24);
  b.rect(10, 6, 3, 18, PAL.woodDark);
  b.vline(10, 6, 18, PAL.wood);
  // ok tabelası
  b.rect(2, 4, 16, 7, PAL.woodLight);
  for (let i = 0; i < 4; i++) b.vline(18 + i, 4 + i, 7 - i * 2, PAL.woodLight);
  b.hline(2, 4, 16, 0xe0a868);
  b.hline(4, 7, 10, PAL.woodDark);
  b.rect(1, 13, 14, 6, PAL.wood);
  for (let i = 0; i < 3; i++) b.vline(1 - i - 1 + 1, 13 + i, 6 - i * 2, PAL.wood);
  b.hline(4, 16, 8, PAL.woodDark);
  b.outline(PAL.outline);
  return b;
}

export function drawFence(): Buf {
  const b = new Buf(16, 14);
  b.rect(2, 2, 3, 12, PAL.woodLight);
  b.rect(11, 2, 3, 12, PAL.woodLight);
  b.vline(4, 2, 12, PAL.wood);
  b.vline(13, 2, 12, PAL.wood);
  b.rect(0, 5, 16, 2, PAL.wood);
  b.rect(0, 9, 16, 2, PAL.wood);
  b.hline(0, 5, 16, PAL.woodLight);
  b.outline(PAL.outline);
  return b;
}

export function drawBarrel(): Buf {
  const b = new Buf(14, 16);
  b.ellipse(7, 8, 6, 7.5, (x, y, nx) => (nx < -0.4 ? PAL.woodLight : nx > 0.5 ? PAL.woodDark : PAL.wood));
  b.hline(1, 4, 12, 0x5a5060);
  b.hline(1, 11, 12, 0x5a5060);
  b.ellipse(7, 2, 5, 1.5, PAL.woodDark);
  b.outline(PAL.outline);
  return b;
}

export function drawCrate(): Buf {
  const b = new Buf(14, 14);
  b.rect(1, 1, 12, 12, PAL.woodLight);
  b.rect(1, 1, 12, 2, 0xe0a868);
  b.line(2, 3, 11, 12, PAL.wood);
  b.line(2, 12, 11, 3, PAL.wood);
  b.rect(1, 1, 1, 12, PAL.wood);
  b.rect(12, 1, 1, 12, PAL.woodDark);
  b.outline(PAL.outline);
  return b;
}

export function drawFlowerPot(): Buf {
  const b = new Buf(12, 16);
  b.rect(3, 10, 6, 5, 0xc0603a);
  b.hline(2, 10, 8, 0xd8784a);
  for (const [x, y] of [
    [6, 3],
    [3, 5],
    [8, 5],
    [5, 7],
  ])
    b.disc(x, y, 2.2, PAL.leaf);
  b.set(6, 2, 0xf06a8a);
  b.set(3, 4, 0xf0d040);
  b.set(8, 4, 0xf06a8a);
  b.outline(PAL.outline);
  return b;
}

// ---------------- İç mekân ----------------

export function drawCounter(): Buf {
  const b = new Buf(64, 26);
  b.rect(0, 4, 64, 22, PAL.wood);
  b.rect(0, 0, 64, 6, PAL.woodLight);
  b.hline(0, 0, 64, 0xe0a868);
  b.hline(0, 6, 64, PAL.woodDark);
  for (let x = 8; x < 64; x += 14) {
    b.rect(x, 9, 10, 13, PAL.woodDark);
    b.rect(x + 1, 10, 8, 11, PAL.wood);
  }
  // tezgah üstü: terazi, zil
  b.rect(50, 0, 6, 3, PAL.gold);
  b.set(53, 0, PAL.goldDark);
  b.rect(8, 1, 10, 2, 0xb0b0c0);
  b.outline(PAL.outline);
  return b;
}

export function drawShelf(): Buf {
  const b = new Buf(40, 40);
  b.rect(0, 0, 40, 40, PAL.woodDark);
  b.rect(2, 2, 36, 36, PAL.woodDarker);
  const colors = [0xe0465b, 0x7a6fd8, 0xf08a2c, 0x48b9d8, 0xf2d43c, 0x6ae0a0, 0x8fa3b8];
  const r = rng(11);
  for (let s = 0; s < 3; s++) {
    const y = 4 + s * 12;
    b.rect(2, y + 9, 36, 2, PAL.wood);
    b.hline(2, y + 9, 36, PAL.woodLight);
    let x = 4;
    while (x < 34) {
      const c = colors[Math.floor(r() * colors.length)];
      const bh = 4 + Math.floor(r() * 4);
      if (r() < 0.2) {
        // kitap
        b.rect(x, y + 9 - 7, 2, 7, [0x8a3a3a, 0x3a5a8a, 0x5a7a3a][Math.floor(r() * 3)]);
        x += 3;
        continue;
      }
      b.rect(x, y + 9 - bh, 3, bh, c);
      b.set(x, y + 9 - bh, shade(c, 1.3));
      b.set(x + 1, y + 9 - bh - 1, PAL.cream);
      x += 4 + Math.floor(r() * 2);
    }
  }
  b.outline(PAL.outline);
  return b;
}

export function drawCauldron(frame: number): Buf {
  const b = new Buf(30, 30);
  // ateş
  const flame = [0xf8d040, 0xf08a2c, 0xe04a2a];
  for (let i = 0; i < 5; i++) {
    const fx = 8 + i * 3.5;
    const fh = 4 + ((i + frame) % 3);
    for (let y = 0; y < fh; y++) b.hline(Math.round(fx), 28 - y, 2, flame[Math.min(2, Math.floor((y / fh) * 3))]);
  }
  // odunlar
  b.rect(5, 27, 20, 3, PAL.woodDark);
  // kazan gövdesi
  b.ellipse(15, 17, 12, 10, (x, y, nx, ny) => litColor(nx, ny, 0x5a5468, 0x3a3448, 0x26202e, x, y));
  // ağız
  b.ellipse(15, 9, 12, 3.5, 0x26202e);
  b.ellipse(15, 9.5, 10, 2.5, 0x5ad09a);
  b.ellipse(13, 9, 5, 1, 0x9af0c4);
  // kabarcıklar
  const bub = [
    [10, 8],
    [18, 9],
    [14, 7],
  ];
  const [bx, by] = bub[frame % 3];
  b.set(bx, by - 2, 0x9af0c4);
  b.set(bx + 1, by - 3, 0xc8ffe0);
  // kulplar
  b.set(2, 12, 0x5a5468);
  b.set(2, 13, 0x5a5468);
  b.set(27, 12, 0x5a5468);
  b.set(27, 13, 0x5a5468);
  b.outline(PAL.outline);
  return b;
}

export function drawBed(): Buf {
  const b = new Buf(26, 38);
  b.rect(0, 0, 26, 38, PAL.woodDark);
  b.rect(2, 4, 22, 32, 0x6a4a8a);
  b.rect(2, 4, 22, 9, PAL.cream);
  b.rect(4, 5, 18, 6, PAL.white);
  // yorgan deseni
  for (let y = 15; y < 36; y += 4) for (let x = 3; x < 24; x += 4) b.rect(x, y, 2, 2, 0x8a6aaa);
  b.hline(2, 13, 22, 0x4a3a6a);
  b.rect(0, 0, 26, 3, PAL.woodLight);
  b.outline(PAL.outline);
  return b;
}

export function drawLectern(): Buf {
  const b = new Buf(20, 28);
  b.rect(8, 12, 4, 13, PAL.woodDark);
  b.rect(4, 24, 12, 3, PAL.woodDark);
  b.rect(1, 6, 18, 7, PAL.wood);
  // açık kitap
  b.rect(2, 2, 16, 7, PAL.parchment);
  b.vline(10, 2, 7, PAL.parchmentDark);
  for (let y = 3; y < 8; y += 2) {
    b.hline(3, y, 5, 0xa08060);
    b.hline(12, y, 5, 0xa08060);
  }
  b.rect(9, 0, 2, 3, 0xc04040); // ayraç
  b.outline(PAL.outline);
  return b;
}

export function drawRug(): Buf {
  const b = new Buf(56, 32);
  b.rect(0, 0, 56, 32, 0x8a3a4a);
  b.rect(2, 2, 52, 28, 0xb84a5a);
  b.rect(5, 5, 46, 22, 0x8a3a4a);
  for (let i = 0; i < 4; i++) b.disc(14 + i * 9, 16, 3, i % 2 ? PAL.gold : 0xf4e4c4);
  for (let x = 0; x < 56; x += 3) {
    b.set(x, -0, 0xf4e4c4);
    b.set(x, 31, 0xf4e4c4);
  }
  return b;
}

// ---------------- Malzeme düğümleri / ikonlar (16x16) ----------------

export function drawIngredient(id: string): Buf {
  const b = new Buf(16, 16);
  const stem = (x: number, y0: number, y1: number) => b.vline(x, y0, y1 - y0, PAL.leafDark);
  switch (id) {
    case 'sifa_otu': {
      for (const [x, y, rx, ry] of [
        [5, 9, 3.5, 2],
        [11, 9, 3.5, 2],
        [8, 6, 2.5, 4],
        [4, 12, 3, 1.8],
        [12, 12, 3, 1.8],
      ] as number[][])
        b.ellipse(x, y, rx, ry, (px, py, nx, ny) => (ny < -0.2 ? 0x8fd070 : nx > 0.4 ? 0x3f8a4a : 0x5fb060));
      b.vline(8, 4, 10, 0xc04a5a);
      b.set(5, 9, 0xc04a5a);
      b.set(11, 9, 0xc04a5a);
      break;
    }
    case 'papatya': {
      stem(5, 8, 15);
      stem(11, 6, 15);
      b.set(6, 12, PAL.leaf);
      b.set(10, 11, PAL.leaf);
      for (const [cx, cy] of [
        [5, 7],
        [11, 5],
      ]) {
        for (const [dx, dy] of [
          [0, -2],
          [2, 0],
          [0, 2],
          [-2, 0],
          [1, -1],
          [1, 1],
          [-1, 1],
          [-1, -1],
        ])
          b.set(cx + dx, cy + dy, PAL.white);
        b.set(cx, cy, 0xf0c030);
      }
      break;
    }
    case 'ciy': {
      b.line(4, 15, 7, 6, PAL.leaf);
      b.line(8, 15, 9, 3, PAL.leafLight);
      b.line(12, 15, 11, 7, PAL.leaf);
      for (const [x, y] of [
        [7, 5],
        [10, 3],
        [11, 8],
      ]) {
        b.disc(x, y + 0.5, 1.6, 0x8ad8ff);
        b.set(x - 1 + 1, y, 0xe8fbff);
      }
      break;
    }
    case 'ay_cicegi': {
      stem(8, 9, 15);
      b.set(7, 12, PAL.leaf);
      b.set(9, 13, PAL.leaf);
      b.disc(8, 6, 4.2, (x, y, nx, ny) => (nx * nx + ny * ny < 0.25 ? 0xe8f4ff : ny < 0 ? 0xa8d4ff : 0x6aa4e8));
      b.set(8, 6, 0xfff8c0);
      break;
    }
    case 'mantar': {
      b.rect(4, 9, 3, 5, PAL.cream);
      b.rect(10, 8, 3, 6, PAL.cream);
      b.ellipse(5.5, 8, 4, 3, (x, y, nx, ny) => (ny < -0.3 ? 0xe86a5a : 0xc04a3a));
      b.ellipse(11.5, 7, 4.5, 3.5, (x, y, nx, ny) => (ny < -0.3 ? 0xe86a5a : 0xc04a3a));
      b.set(4, 7, PAL.white);
      b.set(12, 5, PAL.white);
      b.set(10, 7, PAL.white);
      break;
    }
    case 'recine': {
      b.rect(3, 8, 10, 7, PAL.wood);
      b.rect(3, 8, 3, 7, PAL.woodLight);
      b.ellipse(8, 8, 5, 1.6, 0xd8a468);
      b.disc(9, 5, 2.6, (x, y, nx, ny) => (nx < -0.2 && ny < 0 ? 0xffe090 : 0xf0a020));
      b.set(9, 2, 0xf0a020);
      b.disc(5, 12, 1.4, 0xf0a020);
      break;
    }
    case 'atesbocegi': {
      for (const [x, y] of [
        [4, 5],
        [11, 3],
        [8, 9],
        [12, 11],
        [3, 12],
      ]) {
        b.set(x, y, 0xfff6a8);
        b.set(x + 1, y, 0xf2d43c);
        b.set(x, y + 1, 0xf2d43c);
        b.set(x - 1, y, 0xc8a020);
        b.set(x, y - 1, 0xc8a020);
      }
      break;
    }
    case 'yosun': {
      b.ellipse(8, 10, 7, 5, (x, y, nx, ny) => litColor(nx, ny, PAL.stoneLight, PAL.stone, PAL.stoneDark, x, y));
      b.ellipse(7, 7, 6, 2.5, (x, y) => ((x + y) % 3 === 0 ? 0x2a5a3a : 0x3f7a4a));
      b.set(4, 9, 0x3f7a4a);
      b.set(10, 9, 0x2a5a3a);
      b.set(6, 6, 0x6aa070);
      break;
    }
  }
  b.outline(PAL.outline);
  return b;
}

const BOTTLE = [
  '................',
  '......OOOO......',
  '.....OkkkkO.....',
  '.....OKkkkO.....',
  '......OggO......',
  '......OgGO......',
  '.....OgggGO.....',
  '....OgLLLLgO....',
  '...OLlLLLLLLO...',
  '..OLlLLLLLLLLO..',
  '..OLllLLLLLLLO..',
  '..OLlLLLLLLdLO..',
  '..OLLLLLLLLdLO..',
  '...OLLLLLLddO...',
  '....OOOOOOOO....',
  '................',
];

export function drawPotion(liquid: number): Buf {
  const b = new Buf(16, 16);
  b.grid(0, 0, BOTTLE, {
    O: PAL.outline,
    k: 0xb8844a,
    K: 0xd8a468,
    g: 0xd8e8f0,
    G: 0x98b0c0,
    L: liquid,
    l: mix(liquid, 0xffffff, 0.55),
    d: shade(liquid, 0.7),
  });
  return b;
}

export function drawUnknownBottle(): Buf {
  const b = drawPotion(0x5a5468);
  b.map((c) => (c === PAL.outline ? c : shade(c, 0.6)));
  return b;
}

export function drawTool(id: string): Buf {
  const b = new Buf(16, 16);
  if (id === 'orak') {
    b.line(4, 14, 7, 9, PAL.woodDark);
    b.line(5, 14, 8, 9, PAL.wood);
    for (let a = 0; a < 18; a++) {
      const t = (a / 17) * Math.PI * 1.1 - 0.3;
      const x = 8 + Math.cos(t + Math.PI) * -5;
      const y = 6 - Math.sin(t) * 5;
      b.set(x, y, a < 4 ? 0x9a9aa8 : 0xd8d8e0);
    }
  } else if (id === 'fener') {
    b.rect(5, 1, 6, 2, 0x3a3040);
    b.rect(4, 3, 8, 10, 0x3a3040);
    b.rect(5, 4, 6, 8, 0xf8d878);
    b.rect(6, 5, 2, 3, 0xfff4c0);
    b.rect(3, 13, 10, 2, 0x3a3040);
  } else if (id === 'kazan') {
    b.ellipse(8, 9, 6.5, 5.5, (x, y, nx, ny) => litColor(nx, ny, 0xe0905a, 0xb06a3a, 0x7a4a2a, x, y));
    b.ellipse(8, 5, 6.5, 1.6, 0x4a2a1c);
    b.ellipse(8, 5.3, 5, 1, 0x5ad09a);
  }
  b.outline(PAL.outline);
  return b;
}

export function drawCoin(): Buf {
  const b = new Buf(10, 10);
  b.disc(5, 5, 4.5, (x, y, nx, ny) => (nx + ny < -0.6 ? 0xffe890 : nx + ny > 0.7 ? PAL.goldDark : PAL.gold));
  b.vline(5, 3, 4, PAL.goldDark);
  b.outline(PAL.outline);
  return b;
}

export function drawStar(on: boolean): Buf {
  const rows = ['...O...', '..OYO..', 'OOOYOOO', 'OYYYYYO', '.OYYYO.', 'OYYOYYO', 'OO...OO'];
  const b = new Buf(7, 7);
  b.grid(0, 0, rows, { O: PAL.outline, Y: on ? PAL.gold : 0x6a6070 });
  return b;
}

export function drawHeart(on = true): Buf {
  const rows = ['.OO.OO.', 'OrrOrrO', 'OrRrrrO', 'OrrrrrO', '.OrrrO.', '..OrO..', '...O...'];
  const b = new Buf(7, 7);
  b.grid(0, 0, rows, { O: PAL.outline, r: on ? 0xe04a5a : 0xb8a898, R: on ? 0xff9aa8 : 0xd8ccc0 });
  return b;
}

export function drawBookIcon(): Buf {
  const b = new Buf(18, 16);
  b.rect(1, 2, 16, 13, 0x7a3a2a);
  b.rect(2, 3, 14, 11, 0x9a4a32);
  b.rect(3, 3, 13, 10, PAL.parchment);
  b.rect(1, 2, 2, 13, 0x5a2a1e);
  b.hline(5, 6, 8, 0xa08060);
  b.hline(5, 8, 8, 0xa08060);
  b.hline(5, 10, 6, 0xa08060);
  b.rect(12, 0, 2, 5, 0xc04040);
  b.outline(PAL.outline);
  return b;
}

export function drawBagIcon(): Buf {
  const b = new Buf(18, 16);
  b.ellipse(9, 10, 7.5, 5.5, (x, y, nx, ny) => litColor(nx, ny, 0xd8a468, 0xb07a44, 0x7a5030, x, y));
  b.rect(4, 3, 10, 4, 0xb07a44);
  b.hline(4, 3, 10, 0xd8a468);
  b.rect(7, 6, 4, 3, PAL.gold);
  b.set(8, 7, PAL.goldDark);
  b.outline(PAL.outline);
  return b;
}

export function drawSun(): Buf {
  const b = new Buf(12, 12);
  b.disc(6, 6, 3.6, 0xf8c840);
  for (const [x, y] of [
    [6, 0],
    [6, 11],
    [0, 6],
    [11, 6],
    [2, 2],
    [9, 2],
    [2, 9],
    [9, 9],
  ])
    b.set(x, y, 0xf8c840);
  b.set(5, 5, 0xfff0a0);
  return b;
}

export function drawMoon(): Buf {
  const b = new Buf(12, 12);
  b.disc(6, 6, 4.6, 0xe8e4c8);
  // hilal: sağ üstü kes
  for (let y = 0; y < 12; y++)
    for (let x = 0; x < 12; x++) {
      const dx = x + 0.5 - 8.3;
      const dy = y + 0.5 - 4.3;
      if (dx * dx + dy * dy < 13) b.clear(x, y);
    }
  b.outline(0x3a3458);
  return b;
}

export function drawBell(): Buf {
  const b = new Buf(12, 12);
  b.ellipse(6, 6, 4, 4.5, (x, y, nx) => (nx < -0.3 ? 0xffe890 : PAL.gold));
  b.rect(2, 8, 8, 2, PAL.gold);
  b.set(6, 11, PAL.goldDark);
  b.outline(PAL.outline);
  return b;
}
