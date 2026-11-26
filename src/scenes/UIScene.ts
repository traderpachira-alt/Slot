import Phaser from 'phaser';
import { GameState } from '../state/GameState';
import { Pad } from '../state/input';
import { GOLD, LIGHT, W, H, iconButton, openModal, panel, txt } from '../ui/widgets';
import { sfx } from '../ui/sound';

/** Oyun ekranının üstündeki arayüz: saat, altın, joystick, eylem düğmesi. */
export class UIScene extends Phaser.Scene {
  private clock!: Phaser.GameObjects.Text;
  private dayIcon!: Phaser.GameObjects.Image;
  private gold!: Phaser.GameObjects.Text;
  private bell!: Phaser.GameObjects.Container;
  private bellText!: Phaser.GameObjects.Text;
  private action!: Phaser.GameObjects.Container;
  private actionLabel!: Phaser.GameObjects.Text;
  private joyBase!: Phaser.GameObjects.Arc;
  private joyKnob!: Phaser.GameObjects.Arc;
  private joyPointer: number | null = null;
  private joyOrigin = new Phaser.Math.Vector2();
  private toasts: Phaser.GameObjects.Container[] = [];

  constructor() {
    super('UI');
  }

  create() {
    // Saat paneli
    panel(this, 8, 8, 156, 36, 'panel_dark');
    this.dayIcon = this.add.image(26, 26, 'icon_sun').setScale(2);
    this.clock = txt(this, 44, 26, '', 15, LIGHT).setOrigin(0, 0.5);

    // Altın paneli
    panel(this, 252, 8, 100, 36, 'panel_dark');
    this.add.image(270, 26, 'coin').setScale(2);
    this.gold = txt(this, 340, 26, '', 16, GOLD).setOrigin(1, 0.5);

    // Müşteri zili
    this.bell = this.add.container(8, 50);
    this.bell.add(panel(this, 0, 0, 92, 28, 'panel_dark'));
    this.bell.add(this.add.image(16, 14, 'icon_bell').setScale(1.5));
    this.bellText = txt(this, 30, 14, '', 12, LIGHT).setOrigin(0, 0.5);
    this.bell.add(this.bellText);

    // Defter & çanta
    iconButton(this, 330, 72, 'icon_book', () => void openModal(this, 'Book'));
    iconButton(this, 330, 118, 'icon_bag', () => void openModal(this, 'Bag'));

    // Eylem düğmesi
    this.action = this.add.container(W - 70, H - 96);
    const g = this.add.graphics();
    g.fillStyle(0x2a1d2e, 1).fillCircle(0, 3, 36);
    g.fillStyle(0xc0844a, 1).fillCircle(0, 0, 34);
    g.fillStyle(0xe8b070, 1).fillCircle(-4, -6, 24);
    g.fillStyle(0xd09458, 1).fillCircle(0, 0, 24);
    g.lineStyle(3, 0x2a1d2e, 1).strokeCircle(0, 0, 34);
    const hand = txt(this, 0, -1, '!', 28, LIGHT, { fontStyle: '600', stroke: '#2a1d2e', strokeThickness: 4 }).setOrigin(0.5);
    this.actionLabel = txt(this, 0, 50, '', 12, LIGHT, { stroke: '#2a1d2e', strokeThickness: 4, align: 'center' }).setOrigin(0.5, 0);
    this.action.add([g, hand, this.actionLabel]);
    const hit = this.add.circle(0, 0, 40, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    this.action.add(hit);
    hit.on('pointerdown', () => {
      this.action.setScale(0.92);
      sfx('click');
      GameState.events.emit('action');
    });
    hit.on('pointerup', () => this.action.setScale(1));
    hit.on('pointerout', () => this.action.setScale(1));
    this.action.setVisible(false);

    // Joystick
    this.joyBase = this.add.circle(0, 0, 34, 0xffffff, 0.12).setStrokeStyle(2, 0xffffff, 0.35).setVisible(false);
    this.joyKnob = this.add.circle(0, 0, 15, 0xffffff, 0.45).setVisible(false);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length || this.joyPointer !== null || GameState.paused) return;
      if (p.y < 60) return;
      this.joyPointer = p.id;
      this.joyOrigin.set(p.x, p.y);
      this.joyBase.setPosition(p.x, p.y).setVisible(true);
      this.joyKnob.setPosition(p.x, p.y).setVisible(true);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.id !== this.joyPointer) return;
      const dx = p.x - this.joyOrigin.x;
      const dy = p.y - this.joyOrigin.y;
      const d = Math.hypot(dx, dy);
      const max = 30;
      const k = d > max ? max / d : 1;
      this.joyKnob.setPosition(this.joyOrigin.x + dx * k, this.joyOrigin.y + dy * k);
      if (d < 6) {
        Pad.x = 0;
        Pad.y = 0;
      } else {
        const m = Math.min(1, d / max);
        Pad.x = (dx / d) * m;
        Pad.y = (dy / d) * m;
      }
    });
    const release = (p: Phaser.Input.Pointer) => {
      if (p.id !== this.joyPointer) return;
      this.joyPointer = null;
      Pad.x = 0;
      Pad.y = 0;
      this.joyBase.setVisible(false);
      this.joyKnob.setVisible(false);
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);

    // İlk dokunuşta joystick ipucu
    const hint = txt(this, W / 2, H - 40, 'Yürümek için ekrana dokunup sürükle', 12, LIGHT, {
      stroke: '#2a1d2e',
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.tweens.add({ targets: hint, alpha: 0.4, yoyo: true, repeat: 6, duration: 700, onComplete: () => hint.destroy() });

    // Olaylar
    const ev = GameState.events;
    const handlers: [string, (...a: never[]) => void][] = [
      ['time', () => this.refresh()],
      ['gold', () => this.refreshGold()],
      ['customers', () => this.refresh()],
      ['target', (label: string | null) => this.setTarget(label)],
      ['toast', (s: string) => this.toast(s)],
      ['location', (s: string) => this.locationBanner(s)],
      ['daysplash', () => this.daySplash()],
    ];
    for (const [e, h] of handlers) ev.on(e, h);
    this.events.once('shutdown', () => {
      for (const [e, h] of handlers) ev.off(e, h);
    });

    this.refresh();
    this.refreshGold();
  }

  update() {
    // Bir pencere açıksa joystick'i bırak
    if (GameState.paused && this.joyPointer !== null) {
      this.joyPointer = null;
      Pad.x = 0;
      Pad.y = 0;
      this.joyBase.setVisible(false);
      this.joyKnob.setVisible(false);
    }
  }

  private refresh() {
    const d = GameState.data;
    this.clock.setText(`${d.day}. Gün  ${GameState.timeString}`);
    this.dayIcon.setTexture(GameState.isNight || d.minutes < 6 * 60 + 30 ? 'icon_moon' : 'icon_sun');
    const n = GameState.customers.length;
    this.bell.setVisible(n > 0);
    this.bellText.setText(`${n} müşteri`);
    if (d.minutes >= 24 * 60 && d.minutes % 30 === 0) this.toast('Çok geç oldu... Uyumalısın.');
  }

  private refreshGold() {
    this.gold.setText(String(GameState.data.gold));
    this.tweens.add({ targets: this.gold, scale: 1.25, yoyo: true, duration: 120 });
  }

  private setTarget(label: string | null) {
    if (label) {
      this.actionLabel.setText(label);
      if (!this.action.visible) {
        this.action.setVisible(true).setScale(0.6);
        this.tweens.add({ targets: this.action, scale: 1, duration: 160, ease: 'Back.Out' });
      }
    } else this.action.setVisible(false);
  }

  toast(s: string) {
    const c = this.add.container(W / 2, 96);
    const t = txt(this, 0, 0, s, 13, LIGHT, { align: 'center', wordWrap: { width: 280 } }).setOrigin(0.5);
    const bg = panel(this, -t.width / 2 - 12, -t.height / 2 - 8, t.width + 24, t.height + 16, 'panel_dark');
    c.add([bg, t]);
    c.setDepth(100);
    // eski bildirimleri aşağı it
    for (const o of this.toasts) o.y += t.height + 22;
    this.toasts.push(c);
    c.alpha = 0;
    this.tweens.add({ targets: c, alpha: 1, duration: 150 });
    this.time.delayedCall(2400, () => {
      this.tweens.add({
        targets: c,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.toasts = this.toasts.filter((x) => x !== c);
          c.destroy();
        },
      });
    });
  }

  private locationBanner(name: string) {
    const t = txt(this, W / 2, 160, name, 22, GOLD, { stroke: '#150e1a', strokeThickness: 5, fontStyle: '600' }).setOrigin(0.5);
    t.alpha = 0;
    this.tweens.add({ targets: t, alpha: 1, y: 150, duration: 400, hold: 1000, yoyo: true, onComplete: () => t.destroy() });
  }

  private daySplash() {
    const bg = this.add.rectangle(0, 0, W, H, 0x0a0610, 1).setOrigin(0).setDepth(500);
    const t = txt(this, W / 2, H / 2 - 10, `${GameState.data.day}. Gün`, 34, GOLD, { fontStyle: '600', stroke: '#150e1a', strokeThickness: 5 })
      .setOrigin(0.5)
      .setDepth(501);
    const s = txt(this, W / 2, H / 2 + 28, 'Oyun kaydedildi', 12, '#a898b8').setOrigin(0.5).setDepth(501);
    this.tweens.add({
      targets: [bg, t, s],
      alpha: 0,
      delay: 1200,
      duration: 600,
      onComplete: () => {
        bg.destroy();
        t.destroy();
        s.destroy();
      },
    });
  }
}
