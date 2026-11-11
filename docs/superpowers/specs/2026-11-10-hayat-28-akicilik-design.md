# Hayat Paneli 2.8 — Akıcılık ve gezinme tasarımı

Tarih: 10 Kasım 2026 · Durum: Kerem'in onayını bekliyor · Önceki sürüm: 2.7.2

## Amaç

Kerem'in isteği: uygulama daha doğal ve akıcı kullanılsın; özellikle tasarım ve menüler arası geçiş kolaylaşsın.

Başarı ölçütleri:
- Ayarlar her sayfadan tek dokunuşla açılır.
- Bir sayfanın neresinde olursa olsun tarih, gün okları, zil ve ayarlar elinin altındadır.
- Uzun sayfalarda istediği bölüme tek dokunuşla atlar.
- Sık yapılan kayıtlar (+1 sigara, +1 su, harcama) iki dokunuşu geçmez.

Kerem'in onayladıkları (10 Kasım, 01:20 civarı): A, B, C, D paketlerinin hepsi; ayarlar ayrı ekran olarak.

## Kısıtlar

- iPhone ana ekranına eklenmiş PWA olarak çalışır; Türkçe arayüz.
- Sunucu (Apps Script), veri biçimi ve kurulum değişmez. Ortakların kurulumu bozulmaz.
- Eski bağlantılar çalışmaya devam eder: `#ayarlar`, `#ses`, ve Claude bölümünün eski `ayarlar` sekmesi yeni Ayarlar ekranına yönlenir.
- "Hareket kapalı" seçeneği ve sistemin "hareketi azalt" ayarı açıksa bütün yeni animasyonlar anında olur (süre 0).
- Mevcut testler (test1–test11, sunucu testleri) geçmeye devam eder.

## Kapsam dışı

- Kartları sürükleyip yeniden sıralama.
- Sekmeler arasında yatay kaydırma. Bugün ve Günlük'teki gün değiştirme kaydırmasıyla çakışır.
- Sunucu tarafında herhangi bir değişiklik.
- `/ui-ux-enhancer` becerisinin notları. Beceri bu oturumda bulunamadı; Kerem gönderirse ayrı bir tur olarak değerlendirilir.

## A · Gezinme

### A1. Ayarlar ekranı
- Yeni rota `#ayarlar` ve alt rotalar `#ayarlar/<grup>`.
- Ekran sağdan kayarak açılır (push). Sol üstte "‹ Geri" düğmesi vardır. Sol kenardan (ilk 24 px) sağa kaydırma da geri götürür.
- Açılış noktası: her sekmenin başlığında zilin yanında bir ⚙︎ düğmesi.
- Ana liste, iPhone Ayarlar gibi gruplanmış satırlardan oluşur. Her satırda ikon, başlık ve sağda o ayarın şu anki durumu yazar (ör. "Gece", "Telefonun sesi", "Açık").
- Gruplar ve içerikleri. Mevcut kart fonksiyonları içerik değişmeden yeniden kullanılır:
  - **Profil**: `profilKart`
  - **Claude**: Claude'lu/Claude'suz seçimi, `rutinKart`, `anlikKart`
  - **Bildirimler**: `bildirimKart`
  - **Ses**: `sesAyarKart`
  - **Para**: bütçe ve sigara paketi formu
  - **Görünüm**: tema, renk, alt menü, hareket, titreşim, efekt sesleri
  - **Bu telefon**: sürüm, kurulum sayfası, çıkış
- Claude bölümünün sekmeleri Bildirim · Posta · Sohbet olur; Claude'suzda Bildirim · Kayıtlar. Bu bölümdeki "Ayarlar" sekmesi kalkar. Uygulamada `seggo … data-v="ayarlar"` kullanan bağlantılar (ör. "Aylık bütçe belirle →") ilgili alt sayfaya gider.

### A2. Yapışkan kompakt başlık
- Büyük başlık görünümden çıkınca (IntersectionObserver) üstte cam efektli ince bir şerit belirir.
- Şeritte sayfa başlığı vardır. Bugün ve Günlük'te ayrıca ‹ › gün okları bulunur, İlerleme'de hafta/ay okları. Zil (okunmamış sayısıyla) ve ⚙︎ de şeritte yer alır.
- Şerit üst güvenli alanı (safe-area-inset-top) hesaba katar ve içeriğin üstüne biner. Sayfa kayması zıplamaz.

### A3. Açık sekmeye tekrar dokunma
- Sayfa yukarıdaysa yumuşak kaydırmayla en başa döner.
- Zaten en üstteyse ve Bugün/Günlük'te bugünden farklı bir gün seçiliyse bugüne döner.

## B · Uzun sayfalar

### B1. Bölüm çipleri
- Bugün çipleri: Program · Turlar · Posta · Alışkanlık · Sigara · Para. Turlar ve Posta yalnızca o kartlar görünüyorsa çıkar.
- Günlük çipleri: Sesli · Nasılsın · Uyku · Sabah · Akşam · Kazanımlar.
- Çip satırı yatay kayar ve kompakt şeridin hemen altına yapışır.
- Çipe dokununca kart, şerit yüksekliği kadar boşluk bırakılarak ekrana kayar.
- Kaydırırken ekranda en üstte olan kartın çipi vurgulanır (scrollspy).

### B2. Kapanır kartlar
- Kart başlığında küçük bir ok (chevron) olur. Başlığa dokununca kart kapanır ya da açılır. Durum `hayat.kapali` anahtarında, kart kimliğine göre saklanır.
- Kapalı kart tek satır özet gösterir:

  | Kart | Özet |
  |---|---|
  | Program | "1/2 tamam · sıradaki 23:59" |
  | Turlar | "yok" ya da "n tur · n kişi" |
  | Posta | son özetin ilk satırı ya da "hazırlanıyor" |
  | Alışkanlıklar | "Sigara 5 · Su 4 · Spor ✓" |
  | Son sigaradan beri | "2 sa 10 dk" |
  | Para | "Bugün €0 · Kasım €0" |
  | Günlük kartları | dolu ya da boş |

- Hero (üstteki gösterge kartı) kapanmaz.

### B3. Günlük doluluk işaretleri
- Bir bölümde en az bir alan doluysa çipinde ✓ belirir.
- Günlük başlığında "4/6 bölüm" yazar.

## C · Dokunuşlar

### C1. Çekerek kapatılan pencereler
- `.sheet` sınıflı bütün pencerelerde (Söyle ya da yaz `#sheet`, sesli konuşma `#ses`) `.grab` çubuğu ile başlık alanı sürüklenebilir.
- Pencere parmağı takip eder (translateY). 110 px'ten fazla çekilir ya da hızlı bırakılırsa kapanır; aksi halde yaylanarak geri döner.
- Kapanış, pencerenin arka planındaki mevcut kapatma eylemiyle yapılır (`.sheet-bg` üzerindeki `data-act`: `abclose` / `sesbitir`). Böylece mikrofon kapatma gibi temizlikler aynen çalışır.
- Pencere içindeki metin alanında kaydırma bundan etkilenmez.

### C2. Çekerek yenileme ve senkron durumu
- `#main` en üstteyken aşağı çekilirse dönen bir halka belirir. 70 px'ten sonra bırakılırsa `load()` çağrılır, bitince halka kaybolur.
- Kompakt şeritte ve büyük başlığın altında küçük bir durum yazısı olur:

  | Durum | Yazı |
  |---|---|
  | `flushing` | "Kaydediliyor…" |
  | Bekleyen kayıt var ve hata ya da çevrimdışı | "Çevrimdışı – sırada" |
  | Diğer | "Kaydedildi · n dk önce" |

  Yazı 4 saniye sonra sönükleşir, değişince tekrar belirir.

### C3. Mikrofonda hızlı menü
- Mikrofon düğmesine 450 ms basılı tutulunca titreşim verilir ve düğmenin üstünde yay şeklinde 5 seçenek açılır: +1 sigara, +1 su, Harcama, Brifingi dinle, Günlüğe konuş.
- Parmak bir seçeneğe kaydırılıp bırakılırsa ya da menü açıkken seçeneğe dokunulursa o işlem çalışır. Boş yere dokununca menü kapanır.
- Her seçenek mevcut fonksiyonları çağırır:
  - +1 sigara, +1 su: sayaç fonksiyonları, efektleriyle birlikte
  - Harcama: Para sekmesi, form açık
  - Brifingi dinle: mevcut brifing
  - Günlüğe konuş: Günlük'e gidip sesli günlük mikrofonunu başlatır
- Kısa dokunuş bugünkü gibi "Söyle ya da yaz" penceresini açar.

## D · Görsel cila

- **D1.** Hero'daki sıradaki plan iki satıra kadar sarılır (`-webkit-line-clamp: 2`); kalan süre ayrı satırdadır. "Kit…" kesilmesi biter.
- **D2.** Aylık alışkanlık tablosu çizilince yatayda bugünün sütununa kayar ve sütun hafif vurgulanır. Satır başlıkları zaten yapışkan.
- **D3.** Boş durumlar ikonlu, tek cümleli kartlara dönüşür; her birinde bir eylem düğmesi vardır:

  | Ekran | Düğme |
  |---|---|
  | Bildirimler | "Bildirim ayarları" (Ayarlar › Bildirimler'e gider) |
  | Sohbet / Kayıtlar | "Söyle ya da yaz" |
  | Hedefler | "İlk hedefini ekle" |
  | Para › Kayıtlar | "Harcama ekle" |
  | Turlar | ikon ve "Bugün tur yok" (düğme yok) |

- **D4.** Para › Ekle, Hedefler › Yeni hedef ve Odak listesi formları varsayılan olarak tek bir "+ … ekle" düğmesine katlanır. Dokununca yerinde yumuşakça açılır.
  - `S.ui.acik[<form>]` geçicidir, saklanmaz.
  - Bugün'deki "+ Harcama ya da gelir ekle" ve hızlı menüdeki "Harcama" Para formunu açık getirir.

## Teknik yapı

- Yeni modül `src/2e-gezinme.js`: ayarlar rotası, kompakt şerit, bölüm çipleri ve scrollspy, kapanır kartlar, çekerek yenileme, çekerek kapatma, hızlı menü. `build.py` sırası: …2d-hareket, **2e-gezinme**, 3-app, 4-ses.
- `2-views.js`:
  - `claudeAyarlar` gruplara bölünür: `ayarGrup(ad)` ve `viewAyarlar()`.
  - Kartlara `data-kart="<kimlik>"` ve başlıklara `data-act="katla"` eklenir.
  - Boş durum yardımcısı `bos(ikon, metin, düğme)` gelir.
- `3-app.js`:
  - `render()` yeni `ayarlar` sekmesini tanır.
  - `readHash` alt rotaları ve eski rotaları eşler.
  - Sekme tıklaması A3 davranışını uygular.
- `style.css`: şerit, çipler, push geçişi, kapalı kart, çekme halkası, hızlı menü, boş durum ve form katlama stilleri. Dört tema ve açık/koyu modda kontrol edilir.
- Sürüm `2.8.0`, service worker önbelleği `hayat-v280`.
- Kerem'in yüklediği `sw.js` dosyası eski bir sürüm (`hayat-v23`). Kullanılmaz; repodaki güncel `sw.js` esas alınır.

## Test

- Yeni `test12.js` (Playwright, iPhone 390×844, dokunmatik). Her madde için önce başarısız olan test yazılır, sonra kod (TDD). Kontrol edilenler:
  - ⚙︎ ile ayarların açılması, alt sayfaya gidip geri gelme, kenardan kaydırmayla geri dönme, eski `#ses`/`#ayarlar` bağlantıları
  - kompakt şeridin kaydırınca görünmesi ve oklarla gün değiştirme
  - açık sekmeye dokununca başa dönme, en üstteyken bugüne dönme
  - çipe dokununca doğru karta kayma ve scrollspy vurgusu
  - kart katlama, özet ve sayfa yenilenince hatırlanması
  - Günlük ✓ işaretleri ve "n/6"
  - pencereyi çekince kapanma, az çekince geri yaylanma
  - çekerek yenilemenin `yukle` çağırması ve senkron yazısının durumları
  - basılı tutma menüsü: +1 sigara sayacı artırır, Harcama Para formunu açık getirir, kısa dokunuş bestecisi açar
  - hero metninin kesilmemesi, aylık tablonun bugüne kayması, boş durum düğmeleri, katlanan formlar
  - "hareket kapalı"yken animasyon süresinin 0 olması
- test1–test11 ve sunucu testleri yeniden çalıştırılır.
- Dört temada ekran görüntüleri alınıp gözle kontrol edilir; ancak ondan sonra yayınlanır.
