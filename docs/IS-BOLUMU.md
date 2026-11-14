# Hayat: iki Claude oturumu arasında iş bölümü

Bu repo üzerinde iki ayrı Claude oturumu çalışıyor. Oturumlar birbirine mesaj
gönderemez; ortak defterimiz bu dosya ve PR'lar. Bir işe başlamadan önce burayı
oku, bitirince güncelle.

Son güncelleme: 14 Kasım 2026, Opus oturumu.

## Şu anki durum

- Yayındaki sürüm: `main` = 2.9.0 (`hayat-v290`). PR #1, #3 ve #4 merge edildi.
- PR #2 (Opus, `claude/opus-gunluk-bos-formlar`) `main`'i içine aldı: **2.9.1 / `hayat-v291`**.
  Bundan sonraki PR **2.9.2 / `hayat-v292`** olsun. → Roma temaları PR'ı (`claude/roma-cam-tema`) 2.9.2'yi aldı;
  ondan sonraki **2.9.3 / `hayat-v293`**.
- 2.8 "akıcılık" tasarım dokümanı repoda: `docs/superpowers/specs/2026-11-10-hayat-28-akicilik-design.md`.

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

### Roma temaları (2.9.2, `claude/roma-cam-tema`)

- TV panelinin (ykdikmen/TV) görünümü Hayat'a geldi: iki yeni renk teması **Roma Nero** (`data-renk="nero"`) ve
  **Roma Bianco** (`bianco`). Arkada Roma fotoğrafları, üstünde buzlu cam kartlar, Vespa kırmızısı vurgular, Archivo.
- Kod tek blokta: CSS'te `/* ==== ROMA TEMALARI (2.9.2) ==== */`, JS'te `renkUygula()`'nın hemen altı
  (`TV_SUNUCU`, `FT`, `fotoBaslat`, `fotoYenile`, `fotoAyarKart`). Diğer temalar piksel piksel aynı.
- Fotoğraflar TV panelinin sunucusundan gelir (`islem=foto`, JSONP); kullanıcı Ayarlar > Görünüm'de TV kodunu
  bir kez yazar, kod yalnızca telefonda (`hayat.fotoKod`) durur. En çok 8 fotoğraf `hayat-foto` önbelleğine
  yazılır (sw.js bu önbelleği silmez), günde bir yenilenir, 45 sn'de bir çapraz geçişle değişir.
  Fotoğrafın parlaklığına göre perde ve cam koyuluğu kendini ayarlar (`fotoPerde`). Siyah-beyaz/renkli seçimi: `hayat.fotoSB`.
- `sunucu/Code.js` ve TV sunucusu değişmedi.

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
- Sürüm: bu PR 2.9.0 / `hayat-v290` idi. PR #2 main'i alıp 2.9.1 / `hayat-v291` oldu.

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
| D2 Aylık tablo bugünün sütununa kaysın, sütun vurgulansın | Opus | **bitti (2.9.1, PR #2)** |
| D3 Boş ekranlara ikonlu, düğmeli kartlar | Opus | **bitti (2.9.1, PR #2)** |
| D4 Para / Yeni hedef / Odak formları "+ Ekle" arkasında | Opus | **bitti (2.9.1, PR #2)** |
| B3 Günlük doluluk işaretleri + Günlük çipleri ve kapanır kartları | Opus | **bitti (2.9.1, PR #2)** |
| A1 Ayarlar ayrı ekran (⚙︎, sağdan kayarak) | Fable | yapısal değişiklik |
| C2 Çekerek yenileme + "Kaydedildi / Kaydediliyor / Çevrimdışı" yazısı | Fable | |
| C3 Mikrofona basılı tutunca hızlı menü | Fable | |
| Brifingler, görev istemleri, `sunucu/Code.js`, koç kimliği | Opus | Fable bunlara dokunmuyor |

## Opus 2.9.1'de eklenenler (PR #2) (Fable'ın bilmesi gerekenler)

- **A1 için:** iki düğme hâlâ eski yolu kullanıyor: `data-act="seggo" data-tab="claude" data-g="claude" data-v="ayarlar"`.
  Biri boş Bildirimler ekranındaki "Bildirim ayarları", diğeri Para'daki "Aylık bütçe belirle →".
  Ayarlar ayrı ekran olunca bunları ilgili alt sayfaya (Bildirimler, Para) yönlendir.

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
