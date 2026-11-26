import type { PotionId } from './items';

export interface CharLook {
  skin: number;
  hair: number;
  shirt: number;
  pants: number;
  accent: number;
  hairStyle: 'short' | 'long' | 'bun' | 'bald' | 'cap';
}

export interface Villager {
  id: string;
  name: string;
  title: string;
  look: CharLook;
  wants: { potion: PotionId; lines: string[] }[];
  thanks: string[];
}

export const PLAYER_LOOK: CharLook = {
  skin: 0xf2c6a0,
  hair: 0x7a3b2a,
  shirt: 0x3f7f78,
  pants: 0x3a3048,
  accent: 0xe8b04a,
  hairStyle: 'short',
};

export const VILLAGERS: Villager[] = [
  {
    id: 'ayten',
    name: 'Ayten Teyze',
    title: 'Fırıncı',
    look: { skin: 0xe8b48c, hair: 0xd8d0c8, shirt: 0xc0504d, pants: 0x5a3a3a, accent: 0xf4e4c4, hairStyle: 'bun' },
    wants: [
      { potion: 'uyku', lines: ['Fırın sabah dörtte yanıyor evladım, gece gözüme uyku girmiyor. Bir Uyku Şurubu ver bana.'] },
      { potion: 'sifa', lines: ['Hamur yoğururken bileğimi incittim. Deden olsa hemen bir Şifa İksiri uzatırdı.'] },
      { potion: 'serinlik', lines: ['Fırının önü cehennem gibi! Bir Serinlik Merhemi bulsam...'] },
    ],
    thanks: ['Allah razı olsun yavrum. Deden de böyleydi, kimseyi geri çevirmezdi.', 'Al bakalım, yarın sana sıcak simit ayırırım!'],
  },
  {
    id: 'riza',
    name: 'Balıkçı Rıza',
    title: 'Balıkçı',
    look: { skin: 0xc8946c, hair: 0x3a3a46, shirt: 0x3a5a8c, pants: 0x4a4038, accent: 0xd8c070, hairStyle: 'cap' },
    wants: [
      { potion: 'isitici', lines: ['Gölde sabah ayazı kemiklerime işliyor. Bir Isıtıcı Tonik lazım.'] },
      { potion: 'isilti', lines: ['Gece ağlara bakarken fenerim söndü. Işıltı İksiri diye bir şey vardı, değil mi?'] },
      { potion: 'serinlik', lines: ['Güneşte yandım, sırtım kıpkırmızı. Serinlik Merhemi var mı?'] },
    ],
    thanks: ['Sağ ol. Rahmetli deden babamın hayatını kurtarmıştı, bilir misin?', 'Bu iyi geldi. Akşama sana bir balık bırakırım.'],
  },
  {
    id: 'selin',
    name: 'Selin Öğretmen',
    title: 'Öğretmen',
    look: { skin: 0xf4d0b0, hair: 0x2a1e1a, shirt: 0x6a8c4a, pants: 0x3a3a50, accent: 0xe4c860, hairStyle: 'long' },
    wants: [
      { potion: 'sifa', lines: ['Çocuklardan biri teneffüste dizini yaraladı. Şifa İksiri var mı?'] },
      { potion: 'uyku', lines: ['Sınav kağıtları bitmiyor, uyuyamıyorum. Hafif bir Uyku Şurubu lütfen.'] },
      { potion: 'isilti', lines: ['Çocuklara gökyüzünü anlatacağım. Biraz Işıltı İksiri harika olurdu!'] },
    ],
    thanks: ['Çok teşekkürler! Çocuklara simyacının torununu anlatacağım.', 'Harikasın. Deden de sabırla her şeyi açıklardı.'],
  },
  {
    id: 'mert',
    name: 'Çoban Mert',
    title: 'Çoban',
    look: { skin: 0xd8a47c, hair: 0x8a5a2a, shirt: 0xb08a4a, pants: 0x4a5a3a, accent: 0xf0f0e0, hairStyle: 'short' },
    wants: [
      { potion: 'isitici', lines: ['Yaylada geceler soğuk. Bir Isıtıcı Tonik alayım.'] },
      { potion: 'serinlik', lines: ['Öğle sıcağında koyunların başında kavruldum. Serinlik Merhemi yapabilir misin?'] },
      { potion: 'sifa', lines: ['Bir kuzu dikene takıldı, ben de elimi kestim. Şifa İksiri lazım.'] },
    ],
    thanks: ['Eyvallah. Yolun çayıra düşerse uğra.', 'Sağ olasın. Ay çiçekleri gece tepenin ardında açar, biliyor musun?'],
  },
  {
    id: 'elif',
    name: 'Küçük Elif',
    title: 'Meraklı Çocuk',
    look: { skin: 0xf4cca8, hair: 0xd88a3a, shirt: 0xd86a9a, pants: 0x5a4a7a, accent: 0xffffff, hairStyle: 'long' },
    wants: [
      { potion: 'isilti', lines: ['Annem karanlıktan korkmamam için Işıltı İksiri alabileceğimi söyledi! Var mı?'] },
      { potion: 'sis', lines: ['Sis Özü diye bir iksir duydum! Gerçekten var mı? Bulursan bana sat, olur mu?'] },
      { potion: 'uyku', lines: ['Kardeşim hiç uyumuyor... Annem Uyku Şurubu almamı istedi.'] },
    ],
    thanks: ['Yaşasın! Sen dünyanın en iyi simyacısısın!', 'Büyüyünce ben de iksir yapacağım!'],
  },
  {
    id: 'kerem',
    name: 'Demirci Kerem',
    title: 'Demirci',
    look: { skin: 0xb8845c, hair: 0x1a1a1a, shirt: 0x5a4a44, pants: 0x3a3030, accent: 0xa05030, hairStyle: 'bald' },
    wants: [
      { potion: 'serinlik', lines: ['Ocağın başında elim yandı. Serinlik Merhemi, hemen!'] },
      { potion: 'sis', lines: ['Bir müşterim Sis Özü istiyor, iyi para verirmiş. Yapabilir misin?'] },
      { potion: 'sifa', lines: ['Çekiç parmağıma indi. Şifa İksiri var mı?'] },
    ],
    thanks: ['Teşekkürler. Aletlerin olursa bana getir, bilerim.', 'Hah, işte bu! Deden gibi elin hafif.'],
  },
];

export const MERCHANT: Villager = {
  id: 'nermin',
  name: 'Tüccar Nermin',
  title: 'Gezgin Tüccar',
  look: { skin: 0xe0ac84, hair: 0x5a2a4a, shirt: 0x8a3a6a, pants: 0x3a2a3a, accent: 0xf0c040, hairStyle: 'long' },
  wants: [],
  thanks: [],
};

export type ToolId = 'orak' | 'fener' | 'kazan';

export interface Tool {
  id: ToolId;
  name: string;
  price: number;
  desc: string;
}

export const TOOLS: Tool[] = [
  { id: 'orak', name: 'Orak', price: 120, desc: 'Orman yolundaki dikenli çalıları keser. Ormana gidebilirsin.' },
  { id: 'fener', name: 'Simyacı Feneri', price: 180, desc: 'Gece toplanan malzemeleri görmeni sağlar.' },
  { id: 'kazan', name: 'Bakır Kazan', price: 350, desc: 'Her demlemede bir şişe fazla iksir.' },
];
