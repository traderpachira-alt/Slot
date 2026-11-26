import Phaser from 'phaser';
import { GameState } from '../state/GameState';
import { POTION_LIST, potionPrice } from '../data/items';
import { Modal, button, txt, W, INK, INK_SOFT } from '../ui/widgets';
import { sfx } from '../ui/sound';

/** Dedenin defteri: kapak + her iksir için bir sayfa */
export class BookScene extends Modal {
  private page = 0;
  private content!: Phaser.GameObjects.Container;
  private pageNo!: Phaser.GameObjects.Text;

  constructor() {
    super('Book');
  }

  create() {
    this.openBase('Dedemin Defteri', 540, 330);
    this.content = this.add.container(0, 0);
    this.pageNo = txt(this, W / 2, 530, '', 12, INK_SOFT).setOrigin(0.5);
    this.root.add([this.content, this.pageNo]);
    this.root.add(button(this, 70, 530, 64, 36, '‹', () => this.turn(-1), 'btn', 20));
    this.root.add(button(this, W - 70, 530, 64, 36, '›', () => this.turn(1), 'btn', 20));
    this.closeButton(W / 2, 576);
    this.render();
  }

  private turn(d: number) {
    const max = POTION_LIST.length;
    this.page = (this.page + d + max + 1) % (max + 1);
    sfx('click');
    this.render();
  }

  private render() {
    const c = this.content;
    c.removeAll(true);
    const total = POTION_LIST.length + 1;
    this.pageNo.setText(`${this.page + 1} / ${total}`);
    const x = 44;
    let y = 82;
    if (this.page === 0) {
      const done = POTION_LIST.filter((p) => GameState.isDiscovered(p.id)).length;
      c.add(txt(this, W / 2, y + 10, 'Saadet Hanım\'dan bana,\nbenden sana.', 16, INK, { align: 'center', fontStyle: '600' }).setOrigin(0.5, 0));
      y += 70;
      c.add(
        txt(
          this,
          x,
          y,
          'Bu defterde bildiğim bütün iksirler var. Bazı sayfaları bitiremedim; notlarımı bıraktım. ' +
            'Kazandaki tahtayı düşün: her malzeme karışımı bir yöne iter. Doğru yere varınca kazan parlar.',
          13,
          INK,
          { wordWrap: { width: W - 88 } },
        ),
      );
      y += 150;
      c.add(txt(this, W / 2, y, `Tamamlanan sayfalar: ${done} / ${POTION_LIST.length}`, 14, '#8a3a4a', { fontStyle: '600' }).setOrigin(0.5, 0));
      y += 34;
      POTION_LIST.forEach((p, i) => {
        const ix = W / 2 - 100 + i * 40;
        c.add(this.add.image(ix, y + 16, GameState.isDiscovered(p.id) ? `pot_${p.id}` : 'pot_unknown').setScale(2));
      });
      return;
    }

    const p = POTION_LIST[this.page - 1];
    const known = GameState.isDiscovered(p.id);
    const title = known || p.page === 'hint' ? p.name : '? ? ?';
    c.add(this.add.image(W / 2, y + 18, known ? `pot_${p.id}` : 'pot_unknown').setScale(3));
    y += 46;
    c.add(txt(this, W / 2, y, title, 18, INK, { fontStyle: '600' }).setOrigin(0.5, 0));
    y += 28;
    const status = known
      ? p.page === 'known'
        ? 'Dedenin tamamladığı sayfa'
        : p.page === 'hint'
          ? 'Yarım sayfayı sen tamamladın'
          : 'Boş sayfaya sen yazdın'
      : p.page === 'hint'
        ? 'Yarım kalmış sayfa'
        : 'Boş sayfa';
    c.add(txt(this, W / 2, y, status, 11, INK_SOFT).setOrigin(0.5, 0));
    y += 28;

    if (known) {
      c.add(txt(this, x, y, `Tarif: ${p.recipeNote}`, 13, INK, { wordWrap: { width: W - 88 } }));
      y += 56;
      c.add(txt(this, x, y, `Fiyat: ${potionPrice(p.id, 1)} – ${potionPrice(p.id, 3)} altın`, 12, INK_SOFT));
      c.add(txt(this, W - x, y, `Elinde: ${GameState.potionCount(p.id)}`, 12, INK_SOFT).setOrigin(1, 0));
      y += 26;
      // mini tahta
      const g = this.add.graphics();
      const R = 34;
      const cx = W / 2;
      const cy = y + R + 4;
      g.fillStyle(0xf2e0b8).fillCircle(cx, cy, R);
      g.lineStyle(1, 0xc9a86a).strokeCircle(cx, cy, R).lineBetween(cx - R, cy, cx + R, cy).lineBetween(cx, cy - R, cx, cy + R);
      g.fillStyle(p.color).fillCircle(cx + p.target[0] * R, cy - p.target[1] * R, 5);
      c.add(g);
      y += R * 2 + 14;
      if (p.memory) c.add(txt(this, x, y, `“${p.memory}”`, 11, '#6a4a5a', { wordWrap: { width: W - 88 }, fontStyle: 'italic' }));
    } else {
      c.add(txt(this, x, y, p.hint, 14, '#6a4a5a', { wordWrap: { width: W - 88 } }));
    }
  }
}
