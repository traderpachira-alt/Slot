// Malzemeler, iksirler ve dedenin defteri.
// Kazan tahtası iki eksenlidir:
//   x: Soğuk (-1) ↔ Sıcak (+1)
//   y: Yatıştırıcı (-1) ↔ Canlandırıcı (+1)

export type IngredientId =
  | 'sifa_otu'
  | 'papatya'
  | 'ciy'
  | 'ay_cicegi'
  | 'mantar'
  | 'recine'
  | 'atesbocegi'
  | 'yosun';

export type PotionId = 'sifa' | 'uyku' | 'isitici' | 'serinlik' | 'isilti' | 'sis';

export interface Ingredient {
  id: IngredientId;
  name: string;
  desc: string;
  vec: [number, number];
}

export interface Potion {
  id: PotionId;
  name: string;
  short: string;
  target: [number, number];
  price: number;
  color: number; // sıvı rengi
  glow: number; // parıltı rengi
  page: 'known' | 'hint' | 'blank';
  hint: string;
  memory: string; // sayfa tamamlanınca açılan anı
  recipeNote: string; // tamamlanmış sayfadaki tarif notu
}

export const INGREDIENTS: Record<IngredientId, Ingredient> = {
  sifa_otu: {
    id: 'sifa_otu',
    name: 'Şifa Otu',
    desc: 'Çayırda yetişen yumuşak yapraklı ot. Canlandırır.',
    vec: [0, 0.3],
  },
  papatya: {
    id: 'papatya',
    name: 'Kır Papatyası',
    desc: 'Güneşi seven küçük çiçek. Yatıştırır.',
    vec: [0, -0.3],
  },
  ciy: {
    id: 'ciy',
    name: 'Çiy Damlası',
    desc: 'Sabahın ilk saatlerinde yapraklarda birikir. Serin ve hafif.',
    vec: [-0.2, 0.1],
  },
  ay_cicegi: {
    id: 'ay_cicegi',
    name: 'Ay Çiçeği',
    desc: 'Yalnızca gece açan solgun mavi çiçek. Çok soğuktur.',
    vec: [-0.35, -0.15],
  },
  mantar: {
    id: 'mantar',
    name: 'Orman Mantarı',
    desc: 'Nemli kütüklerin dibinde biter. Hafif ılık, uyuşturucu.',
    vec: [0.1, -0.25],
  },
  recine: {
    id: 'recine',
    name: 'Reçine Damlası',
    desc: 'Çam kabuğundan sızan altın damla. Sıcaktır.',
    vec: [0.3, 0],
  },
  atesbocegi: {
    id: 'atesbocegi',
    name: 'Ateş Böceği Tozu',
    desc: 'Gece ormanında parlayan böceklerin bıraktığı toz.',
    vec: [0.25, 0.3],
  },
  yosun: {
    id: 'yosun',
    name: 'Gölge Yosunu',
    desc: 'Güneş görmeyen taşların üstünde yaşar. Serin ve ağır.',
    vec: [-0.2, -0.3],
  },
};

export const POTIONS: Record<PotionId, Potion> = {
  sifa: {
    id: 'sifa',
    name: 'Şifa İksiri',
    short: 'Şifa',
    target: [0, 0.55],
    price: 30,
    color: 0xe0465b,
    glow: 0xff9aa8,
    page: 'known',
    hint: '',
    recipeNote: 'İki tutam şifa otu. Kaynamaya bırakma, yeter.',
    memory: '',
  },
  uyku: {
    id: 'uyku',
    name: 'Uyku Şurubu',
    short: 'Uyku',
    target: [0, -0.6],
    price: 30,
    color: 0x7a6fd8,
    glow: 0xc2b8ff,
    page: 'known',
    hint: '',
    recipeNote: 'İki papatya. Kasabanın yarısı bununla uyur, bilirsin.',
    memory: '',
  },
  isitici: {
    id: 'isitici',
    name: 'Isıtıcı Tonik',
    short: 'Tonik',
    target: [0.6, 0.2],
    price: 45,
    color: 0xf08a2c,
    glow: 0xffd08a,
    page: 'known',
    hint: '',
    recipeNote: 'Reçine sıcaklık verir. Biraz şifa otu, tadı yumuşasın.',
    memory: '',
  },
  serinlik: {
    id: 'serinlik',
    name: 'Serinlik Merhemi',
    short: 'Serinlik',
    target: [-0.65, 0],
    price: 60,
    color: 0x48b9d8,
    glow: 0xb4f0ff,
    page: 'hint',
    hint:
      'Yaz sıcağında yanan çobanlar için... Ustam, "Gece açan şey soğuğu taşır" derdi. ' +
      'Ama yalnız başına insanı uyutur. Biraz canlılık eklemeli. Tam batıya, ne eksik ne fazla.',
    recipeNote: 'İki ay çiçeği, bir tutam şifa otu. Tam batı.',
    memory:
      'Bu merhemi ilk yaptığımda yaz kavurucuydu. Rıza\'nın babası teknede bayılmıştı. ' +
      'Merhemi sürdük, gözlerini açtı. O gün anladım: bu iş para işi değil torunum, insan işi.',
  },
  isilti: {
    id: 'isilti',
    name: 'Işıltı İksiri',
    short: 'Işıltı',
    target: [0.5, 0.6],
    price: 70,
    color: 0xf2d43c,
    glow: 0xfff6a8,
    page: 'hint',
    hint:
      'Karanlıkta yolunu kaybedenler için bir ışık. Ormanda gece dans eden küçük ateşler... ' +
      'Onların tozu hem ısıtır hem uyandırır. Kuzeydoğuya doğru, iki ölçü yeterli olmalı.',
    recipeNote: 'İki ölçü ateş böceği tozu. Kuzeydoğu.',
    memory:
      'Ustam Saadet Hanım bu iksiri bana bir kış gecesi gösterdi. Fener yağı bitmişti, ' +
      'şişeyi kaldırdı ve atölye gün gibi aydınlandı. "Işık her zaman bir şişeye sığar" dedi.',
  },
  sis: {
    id: 'sis',
    name: 'Sis Özü',
    short: 'Sis Özü',
    target: [-0.55, -0.5],
    price: 120,
    color: 0x8fa3b8,
    glow: 0xe6eef8,
    page: 'blank',
    hint: 'Bu sayfa boş. Dede buraya hiçbir şey yazmamış... Belki soğuk ve derin bir köşede bir şey vardır?',
    recipeNote: 'Ay çiçeği ve gölge yosunu. Güneybatının en derin köşesi.',
    memory:
      'Bunu sen buldun. Dedenin defterinde boş kalan sayfaya kendi elinle yazdın. ' +
      'Satır aralarında küçük bir not var, dedenin el yazısı: "Bir gün biri bu sayfayı dolduracak. Umarım sen olursun."',
  },
};

export const INGREDIENT_LIST = Object.values(INGREDIENTS);
export const POTION_LIST = Object.values(POTIONS);

export const ZONE_RADIUS = 0.2;

export function qualityFromDistance(d: number): number {
  if (d < 0.07) return 3;
  if (d < 0.13) return 2;
  if (d <= ZONE_RADIUS) return 1;
  return 0;
}

export const QUALITY_MULT = [0, 1, 1.35, 1.7];

export function potionPrice(id: PotionId, q: number): number {
  return Math.round(POTIONS[id].price * QUALITY_MULT[q]);
}
