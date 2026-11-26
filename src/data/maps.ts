import type { TerrainSpec } from '../art/ground';
import type { IngredientId } from './items';
import type { MapId } from '../state/GameState';

export interface MapObject {
  tex: string;
  x: number; // alt-orta
  y: number;
  collide?: [number, number]; // ayak kutusu (genişlik, yükseklik)
  flip?: boolean;
  light?: { dx: number; dy: number; r: number; color: number }; // gece ışığı
  decal?: boolean; // zeminde, y sıralaması yok
}

export type InteractKind = 'door' | 'exit' | 'counter' | 'cauldron' | 'book' | 'bed' | 'merchant' | 'villager' | 'cat' | 'sign';

export interface Interactable {
  kind: InteractKind;
  x: number;
  y: number;
  r: number;
  label: string;
  target?: MapId;
  spawn?: string;
  villager?: string;
}

export type NodeWhen = 'any' | 'morning' | 'night';

export interface GatherNode {
  item: IngredientId;
  x: number;
  y: number;
  when: NodeWhen;
}

export interface Ambient {
  villager: string;
  x: number;
  y: number;
  face: 'down' | 'left' | 'right' | 'up';
  line: string;
}

export interface MapDef {
  id: MapId;
  name: string;
  w: number;
  h: number;
  indoor: boolean;
  terrain?: TerrainSpec;
  objects: MapObject[];
  interact: Interactable[];
  nodes: GatherNode[];
  ambient: Ambient[];
  spawns: Record<string, [number, number]>;
  fireflies?: boolean;
}

// Yardımcı: ağaç sırası
function treeRow(tex: string[], xs: number[], y: number, jitter = 6): MapObject[] {
  return xs.map((x, i) => ({ tex: tex[i % tex.length], x, y: y + ((i * 37) % (jitter * 2)) - jitter, collide: [10, 6] as [number, number] }));
}

export const MAPS: Record<MapId, MapDef> = {
  town: {
    id: 'town',
    name: 'Kasaba',
    w: 320,
    h: 480,
    indoor: false,
    terrain: {
      seed: 11,
      theme: 'town',
      flowers: 0.5,
      dirt: [
        { t: 'blob', x: 152, y: 178, rx: 74, ry: 24 },
        { t: 'path', pts: [[160, 0], [158, 60], [152, 170]], r: 13 },
        { t: 'path', pts: [[152, 170], [156, 250], [160, 340], [150, 420], [160, 480]], r: 12 },
        { t: 'path', pts: [[156, 250], [100, 262], [58, 272]], r: 11 },
        { t: 'path', pts: [[156, 250], [210, 262], [262, 278]], r: 11 },
        { t: 'path', pts: [[158, 340], [110, 362], [66, 372]], r: 12 },
        { t: 'blob', x: 66, y: 378, rx: 36, ry: 18 },
        { t: 'blob', x: 250, y: 210, rx: 26, ry: 12 },
        { t: 'blob', x: 40, y: 200, rx: 16, ry: 8 },
        { t: 'blob', x: 220, y: 330, rx: 18, ry: 8 },
      ],
      stone: [{ t: 'blob', x: 158, y: 262, rx: 30, ry: 18 }],
      water: [
        { t: 'blob', x: 282, y: 420, rx: 62, ry: 40 },
        { t: 'blob', x: 310, y: 470, rx: 60, ry: 34 },
        { t: 'blob', x: 330, y: 360, rx: 30, ry: 40 },
      ],
    },
    objects: [
      { tex: 'shop', x: 156, y: 160, collide: [100, 32], light: { dx: -30, dy: -20, r: 40, color: 0xffc070 } },
      { tex: 'house_orange', x: 58, y: 262, collide: [66, 26], light: { dx: -22, dy: -14, r: 26, color: 0xffc070 } },
      { tex: 'house_blue', x: 262, y: 268, collide: [66, 26], light: { dx: 22, dy: -14, r: 26, color: 0xffc070 } },
      { tex: 'well', x: 158, y: 270, collide: [24, 10] },
      { tex: 'stall', x: 66, y: 368, collide: [50, 12] },
      { tex: 'lamp', x: 122, y: 196, collide: [4, 3], light: { dx: 0, dy: -26, r: 42, color: 0xffd890 } },
      { tex: 'lamp', x: 192, y: 196, collide: [4, 3], light: { dx: 0, dy: -26, r: 42, color: 0xffd890 } },
      { tex: 'lamp', x: 132, y: 330, collide: [4, 3], light: { dx: 0, dy: -26, r: 42, color: 0xffd890 } },
      { tex: 'lamp', x: 98, y: 386, collide: [4, 3], light: { dx: 0, dy: -26, r: 42, color: 0xffd890 } },
      { tex: 'sign', x: 182, y: 40, collide: [4, 3] },
      { tex: 'barrel', x: 216, y: 152, collide: [12, 6] },
      { tex: 'barrel', x: 228, y: 158, collide: [12, 6] },
      { tex: 'crate', x: 220, y: 168, collide: [12, 6] },
      { tex: 'pot', x: 130, y: 166, collide: [8, 4] },
      { tex: 'pot', x: 172, y: 166, collide: [8, 4] },
      { tex: 'barrel', x: 104, y: 380, collide: [12, 6] },
      { tex: 'crate', x: 30, y: 384, collide: [12, 6] },
      ...treeRow(['pine', 'pine2'], [8, 34, 62, 92, 120], 56, 8),
      ...treeRow(['pine2', 'pine'], [200, 228, 256, 286, 314], 58, 8),
      ...treeRow(['pine', 'oak'], [6, 314], 120, 8),
      { tex: 'oak', x: 24, y: 168, collide: [10, 6] },
      { tex: 'oak2', x: 300, y: 196, collide: [10, 6] },
      { tex: 'pine', x: 12, y: 322, collide: [10, 6] },
      { tex: 'oak', x: 28, y: 466, collide: [10, 6] },
      { tex: 'oak2', x: 100, y: 470, collide: [10, 6] },
      { tex: 'pine2', x: 206, y: 476, collide: [10, 6] },
      { tex: 'pine', x: 312, y: 300, collide: [10, 6] },
      { tex: 'bush', x: 96, y: 130 },
      { tex: 'bush_berry', x: 222, y: 120 },
      { tex: 'bush', x: 12, y: 226 },
      { tex: 'bush_berry', x: 208, y: 228 },
      { tex: 'bush', x: 120, y: 300 },
      { tex: 'bush', x: 300, y: 330 },
      { tex: 'bush_berry', x: 40, y: 420 },
      { tex: 'rock', x: 196, y: 300 },
      { tex: 'rock', x: 70, y: 150 },
      { tex: 'rock_big', x: 230, y: 380, collide: [16, 6] },
      { tex: 'rock', x: 190, y: 420 },
      { tex: 'fence', x: 16, y: 290 },
      { tex: 'fence', x: 32, y: 290 },
      { tex: 'fence', x: 84, y: 290 },
      { tex: 'fence', x: 100, y: 290 },
      { tex: 'fence', x: 228, y: 296 },
      { tex: 'fence', x: 244, y: 296 },
      { tex: 'fence', x: 290, y: 296 },
      { tex: 'fence', x: 306, y: 296 },
    ],
    interact: [
      { kind: 'door', x: 150, y: 166, r: 16, label: 'Dükkâna gir', target: 'shop', spawn: 'door' },
      { kind: 'exit', x: 160, y: 12, r: 22, label: 'Yolculuk' },
      { kind: 'merchant', x: 66, y: 380, r: 22, label: 'Tüccar Nermin' },
      { kind: 'sign', x: 182, y: 44, r: 16, label: 'Tabelayı oku' },
    ],
    nodes: [
      { item: 'sifa_otu', x: 40, y: 140, when: 'any' },
      { item: 'papatya', x: 290, y: 240, when: 'any' },
    ],
    ambient: [
      { villager: 'ayten', x: 92, y: 284, face: 'down', line: 'Fırından yeni çıktı simitler! Deden her sabah iki tane alırdı.' },
      { villager: 'selin', x: 190, y: 276, face: 'left', line: 'Okulun bahçesine şifa otu ekmek istiyorum. Çayırda bolca var, değil mi?' },
      { villager: 'mert', x: 130, y: 420, face: 'right', line: 'Çayıra kuzeyden çıkılır. Sabah erken gidersen yapraklarda çiy bulursun.' },
      { villager: 'elif', x: 214, y: 236, face: 'down', line: 'Dedenin kedisi Tarçın hâlâ dükkânda mı? Onu çok seviyorum!' },
      { villager: 'riza', x: 232, y: 404, face: 'right', line: 'Sessiz ol, balıklar kaçar... Ormana gidersen reçineli çamlara bak.' },
      { villager: 'kerem', x: 296, y: 286, face: 'left', line: 'Ormana giden yol dikenle kaplı. Nermin\'den bir orak al, ben bilerim.' },
    ],
    spawns: {
      start: [150, 180],
      door: [150, 180],
      north: [160, 34],
    },
  },

  shop: {
    id: 'shop',
    name: 'İksir Dükkânı',
    w: 192,
    h: 176,
    indoor: true,
    objects: [
      { tex: 'shelf', x: 30, y: 46, collide: [40, 6] },
      { tex: 'shelf', x: 162, y: 46, collide: [40, 6] },
      { tex: 'rug', x: 104, y: 146, decal: true },
      { tex: 'counter', x: 56, y: 120, collide: [64, 16] },
      { tex: 'cauldron', x: 150, y: 88, collide: [26, 10], light: { dx: 0, dy: -10, r: 36, color: 0x7affc0 } },
      { tex: 'lectern', x: 100, y: 72, collide: [14, 6] },
      { tex: 'bed', x: 174, y: 160, collide: [26, 34] },
      { tex: 'pot', x: 12, y: 64, collide: [8, 4] },
      { tex: 'pot', x: 120, y: 60, collide: [8, 4] },
      { tex: 'barrel', x: 14, y: 160, collide: [12, 6] },
      { tex: 'crate', x: 30, y: 164, collide: [12, 6] },
    ],
    interact: [
      { kind: 'door', x: 96, y: 168, r: 14, label: 'Dışarı çık', target: 'town', spawn: 'door' },
      { kind: 'counter', x: 56, y: 104, r: 30, label: 'Tezgâh' },
      { kind: 'cauldron', x: 150, y: 86, r: 22, label: 'Kazan' },
      { kind: 'book', x: 100, y: 70, r: 18, label: 'Dedemin Defteri' },
      { kind: 'bed', x: 172, y: 140, r: 22, label: 'Uyu' },
      { kind: 'cat', x: 132, y: 130, r: 14, label: 'Tarçın\'ı sev' },
    ],
    nodes: [],
    ambient: [],
    spawns: {
      start: [96, 100],
      door: [96, 150],
      bed: [150, 140],
    },
  },

  meadow: {
    id: 'meadow',
    name: 'Rüzgârlı Çayır',
    w: 320,
    h: 440,
    indoor: false,
    terrain: {
      seed: 23,
      theme: 'meadow',
      flowers: 1.4,
      dirt: [
        { t: 'path', pts: [[160, 440], [170, 380], [140, 320], [150, 250], [190, 190], [180, 120]], r: 10 },
        { t: 'blob', x: 182, y: 110, rx: 30, ry: 16 },
        { t: 'blob', x: 260, y: 300, rx: 20, ry: 10 },
      ],
      water: [{ t: 'blob', x: 62, y: 230, rx: 46, ry: 30 }],
    },
    objects: [
      ...treeRow(['oak', 'oak2', 'pine'], [10, 40, 74, 110, 150, 200, 240, 276, 310], 36, 10),
      { tex: 'oak', x: 290, y: 150, collide: [10, 6] },
      { tex: 'oak2', x: 30, y: 330, collide: [10, 6] },
      { tex: 'pine', x: 300, y: 400, collide: [10, 6] },
      { tex: 'oak', x: 20, y: 430, collide: [10, 6] },
      { tex: 'rock_big', x: 230, y: 230, collide: [16, 6] },
      { tex: 'rock', x: 110, y: 160 },
      { tex: 'rock_moss', x: 270, y: 360 },
      { tex: 'bush', x: 220, y: 90 },
      { tex: 'bush_berry', x: 90, y: 300 },
      { tex: 'bush', x: 250, y: 430 },
      { tex: 'fence', x: 110, y: 410 },
      { tex: 'fence', x: 126, y: 410 },
      { tex: 'fence', x: 196, y: 410 },
      { tex: 'fence', x: 212, y: 410 },
      { tex: 'sign', x: 186, y: 424, collide: [4, 3] },
    ],
    interact: [{ kind: 'exit', x: 160, y: 432, r: 22, label: 'Yolculuk' }],
    nodes: [
      { item: 'sifa_otu', x: 120, y: 360, when: 'any' },
      { item: 'sifa_otu', x: 230, y: 330, when: 'any' },
      { item: 'sifa_otu', x: 80, y: 120, when: 'any' },
      { item: 'sifa_otu', x: 260, y: 190, when: 'any' },
      { item: 'sifa_otu', x: 200, y: 280, when: 'any' },
      { item: 'papatya', x: 100, y: 400, when: 'any' },
      { item: 'papatya', x: 210, y: 380, when: 'any' },
      { item: 'papatya', x: 130, y: 210, when: 'any' },
      { item: 'papatya', x: 280, y: 270, when: 'any' },
      { item: 'papatya', x: 60, y: 160, when: 'any' },
      { item: 'ciy', x: 150, y: 140, when: 'morning' },
      { item: 'ciy', x: 240, y: 140, when: 'morning' },
      { item: 'ciy', x: 110, y: 270, when: 'morning' },
      { item: 'ciy', x: 60, y: 380, when: 'morning' },
      { item: 'ay_cicegi', x: 40, y: 280, when: 'night' },
      { item: 'ay_cicegi', x: 110, y: 230, when: 'night' },
      { item: 'ay_cicegi', x: 230, y: 70, when: 'night' },
      { item: 'ay_cicegi', x: 290, y: 330, when: 'night' },
    ],
    ambient: [],
    spawns: { start: [160, 410], south: [160, 410] },
  },

  forest: {
    id: 'forest',
    name: 'Fısıltılı Orman',
    w: 320,
    h: 480,
    indoor: false,
    fireflies: true,
    terrain: {
      seed: 37,
      theme: 'forest',
      flowers: 0.5,
      dirt: [
        { t: 'path', pts: [[160, 480], [150, 400], [180, 330], [160, 260], [120, 200], [140, 130], [180, 90]], r: 9 },
        { t: 'blob', x: 180, y: 86, rx: 26, ry: 14 },
        { t: 'blob', x: 240, y: 260, rx: 18, ry: 10 },
      ],
      water: [{ t: 'blob', x: 260, y: 150, rx: 34, ry: 20 }],
    },
    objects: [
      ...treeRow(['fpine', 'fpine2', 'foak'], [8, 34, 60, 88, 116, 146, 176, 206, 236, 264, 292, 316], 40, 10),
      ...treeRow(['fpine2', 'foak', 'fpine'], [10, 40, 72], 120, 12),
      ...treeRow(['fpine', 'fpine2'], [300, 316], 220, 12),
      ...treeRow(['foak', 'fpine'], [14, 50, 82], 280, 12),
      ...treeRow(['fpine2', 'fpine'], [250, 292, 316], 330, 12),
      ...treeRow(['fpine', 'foak', 'fpine2'], [12, 44, 84], 400, 12),
      ...treeRow(['fpine', 'fpine2'], [236, 270, 306], 440, 10),
      { tex: 'fpine', x: 210, y: 200, collide: [10, 6] },
      { tex: 'foak', x: 110, y: 330, collide: [10, 6] },
      { tex: 'log', x: 220, y: 380, collide: [26, 6] },
      { tex: 'log', x: 90, y: 180, collide: [26, 6], flip: true },
      { tex: 'stump', x: 200, y: 140, collide: [12, 5] },
      { tex: 'stump', x: 60, y: 350, collide: [12, 5] },
      { tex: 'rock_moss', x: 130, y: 250 },
      { tex: 'rock_moss', x: 270, y: 290 },
      { tex: 'rock_big', x: 40, y: 220, collide: [16, 6] },
      { tex: 'bush', x: 200, y: 460 },
      { tex: 'bush', x: 110, y: 460 },
      { tex: 'bush_berry', x: 230, y: 230 },
    ],
    interact: [{ kind: 'exit', x: 160, y: 472, r: 22, label: 'Yolculuk' }],
    nodes: [
      { item: 'mantar', x: 70, y: 196, when: 'any' },
      { item: 'mantar', x: 210, y: 396, when: 'any' },
      { item: 'mantar', x: 76, y: 362, when: 'any' },
      { item: 'mantar', x: 190, y: 150, when: 'any' },
      { item: 'mantar', x: 280, y: 400, when: 'any' },
      { item: 'recine', x: 116, y: 136, when: 'any' },
      { item: 'recine', x: 212, y: 210, when: 'any' },
      { item: 'recine', x: 268, y: 342, when: 'any' },
      { item: 'recine', x: 50, y: 412, when: 'any' },
      { item: 'yosun', x: 140, y: 262, when: 'any' },
      { item: 'yosun', x: 280, y: 300, when: 'any' },
      { item: 'yosun', x: 30, y: 300, when: 'any' },
      { item: 'yosun', x: 230, y: 112, when: 'any' },
      { item: 'atesbocegi', x: 150, y: 190, when: 'night' },
      { item: 'atesbocegi', x: 240, y: 280, when: 'night' },
      { item: 'atesbocegi', x: 100, y: 420, when: 'night' },
      { item: 'atesbocegi', x: 190, y: 330, when: 'night' },
      { item: 'sifa_otu', x: 170, y: 430, when: 'any' },
    ],
    ambient: [],
    spawns: { start: [160, 450], south: [160, 450] },
  },
};

export interface Destination {
  id: MapId;
  name: string;
  desc: string;
  minutes: number;
  needs?: 'orak';
}

export const DESTINATIONS: Destination[] = [
  { id: 'town', name: 'Kasaba', desc: 'Dükkânın, komşuların ve tüccar.', minutes: 30 },
  { id: 'meadow', name: 'Rüzgârlı Çayır', desc: 'Şifa otu, papatya. Sabah çiy, gece ay çiçeği.', minutes: 30 },
  { id: 'forest', name: 'Fısıltılı Orman', desc: 'Mantar, reçine, yosun. Gece ateş böcekleri.', minutes: 50, needs: 'orak' },
];
