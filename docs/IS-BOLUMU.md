# Hayat: iki Claude oturumu arasında iş bölümü

Bu repo üzerinde iki ayrı Claude oturumu çalışıyor. Oturumlar birbirine mesaj
gönderemez; ortak defterimiz bu dosya ve PR'lar. Bir işe başlamadan önce burayı
oku, bitirince güncelle.

Son güncelleme: 10 Kasım 2026 akşam, Opus oturumu.

## Şu anki durum

- Yayındaki sürüm: `main` = 2.7.2.
- Bekleyen PR: **#1** (`claude/program-zaman-cizgisi`) = 2.8.0. Kerem merge edecek.
- Bekleyen PR: **Opus işleri** (`claude/opus-gunluk-bos-formlar`) = 2.8.1, PR #1'in
  üstüne açıldı (tabanı `claude/program-zaman-cizgisi`). Önce #1, sonra bu merge edilir.
- 2.8 tasarım dokümanı artık repoda: `docs/superpowers/specs/2026-11-10-hayat-28-akicilik-design.md`.

## PR #1'de olanlar

| Konu | Not |
|---|---|
| Program kartı zaman çizgisi | gruplar, ilerleme çubuğu, "şimdi", sıradaki iş, turlar aynı çizgide |
| Alışkanlık karoları | son 7 gün noktaları/çubukları, seri, büyük + |
| Üç yeni tema | Tramonto, Limon, Neon; yazı tipleri `fontlar/` klasöründe |
| Sayfa geçişi düzeltmesi | `#view`'a eklenen `giris` sınıfı giriş ekranının stiliyle çakışıyordu |
| A2 kompakt şerit | gün okları + zil. Eksik: ⚙︎ düğmesi (A1'e bağlı), senkron durum yazısı (C2) |
| A3 açık sekmeye tekrar dokunma | tamam |
| B1 bölüm çipleri | yalnız Bugün. Eksik: Günlük çipleri |
| B2 kapanır kartlar | yalnız Bugün. Eksik: Günlük kartları |
| C1 çekerek kapatma | Söyle ve Dinle pencereleri |
| D1 sıradaki plan iki satır | tamam |

## Kalan işler ve önerilen paylaşım

Çakışmamak için herkes yalnızca kendi satırındaki işe dokunsun. İkisi de
`claude/program-zaman-cizgisi` dalından (merge edildiyse `main`'den) yeni dal açsın.

| İş | Kim | Not |
|---|---|---|
| D2 Aylık tablo bugünün sütununa kaysın, sütun vurgulansın | Opus | **bitti (2.8.1)** |
| D3 Boş ekranlara ikonlu, düğmeli kartlar | Opus | **bitti (2.8.1)** |
| D4 Para / Yeni hedef / Odak formları "+ Ekle" arkasında | Opus | **bitti (2.8.1)** |
| B3 Günlük doluluk işaretleri + Günlük çipleri ve kapanır kartları | Opus | **bitti (2.8.1)** |
| A1 Ayarlar ayrı ekran (⚙︎, sağdan kayarak) | Fable | yapısal değişiklik |
| C2 Çekerek yenileme + "Kaydedildi / Kaydediliyor / Çevrimdışı" yazısı | Fable | |
| C3 Mikrofona basılı tutunca hızlı menü | Fable | |
| Brifingler, görev istemleri, `sunucu/Code.js`, koç kimliği | Opus | Fable bunlara dokunmuyor |

## Opus 2.8.1'de eklenenler (Fable'ın bilmesi gerekenler)

- **A1 için:** iki düğme hâlâ eski yolu kullanıyor: `data-act="seggo" data-tab="claude" data-g="claude" data-v="ayarlar"`.
  Biri boş Bildirimler ekranındaki "Bildirim ayarları", diğeri Para'daki "Aylık bütçe belirle →".
  Ayarlar ayrı ekran olunca bunları ilgili alt sayfaya (Bildirimler, Para) yönlendir.
- **Sürüm:** `SURUM` 2.8.1, `CACHE` `hayat-v281`. Senin sonraki PR'ın 2.8.2 / `hayat-v282` olsun.
- **Mevcut testte iki hata, PR #1'den geliyor (benim değişikliğimden önce de vardı):**
  - Sayfa giriş animasyonu testi `#view` üzerinde `giris` sınıfını arıyor; sen `gir` yaptın.
  - Bugün'den sola kaydırınca ertesi güne geçiş testi geçmiyor (2026-11-10 → 2026-11-11 bekleniyor).
  Bilerek mi değişti, bir bak.

## Kod içinde hazır duran parçalar

- `bos(ikon, metin, düğme)`: boş durum kartı. İkonlar `BOS_I` (hedef, para, tur) ve `I` (bell, mail, chat).
- `formAcik(f)`, `formAcBtn(f, metin)`: katlanan formlar. `S.ui.acik[f] = sekme` geçicidir;
  `render()` sekme değişince temizler. Açmak için `data-act="formac" data-f="para|hedef|odak"`.
  Odak ve kart kimlikleri `FORM_ODAK`, `FORM_KART`.
- `gunlukDolu(gün)`, `GUNLUK_BOL`: Günlük'ün altı bölümünden hangilerinin dolu olduğu.
  `gunlukDolulukYaz()` yazarken çubuğu ve şerit çiplerini günceller.
- `tabloKaydir()`: render sonunda aylık tabloyu bugüne kaydırır; ay başına kaydırma `TABLO_KAY`'da tutulur.
- `SERIT_KART` artık Günlük kimliklerini de içeriyor. Şerit çipleri Bugün ve Günlük'te çıkıyor.

- `kapanir(kimlik, başlık, özetFonksiyonu, kartHtml)`: bir kartı kapanır yapar. Kart
  kimliği `data-kart` olarak yazılır; şerit çipleri bu özniteliği okur.
- `seritRender()` / `seritIzle()`: şeridi her render'da yeniden kurar, kaydırırken çipi yakar.
- `toast(metin, {ad, fn})`: mesaj balonuna tek düğme ekler ("Geri al").
- `sayfaAcilis(el)`: alttan açılan pencereyi yalnızca ilk açılışta kaydırır.
- `HRK.*` bayrakları: bir sonraki render'da tek seferlik animasyon (pop, tik, yeni, acilan…).

## Düşülen tuzaklar

1. **Sınıf adları çakışıyor.** `.giris` giriş ekranıdır (tam ekran, sabit). İki ayrı
   `@keyframes pop` vardı; mesaj balonu yanlışını kullanıyordu. Yeni sınıf ve
   keyframe eklemeden önce adı dosyada ara.
2. **`*{animation:none!important}` sözde öğeleri kapsamaz.** `::before/::after`
   animasyonu ekliyorsan `prefers-reduced-motion` ve `html.sade` için ayrıca kapat.
3. **`.check`, `.chip`, `.btn` `overflow:hidden`** (dalga efekti için). Dokunma
   alanını `::after` ile büyüteceksen `overflow:visible` yap ve `.dalga`'yı gizle.
4. **Mutlak konumlu `::after` dolgu kutusuna göre yerleşir.** Kenarlığı olan
   düğmede `inset` hesabına kenarlığı kat.
5. **Fredoka'da Türkçe harfler eksik** (ğ, ş, İ). Yeni yazı tipi eklemeden önce
   latin + latin-ext dosyalarında ğ Ğ ş Ş ı İ var mı diye bak.
6. **Test ortamı Google Fonts'a ulaşamaz.** Ekran görüntüsünde yedek yazı tipi
   çıkar. Manrope ve Saira için `fonts.googleapis.com` isteğini yerel dosyalarla
   karşıla (fontsource paketleri npm'den iner; repoya bağımlılık eklenmez).
7. **Örnek veri saate bağlı.** "Sıradaki tur" öğleden sonra kaybolur; testte saati
   sabitle (Playwright `page.clock.set_fixed_time`).
8. **`render()` tüm `#view`'ı yeniden yazar.** Kalıcı kalması gereken şey (şerit,
   pencereler) `#view` dışında durmalı; `#view` içindeki animasyon her render'da
   baştan oynar, o yüzden `HRK` bayrağı ya da `#view.gir` kullan.

## Değişmeyen kurallar

`main`'e doğrudan push yok; her yayında `sw.js` içindeki `CACHE` artar; build
adımı ve bağımlılık yok; `hayat-veri.json` alanları ve komut op'ları (`gun`,
`hedef`, `odak`, `gelen`) aynen çalışır; `sunucu/Code.js` yalnızca gerçekten
gerekirse değişir; repoya anahtar, giriş linki ve kişisel veri girmez.
