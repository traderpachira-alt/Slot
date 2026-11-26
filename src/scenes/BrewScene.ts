import Phaser from 'phaser';
import { GameState } from '../state/GameState';
import {
  INGREDIENT_LIST,
  INGREDIENTS,
  POTION_LIST,
  POTIONS,
  ZONE_RADIUS,
  qualityFromDistance,
  type IngredientId,
  type PotionId,
} from '../data/items';
import { Modal, button, openModal, stars, txt, W, INK, INK_SOFT, type Button } from '../ui/widgets';
import { sfx } from '../ui/sound';

const MAX_ING = 4;
const MAX_HEAT = 2;
const BOARD_R = 112;
const CX = W / 2;
const CY = 190;

/** Kazan: malzemeler tahtadaki imleci iter; imleç bir iksir bölgesine düşerse şişelenir. */
export class BrewScene extends Modal {
  private pos = new Phaser.Math.Vector2();
  private trail: Phaser.Math.Vector2[] = [];
  private added: IngredientId[] = [];
  private heat = 0;
  private water = false;
  private gfx!: Phaser.GameObjects.Graphics;
  private marker!: Phaser.GameObjects.Container;
  private result!: Phaser.GameObjects.Text;
  private resultStars!: Phaser.GameObjects.Container;
  private addedRow!: Phaser.GameObjects.Container;
  private tray!: Phaser.GameObjects.Container;
  private bottleBtn!: Button;
  private heatBtn!: Button;
  private waterBtn!: Button;
  private zoneIcons!: Phaser.GameObjects.Container;

  constructor() {
    super('Brew');
  }

  create() {
    const box = this.openBase('Kazan', 600, 344);
    this.pos.set(0, 0);
    this.trail = [new Phaser.Math.Vector2(0, 0)];
    this.added = [];
    this.heat = 0;
    this.water = false;

    // Tahta
    this.gfx = this.add.graphics();
    this.zoneIcons = this.add.container(0, 0);
    this.root.add([this.gfx, this.zoneIcons]);
    const lab = (x: number, y: number, s: string) =>
      this.root.add(txt(this, x, y, s, 11, INK_SOFT, { fontStyle: '600' }).setOrigin(0.5));
    lab(CX, CY - BOARD_R - 10, 'Canlandırıcı');
    lab(CX, CY + BOARD_R + 10, 'Yatıştırıcı');
    lab(CX + BOARD_R - 8, CY - 8, 'Sıcak');
    lab(CX - BOARD_R + 10, CY - 8, 'Soğuk');

    this.marker = this.add.container(CX, CY);
    const mg = this.add.graphics();
    mg.fillStyle(0x2a1d2e).fillCircle(0, 1, 8);
    mg.fillStyle(0x5ad09a).fillCircle(0, 0, 6);
    mg.fillStyle(0xc8ffe0).fillCircle(-2, -2, 2);
    this.marker.add(mg);
    this.root.add(this.marker);
    this.tweens.add({ targets: this.marker, scale: 1.15, yoyo: true, repeat: -1, duration: 500 });

    // Sonuç satırı
    this.result = txt(this, CX, 336, '', 14, INK, { align: 'center', wordWrap: { width: 300 } }).setOrigin(0.5);
    this.resultStars = this.add.container(0, 0);
    this.root.add([this.result, this.resultStars]);

    // Eklenenler
    this.addedRow = this.add.container(0, 0);
    this.root.add(this.addedRow);

    // Malzeme tepsisi
    this.root.add(txt(this, box.x + 16, 386, 'Malzemelerin (dokun → kazana at)', 11, INK_SOFT));
    this.tray = this.add.container(0, 0);
    this.root.add(this.tray);

    // Düğmeler
    const by = 548;
    this.heatBtn = button(this, CX - 108, by, 96, 34, 'Ateş +', () => this.addHeat());
    this.waterBtn = button(this, CX, by, 96, 34, 'Su ekle', () => this.addWater());
    const resetBtn = button(this, CX + 108, by, 96, 34, 'Boşalt', () => this.reset());
    this.bottleBtn = button(this, CX + 56, by + 44, 150, 38, 'Şişele', () => void this.bottle(), 'btn_green', 16);
    this.root.add([this.heatBtn, this.waterBtn, resetBtn, this.bottleBtn]);
    const closeB = button(this, CX - 84, by + 44, 120, 38, 'Kapat', () => {
      this.refundAll();
      this.close();
    });
    this.root.add(closeB);

    this.redraw();
  }

  private toScreen(v: Phaser.Math.Vector2 | [number, number]) {
    const x = Array.isArray(v) ? v[0] : v.x;
    const y = Array.isArray(v) ? v[1] : v.y;
    return { x: CX + x * BOARD_R, y: CY - y * BOARD_R };
  }

  private redraw() {
    const g = this.gfx;
    g.clear();
    // zemin
    g.fillStyle(0x2a1d2e).fillCircle(CX, CY + 2, BOARD_R + 4);
    g.fillStyle(0xf8ecd0).fillCircle(CX, CY, BOARD_R + 2);
    g.fillStyle(0xf2e0b8).fillCircle(CX, CY, BOARD_R * 0.66);
    g.fillStyle(0xf8ecd0).fillCircle(CX, CY, BOARD_R * 0.33);
    g.lineStyle(1, 0xc9a86a, 0.8);
    g.lineBetween(CX - BOARD_R, CY, CX + BOARD_R, CY);
    g.lineBetween(CX, CY - BOARD_R, CX, CY + BOARD_R);
    g.strokeCircle(CX, CY, BOARD_R * 0.66);
    g.strokeCircle(CX, CY, BOARD_R * 0.33);

    // bilinen iksir bölgeleri
    this.zoneIcons.removeAll(true);
    for (const p of POTION_LIST) {
      if (!GameState.isDiscovered(p.id)) continue;
      const s = this.toScreen(p.target);
      g.fillStyle(p.color, 0.22).fillCircle(s.x, s.y, ZONE_RADIUS * BOARD_R);
      g.lineStyle(2, p.color, 0.8).strokeCircle(s.x, s.y, ZONE_RADIUS * BOARD_R);
      g.fillStyle(p.color, 0.25).fillCircle(s.x, s.y, 0.07 * BOARD_R);
      this.zoneIcons.add(this.add.image(s.x, s.y, `pot_${p.id}`).setAlpha(0.85));
    }

    // iz
    g.lineStyle(2, 0x3a8a6a, 0.9);
    for (let i = 1; i < this.trail.length; i++) {
      const a = this.toScreen(this.trail[i - 1]);
      const b = this.toScreen(this.trail[i]);
      g.lineBetween(a.x, a.y, b.x, b.y);
      g.fillStyle(0x3a8a6a).fillCircle(a.x, a.y, 2.5);
    }

    this.updateResult();
    this.buildAdded();
    this.buildTray();
    this.heatBtn.setEnabled(this.heat < MAX_HEAT && this.added.length > 0);
    this.waterBtn.setEnabled(!this.water && this.added.length > 0);
  }

  private moveMarker() {
    const s = this.toScreen(this.pos);
    this.tweens.add({ targets: this.marker, x: s.x, y: s.y, duration: 380, ease: 'Back.Out' });
  }

  /** İmlecin bulunduğu bölgedeki iksir (keşfedilmemiş olsa bile) */
  private zone(): { id: PotionId; q: number } | null {
    let best: { id: PotionId; q: number; d: number } | null = null;
    for (const p of POTION_LIST) {
      const d = Math.hypot(this.pos.x - p.target[0], this.pos.y - p.target[1]);
      const q = qualityFromDistance(d);
      if (q > 0 && (!best || d < best.d)) best = { id: p.id, q, d };
    }
    return best;
  }

  private updateResult() {
    this.bottleBtn.setEnabled(this.added.length > 0);
    if (this.flashTimer && this.flashTimer.getProgress() < 1) return; // mesaj gösteriliyor
    this.resultStars.removeAll(true);
    if (!this.added.length) {
      this.result.setText('Kazan boş. Aşağıdan malzeme ekle.');
      return;
    }
    const z = this.zone();
    if (!z) {
      this.result.setText('Bulanık bir karışım...\nHiçbir iksire benzemiyor.');
      return;
    }
    if (GameState.isDiscovered(z.id)) {
      this.result.setText(POTIONS[z.id].name);
      this.resultStars.add(stars(this, CX - 11, 354, z.q));
    } else {
      this.result.setText('Kazan tuhaf bir ışıkla parlıyor...\nBu daha önce görmediğin bir şey!');
    }
  }

  private buildAdded() {
    this.addedRow.removeAll(true);
    const y = 368;
    for (let i = 0; i < MAX_ING; i++) {
      const x = CX - 54 + i * 36;
      this.addedRow.add(this.add.nineslice(x, y, 'slot', undefined, 30, 30, 5, 5, 5, 5));
      const id = this.added[i];
      if (id) this.addedRow.add(this.add.image(x, y, `ing_${id}`).setScale(1.5));
    }
    if (this.heat) this.addedRow.add(txt(this, CX + 92, y, `🔥x${this.heat}`.replace('🔥', 'Ateş '), 10, '#b84a2a').setOrigin(0, 0.5));
    if (this.water) this.addedRow.add(txt(this, CX + 92, y + 12, 'Su', 10, '#2c6aa8').setOrigin(0, 0.5));
  }

  private buildTray() {
    this.tray.removeAll(true);
    const x0 = 26;
    const y0 = 400;
    INGREDIENT_LIST.forEach((ing, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = x0 + col * 78;
      const y = y0 + row * 58;
      const have = GameState.data.ingredients[ing.id] ?? 0;
      const slot = this.add.nineslice(x, y, 'slot', undefined, 72, 52, 5, 5, 5, 5).setOrigin(0);
      const icon = this.add.image(x + 22, y + 22, `ing_${ing.id}`).setScale(2);
      const cnt = txt(this, x + 66, y + 34, `${have}`, 13, have ? INK : '#a89070', { fontStyle: '600' }).setOrigin(1, 0.5);
      const nm = txt(this, x + 36, y + 46, ing.name, 8, INK_SOFT).setOrigin(0.5, 1);
      nm.setVisible(false);
      if (!have) {
        icon.setAlpha(0.3);
        slot.setAlpha(0.6);
      }
      this.tray.add([slot, icon, cnt, nm]);
      slot.setInteractive({ useHandCursor: true });
      slot.on('pointerup', () => this.addIngredient(ing.id, x + 22, y + 22));
    });
  }

  private addIngredient(id: IngredientId, fx: number, fy: number) {
    if (this.added.length >= MAX_ING) {
      this.flash('Kazan dolu! (en fazla 4 malzeme)');
      return;
    }
    if (!GameState.takeIngredient(id)) {
      this.flash(`${INGREDIENTS[id].name} kalmadı.`);
      return;
    }
    sfx('drop');
    this.added.push(id);
    const v = INGREDIENTS[id].vec;
    this.pos.x = Phaser.Math.Clamp(this.pos.x + v[0], -1, 1);
    this.pos.y = Phaser.Math.Clamp(this.pos.y + v[1], -1, 1);
    this.trail.push(this.pos.clone());
    // uçan ikon
    const fly = this.add.image(fx, fy, `ing_${id}`).setScale(2);
    const s = this.toScreen(this.pos);
    this.tweens.add({ targets: fly, x: s.x, y: s.y, scale: 0.5, alpha: 0.2, duration: 350, ease: 'Quad.In', onComplete: () => fly.destroy() });
    this.moveMarker();
    this.redraw();
  }

  private addHeat() {
    if (this.heat >= MAX_HEAT) return;
    this.heat++;
    sfx('brew');
    this.pos.x = Phaser.Math.Clamp(this.pos.x + 0.1, -1, 1);
    this.trail.push(this.pos.clone());
    this.moveMarker();
    this.redraw();
  }

  private addWater() {
    if (this.water) return;
    this.water = true;
    sfx('drop');
    this.pos.scale(0.75);
    this.trail.push(this.pos.clone());
    this.moveMarker();
    this.redraw();
  }

  private refundAll() {
    for (const id of this.added) GameState.addIngredient(id);
    this.added = [];
  }

  private reset() {
    this.refundAll();
    this.pos.set(0, 0);
    this.trail = [new Phaser.Math.Vector2(0, 0)];
    this.heat = 0;
    this.water = false;
    this.moveMarker();
    this.redraw();
  }

  private flashTimer?: Phaser.Time.TimerEvent;
  /** Sonuç satırında kısa süreli mesaj gösterir */
  private flash(s: string, soft = false) {
    this.flashTimer?.remove();
    this.resultStars.removeAll(true);
    this.result.setText(s).setColor(soft ? '#3a7a3a' : '#b84a2a');
    this.flashTimer = this.time.delayedCall(1800, () => {
      this.flashTimer = undefined;
      this.result.setColor(INK);
      this.updateResult();
    });
  }

  private async bottle() {
    if (!this.added.length) return;
    const z = this.zone();
    this.bottleBtn.setEnabled(false);
    if (!z) {
      sfx('fail');
      this.added = [];
      GameState.advance(15);
      this.flash('Bulanık sıvıyı döktün. Malzemeler boşa gitti.');
      this.time.delayedCall(700, () => this.reset());
      return;
    }
    const n = 2 + (GameState.hasTool('kazan') ? 1 : 0);
    GameState.addPotion(z.id, z.q, n);
    this.added = [];
    GameState.advance(30);
    const isNew = !GameState.isDiscovered(z.id);
    const p = POTIONS[z.id];

    // şişe animasyonu
    const bottle = this.add.image(CX, CY, `pot_${z.id}`).setScale(1);
    const glow = this.add.image(CX, CY, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(p.glow).setScale(0.5);
    this.root.add([glow, bottle]);
    this.tweens.add({ targets: bottle, scale: 5, duration: 500, ease: 'Back.Out' });
    this.tweens.add({ targets: glow, scale: 4, alpha: 0, duration: 900 });
    sfx(isNew ? 'discover' : 'brew');

    if (isNew) {
      GameState.data.discovered.push(z.id);
      GameState.save();
      await new Promise((r) => this.time.delayedCall(900, r));
      bottle.destroy();
      glow.destroy();
      await openModal(this, 'Dialog', {
        pages: [
          {
            name: 'Yeni keşif!',
            icon: `pot_${z.id}`,
            text: `${p.name}\n\nDefterdeki ${p.page === 'blank' ? 'boş sayfaya' : 'yarım sayfaya'} tarifi yazdın. ${n} şişe hazır.`,
          },
          { name: 'Defterin kenarında bir not', portrait: 'dede_portrait', text: p.memory },
        ],
      });
      this.scene.bringToTop();
    } else {
      this.flash(`${n} şişe ${p.name} hazır! (★${z.q})`, true);
      await new Promise((r) => this.time.delayedCall(900, r));
      bottle.destroy();
      glow.destroy();
    }
    this.reset();
  }
}

