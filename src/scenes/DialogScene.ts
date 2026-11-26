import Phaser from 'phaser';
import { Modal, button, panel, txt, W, H, INK, INK_SOFT } from '../ui/widgets';
import { sfx } from '../ui/sound';

export interface DialogPage {
  name?: string;
  portrait?: string;
  text: string;
  hearts?: number;
  icon?: string;
}

export interface DialogData {
  pages: DialogPage[];
  choices?: string[];
  onChoice?: (i: number) => void;
}

/** Ekranın altında yazı makinesi efektli konuşma kutusu. */
export class DialogScene extends Modal {
  private data_!: DialogData;
  private page = 0;
  private body!: Phaser.GameObjects.Text;
  private nameText!: Phaser.GameObjects.Text;
  private portrait!: Phaser.GameObjects.Image;
  private portraitFrame!: Phaser.GameObjects.NineSlice;
  private heartRow!: Phaser.GameObjects.Container;
  private iconImg!: Phaser.GameObjects.Image;
  private more!: Phaser.GameObjects.Text;
  private full = '';
  private shown = 0;
  private typing?: Phaser.Time.TimerEvent;
  private choiceBox?: Phaser.GameObjects.Container;

  constructor() {
    super('Dialog');
  }

  init(d: DialogData) {
    this.data_ = d;
    this.page = 0;
    this.choiceBox = undefined;
  }

  create() {
    // Modal.openBase yerine alt kutu
    this.openBase(null, 0, 0);
    this.root.removeAll(true);
    const boxY = H - 230;
    this.portraitFrame = panel(this, 16, boxY - 74, 80, 80, 'panel');
    this.portrait = this.add.image(56, boxY - 34, '__DEFAULT').setScale(2);
    this.root.add([this.portraitFrame, this.portrait]);
    this.root.add(panel(this, 12, boxY, W - 24, 200));
    this.nameText = txt(this, 28, boxY + 14, '', 14, '#8a3a4a', { fontStyle: '600' });
    this.heartRow = this.add.container(W - 40, boxY + 21);
    this.body = txt(this, 28, boxY + 40, '', 15, INK, { wordWrap: { width: W - 64 } });
    this.iconImg = this.add.image(W - 50, boxY + 60, '__DEFAULT').setScale(3).setVisible(false);
    this.more = txt(this, W - 34, boxY + 180, '▼', 14, INK_SOFT).setOrigin(0.5);
    this.tweens.add({ targets: this.more, y: boxY + 176, yoyo: true, repeat: -1, duration: 400 });
    this.root.add([this.nameText, this.heartRow, this.body, this.iconImg, this.more]);

    const hit = this.add.zone(0, 0, W, H).setOrigin(0).setInteractive();
    this.root.addAt(hit, 0);
    hit.on('pointerup', () => this.advance());
    this.input.keyboard?.on('keydown-SPACE', () => this.advance());
    this.input.keyboard?.on('keydown-ENTER', () => this.advance());
    this.input.keyboard?.on('keydown-E', () => this.advance());

    this.showPage();
  }

  private showPage() {
    const p = this.data_.pages[this.page];
    this.nameText.setText(p.name ?? '');
    if (p.portrait) {
      this.portrait.setTexture(p.portrait).setVisible(true);
      this.portraitFrame.setVisible(true);
    } else {
      this.portrait.setVisible(false);
      this.portraitFrame.setVisible(false);
    }
    this.heartRow.removeAll(true);
    if (p.hearts !== undefined) {
      for (let i = 0; i < 5; i++) {
        this.heartRow.add(this.add.image(-i * 10, 0, 4 - i < p.hearts ? 'heart' : 'heart_off'));
      }
    }
    if (p.icon) this.iconImg.setTexture(p.icon).setVisible(true);
    else this.iconImg.setVisible(false);
    this.body.setWordWrapWidth(p.icon ? W - 110 : W - 64);
    const topPad = p.name ? 40 : 18;
    this.body.y = H - 230 + topPad;
    this.full = p.text;
    this.shown = 0;
    this.body.setText('');
    this.more.setVisible(false);
    this.typing?.remove();
    this.typing = this.time.addEvent({
      delay: 18,
      loop: true,
      callback: () => {
        this.shown += 1;
        this.body.setText(this.full.slice(0, this.shown));
        if (this.shown % 3 === 0) sfx('step');
        if (this.shown >= this.full.length) this.finishTyping();
      },
    });
  }

  private finishTyping() {
    this.typing?.remove();
    this.typing = undefined;
    this.body.setText(this.full);
    this.shown = this.full.length;
    const last = this.page === this.data_.pages.length - 1;
    if (last && this.data_.choices?.length) this.showChoices();
    else this.more.setVisible(true);
  }

  private showChoices() {
    if (this.choiceBox) return;
    const ch = this.data_.choices!;
    this.choiceBox = this.add.container(0, 0);
    const bw = 140;
    const gap = 12;
    const total = ch.length * bw + (ch.length - 1) * gap;
    ch.forEach((label, i) => {
      const b = button(this, W / 2 - total / 2 + bw / 2 + i * (bw + gap), H - 62, bw, 38, label, () => {
        this.close();
        this.data_.onChoice?.(i);
      }, i === 0 ? 'btn_green' : 'btn');
      this.choiceBox!.add(b);
    });
    this.root.add(this.choiceBox);
  }

  private advance() {
    if (this.choiceBox) return;
    if (this.typing) {
      this.finishTyping();
      return;
    }
    if (this.page < this.data_.pages.length - 1) {
      this.page++;
      sfx('click');
      this.showPage();
    } else {
      this.close();
      this.data_.onChoice?.(-1);
    }
  }
}
