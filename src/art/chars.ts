import { Buf, PAL, mix, shade } from './pixel';
import type { CharLook } from '../data/npcs';

export const CHAR_W = 16;
export const CHAR_H = 24;

const DOWN_TOP = [
  '................',
  '....OOOOOOOO....',
  '...OHHHHHHHHO...',
  '..OHHHHHHHHHHO..',
  '..OHHHHHHHHHHO..',
  '..OHHHHhhHHHHO..',
  '..OHhSSSSSShHO..',
  '..OHSSSSSSSSHO..',
  '..OhSESSSSEShO..',
  '..OhSESSSSEShO..',
  '..OOSRSSSSRSOO..',
  '...OOSSSSSSOO...',
  '...OAAAAAAAAO...',
  '..OCAAAAAAAACO..',
  '..OCCCCACCCCCO..',
  '..OCcCCACCCCcO..',
  '..OScCCCCCCcSO..',
  '..OOOCCCCCCOOO..',
];

const UP_TOP = [
  '................',
  '....OOOOOOOO....',
  '...OHHHHHHHHO...',
  '..OHHHHHHHHHHO..',
  '..OHHHHHHHHHHO..',
  '..OHHHHHHHHHHO..',
  '..OHHHHHHHHHHO..',
  '..OHhHHHHHHhHO..',
  '..OhHHHHHHHHhO..',
  '..OhhHHHHHHhhO..',
  '..OOhhhhhhhhOO..',
  '...OOSSSSSSOO...',
  '...OAAAAAAAAO...',
  '..OCAAAAAAAACO..',
  '..OCCCCCACCCCO..',
  '..OCcCCCACCCcO..',
  '..OScCCCCCCcSO..',
  '..OOOCCCCCCOOO..',
];

const SIDE_TOP = [
  '................',
  '.....OOOOOO.....',
  '....OHHHHHHO....',
  '...OHHHHHHHHO...',
  '..OHHHHHHHHHHO..',
  '..OHHHHHHHHHHO..',
  '..OHHHHHHSSSSO..',
  '..OHHHhHSSSSSO..',
  '..OHHHhSSSSESO..',
  '..OhHHhSSSSESO..',
  '..OOhhSSSSRSSO..',
  '...OOOSSSSSOO...',
  '....OAAAAAAO....',
  '...OAAAACCCO....',
  '...OAOCCCCCO....',
  '....OCCSSCCO....',
  '....OCcSScCO....',
  '....OOCCCCOO....',
];

const LEGS_FRONT = [
  ['....OPPPPPPO....', '....OPPOOPPO....', '....OPPOOPPO....', '....OBBOOBBO....', '....OOO..OOO....', '................'],
  ['....OPPPPPPO....', '....OPPOOPPO....', '....OBBOOPPO....', '....OOOOOBBO....', '.........OOO....', '................'],
  ['....OPPPPPPO....', '....OPPOOPPO....', '....OPPOOBBO....', '....OBBOOOOO....', '....OOO.........', '................'],
];

const LEGS_SIDE = [
  ['....OPPPPPPO....', '.....OPPPPO.....', '.....OPPPPO.....', '.....OBBBBO.....', '.....OOOOOO.....', '................'],
  ['....OPPPPPPO....', '....OPPOOPPO....', '...OPPO..OPPO...', '...OBBO..OBBO...', '...OOO....OOO...', '................'],
  ['....OPPPPPPO....', '.....OPPPPO.....', '.....OPPBBO.....', '.....OBBOOO.....', '.....OOO........', '................'],
];

function palette(look: CharLook): Record<string, number> {
  return {
    O: PAL.outline,
    H: look.hair,
    h: shade(look.hair, 0.72),
    S: look.skin,
    s: shade(look.skin, 0.85),
    E: 0x2a1d2e,
    R: mix(look.skin, 0xe0607a, 0.45),
    A: look.accent,
    C: look.shirt,
    c: shade(look.shirt, 0.75),
    P: look.pants,
    p: shade(look.pants, 0.8),
    B: 0x4a2e22,
  };
}

function applyHair(b: Buf, ox: number, look: CharLook, dir: 'down' | 'up' | 'side') {
  const p = palette(look);
  const at = (x: number, y: number) => b.get(ox + x, y);
  const put = (x: number, y: number, c: number) => b.set(ox + x, y, c);
  switch (look.hairStyle) {
    case 'long': {
      if (dir === 'down') {
        for (let y = 10; y <= 15; y++) {
          put(2, y, p.H);
          put(13, y, p.H);
          put(1, y, PAL.outline);
          put(14, y, PAL.outline);
        }
        put(2, 16, PAL.outline);
        put(13, 16, PAL.outline);
      } else if (dir === 'up') {
        for (let y = 10; y <= 15; y++) for (let x = 3; x <= 12; x++) put(x, y, y === 15 ? p.h : p.H);
        for (let y = 10; y <= 15; y++) {
          put(2, y, PAL.outline);
          put(13, y, PAL.outline);
        }
        for (let x = 3; x <= 12; x++) put(x, 16, PAL.outline);
      } else {
        for (let y = 10; y <= 15; y++) {
          put(3, y, p.H);
          put(4, y, y > 12 ? p.h : p.H);
          put(2, y, PAL.outline);
        }
        put(3, 16, PAL.outline);
        put(4, 16, PAL.outline);
      }
      break;
    }
    case 'bun': {
      const bx = dir === 'side' ? 3 : 6;
      for (let x = bx; x < bx + 4; x++) {
        put(x, 0, PAL.outline);
        put(x, 1, p.H);
      }
      put(bx - 1, 1, PAL.outline);
      put(bx + 4, 1, PAL.outline);
      put(bx + 1, 1, shade(p.H, 1.15));
      break;
    }
    case 'bald': {
      for (let y = 0; y < 6; y++)
        for (let x = 0; x < 16; x++) {
          const c = at(x, y);
          if (c === p.H) put(x, y, p.S);
          if (c === p.h) put(x, y, p.s);
        }
      put(dir === 'side' ? 8 : 6, 3, shade(p.S, 1.12));
      break;
    }
    case 'cap': {
      const cap = p.A;
      for (let y = 0; y < 6; y++)
        for (let x = 0; x < 16; x++) {
          const c = at(x, y);
          if (c === p.H || c === p.h) put(x, y, y === 5 ? shade(cap, 0.7) : cap);
        }
      if (dir === 'side') {
        put(13, 5, shade(cap, 0.7));
        put(14, 5, PAL.outline);
        put(13, 4, PAL.outline);
      }
      break;
    }
    default:
      break;
  }
}

/** 9 kareli karakter şeridi: aşağı(3), yukarı(3), yan(3) */
export function drawCharacterSheet(look: CharLook): Buf {
  const b = new Buf(CHAR_W * 9, CHAR_H);
  const p = palette(look);
  const parts: { top: string[]; legs: string[][]; dir: 'down' | 'up' | 'side' }[] = [
    { top: DOWN_TOP, legs: LEGS_FRONT, dir: 'down' },
    { top: UP_TOP, legs: LEGS_FRONT, dir: 'up' },
    { top: SIDE_TOP, legs: LEGS_SIDE, dir: 'side' },
  ];
  parts.forEach((part, d) => {
    for (let f = 0; f < 3; f++) {
      const ox = (d * 3 + f) * CHAR_W;
      const bob = f === 0 ? 0 : 1;
      // bacaklar
      b.grid(ox, 18, part.legs[f], p);
      // gövde + kafa (yürürken 1px aşağı sallanır)
      const tmp = new Buf(CHAR_W, CHAR_H);
      tmp.grid(0, 0, part.top, p);
      applyHair(tmp, 0, look, part.dir);
      for (let y = 0; y < 18; y++)
        for (let x = 0; x < CHAR_W; x++) {
          const c = tmp.get(x, y);
          if (c !== -1 && y + bob < 19) b.set(ox + x, y + bob, c);
        }
    }
  });
  return b;
}

/** Konuşma kutusu için büyük portre (yalnızca kafa, 2x) */
export function drawPortrait(look: CharLook): Buf {
  const sheet = drawCharacterSheet(look);
  const b = new Buf(32, 32);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const c = sheet.get(x, y + 1);
      if (c === -1) continue;
      b.rect(x * 2, y * 2, 2, 2, c);
    }
  return b;
}

/** Dedenin kedisi Tarçın: 2 kare (oturma, kuyruk sallama) */
export function drawCat(): Buf {
  const rows0 = [
    '..............',
    '.O.O..........',
    'OoOoO.........',
    'OoooO.........',
    'OeoeO..OOO....',
    'OoooOOOoooO...',
    '.OOooooooooO..',
    '..OoowwoooooOO',
    '..OoowwooooOoO',
    '..OOOOOOOOOO.O',
  ];
  const rows1 = rows0.slice();
  rows1[7] = '..OoowwooooO.O';
  rows1[8] = '..OoowwooooOOo';
  rows1[9] = '..OOOOOOOOOOOO';
  const pal = { O: PAL.outline, o: 0xe0904a, w: 0xfff0d8, e: 0x2a1d2e };
  const b = new Buf(28, 10);
  b.grid(0, 0, rows0, pal);
  b.grid(14, 0, rows1, pal);
  return b;
}
