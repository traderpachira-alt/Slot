import Phaser from 'phaser';
import { GameState } from '../state/GameState';
import { POTIONS, potionPrice } from '../data/items';
import { VILLAGERS } from '../data/npcs';
import { Modal, button, stars, txt, W, INK, INK_SOFT } from '../ui/widgets';
import { sfx } from '../ui/sound';

/** Tezgâh: sıradaki müşteriye iksir sat */
export class ServeScene extends Modal {
  private body!: Phaser.GameObjects.Container;

  constructor() {
    super('Serve');
  }

  create() {
    this.openBase('Tezgâh', 470, 330);
    this.body = this.add.container(0, 0);
    this.root.add(this.body);
    this.show();
  }

  private show() {
    this.body.removeAll(true);
    const c = GameState.customers[0];
    if (!c) {
      this.close();
      return;
    }
    const v = VILLAGERS.find((x) => x.id === c.villagerId)!;
    const p = POTIONS[c.potion];
    const hearts = GameState.data.hearts[v.id] ?? 0;
    const known = GameState.isDiscovered(p.id);
    let y = 110;
    this.body.add(this.add.nineslice(70, y + 26, 'panel_dark', undefined, 76, 76, 6, 6, 6, 6));
    this.body.add(this.add.image(70, y + 26, `npc_${v.id}_portrait`).setScale(2));
    this.body.add(txt(this, 118, y, v.name, 16, INK, { fontStyle: '600' }));
    this.body.add(txt(this, 118, y + 20, v.title, 11, INK_SOFT));
    for (let i = 0; i < 5; i++) {
      this.body.add(this.add.image(122 + i * 10, y + 44, i < hearts ? 'heart' : 'heart_off'));
    }
    if (GameState.customers.length > 1)
      this.body.add(txt(this, W - 34, y, `Sırada: ${GameState.customers.length - 1}`, 11, INK_SOFT).setOrigin(1, 0));
    y += 78;
    this.body.add(txt(this, 34, y, `“${c.line}”`, 14, INK, { wordWrap: { width: W - 68 } }));
    y += 96;
    this.body.add(this.add.nineslice(W / 2, y + 24, 'slot', undefined, 290, 56, 5, 5, 5, 5));
    this.body.add(this.add.image(62, y + 24, known ? `pot_${p.id}` : 'pot_unknown').setScale(2));
    this.body.add(txt(this, 86, y + 14, known ? p.name : `${p.name} (tarif bilinmiyor)`, 13, INK, { fontStyle: '600' }));
    const have = GameState.potionCount(p.id);
    this.body.add(txt(this, 86, y + 32, `Elinde: ${have}`, 11, have ? '#3a7a3a' : '#b84a2a'));

    const bestQ = [3, 2, 1].find((q) => (GameState.data.potions[`${p.id}:${q}`] ?? 0) > 0) ?? 0;
    const price = bestQ ? potionPrice(p.id, bestQ) + hearts * 2 : 0;
    if (bestQ) this.body.add(stars(this, W - 74, y + 24, bestQ));

    const by = 436;
    const give = button(this, W / 2 - 76, by, 140, 40, have ? `Ver  +${price}` : 'Stokta yok', () => this.give(price), 'btn_green', 15);
    give.setEnabled(have > 0);
    const no = button(this, W / 2 + 76, by, 140, 40, 'Üzgünüm', () => this.refuse());
    this.body.add([give, no]);
    this.body.add(button(this, W / 2, by + 50, 120, 34, 'Kapat', () => this.close()));
  }

  private give(price: number) {
    const c = GameState.customers.shift()!;
    GameState.takeBestPotion(c.potion);
    GameState.addGold(price);
    GameState.data.totalSold++;
    const h = GameState.data.hearts[c.villagerId] ?? 0;
    GameState.data.hearts[c.villagerId] = Math.min(5, h + (Math.random() < 0.5 ? 1 : 0) + (h === 0 ? 1 : 0));
    GameState.events.emit('customers');
    sfx('coin');
    const v = VILLAGERS.find((x) => x.id === c.villagerId)!;
    this.react(Phaser.Utils.Array.GetRandom(v.thanks), `+${price} altın`);
  }

  private refuse() {
    GameState.customers.shift();
    GameState.events.emit('customers');
    this.react('Peki... Belki başka zaman.', '');
  }

  private react(line: string, reward: string) {
    this.body.removeAll(true);
    this.body.add(txt(this, W / 2, 230, `“${line}”`, 15, INK, { align: 'center', wordWrap: { width: W - 80 } }).setOrigin(0.5));
    if (reward) {
      const r = txt(this, W / 2, 300, reward, 20, '#b8860b', { fontStyle: '600' }).setOrigin(0.5);
      this.body.add(r);
      this.tweens.add({ targets: r, y: 290, yoyo: true, duration: 300 });
    }
    this.time.delayedCall(1500, () => this.show());
  }
}
