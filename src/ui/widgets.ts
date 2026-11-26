import Phaser from 'phaser';
import { GameState } from '../state/GameState';
import { sfx } from './sound';

export const FONT = '"Pixelify Sans", monospace';
export const W = 360;
export const H = 640;

export const INK = '#3a2418';
export const INK_SOFT = '#7a5a3a';
export const LIGHT = '#fff4dc';
export const GOLD = '#f2c040';

export function txt(
  scene: Phaser.Scene,
  x: number,
  y: number,
  s: string,
  size = 14,
  color = INK,
  opts: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {},
): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, s, {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    lineSpacing: 3,
    ...opts,
  });
  t.setResolution(2);
  return t;
}

export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, key = 'panel') {
  return scene.add.nineslice(x, y, key, undefined, w, h, 6, 6, 6, 6).setOrigin(0, 0);
}

export interface Button extends Phaser.GameObjects.Container {
  setEnabled(on: boolean): Button;
  setLabel(s: string): Button;
}

export function button(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  onClick: () => void,
  style: 'btn' | 'btn_green' | 'btn_gray' = 'btn',
  size = 14,
): Button {
  const c = scene.add.container(x, y) as Button;
  const bg = scene.add.nineslice(0, 0, style, undefined, w, h, 6, 6, 6, 6);
  const t = txt(scene, 0, -1, label, size, LIGHT, { align: 'center', stroke: '#2a1d2e', strokeThickness: 3 }).setOrigin(0.5);
  c.add([bg, t]);
  c.setSize(w, h);
  let enabled = true;
  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerdown', () => {
    if (!enabled) return;
    bg.setTexture('btn_down');
    t.y = 0;
  });
  const reset = () => {
    bg.setTexture(enabled ? style : 'btn_gray');
    t.y = -1;
  };
  bg.on('pointerout', reset);
  bg.on('pointerup', () => {
    if (!enabled) return;
    reset();
    sfx('click');
    onClick();
  });
  c.setEnabled = (on: boolean) => {
    enabled = on;
    bg.setTexture(on ? style : 'btn_gray');
    t.setAlpha(on ? 1 : 0.7);
    return c;
  };
  c.setLabel = (s: string) => {
    t.setText(s);
    return c;
  };
  return c;
}

export function iconButton(scene: Phaser.Scene, x: number, y: number, icon: string, onClick: () => void, size = 40) {
  const c = scene.add.container(x, y);
  const bg = scene.add.nineslice(0, 0, 'panel', undefined, size, size, 6, 6, 6, 6);
  const ic = scene.add.image(0, 0, icon).setScale(2);
  c.add([bg, ic]);
  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerdown', () => ic.setScale(1.8));
  bg.on('pointerout', () => ic.setScale(2));
  bg.on('pointerup', () => {
    ic.setScale(2);
    sfx('click');
    onClick();
  });
  return c;
}

/** Tüm açılır pencerelerin temeli: zamanı durdurur, arka planı karartır. */
export abstract class Modal extends Phaser.Scene {
  protected root!: Phaser.GameObjects.Container;
  private closing = false;

  protected openBase(title: string | null, h = 520, w = 336) {
    this.closing = false;
    GameState.pause();
    const dim = this.add.rectangle(0, 0, W, H, 0x120a18, 0.65).setOrigin(0).setInteractive();
    dim.alpha = 0;
    this.tweens.add({ targets: dim, alpha: 1, duration: 150 });
    this.root = this.add.container(0, 0);
    const x = (W - w) / 2;
    const y = (H - h) / 2;
    this.root.add(panel(this, x, y, w, h));
    if (title) {
      const tb = panel(this, W / 2 - 90, y - 14, 180, 30, 'panel_dark');
      this.root.add(tb);
      this.root.add(txt(this, W / 2, y + 1, title, 16, GOLD, { stroke: '#150e1a', strokeThickness: 3 }).setOrigin(0.5));
    }
    this.root.y = 20;
    this.root.alpha = 0;
    this.tweens.add({ targets: this.root, y: 0, alpha: 1, duration: 180, ease: 'Back.Out' });
    return { x, y, w, h };
  }

  protected closeButton(x: number, y: number, label = 'Kapat') {
    const b = button(this, x, y, 110, 34, label, () => this.close());
    this.root.add(b);
    return b;
  }

  close() {
    if (this.closing) return;
    this.closing = true;
    GameState.resume();
    this.tweens.add({
      targets: this.root,
      alpha: 0,
      y: 12,
      duration: 120,
      onComplete: () => {
        this.events.emit('closed');
        this.scene.stop();
      },
    });
  }
}

export function stars(scene: Phaser.Scene, x: number, y: number, q: number, scale = 1) {
  const c = scene.add.container(x, y);
  for (let i = 0; i < 3; i++) c.add(scene.add.image(i * 8 * scale, 0, i < q ? 'star_on' : 'star_off').setScale(scale));
  return c;
}

export function openModal(from: Phaser.Scene, key: string, data?: object): Promise<void> {
  return new Promise((resolve) => {
    const sp = from.scene.get(key);
    from.scene.launch(key, data);
    from.scene.bringToTop(key);
    sp.events.once('closed', () => resolve());
  });
}
