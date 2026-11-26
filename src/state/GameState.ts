import Phaser from 'phaser';
import { POTIONS, type IngredientId, type PotionId } from '../data/items';
import type { ToolId } from '../data/npcs';

export const MS_PER_GAME_MINUTE = 450; // 1 oyun dakikası = 0.45 sn
export const DAY_START = 6 * 60;
export const DAY_END = 26 * 60; // gece 02:00'de bayılır
export const SHOP_OPEN = 9 * 60;
export const SHOP_CLOSE = 19 * 60;

const SAVE_KEY = 'dedemin-iksir-defteri/save-v1';

export type MapId = 'town' | 'shop' | 'meadow' | 'forest';

export interface Customer {
  villagerId: string;
  potion: PotionId;
  line: string;
  arrive: number; // dakika
  leave: number;
}

export interface SaveData {
  day: number;
  minutes: number;
  gold: number;
  ingredients: Partial<Record<IngredientId, number>>;
  potions: Record<string, number>; // "sifa:2" → adet
  discovered: PotionId[];
  tools: ToolId[];
  hearts: Record<string, number>;
  introDone: boolean;
  totalSold: number;
}

function freshData(): SaveData {
  return {
    day: 1,
    minutes: 8 * 60,
    gold: 40,
    ingredients: { sifa_otu: 2, papatya: 2 },
    potions: { 'sifa:2': 1 },
    discovered: (Object.keys(POTIONS) as PotionId[]).filter((p) => POTIONS[p].page === 'known'),
    tools: [],
    hearts: {},
    introDone: false,
    totalSold: 0,
  };
}

class GameStateClass {
  data: SaveData = freshData();
  events = new Phaser.Events.EventEmitter();
  /** Menü açıkken zaman durur. */
  pauseCount = 0;
  private acc = 0;
  /** Gün içinde toplanmış düğümler: "meadow:3" */
  gathered = new Set<string>();
  customers: Customer[] = [];
  private nextCustomerAt = 0;

  newGame() {
    this.data = freshData();
    this.resetDay();
  }

  hasSave(): boolean {
    try {
      return !!localStorage.getItem(SAVE_KEY);
    } catch {
      return false;
    }
  }

  load(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      this.data = { ...freshData(), ...JSON.parse(raw) };
      this.resetDay();
      return true;
    } catch {
      return false;
    }
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      /* depolama kapalı olabilir, oyun yine de çalışır */
    }
  }

  private resetDay() {
    this.gathered.clear();
    this.customers = [];
    this.nextCustomerAt = SHOP_OPEN + Phaser.Math.Between(0, 30);
  }

  // ---- Zaman ----
  get paused() {
    return this.pauseCount > 0;
  }
  pause() {
    this.pauseCount++;
  }
  resume() {
    this.pauseCount = Math.max(0, this.pauseCount - 1);
  }

  update(dt: number) {
    if (this.paused) return;
    this.acc += dt;
    while (this.acc >= MS_PER_GAME_MINUTE) {
      this.acc -= MS_PER_GAME_MINUTE;
      this.advance(1);
    }
  }

  advance(mins: number) {
    for (let i = 0; i < mins; i++) {
      this.data.minutes++;
      this.tickCustomers();
      if (this.data.minutes >= DAY_END) {
        this.events.emit('passout');
        return;
      }
    }
    this.events.emit('time');
  }

  sleep() {
    this.data.day++;
    this.data.minutes = DAY_START;
    this.resetDay();
    this.save();
    this.events.emit('time');
    this.events.emit('newday');
  }

  get timeString(): string {
    const m = this.data.minutes % (24 * 60);
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  /** 0 = gündüz, 1 = gece karanlığı */
  get darkness(): number {
    const m = this.data.minutes;
    if (m < 7 * 60) return 0.6 - ((m - DAY_START) / 60) * 0.6; // şafak
    if (m < 18 * 60) return 0;
    if (m < 21 * 60) return ((m - 18 * 60) / 180) * 0.85;
    return 0.85;
  }

  /** Akşam/şafak sıcak tonu 0..1 */
  get dusk(): number {
    const m = this.data.minutes;
    if (m >= 17 * 60 && m < 20 * 60) return 1 - Math.abs(m - 18.5 * 60) / 90;
    if (m < 7 * 60) return 0.5;
    return 0;
  }

  get isNight(): boolean {
    return this.data.minutes >= 20 * 60 || this.data.minutes < 5 * 60;
  }

  get shopOpen(): boolean {
    return this.data.minutes >= SHOP_OPEN && this.data.minutes < SHOP_CLOSE;
  }

  // ---- Müşteriler ----
  private tickCustomers() {
    const m = this.data.minutes;
    const before = this.customers.length;
    this.customers = this.customers.filter((c) => c.leave > m);
    if (this.customers.length !== before) this.events.emit('customers');
    if (!this.shopOpen) return;
    if (m >= this.nextCustomerAt && this.customers.length < 3) {
      this.spawnCustomer();
      this.nextCustomerAt = m + Phaser.Math.Between(50, 110);
    }
  }

  spawnHandler: (() => Customer | null) | null = null;

  private spawnCustomer() {
    const c = this.spawnHandler?.();
    if (c) {
      this.customers.push(c);
      this.events.emit('customers');
      this.events.emit('toast', 'Dükkânda bir müşteri bekliyor!');
    }
  }

  // ---- Envanter ----
  addIngredient(id: IngredientId, n = 1) {
    this.data.ingredients[id] = (this.data.ingredients[id] ?? 0) + n;
    this.events.emit('inventory');
  }
  takeIngredient(id: IngredientId, n = 1): boolean {
    const have = this.data.ingredients[id] ?? 0;
    if (have < n) return false;
    this.data.ingredients[id] = have - n;
    this.events.emit('inventory');
    return true;
  }
  addPotion(id: PotionId, q: number, n = 1) {
    const k = `${id}:${q}`;
    this.data.potions[k] = (this.data.potions[k] ?? 0) + n;
    this.events.emit('inventory');
  }
  /** En yüksek kaliteli şişeyi verir. */
  takeBestPotion(id: PotionId): number {
    for (let q = 3; q >= 1; q--) {
      const k = `${id}:${q}`;
      if ((this.data.potions[k] ?? 0) > 0) {
        this.data.potions[k]--;
        if (this.data.potions[k] === 0) delete this.data.potions[k];
        this.events.emit('inventory');
        return q;
      }
    }
    return 0;
  }
  potionCount(id: PotionId): number {
    let n = 0;
    for (let q = 1; q <= 3; q++) n += this.data.potions[`${id}:${q}`] ?? 0;
    return n;
  }
  addGold(n: number) {
    this.data.gold += n;
    this.events.emit('gold');
  }
  hasTool(t: ToolId) {
    return this.data.tools.includes(t);
  }
  isDiscovered(p: PotionId) {
    return this.data.discovered.includes(p);
  }
}

export const GameState = new GameStateClass();
