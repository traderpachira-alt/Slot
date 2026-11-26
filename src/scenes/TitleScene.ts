import Phaser from 'phaser';
import { GameState } from '../state/GameState';
import { button, txt, W, H, GOLD, LIGHT, panel } from '../ui/widgets';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    // Arka plan: kasabanın dükkân çevresi, 2x büyütülmüş
    // dünya noktası (156,150) ekranda (180,280)'e gelsin
    const ox = 180 - 156 * 2;
    const oy = 280 - 150 * 2;
    this.add.image(ox, oy, 'ground_town').setOrigin(0).setScale(2);
    const place = (tex: string, x: number, y: number) => this.add.image(ox + x * 2, oy + y * 2, tex).setOrigin(0.5, 1).setScale(2).setDepth(y);
    place('shop', 156, 160);
    place('pine', 92, 70);
    place('pine2', 228, 66);
    place('pine', 62, 52);
    place('oak2', 300, 196);
    place('oak', 24, 168);
    place('barrel', 216, 152);
    place('barrel', 228, 158);
    place('crate', 220, 168);
    place('pot', 130, 166);
    place('pot', 172, 166);
    place('lamp', 122, 196);
    place('lamp', 192, 196);
    const p = this.add.sprite(ox + 150 * 2, oy + 196 * 2, 'player', 0).setOrigin(0.5, 1).setScale(2).setDepth(196);
    this.tweens.add({ targets: p, y: p.y - 2, yoyo: true, repeat: -1, duration: 600 });
    const cat = this.add.sprite(ox + 176 * 2, oy + 194 * 2, 'cat', 0).setOrigin(0.5, 1).setScale(2).setDepth(194);
    cat.play('cat_idle');

    // Alt kararma
    const g = this.add.graphics().setDepth(1000);
    for (let i = 0; i < 40; i++) {
      g.fillStyle(0x1b1424, (i / 40) * 0.95);
      g.fillRect(0, 400 + i * 6, W, 6);
    }
    g.fillStyle(0x1b1424, 0.95).fillRect(0, 640, W, 10);

    // Başlık
    const tp = this.add.container(0, 0).setDepth(1001);
    tp.add(panel(this, 30, 34, 300, 108, 'panel_dark'));
    tp.add(txt(this, W / 2, 62, 'Dedemin', 20, LIGHT, { stroke: '#150e1a', strokeThickness: 4 }).setOrigin(0.5));
    tp.add(
      txt(this, W / 2, 98, 'İKSİR DEFTERİ', 32, GOLD, { fontStyle: '600', stroke: '#150e1a', strokeThickness: 5 }).setOrigin(0.5),
    );
    tp.add(txt(this, W / 2, 128, 'bir simyacı hikâyesi', 12, '#c8b8d8').setOrigin(0.5));
    this.tweens.add({ targets: tp, y: 4, yoyo: true, repeat: -1, duration: 1800, ease: 'Sine.InOut' });

    const hasSave = GameState.hasSave();
    const by = 470;
    if (hasSave) {
      button(this, W / 2, by, 200, 44, 'Devam Et', () => this.begin(false), 'btn_green', 18).setDepth(1002);
      button(this, W / 2, by + 56, 200, 40, 'Yeni Oyun', () => this.confirmNew(), 'btn', 16).setDepth(1002);
    } else {
      button(this, W / 2, by + 20, 200, 48, 'Yeni Oyun', () => this.begin(true), 'btn_green', 18).setDepth(1002);
    }
    txt(this, W / 2, H - 22, 'v0.1 · ilk oynanabilir sürüm', 10, '#7a6a8a').setOrigin(0.5).setDepth(1002);
  }

  private confirmNew() {
    const c = this.add.container(0, 0).setDepth(2000);
    const dim = this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0).setInteractive();
    c.add(dim);
    c.add(panel(this, 40, 240, 280, 150));
    c.add(txt(this, W / 2, 280, 'Kayıtlı oyunun silinecek.\nEmin misin?', 15, '#3a2418', { align: 'center' }).setOrigin(0.5));
    c.add(button(this, 115, 350, 110, 36, 'Vazgeç', () => c.destroy()));
    c.add(button(this, 245, 350, 110, 36, 'Evet', () => this.begin(true), 'btn_green'));
  }

  private begin(fresh: boolean) {
    if (fresh || !GameState.load()) GameState.newGame();
    this.cameras.main.fadeOut(300, 27, 20, 36);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('World', { map: 'shop', spawn: GameState.data.introDone ? 'bed' : 'start' });
    });
  }
}
