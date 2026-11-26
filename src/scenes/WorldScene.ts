import Phaser from 'phaser';
import { MAPS, type GatherNode, type Interactable, type MapDef } from '../data/maps';
import { MAP_BLOCKERS } from '../art/generate';
import { GameState, type MapId, type Customer } from '../state/GameState';
import { Pad } from '../state/input';
import { INGREDIENTS, type PotionId } from '../data/items';
import { VILLAGERS } from '../data/npcs';
import { openModal, txt } from '../ui/widgets';
import { sfx } from '../ui/sound';
import { mix } from '../art/pixel';

interface Target {
  kind: Interactable['kind'] | 'node' | 'customer';
  x: number;
  y: number;
  r: number;
  label: string;
  ref?: Interactable;
  node?: { def: GatherNode; idx: number; sprite: Phaser.GameObjects.Image; glow?: Phaser.GameObjects.Image };
  villagerId?: string;
}

const SPEED = 72;

function dayRand(day: number, i: number, salt: number) {
  let h = (day * 2654435761 + i * 40503 + salt * 977) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519) >>> 0;
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

export class WorldScene extends Phaser.Scene {
  private map!: MapDef;
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private shadow!: Phaser.GameObjects.Image;
  private blockers!: Phaser.Physics.Arcade.StaticGroup;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private facing: 'down' | 'up' | 'side' = 'down';
  private targets: Target[] = [];
  private current: Target | null = null;
  private overlay!: Phaser.GameObjects.Rectangle;
  private glows: { img: Phaser.GameObjects.Image; always?: boolean }[] = [];
  private playerLight?: Phaser.GameObjects.Image;
  private fireflies?: Phaser.GameObjects.Particles.ParticleEmitter;
  private villagerSprites = new Map<string, Phaser.GameObjects.Sprite>();
  private customerSprites: Phaser.GameObjects.Sprite[] = [];
  private nodeSprites: { def: GatherNode; idx: number; sprite: Phaser.GameObjects.Image; glow?: Phaser.GameObjects.Image }[] = [];
  private busy = false;
  private stepTimer = 0;
  private lastMinuteCheck = -1;

  constructor() {
    super('World');
  }

  init(data: { map?: MapId; spawn?: string }) {
    this.map = MAPS[data.map ?? 'shop'];
    this.spawnName = data.spawn ?? 'start';
  }
  private spawnName = 'start';

  create() {
    const m = this.map;
    this.busy = false;
    this.targets = [];
    this.glows = [];
    this.nodeSprites = [];
    this.customerSprites = [];
    this.villagerSprites.clear();
    this.current = null;
    this.playerLight = undefined;
    this.fireflies = undefined;

    this.physics.world.setBounds(0, 0, m.w, m.h);
    this.add.image(0, 0, `ground_${m.id}`).setOrigin(0).setDepth(-10000);
    this.blockers = this.physics.add.staticGroup();

    // su ve duvarlar
    for (const [x, y, w, h] of MAP_BLOCKERS[m.id] ?? []) this.block(x + w / 2, y + h / 2, w, h);
    if (m.indoor) {
      this.block(m.w / 2, 25, m.w, 50);
      this.block(2, m.h / 2, 8, m.h);
      this.block(m.w - 2, m.h / 2, 8, m.h);
      this.block(m.w / 2, m.h - 2, m.w, 8);
    }

    // nesneler
    for (const o of m.objects) {
      const img = this.add.image(o.x, o.y, o.tex).setOrigin(0.5, 1);
      if (o.flip) img.setFlipX(true);
      img.setDepth(o.decal ? -5000 : o.y);
      if (o.tex === 'cauldron') {
        img.destroy();
        const s = this.add.sprite(o.x, o.y, 'cauldron').setOrigin(0.5, 1).setDepth(o.y);
        s.play('cauldron_bubble');
      }
      if (o.collide) this.block(o.x, o.y - o.collide[1] / 2, o.collide[0], o.collide[1]);
      if (o.light) this.addLight(o.x + o.light.dx, o.y + o.light.dy, o.light.r, o.light.color, o.tex === 'cauldron');
    }

    // etkileşimler
    for (const it of m.interact) this.targets.push({ kind: it.kind, x: it.x, y: it.y, r: it.r, label: it.label, ref: it });

    // kasaba sakinleri
    for (const a of m.ambient) {
      const s = this.add.sprite(a.x, a.y, `npc_${a.villager}`, a.face === 'up' ? 3 : a.face === 'down' ? 0 : 6);
      s.setOrigin(0.5, 1).setDepth(a.y);
      if (a.face === 'left') s.setFlipX(true);
      this.add.image(a.x, a.y, 'shadow').setOrigin(0.5, 0.7).setAlpha(0.22).setDepth(a.y - 1);
      this.block(a.x, a.y - 3, 10, 6);
      this.villagerSprites.set(a.villager, s);
      this.tweens.add({ targets: s, scaleY: 1.03, yoyo: true, repeat: -1, duration: 900 + Math.random() * 400 });
      const v = VILLAGERS.find((vv) => vv.id === a.villager)!;
      this.targets.push({ kind: 'villager', x: a.x, y: a.y, r: 18, label: v.name, villagerId: a.villager });
    }

    // tüccar
    if (m.id === 'town') {
      const s = this.add.sprite(66, 348, 'npc_nermin', 0).setOrigin(0.5, 1).setDepth(347);
      this.villagerSprites.set('nermin', s);
    }

    // kedi
    if (m.id === 'shop') {
      const cat = this.add.sprite(132, 134, 'cat', 0).setOrigin(0.5, 1).setDepth(134);
      cat.play('cat_idle');
      this.block(132, 131, 12, 5);
    }

    // toplama düğümleri
    m.nodes.forEach((def, idx) => {
      const sprite = this.add.image(def.x, def.y, `ing_${def.item}`).setOrigin(0.5, 1).setDepth(def.y);
      let glow: Phaser.GameObjects.Image | undefined;
      if (def.when === 'night') {
        glow = this.add
          .image(def.x, def.y - 6, 'glow')
          .setBlendMode(Phaser.BlendModes.ADD)
          .setTint(def.item === 'ay_cicegi' ? 0x8ac8ff : 0xfff080)
          .setScale(0.55)
          .setDepth(20001);
        this.tweens.add({ targets: glow, alpha: 0.5, yoyo: true, repeat: -1, duration: 1200 });
      }
      this.tweens.add({ targets: sprite, angle: { from: -3, to: 3 }, yoyo: true, repeat: -1, duration: 1400 + idx * 70, ease: 'Sine.InOut' });
      this.nodeSprites.push({ def, idx, sprite, glow });
    });
    this.refreshNodes();

    // oyuncu
    const sp = m.spawns[this.spawnName] ?? m.spawns.start;
    this.shadow = this.add.image(sp[0], sp[1], 'shadow').setOrigin(0.5, 0.7).setAlpha(0.25);
    this.player = this.physics.add.sprite(sp[0], sp[1], 'player', 0).setOrigin(0.5, 1);
    this.player.body.setSize(10, 6).setOffset(3, 17);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.blockers);
    if (this.spawnName === 'door' && m.id === 'shop') this.facing = 'up';
    if (this.spawnName === 'door' && m.id === 'town') this.facing = 'down';

    // kamera
    const cam = this.cameras.main;
    cam.setZoom(2);
    // Görüş alanından küçük haritalar ekranda ortalanır
    const viewW = cam.width / 2;
    const viewH = cam.height / 2;
    const bx = m.w < viewW ? -(viewW - m.w) / 2 : 0;
    const by = m.h < viewH ? -(viewH - m.h) / 2 : 0;
    cam.setBounds(bx, by, Math.max(m.w, viewW), Math.max(m.h, viewH));
    cam.startFollow(this.player, true, 0.18, 0.18, 0, 10);
    cam.setBackgroundColor(m.indoor ? '#1a1018' : '#1b1424');
    cam.roundPixels = true;
    cam.fadeIn(250, 27, 20, 36);

    // gece ışığı katmanı
    this.overlay = this.add
      .rectangle(-50, -50, m.w + 100, m.h + 100, 0xffffff)
      .setOrigin(0)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(20000);
    if (GameState.hasTool('fener') && !m.indoor) {
      this.playerLight = this.add.image(0, 0, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xffd890).setScale(1.6).setDepth(20002);
    }

    if (m.fireflies) {
      this.fireflies = this.add.particles(0, 0, 'px', {
        emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(0, 0, m.w, m.h), quantity: 1 } as Phaser.Types.GameObjects.Particles.EmitZoneData,
        lifespan: 4000,
        speed: { min: 3, max: 12 },
        alpha: { values: [0, 1, 0.6, 1, 0], interpolation: 'linear' },
        scale: { min: 0.5, max: 1 },
        tint: 0xfff6a8,
        blendMode: 'ADD',
        frequency: 90,
      } as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig);
      this.fireflies.setDepth(20003);
    }

    // klavye
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,E,ENTER') as Record<string, Phaser.Input.Keyboard.Key>;
    kb.on('keydown-SPACE', () => this.doAction());
    kb.on('keydown-E', () => this.doAction());
    kb.on('keydown-ENTER', () => this.doAction());

    // olaylar
    const ev = GameState.events;
    const onAction = () => this.doAction();
    const onCustomers = () => this.refreshCustomers();
    const onPassout = () => this.passOut();
    ev.on('action', onAction);
    ev.on('customers', onCustomers);
    ev.on('passout', onPassout);
    this.events.once('shutdown', () => {
      ev.off('action', onAction);
      ev.off('customers', onCustomers);
      ev.off('passout', onPassout);
      ev.emit('target', null);
    });

    GameState.spawnHandler = () => this.makeCustomer();

    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.scene.bringToTop('UI');
    ev.emit('location', m.name);

    this.refreshCustomers();
    this.refreshAmbient();
    this.updateLighting();

    if (!GameState.data.introDone) this.time.delayedCall(400, () => this.intro());
  }

  private block(cx: number, cy: number, w: number, h: number) {
    const z = this.add.zone(cx, cy, w, h);
    this.physics.add.existing(z, true);
    this.blockers.add(z);
  }

  private addLight(x: number, y: number, r: number, color: number, always = false) {
    const img = this.add
      .image(x, y, 'glow')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(color)
      .setScale(r / 32)
      .setDepth(20001);
    this.glows.push({ img, always });
    this.tweens.add({ targets: img, scale: (r / 32) * 1.06, yoyo: true, repeat: -1, duration: 700 + Math.random() * 500 });
  }

  // ---------- Güncelleme ----------
  update(_t: number, dt: number) {
    GameState.update(dt);
    if (!this.player) return;

    let vx = 0;
    let vy = 0;
    const k = this.keys;
    if (!GameState.paused && !this.busy) {
      if (k.A.isDown || k.LEFT.isDown) vx -= 1;
      if (k.D.isDown || k.RIGHT.isDown) vx += 1;
      if (k.W.isDown || k.UP.isDown) vy -= 1;
      if (k.S.isDown || k.DOWN.isDown) vy += 1;
      if (vx === 0 && vy === 0) {
        vx = Pad.x;
        vy = Pad.y;
      }
    }
    const len = Math.hypot(vx, vy);
    if (len > 1) {
      vx /= len;
      vy /= len;
    }
    this.player.setVelocity(vx * SPEED, vy * SPEED);
    const moving = len > 0.1;
    if (moving) {
      if (Math.abs(vx) > Math.abs(vy)) {
        this.facing = 'side';
        this.player.setFlipX(vx < 0);
      } else this.facing = vy < 0 ? 'up' : 'down';
      this.player.anims.play(`player_${this.facing}`, true);
      this.stepTimer += dt;
      if (this.stepTimer > 300) {
        this.stepTimer = 0;
        if (!this.map.indoor) sfx('step');
      }
    } else {
      this.player.anims.stop();
      this.player.setFrame(this.facing === 'down' ? 0 : this.facing === 'up' ? 3 : 6);
    }
    this.player.setDepth(this.player.y);
    this.shadow.setPosition(this.player.x, this.player.y).setDepth(this.player.y - 1);
    if (this.playerLight) this.playerLight.setPosition(this.player.x, this.player.y - 10);

    this.findTarget();

    if (GameState.data.minutes !== this.lastMinuteCheck) {
      this.lastMinuteCheck = GameState.data.minutes;
      this.updateLighting();
      if (GameState.data.minutes % 10 === 0) {
        this.refreshNodes();
        this.refreshAmbient();
      }
    }
  }

  private findTarget() {
    const px = this.player.x;
    const py = this.player.y - 4;
    let best: Target | null = null;
    let bestD = 1e9;
    const consider = (t: Target) => {
      const d = Math.hypot(t.x - px, t.y - py);
      if (d < t.r && d < bestD) {
        best = t;
        bestD = d;
      }
    };
    for (const t of this.targets) {
      if (t.kind === 'villager' && t.villagerId && !this.villagerSprites.get(t.villagerId)?.visible) continue;
      consider(t);
    }
    for (const n of this.nodeSprites) {
      if (!n.sprite.visible) continue;
      consider({ kind: 'node', x: n.def.x, y: n.def.y - 4, r: 16, label: `Topla: ${INGREDIENTS[n.def.item].name}`, node: n });
    }
    const b = best as Target | null;
    const changed = (b?.label ?? null) !== (this.current?.label ?? null) || b?.node !== this.current?.node;
    this.current = b;
    if (changed) GameState.events.emit('target', b ? b.label : null);
  }

  // ---------- Işık ----------
  private updateLighting() {
    const dark = GameState.darkness * (this.map.indoor ? 0.45 : 1);
    const dusk = GameState.dusk * (this.map.indoor ? 0.3 : 1);
    let c = 0xffffff;
    c = mix(c, 0xffb080, dusk * 0.45);
    c = mix(c, this.map.indoor ? 0x6a4a6a : 0x2a3068, dark);
    this.overlay.setFillStyle(c);
    for (const l of this.glows) l.img.setAlpha(l.always ? 0.35 + dark * 0.6 : Math.max(0, dark - 0.1) * 1.1);
    if (this.playerLight) this.playerLight.setAlpha(Math.max(0, dark - 0.2) * 0.9);
    if (this.fireflies) this.fireflies.emitting = GameState.isNight;
  }

  // ---------- Düğümler / sakinler / müşteriler ----------
  private nodeActive(def: GatherNode, idx: number): boolean {
    const key = `${this.map.id}:${idx}`;
    if (GameState.gathered.has(key)) return false;
    if (dayRand(GameState.data.day, idx, this.map.id.length) > 0.8) return false;
    const m = GameState.data.minutes;
    if (def.when === 'morning') return m < 11 * 60;
    if (def.when === 'night') return GameState.isNight && GameState.hasTool('fener');
    return true;
  }

  private refreshNodes() {
    for (const n of this.nodeSprites) {
      const on = this.nodeActive(n.def, n.idx);
      n.sprite.setVisible(on);
      n.glow?.setVisible(on);
    }
  }

  private refreshAmbient() {
    const late = GameState.data.minutes >= 21 * 60;
    const inShop = new Set(GameState.customers.map((c) => c.villagerId));
    for (const [id, s] of this.villagerSprites) {
      if (id === 'nermin') {
        s.setVisible(GameState.data.minutes >= 8 * 60 && GameState.data.minutes < 20 * 60);
        continue;
      }
      s.setVisible(!late && !inShop.has(id));
    }
  }

  private refreshCustomers() {
    this.refreshAmbient();
    if (this.map.id !== 'shop') return;
    for (const s of this.customerSprites) s.destroy();
    this.customerSprites = [];
    GameState.customers.forEach((c, i) => {
      const x = 40 + i * 22;
      const y = 146 + (i % 2) * 3;
      const s = this.add.sprite(x, y, `npc_${c.villagerId}`, 3).setOrigin(0.5, 1).setDepth(y);
      s.alpha = 0;
      this.tweens.add({ targets: s, alpha: 1, duration: 300 });
      this.customerSprites.push(s);
      if (i === 0) {
        const bub = this.add.image(x, y - 26, `pot_${c.potion}`).setDepth(y + 1);
        this.tweens.add({ targets: bub, y: y - 29, yoyo: true, repeat: -1, duration: 500 });
        this.customerSprites.push(bub as unknown as Phaser.GameObjects.Sprite);
      }
    });
  }

  private makeCustomer(): Customer | null {
    const busy = new Set(GameState.customers.map((c) => c.villagerId));
    const free = VILLAGERS.filter((v) => !busy.has(v.id));
    if (!free.length) return null;
    const v = Phaser.Utils.Array.GetRandom(free);
    const weighted: { potion: PotionId; line: string }[] = [];
    for (const w of v.wants) {
      const n = GameState.isDiscovered(w.potion) ? 3 : 1;
      for (let i = 0; i < n; i++) weighted.push({ potion: w.potion, line: Phaser.Utils.Array.GetRandom(w.lines) });
    }
    const pick = Phaser.Utils.Array.GetRandom(weighted);
    const now = GameState.data.minutes;
    return { villagerId: v.id, potion: pick.potion, line: pick.line, arrive: now, leave: now + 180 };
  }

  // ---------- Etkileşimler ----------
  private async doAction() {
    const t = this.current;
    if (!t || this.busy || GameState.paused) return;
    switch (t.kind) {
      case 'door':
        sfx('door');
        this.go(t.ref!.target!, t.ref!.spawn!);
        break;
      case 'exit':
        await openModal(this, 'Travel', { from: this.map.id });
        break;
      case 'counter':
        if (GameState.customers.length) await openModal(this, 'Serve');
        else
          GameState.events.emit(
            'toast',
            GameState.shopOpen ? 'Şu an bekleyen müşteri yok.' : 'Dükkân 09:00–19:00 arası açık.',
          );
        break;
      case 'cauldron':
        await openModal(this, 'Brew');
        break;
      case 'book':
        await openModal(this, 'Book');
        break;
      case 'bed':
        await openModal(this, 'Dialog', {
          pages: [{ text: GameState.data.minutes < 18 * 60 ? 'Daha erken... Yine de uyumak istiyor musun?' : 'Yorucu bir gündü. Uyumak istiyor musun?' }],
          choices: ['Uyu', 'Vazgeç'],
          onChoice: (i: number) => {
            if (i === 0) this.sleep(false);
          },
        });
        break;
      case 'merchant': {
        const open = GameState.data.minutes >= 8 * 60 && GameState.data.minutes < 20 * 60;
        if (open) await openModal(this, 'Merchant');
        else GameState.events.emit('toast', 'Tüccar tezgâhını kapatmış. (08:00–20:00)');
        break;
      }
      case 'villager': {
        const v = VILLAGERS.find((vv) => vv.id === t.villagerId)!;
        const a = this.map.ambient.find((aa) => aa.villager === v.id)!;
        const s = this.villagerSprites.get(v.id)!;
        // oyuncuya dön
        const dx = this.player.x - s.x;
        const dy = this.player.y - s.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          s.setFrame(6);
          s.setFlipX(dx < 0);
        } else s.setFrame(dy < 0 ? 3 : 0);
        const hearts = GameState.data.hearts[v.id] ?? 0;
        await openModal(this, 'Dialog', {
          pages: [{ name: `${v.name} · ${v.title}`, portrait: `npc_${v.id}_portrait`, text: a.line, hearts }],
        });
        break;
      }
      case 'cat':
        sfx('pick');
        this.heartBurst(132, 118);
        GameState.events.emit('toast', Phaser.Utils.Array.GetRandom(['Tarçın mırladı.', 'Tarçın elini yaladı.', 'Tarçın göbeğini gösterdi!']));
        break;
      case 'sign':
        await openModal(this, 'Dialog', {
          pages: [{ text: '↑ Kuzey yolu\nRüzgârlı Çayır · Fısıltılı Orman\n\nAlt satırda solmuş bir el yazısı: "İyi bak dükkâna. — S."' }],
        });
        break;
      case 'node':
        this.gather(t.node!);
        break;
      default:
        break;
    }
  }

  private gather(n: { def: GatherNode; idx: number; sprite: Phaser.GameObjects.Image; glow?: Phaser.GameObjects.Image }) {
    const key = `${this.map.id}:${n.idx}`;
    GameState.gathered.add(key);
    const qty = Math.random() < 0.3 ? 2 : 1;
    GameState.addIngredient(n.def.item, qty);
    sfx('pick');
    const { sprite, glow } = n;
    this.tweens.killTweensOf(sprite);
    this.tweens.add({
      targets: sprite,
      y: sprite.y - 14,
      alpha: 0,
      duration: 350,
      ease: 'Quad.Out',
      onComplete: () => {
        sprite.setVisible(false).setAlpha(1);
        sprite.y = n.def.y;
        sprite.angle = 0;
        this.tweens.add({ targets: sprite, angle: { from: -3, to: 3 }, yoyo: true, repeat: -1, duration: 1400 });
      },
    });
    glow?.setVisible(false);
    const sp = this.add.particles(n.def.x, n.def.y - 6, 'sparkle', {
      speed: { min: 20, max: 50 },
      lifespan: 400,
      quantity: 6,
      scale: { start: 1, end: 0 },
      tint: [0xffffff, 0xfff0a0],
      emitting: false,
    });
    sp.setDepth(30000);
    sp.explode(6);
    this.time.delayedCall(600, () => sp.destroy());
    const label = txt(this, n.def.x, n.def.y - 20, `+${qty} ${INGREDIENTS[n.def.item].name}`, 8, '#fff4dc', {
      stroke: '#2a1d2e',
      strokeThickness: 2,
    })
      .setOrigin(0.5)
      .setDepth(30001);
    this.tweens.add({ targets: label, y: label.y - 12, alpha: 0, duration: 1100, delay: 300, onComplete: () => label.destroy() });
    GameState.advance(5);
  }

  private heartBurst(x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      const h = this.add.image(x + (i - 1) * 6, y, 'heart').setDepth(30000);
      this.tweens.add({ targets: h, y: y - 16 - i * 4, alpha: 0, duration: 900, delay: i * 120, onComplete: () => h.destroy() });
    }
  }

  go(map: MapId, spawn: string) {
    if (this.busy) return;
    this.busy = true;
    this.player.setVelocity(0, 0);
    this.cameras.main.fadeOut(220, 27, 20, 36);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ map, spawn }));
  }

  private sleep(passedOut: boolean) {
    this.busy = true;
    this.player.setVelocity(0, 0);
    GameState.pause();
    const cam = this.cameras.main;
    cam.fadeOut(600, 10, 6, 16);
    cam.once('camerafadeoutcomplete', () => {
      GameState.sleep();
      GameState.resume();
      GameState.events.emit('daysplash', passedOut);
      this.scene.restart({ map: 'shop', spawn: 'bed' });
    });
  }

  private passOut() {
    if (this.busy) return;
    const lost = Math.min(50, Math.floor(GameState.data.gold * 0.1));
    GameState.addGold(-lost);
    GameState.events.emit('toast', lost > 0 ? `Yorgunluktan bayıldın... (−${lost} altın)` : 'Yorgunluktan bayıldın...');
    this.sleep(true);
  }

  private async intro() {
    const dede = 'dede_portrait';
    await openModal(this, 'Dialog', {
      pages: [
        { name: 'Dedenin mektubu', portrait: dede, text: 'Sevgili torunum,\n\nBu mektubu okuyorsan, dükkân artık senindir. Kusura bakma, biraz tozlu bıraktım.' },
        {
          name: 'Dedenin mektubu',
          portrait: dede,
          text: 'Kürsüdeki defter, ustam Saadet Hanım\'dan bana kaldı. Ömrüm boyunca sayfalarını tamamlamaya çalıştım. Bazıları hâlâ yarım.',
        },
        {
          name: 'Dedenin mektubu',
          portrait: dede,
          text: 'Kazanı, kediyi ve kasabayı sana emanet ediyorum. Komşulara iyi bak; onlar da sana bakar.\n\nSevgiyle, deden.',
        },
        {
          text: 'İPUCU\n• Tezgâhta müşterilere iksir sat (09:00–19:00).\n• Kazanda malzemeleri karıştırıp iksir yap.\n• Kuzeydeki yoldan çayıra gidip malzeme topla.\n• Gece olunca yatağında uyu.',
        },
      ],
    });
    GameState.data.introDone = true;
    GameState.save();
  }
}
