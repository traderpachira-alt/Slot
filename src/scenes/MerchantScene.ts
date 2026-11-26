import Phaser from 'phaser';
import { GameState } from '../state/GameState';
import { INGREDIENTS, type IngredientId } from '../data/items';
import { TOOLS } from '../data/npcs';
import { Modal, button, txt, W, INK, INK_SOFT } from '../ui/widgets';
import { sfx } from '../ui/sound';

const GOODS: { id: IngredientId; price: number }[] = [
  { id: 'sifa_otu', price: 8 },
  { id: 'papatya', price: 8 },
  { id: 'recine', price: 16 },
  { id: 'mantar', price: 16 },
];

export class MerchantScene extends Modal {
  constructor() {
    super('Merchant');
  }

  create() {
    this.openBase('Tüccar Nermin', 560, 336);
    this.build();
  }

  private build() {
    // önceki içerik (başlık/panel hariç) temizlenir
    const keep = 3;
    while (this.root.length > keep) (this.root.getAt(keep) as Phaser.GameObjects.GameObject).destroy();
    const x0 = 28;
    let y = 64;
    this.root.add(this.add.image(x0 + 24, y + 24, 'npc_nermin_portrait').setScale(1.4));
    this.root.add(
      txt(this, x0 + 56, y + 4, '"Uzak diyarlardan ne ararsan bende! Altının varsa tabii..."', 12, INK, { wordWrap: { width: 230 } }),
    );
    y += 64;
    this.root.add(txt(this, x0, y, `Altının: ${GameState.data.gold}`, 13, '#8a6a20', { fontStyle: '600' }));
    y += 24;
    this.root.add(txt(this, x0, y, 'Aletler', 13, '#8a3a4a', { fontStyle: '600' }));
    y += 20;
    for (const t of TOOLS) {
      const owned = GameState.hasTool(t.id);
      this.root.add(this.add.image(x0 + 16, y + 18, `tool_${t.id}`).setScale(2));
      this.root.add(txt(this, x0 + 38, y + 2, t.name, 13, INK, { fontStyle: '600' }));
      this.root.add(txt(this, x0 + 38, y + 20, t.desc, 10, INK_SOFT, { wordWrap: { width: 176 } }));
      const b = button(this, W - 62, y + 18, 84, 32, owned ? 'Sende' : `${t.price}`, () => {
        if (GameState.data.gold < t.price) return this.say('Altının yetmiyor, tatlım.');
        GameState.addGold(-t.price);
        GameState.data.tools.push(t.id);
        GameState.save();
        sfx('coin');
        this.build();
        this.say(`${t.name} artık senin!`);
      }, 'btn_green');
      b.setEnabled(!owned && GameState.data.gold >= t.price);
      this.root.add(b);
      y += 54;
    }
    y += 4;
    this.root.add(txt(this, x0, y, 'Malzemeler (1 adet)', 13, '#8a3a4a', { fontStyle: '600' }));
    y += 22;
    GOODS.forEach((gd, i) => {
      const x = x0 + (i % 2) * 144;
      const yy = y + Math.floor(i / 2) * 44;
      this.root.add(this.add.image(x + 12, yy + 14, `ing_${gd.id}`).setScale(1.5));
      this.root.add(txt(this, x + 28, yy + 14, INGREDIENTS[gd.id].name, 11, INK, { wordWrap: { width: 60 } }).setOrigin(0, 0.5));
      const b = button(this, x + 112, yy + 14, 54, 30, `${gd.price}`, () => {
        if (GameState.data.gold < gd.price) return this.say('Altının yetmiyor.');
        GameState.addGold(-gd.price);
        GameState.addIngredient(gd.id);
        sfx('coin');
        this.build();
      });
      b.setEnabled(GameState.data.gold >= gd.price);
      this.root.add(b);
    });
    this.closeButton(W / 2, 584);
  }

  private say(s: string) {
    const t = txt(this, W / 2, 112, s, 12, '#b84a2a').setOrigin(0.5);
    this.root.add(t);
    this.tweens.add({ targets: t, alpha: 0, delay: 1400, duration: 300, onComplete: () => t.destroy() });
  }
}
