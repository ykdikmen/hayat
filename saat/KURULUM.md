# Hayat Saat: Apple Watch'tan Claude ile sesli sohbet

Saate konuşursun, Claude 2-5 saniyede cevap verir, saat sesli okur. Claude:

- bugünkü ve yarınki planını, alışkanlıklarını, hedeflerini bilir (Hayat Paneli),
- bugünün ve yarının turlarını bilir (Tur Programı takvimi),
- Roma hava durumunu bilir, gerekirse internette arar,
- "plana ekle", "2 sigara içtim", "spor yaptım" dersen Hayat'a yazar (5 dakika içinde uygulamada),
- "Salı 10'da dişçi" dersen Google Takvim'e de ekler,
- son 20 dakikadaki konuşmayı hatırlar ("yeni sohbet" dersen sıfırlar),
- "modeli Opus yap", "eforu yüksek yap" dersen ayarını kendisi değiştirir.

Bu, Hayat Paneli sunucusundan **ayrı** küçük bir projedir; ana sunucuya dokunmaz.

## 1. API anahtarı (bir kez)

1. console.anthropic.com → giriş → **Billing**: kart ekle, biraz kredi yükle (5 $ aylarca yeter).
2. **API Keys → Create Key**, adı "Hayat Saat". `sk-ant-…` ile başlayan anahtarı kopyala. Kimseyle paylaşma.

## 2. Apps Script projesi (bilgisayardan, bir kez)

Hayat Paneli'nin kurulu olduğu Google hesabıyla:

1. **script.new** adresini aç. İçindekini sil, `saat/Code.js` dosyasının tamamını yapıştır. Proje adını **Hayat Saat** yap, Kaydet.
2. Soldaki çark (**Proje Ayarları**) → en altta **Komut dosyası özellikleri → Özellik ekle**:
   - Özellik: `ANTHROPIC_API_KEY` · Değer: kopyaladığın `sk-ant-…` anahtarı → Kaydet.
3. Sağ üstte **Dağıt → Yeni dağıtım** → çark → **Web uygulaması**. Çalıştıran: **Ben** · Erişimi olan: **Herkes** → Dağıt → izinleri onayla
   ("Google bu uygulamayı doğrulamadı" çıkarsa: Gelişmiş → Hayat Saat sayfasına git → İzin ver).
4. Editörde üstteki listeden **kur**'u seç → **Çalıştır**. Yürütme günlüğünde **Adres** ve **Anahtar (k)** yazar; ikisini de not al.
5. İstersen listeden **dene**'yi seç → Çalıştır: Claude'un cevabı günlükte çıkar. Çıkıyorsa her şey hazır.

Kodu sonra güncellersen: yapıştır → Kaydet → Dağıt → Dağıtımları yönet → kalem → Sürüm: **Yeni sürüm** → Dağıt. Adres değişmez.

## 3. Kestirme (iPhone'da, bir kez)

Kestirmeler → **+** → adı **Claude**:

1. **Tekrarla** (20 kez). Aşağıdakilerin hepsi bunun içine:
2. **Metni Dikte Et**: Dil **Türkçe**, Dinlemeyi Durdur **Kısa Duraklamadan Sonra**.
3. **Eğer** Dikte Edilmiş Metin **şunu içeriyorsa** `bitti` → **Kestirmeyi Durdur**. (Eğer'in sonu)
4. **URL'nin İçeriğini Al**:
   - URL: 2.4'teki **Adres**
   - Yöntem: **POST**, İstek Gövdesi: **JSON**
   - Alan ekle → Metin: `k` = 2.4'teki **Anahtar**
   - Alan ekle → Metin: `metin` = **Dikte Edilmiş Metin** (değişken)
5. **Metni Seslendir**: girdi **URL'nin İçeriği**, Dil **Türkçe**.

Sonra kestirmenin ayrıntılarında (ⓘ) **Apple Watch'ta Göster**'i aç. Saatte kadrana Kestirmeler komplikasyonu olarak ekle,
ya da "Hey Siri, Claude" de. Konuşma bitince "bitti" de.

## Ayarlar

- Model ve efor sesle değişir: "modeli Opus yap", "Haiku'ya geç", "eforu orta yap". Varsayılan: **Sonnet, düşük efor** (hızlı).
  Apps Script'te Komut dosyası özellikleri'nden `MODEL` (`haiku` / `sonnet` / `opus`) ve `EFOR` (`low` / `medium` / `high`) ile de değişir.
- Sonnet ve Opus'ta Claude bir soruyu reddederse API kendiliğinden başka modelle dener (sunucu tarafı yedek model).
- Maliyet: Sonnet ile bir soru-cevap kabaca 1-2 sent (dolar); internette arama yaparsa biraz daha. Opus yaklaşık iki katı, Haiku çok daha ucuz.

## Sorun giderme

- **"Anahtar yanlış"**: kestirmedeki `k` değeri günlükteki anahtarla aynı değil.
- **"API anahtarı eksik / geçersiz"**: Komut dosyası özellikleri'nde `ANTHROPIC_API_KEY` adı ve değeri doğru mu.
- **Hayat'a yazdı ama görünmüyor**: Hayat sunucusu komutları 5 dakikada bir alır; uygulamayı açınca da hemen alır.
- **Turlar görünmüyor**: Tur Programı takvimi bu Google hesabıyla paylaşılmış olmalı.
