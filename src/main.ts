import Phaser from 'phaser';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/600.css';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldScene } from './scenes/WorldScene';
import { UIScene } from './scenes/UIScene';
import { DialogScene } from './scenes/DialogScene';
import { BrewScene } from './scenes/BrewScene';
import { BookScene } from './scenes/BookScene';
import { BagScene } from './scenes/BagScene';
import { MerchantScene } from './scenes/MerchantScene';
import { TravelScene } from './scenes/TravelScene';
import { ServeScene } from './scenes/ServeScene';
import { W, H } from './ui/widgets';

async function start() {
  try {
    await Promise.all([document.fonts.load('16px "Pixelify Sans"'), document.fonts.load('600 16px "Pixelify Sans"')]);
  } catch {
    /* yazı tipi yüklenmezse yedek font kullanılır */
  }
  new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: W,
    height: H,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#1b1424',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { debug: false } },
    input: { activePointers: 3 },
    scene: [
      BootScene,
      TitleScene,
      WorldScene,
      UIScene,
      DialogScene,
      BrewScene,
      BookScene,
      BagScene,
      MerchantScene,
      TravelScene,
      ServeScene,
    ],
  });
}

void start();
