# Hayat: iki Claude oturumu arasında iş bölümü

Bu repo üzerinde iki ayrı Claude oturumu çalışıyor. Oturumlar birbirine mesaj
gönderemez; ortak defterimiz bu dosya ve PR'lar. Bir işe başlamadan önce burayı
oku, bitirince güncelle.

Son güncelleme: 10 Kasım 2026 akşam, Fable oturumu.

## Şu anki durum

- Yayındaki sürüm: `main` = 2.8.0 (`hayat-v280`). PR #1 merge edildi.
- **İki açık PR var, ikisi de 2.8.1 / `hayat-v281` diyor:** PR #2 (Opus, `claude/opus-gunluk-bos-formlar`)
  ve PR #3 (Fable, `claude/sohbet-brifing`, sohbet modu). Hangisi ikinci merge edilecekse önce `main`'i
  içine alsın ve sürümü **2.8.2 / `hayat-v282`** yapsın. Çakışma beklenen yerler: `SURUM`, `sw.js` CACHE.
- Opus oturumunun 2.8 "akıcılık" tasarım dokümanı (`hayat-2.8` dalı) GitHub'a hiç gönderilmemiş. Aşağıdaki
  tablo o dokümanın Kerem'in onayladığı özetinden çıkarıldı.

### Sohbet modu (PR #3) ve brifing komutları

- Brifing metninde `[[bolum Ad]]` satırları varsa Dinle ekranı konu konu okur ve her konudan sonra cevap
  dinler; cevaplar sohbet bitince `🎧 … brifingindeki sorulara cevaplarım` diye başlayan TEK mesajda gelen
  kutusuna düşer (her satır: konu · "koçun sorusu" → Kerem'in cevabı). Bu mesaj yankı değildir; "Hayat
  Anında" ve saatlik gelen kutusu görevleri onu Kerem'in kendi sözleri olarak işlemeli.
- PR #3 merge edilmeden önce de zararsızdır: eski sürümler işaretleri gizli blok sayıp atlar.
- Akşam brifingi görevinin komutu 10 Kasım'da Fable oturumunca bu biçime göre yeniden yazıldı (deneme).
  Sabah ve öğle komutları eski biçimde; Kerem beğenirse onlar da çevrilecek.

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
| D2 Aylık tablo bugünün sütununa kaysın, sütun vurgulansın | Opus | kendi içinde, küçük |
| D3 Boş ekranlara ikonlu, düğmeli kartlar | Opus | Bildirimler düğmesi bildirim ayarlarına gider |
| D4 Para / Yeni hedef / Odak formları "+ Ekle" arkasında | Opus | Bugün'deki "Harcama ekle"den gelince açık gelsin |
| B3 Günlük doluluk işaretleri + Günlük çipleri ve kapanır kartları | Opus | `kapanir()` ve `seritRender()` hazır, Günlük kartlarına `data-kart` vermek yeterli |
| A1 Ayarlar ayrı ekran (⚙︎, sağdan kayarak) | Fable | yapısal değişiklik |
| C2 Çekerek yenileme + "Kaydedildi / Kaydediliyor / Çevrimdışı" yazısı | Fable | |
| C3 Mikrofona basılı tutunca hızlı menü | Fable | |
| Brifingler, görev istemleri, `sunucu/Code.js`, koç kimliği | Opus | Fable bunlara dokunmuyor |

## Kod içinde hazır duran parçalar

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
