import Phaser from 'phaser';
import { generateAll } from '../art/generate';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    generateAll(this);
    this.scene.start('Title');
  }
}
