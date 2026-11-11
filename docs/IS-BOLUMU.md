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
- Tek ses dosyası (Kerem'in isteği, 10 Kasım): Gemini sesi açıkken bütün sohbet TEK istekte seslendirilir;
  konu aralarına `[long pause]` etiketi konur, uygulama ses dalgasında bu uzun sessizlikleri bulup dosyayı
  her soruda durdurur, cevaptan sonra kaldığı yerden sürdürür (`sohbetTek`, `kesimHesapla`, `sohbetTekCal`).
  Aralar güvenle bulunamazsa konu konu seslendirmeye döner; iki kez üst üste olmazsa kendini kapatır
  (Ayarlar > Ses > "Sohbette tek ses dosyası"). Sentetik sesle sınandı; Gemini'nin etiketi gerçekten
  uzun sessizliğe çevirdiği ve iPhone'da kaldığı yerden devam ettiği gerçek telefonda DOĞRULANMADI.
  Komut yazarken: konu metinlerinin içinde `[long pause]` kullanma, toplam metin 4500 karakteri geçmesin
  (geçerse uygulama konu konu seslendirir).
- Akşam brifingi görevinin komutu 10 Kasım'da Fable oturumunca bu biçime göre yeniden yazıldı (deneme).
  Sabah ve öğle komutları eski biçimde; Kerem beğenirse onlar da çevrilecek.

### Alan sayfaları (2.9.0, `claude/detay-sayfalari`)

- Bugün'deki karolar, Para ve Sigara kartları ve yeni "Nasıl hissediyorum" kartı kendi sayfasına açılır:
  `#/su`, `#/sigara`, `#/tuvalet` (çiş + büyük), `#/his`, `#/uyku`, `#/para`, diğer alışkanlıklar `#/<anahtar>`.
  Sayfa `#view`'ın üstünde ayrı katmandır (`#detay`); sekme (`S.tab`) değişmez, `S.detay` dolar.
- Kod tek blokta: `/* ==== DETAY SAYFALARI ==== */` işaretleri arasında (CSS'te de aynı işaret). Yeni bir alan için
  `ALAN`'a satır ve `detayHtml`'de bir kurucu eklemek yeter.
- Karo davranışı değişti: işaretli karolarda yalnızca sağdaki yuvarlak (`button.dot`) işaretler, karonun geri
  kalanı sayfayı açar (`.kr-ac`). Sayaçlarda artı/eksi aynen çalışır. Karolara dokunan testler buna göre yazılmalı.
- Yeni veri (hepsi eklemedir, eski alanlar aynı): güne `iz` = `{su: ["09:10", …], cis: […]}` (+ basılan saatler;
  sigara eskisi gibi `sigaraSaat`'te), ayarlara `gunHedef` = `{su: 8, …}` ve `koc` = `{su: {metin, zaman}}`.
- **Brifing/gelen kutusu komutlarını yazan oturum için:** bir alanın sayfasındaki "Koçun diyor ki" kartına not
  düşmek istersen cevabın sonundaki gizli bloğa şu op'u koy; uygulama 7 gün gösterir, sonra kendi kurallarına döner:
  `[[uygula {"ops":[{"op":"koc","alan":"su","metin":"…"}]}]]` (alan: `su`, `sigara`, `tuvalet`, `his`, `uyku`,
  `para` ya da bir alışkanlık anahtarı). Komutlara henüz eklenmedi; `sunucu/Code.js` değişmedi.
- Sürüm: bu PR 2.9.0 / `hayat-v290`. PR #2 hâlâ 2.8.1 diyor; hangisi sonra merge olursa main'dekinden büyük
  bir sürüm ve yeni bir `CACHE` vermeli. İkisi de `index.html`'de Bugün ve Günlük çevresine dokunduğu için
  ikinci merge'de çakışma çıkabilir.

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
