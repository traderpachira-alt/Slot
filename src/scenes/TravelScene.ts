import { GameState, type MapId } from '../state/GameState';
import { DESTINATIONS } from '../data/maps';
import { Modal, button, panel, txt, W, INK, INK_SOFT } from '../ui/widgets';
import type { WorldScene } from './WorldScene';

export class TravelScene extends Modal {
  private from: MapId = 'town';

  constructor() {
    super('Travel');
  }

  init(d: { from: MapId }) {
    this.from = d.from;
  }

  create() {
    this.openBase('Yolculuk', 420, 330);
    let y = 160;
    this.root.add(txt(this, W / 2, y - 22, 'Nereye gitmek istersin?', 14, INK).setOrigin(0.5));
    for (const d of DESTINATIONS) {
      if (d.id === this.from) continue;
      const locked = d.needs === 'orak' && !GameState.hasTool('orak');
      this.root.add(panel(this, 30, y, 300, 86, 'slot'));
      this.root.add(txt(this, 44, y + 10, d.name, 15, INK, { fontStyle: '600' }));
      this.root.add(txt(this, 44, y + 32, locked ? 'Yol dikenle kaplı. Bir orak lazım.' : d.desc, 11, INK_SOFT, { wordWrap: { width: 170 } }));
      const b = button(this, 272, y + 43, 92, 36, `${d.minutes} dk`, () => {
        this.close();
        GameState.advance(d.minutes);
        const world = this.scene.get('World') as unknown as WorldScene;
        world.go(d.id, d.id === 'town' ? 'north' : 'south');
      }, 'btn_green');
      b.setEnabled(!locked);
      this.root.add(b);
      y += 98;
    }
    this.closeButton(W / 2, 498, 'Vazgeç');
  }
}
