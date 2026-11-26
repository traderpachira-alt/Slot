# Dedemin İksir Defteri

Tarayıcıda çalışan, dikey ekranlı (mobil öncelikli) 2D pixel art bir iksir dükkânı / yaşam simülasyonu.

Oyuncu, dedesinden kalan iksir dükkânını devralır. Dedenin ustasından kalan iksir defterinde
bazı sayfalar yarım, bazıları boş. Malzeme toplayıp kazanda deneyerek defteri tamamlarsın.

## Çalıştırma

```bash
npm install
npm run dev      # geliştirme sunucusu
npm run build    # dist/ klasörüne üretim derlemesi
```

## Kontroller

- **Telefonda:** Ekrana dokunup sürükle → yürü. Sağ alttaki **!** düğmesi → etkileşim.
- **Bilgisayarda:** WASD / ok tuşları, etkileşim için E / Boşluk / Enter.

## İlk sürümde neler var

- **Kasaba, dükkân içi, Rüzgârlı Çayır, Fısıltılı Orman**
- **Kazan mini oyunu:** İki eksenli tahta (Soğuk↔Sıcak, Yatıştırıcı↔Canlandırıcı). Her malzeme imleci
  bir yöne iter. Ateş (+sıcak) ve su (merkeze çeker) ile ince ayar yapılır. İmleç bir iksir bölgesine
  düşerse şişelenir, merkeze yakınlık kaliteyi (★1–3) belirler.
- **Dedenin defteri:** 3 tamamlanmış sayfa, 2 ipuçlu yarım sayfa, 1 boş sayfa. Yeni tarif keşfedilince
  dedenin bir anısı açılır.
- **Gün–gece döngüsü:** Dükkân 09:00–19:00 açık. Gece ay çiçeği ve ateş böcekleri (fener gerekir).
  02:00'de bayılırsın.
- **Müşteri siparişleri:** 6 kasabalı, her birinin istekleri ve kalp (dostluk) seviyesi var.
- **Tüccar:** Orak (ormana giriş), fener (gece toplama), bakır kazan (+1 şişe), temel malzemeler.
- Otomatik kayıt (uyuyunca), sentezlenmiş ses efektleri.

Tüm görseller `src/art/` altında kodla üretilir. Harici görsel dosyası yoktur.

## Klasör yapısı

```
src/
  art/      piksel çizim kütüphanesi, karakterler, nesneler, zemin boyama
  data/     malzemeler, iksirler, kasabalılar, haritalar
  state/    oyun durumu, zaman, kayıt
  scenes/   Phaser sahneleri (dünya, arayüz, kazan, defter, tezgâh...)
  ui/       ortak arayüz bileşenleri ve sesler
```
