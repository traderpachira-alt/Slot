import { GameState } from '../state/GameState';
import { INGREDIENT_LIST, POTION_LIST } from '../data/items';
import { TOOLS } from '../data/npcs';
import { Modal, stars, txt, W, INK, INK_SOFT } from '../ui/widgets';

export class BagScene extends Modal {
  constructor() {
    super('Bag');
  }

  create() {
    this.openBase('Çanta', 540, 330);
    const x0 = 30;
    let y = 76;
    this.root.add(txt(this, x0 + 8, y, 'Malzemeler', 13, '#8a3a4a', { fontStyle: '600' }));
    y += 22;
    INGREDIENT_LIST.forEach((ing, i) => {
      const x = x0 + 8 + (i % 4) * 74;
      const yy = y + Math.floor(i / 4) * 54;
      const have = GameState.data.ingredients[ing.id] ?? 0;
      this.root.add(this.add.nineslice(x, yy, 'slot', undefined, 68, 48, 5, 5, 5, 5).setOrigin(0));
      this.root.add(this.add.image(x + 20, yy + 20, `ing_${ing.id}`).setScale(2).setAlpha(have ? 1 : 0.3));
      this.root.add(txt(this, x + 62, yy + 30, String(have), 13, INK, { fontStyle: '600' }).setOrigin(1, 0.5));
      this.root.add(txt(this, x + 34, yy + 44, ing.name, 8, INK_SOFT).setOrigin(0.5, 1));
    });
    y += 120;
    this.root.add(txt(this, x0 + 8, y, 'İksirler', 13, '#8a3a4a', { fontStyle: '600' }));
    y += 22;
    let any = false;
    for (const p of POTION_LIST) {
      for (let q = 3; q >= 1; q--) {
        const n = GameState.data.potions[`${p.id}:${q}`] ?? 0;
        if (!n) continue;
        any = true;
        this.root.add(this.add.image(x0 + 22, y + 8, `pot_${p.id}`).setScale(1.5));
        this.root.add(txt(this, x0 + 40, y + 8, p.name, 13, INK).setOrigin(0, 0.5));
        this.root.add(stars(this, x0 + 186, y + 8, q));
        this.root.add(txt(this, W - 44, y + 8, `x${n}`, 13, INK, { fontStyle: '600' }).setOrigin(1, 0.5));
        y += 24;
      }
    }
    if (!any) {
      this.root.add(txt(this, x0 + 8, y, 'Henüz iksirin yok. Kazana uğra!', 12, INK_SOFT));
      y += 24;
    }
    y = Math.max(y + 10, 440);
    this.root.add(txt(this, x0 + 8, y, 'Aletler', 13, '#8a3a4a', { fontStyle: '600' }));
    y += 20;
    TOOLS.forEach((t, i) => {
      const owned = GameState.hasTool(t.id);
      this.root.add(this.add.image(x0 + 28 + i * 96, y + 16, `tool_${t.id}`).setScale(2).setAlpha(owned ? 1 : 0.25));
      this.root.add(txt(this, x0 + 46 + i * 96, y + 16, t.name, 10, owned ? INK : '#a89070', { wordWrap: { width: 60 } }).setOrigin(0, 0.5));
    });
    this.closeButton(W / 2, 576);
  }
}
