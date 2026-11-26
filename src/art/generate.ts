import Phaser from 'phaser';
import { Buf, PAL } from './pixel';
import { drawCat, drawCharacterSheet, drawPortrait, CHAR_W, CHAR_H } from './chars';
import * as O from './objects';
import { paintInterior, paintTerrain, waterRects } from './ground';
import { INGREDIENT_LIST, POTION_LIST } from '../data/items';
import { MERCHANT, PLAYER_LOOK, VILLAGERS, type CharLook } from '../data/npcs';
import { MAPS } from '../data/maps';

export const MAP_BLOCKERS: Record<string, [number, number, number, number][]> = {};

function add(scene: Phaser.Scene, key: string, b: Buf) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, b.toCanvas());
}

function addSheet(scene: Phaser.Scene, key: string, b: Buf, fw: number, fh: number) {
  const tex = scene.textures.addCanvas(key, b.toCanvas())!;
  const n = Math.floor(b.w / fw);
  for (let i = 0; i < n; i++) tex.add(i, 0, i * fw, 0, fw, fh);
}

function addCharacter(scene: Phaser.Scene, key: string, look: CharLook) {
  addSheet(scene, key, drawCharacterSheet(look), CHAR_W, CHAR_H);
  add(scene, `${key}_portrait`, drawPortrait(look));
  const a = scene.anims;
  a.create({ key: `${key}_down`, frames: a.generateFrameNumbers(key, { frames: [1, 0, 2, 0] }), frameRate: 8, repeat: -1 });
  a.create({ key: `${key}_up`, frames: a.generateFrameNumbers(key, { frames: [4, 3, 5, 3] }), frameRate: 8, repeat: -1 });
  a.create({ key: `${key}_side`, frames: a.generateFrameNumbers(key, { frames: [7, 6, 8, 6] }), frameRate: 8, repeat: -1 });
}

function uiPanel(fill: number, border: number, light: number, size = 24): Buf {
  const b = new Buf(size, size);
  b.rect(1, 1, size - 2, size - 2, fill);
  // kenarlar
  b.hline(2, 0, size - 4, border);
  b.hline(2, size - 1, size - 4, border);
  b.vline(0, 2, size - 4, border);
  b.vline(size - 1, 2, size - 4, border);
  b.set(1, 1, border);
  b.set(size - 2, 1, border);
  b.set(1, size - 2, border);
  b.set(size - 2, size - 2, border);
  // iç ışık çizgisi
  b.hline(2, 2, size - 4, light);
  b.hline(2, size - 4, size - 4, PAL.parchmentDark === fill ? border : mixDark(fill));
  b.hline(2, size - 3, size - 4, mixDark(fill));
  return b;
}

function mixDark(c: number) {
  const r = ((c >> 16) & 255) * 0.82;
  const g = ((c >> 8) & 255) * 0.82;
  const b = (c & 255) * 0.82;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}

function glowTexture(scene: Phaser.Scene, key: string, size: number) {
  const cv = document.createElement('canvas');
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  scene.textures.addCanvas(key, cv);
}

export function generateAll(scene: Phaser.Scene) {
  // Karakterler
  addCharacter(scene, 'player', PLAYER_LOOK);
  for (const v of VILLAGERS) addCharacter(scene, `npc_${v.id}`, v.look);
  addCharacter(scene, 'npc_nermin', MERCHANT.look);
  const dede: CharLook = { skin: 0xe8b890, hair: 0xe8e8f0, shirt: 0x5a4a8a, pants: 0x3a3048, accent: 0xd8b060, hairStyle: 'bald' };
  add(scene, 'dede_portrait', drawPortrait(dede));
  addSheet(scene, 'cat', drawCat(), 14, 10);
  scene.anims.create({ key: 'cat_idle', frames: scene.anims.generateFrameNumbers('cat', { frames: [0, 0, 0, 1, 0, 1] }), frameRate: 2, repeat: -1 });

  // Gölge
  const sh = new Buf(14, 5);
  sh.ellipse(7, 2.5, 7, 2.5, 0x000000);
  add(scene, 'shadow', sh);

  // Ağaçlar & doğa
  add(scene, 'pine', O.drawPine(1));
  add(scene, 'pine2', O.drawPine(5, { l: 0x5aaa72, m: 0x3a8a62, d: 0x24604a }));
  add(scene, 'oak', O.drawOak(2));
  add(scene, 'oak2', O.drawOak(8, { l: 0x8ac458, m: 0x5c9e44, d: 0x3a7032 }));
  add(scene, 'fpine', O.drawPine(13, { l: 0x3f8a64, m: 0x2a6a50, d: 0x1a4a3c }));
  add(scene, 'fpine2', O.drawPine(17, { l: 0x4a7a5a, m: 0x305e48, d: 0x1e4236 }));
  add(scene, 'foak', O.drawOak(19, { l: 0x5a9a4a, m: 0x3a7a40, d: 0x245a30 }));
  add(scene, 'bush', O.drawBush(3));
  add(scene, 'bush_berry', O.drawBush(4, true));
  add(scene, 'rock', O.drawRock());
  add(scene, 'rock_big', O.drawRock(true));
  add(scene, 'rock_moss', O.drawRock(true, true));
  add(scene, 'stump', O.drawStump());
  add(scene, 'log', O.drawLog());

  // Binalar & eşyalar
  add(scene, 'shop', O.drawShopBuilding());
  add(scene, 'house_orange', O.drawHouse(PAL.roofOrange, 31, 0xf0e0c0, 1));
  add(scene, 'house_blue', O.drawHouse(0x4a7ab8, 41, 0xe8dcc8, 0));
  add(scene, 'stall', O.drawStall());
  add(scene, 'well', O.drawWell());
  add(scene, 'lamp', O.drawLamp());
  add(scene, 'sign', O.drawSign());
  add(scene, 'fence', O.drawFence());
  add(scene, 'barrel', O.drawBarrel());
  add(scene, 'crate', O.drawCrate());
  add(scene, 'pot', O.drawFlowerPot());
  add(scene, 'counter', O.drawCounter());
  add(scene, 'shelf', O.drawShelf());
  add(scene, 'bed', O.drawBed());
  add(scene, 'lectern', O.drawLectern());
  add(scene, 'rug', O.drawRug());
  const cauldron = new Buf(90, 30);
  for (let i = 0; i < 3; i++) cauldron.blit(O.drawCauldron(i), i * 30, 0);
  addSheet(scene, 'cauldron', cauldron, 30, 30);
  scene.anims.create({ key: 'cauldron_bubble', frames: scene.anims.generateFrameNumbers('cauldron', { frames: [0, 1, 2] }), frameRate: 5, repeat: -1 });

  // İkonlar
  for (const ing of INGREDIENT_LIST) add(scene, `ing_${ing.id}`, O.drawIngredient(ing.id));
  for (const p of POTION_LIST) add(scene, `pot_${p.id}`, O.drawPotion(p.color));
  add(scene, 'pot_unknown', O.drawUnknownBottle());
  for (const t of ['orak', 'fener', 'kazan']) add(scene, `tool_${t}`, O.drawTool(t));
  add(scene, 'coin', O.drawCoin());
  add(scene, 'star_on', O.drawStar(true));
  add(scene, 'star_off', O.drawStar(false));
  add(scene, 'heart', O.drawHeart());
  add(scene, 'icon_book', O.drawBookIcon());
  add(scene, 'icon_bag', O.drawBagIcon());
  add(scene, 'icon_sun', O.drawSun());
  add(scene, 'icon_moon', O.drawMoon());
  add(scene, 'icon_bell', O.drawBell());

  // Arayüz
  add(scene, 'panel', uiPanel(PAL.parchment, PAL.outline, 0xfff0c8));
  add(scene, 'panel_dark', uiPanel(0x3a2a44, 0x150e1a, 0x5a4a6a));
  add(scene, 'btn', uiPanel(0xc0844a, PAL.outline, 0xe8b070));
  add(scene, 'btn_down', uiPanel(0x9a6038, PAL.outline, 0xb87848));
  add(scene, 'btn_green', uiPanel(0x5a9a4a, PAL.outline, 0x8ac870));
  add(scene, 'btn_gray', uiPanel(0x8a8090, PAL.outline, 0xa8a0b0));
  add(scene, 'slot', uiPanel(0xd8c08a, 0x8a6a44, 0xeedcb0, 22));
  glowTexture(scene, 'glow', 64);
  const dot = new Buf(2, 2);
  dot.rect(0, 0, 2, 2, 0xffffff);
  add(scene, 'px', dot);
  const sparkle = new Buf(5, 5);
  sparkle.vline(2, 0, 5, 0xffffff);
  sparkle.hline(0, 2, 5, 0xffffff);
  add(scene, 'sparkle', sparkle);

  // Harita zeminleri
  for (const m of Object.values(MAPS)) {
    if (m.indoor) {
      add(scene, `ground_${m.id}`, paintInterior(m.w, m.h, 46));
      MAP_BLOCKERS[m.id] = [];
    } else if (m.terrain) {
      const res = paintTerrain(m.w, m.h, m.terrain);
      add(scene, `ground_${m.id}`, res.buf);
      MAP_BLOCKERS[m.id] = waterRects(res.water, m.w, m.h);
    }
  }
}
