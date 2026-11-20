/**
 * Hayat Saat — Apple Watch'tan Claude ile sesli sohbet (Google Apps Script)
 *
 * Hayat Paneli sunucusundan AYRI, küçük bir projedir; ana sunucuya dokunmaz.
 * Saatteki kestirme söylediğini buraya yollar, Claude cevabı düz metin olarak döner, saat sesli okur.
 *  - Bugünkü planını, alışkanlıklarını, hedeflerini (Drive'daki hayat-veri.json'dan) ve turları (Tur Programı takviminden) bilir.
 *  - Roma hava durumunu bilir (Open-Meteo), gerektiğinde internette arar.
 *  - "Plana ekle / sigara içtim / spor yaptım" dersen Hayat'a komut dosyası yazar (5 dakika içinde uygulamada görünür).
 *  - "Randevu / hatırlat" dersen Google Takvim'e ekler.
 *  - Son 20 dakikadaki konuşmayı hatırlar. "Yeni sohbet" dersen sıfırlar.
 *  - "Modeli Opus yap", "eforu yüksek yap" dersen ayarı kendisi değiştirir.
 *
 * KURULUM: saat/KURULUM.md
 */

const TZ = 'Europe/Rome';
const SURUM = '1.0.0';
const TUR_TAKVIM_ID = '8f4c9f2141ad6f5c3b2d420bfc83c9f2ed49426659730e24056f9693a6d61572@group.calendar.google.com';
const ROMA = {lat: 41.8933, lon: 12.4829};
const MODELLER = {haiku: 'claude-haiku-5-5', sonnet: 'claude-sonnet-5-5', opus: 'claude-opus-5-5'};
const EFORLAR = {low: 1, medium: 1, high: 1};
const VARSAYILAN_MODEL = 'sonnet', VARSAYILAN_EFOR = 'low';
const GECMIS_DK = 20, GECMIS_MESAJ = 16;

/* ===================== kurulum ===================== */

/**
 * Bir kez çalıştır (editörde üstteki listeden kur'u seç → Çalıştır).
 * Hayat Paneli dosyalarını bulur, saat anahtarını üretir, kestirmeye yazılacak adresi ve anahtarı Yürütme günlüğüne yazar.
 */
function kur() {
  const p = PropertiesService.getScriptProperties(), satir = [];
  const klasorler = DriveApp.getFoldersByName('Hayat Paneli');
  if (!klasorler.hasNext()) throw new Error('Drive\'da "Hayat Paneli" klasörü bulunamadı. Bu projeyi Hayat Paneli\'nin kurulu olduğu Google hesabıyla açmalısın.');
  const klasor = klasorler.next();
  const ozet = klasor.getFilesByName('hayat-veri.json');
  if (ozet.hasNext()) { p.setProperty('OZET_ID', ozet.next().getId()); satir.push('hayat-veri.json bulundu ✓'); }
  else satir.push('UYARI: hayat-veri.json yok; Claude programını göremez.');
  const komut = klasor.getFoldersByName('komutlar');
  if (komut.hasNext()) { p.setProperty('KOMUT_ID', komut.next().getId()); satir.push('komutlar klasörü bulundu ✓'); }
  else satir.push('UYARI: komutlar klasörü yok; Claude Hayat\'a yazamaz.');
  if (!p.getProperty('SAAT_ANAHTAR')) p.setProperty('SAAT_ANAHTAR', (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').slice(0, 32));
  if (!p.getProperty('MODEL')) p.setProperty('MODEL', VARSAYILAN_MODEL);
  if (!p.getProperty('EFOR')) p.setProperty('EFOR', VARSAYILAN_EFOR);
  satir.push(/^sk-ant-/.test(p.getProperty('ANTHROPIC_API_KEY') || '') ? 'API anahtarı ✓' : 'EKSİK: Proje Ayarları → Komut dosyası özellikleri → ANTHROPIC_API_KEY ekle.');
  try { CalendarApp.getDefaultCalendar(); UrlFetchApp.fetch('https://api.open-meteo.com/v1/forecast?latitude=41.89&longitude=12.48&current=temperature_2m', {muteHttpExceptions: true}); satir.push('Takvim ve internet izni ✓'); }
  catch (e) { satir.push('İzin sorunu: ' + e); }
  const url = ScriptApp.getService().getUrl();
  satir.push('', 'Kestirmeye yazılacaklar:',
    'Adres: ' + (url || '(önce Dağıt → Yeni dağıtım → Web uygulaması yap, sonra kur\'u tekrar çalıştır)'),
    'Anahtar (k): ' + p.getProperty('SAAT_ANAHTAR'),
    'Model: ' + p.getProperty('MODEL') + ' · Efor: ' + p.getProperty('EFOR'));
  console.log(satir.join('\n'));
  return satir.join('\n');
}

/** Editörden deneme: kestirme olmadan bir soru sorar, cevabı günlüğe yazar. */
function dene() {
  const c = sohbet_('Bugün ve yarın programımda ne var, hava nasıl?');
  console.log(c);
  return c;
}

/* ===================== web ===================== */

function doGet() {
  return ContentService.createTextOutput('Hayat Saat çalışıyor (sürüm ' + SURUM + ').');
}

function doPost(e) {
  let govde = {};
  try { govde = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (x) { return duz_('İstek okunamadı.'); }
  const a = PropertiesService.getScriptProperties().getProperty('SAAT_ANAHTAR');
  if (!a || typeof govde.k !== 'string' || govde.k !== a) return duz_('Anahtar yanlış. Kestirmedeki k değerini kontrol et.');
  try {
    return duz_(sohbet_(String(govde.metin || ''), !!govde.yeni));
  } catch (err) {
    console.error(err);
    return duz_('Bir sorun çıktı: ' + String((err && err.message) || err).slice(0, 200));
  }
}
function duz_(t) { return ContentService.createTextOutput(t).setMimeType(ContentService.MimeType.TEXT); }

/* ===================== sohbet ===================== */

function sohbet_(metin, yeni) {
  metin = metin.trim().slice(0, 4000);
  const onbellek = CacheService.getScriptCache();
  const sifirla = /^(yeni sohbet|sohbeti sıfırla|baştan başla)[.!]?$/i.test(metin);
  if (yeni || sifirla) onbellek.remove('gecmis');
  if (sifirla) return 'Tamam, yeni sohbet. Dinliyorum.';
  if (!metin) return 'Seni duyamadım, tekrar söyler misin?';
  let gecmis = [];
  try { gecmis = JSON.parse(onbellek.get('gecmis') || '[]'); } catch (x) { gecmis = []; }

  const p = PropertiesService.getScriptProperties();
  const anahtar = p.getProperty('ANTHROPIC_API_KEY') || '';
  if (!/^sk-ant-/.test(anahtar)) return 'API anahtarı eksik. Apps Script proje ayarlarına ANTHROPIC_API_KEY ekle.';

  const sistem = sistemMetni_();
  const mesajlar = gecmis.concat([{role: 'user', content: metin}]);
  const ayar = ayar_();   // ayar_degistir aracı bu sorunun ortasında değiştirse de bu soru aynı modelle biter
  let cevap = '';
  for (let tur = 0; tur < 6; tur++) {
    const r = claudeIstek_(anahtar, ayar.model, ayar.efor, sistem, mesajlar);
    if (r.stop_reason === 'refusal') { cevap = 'Buna cevap veremiyorum, başka türlü sorar mısın?'; break; }
    const icerik = r.content || [];
    const metinler = icerik.filter(b => b.type === 'text').map(b => b.text).join('');
    if (r.stop_reason === 'pause_turn') { mesajlar.push({role: 'assistant', content: icerik}); continue; }
    if (r.stop_reason === 'tool_use') {
      mesajlar.push({role: 'assistant', content: icerik});
      const sonuclar = icerik.filter(b => b.type === 'tool_use').map(b => {
        try { return {type: 'tool_result', tool_use_id: b.id, content: aracCalistir_(b.name, b.input || {})}; }
        catch (err) { return {type: 'tool_result', tool_use_id: b.id, content: 'Hata: ' + String((err && err.message) || err), is_error: true}; }
      });
      mesajlar.push({role: 'user', content: sonuclar});
      continue;
    }
    cevap = metinler;   // end_turn ya da max_tokens
    break;
  }
  cevap = sesIcinTemizle_(cevap) || 'Bir şey söyleyemedim, tekrar sorar mısın?';

  // Geçmişe yalnızca düz metin girer (düşünce ve araç blokları değil): her istek kendi içinde tutarlı kalır.
  gecmis = gecmis.concat([{role: 'user', content: metin}, {role: 'assistant', content: cevap}]).slice(-GECMIS_MESAJ);
  try { onbellek.put('gecmis', JSON.stringify(gecmis), GECMIS_DK * 60); } catch (x) { onbellek.remove('gecmis'); }
  return cevap;
}

function ayar_() {
  const p = PropertiesService.getScriptProperties();
  const m = p.getProperty('MODEL') || VARSAYILAN_MODEL, e = p.getProperty('EFOR') || VARSAYILAN_EFOR;
  return {model: MODELLER[m] ? m : VARSAYILAN_MODEL, efor: EFORLAR[e] ? e : VARSAYILAN_EFOR};
}

function claudeIstek_(anahtar, model, efor, sistem, mesajlar) {
  const id = MODELLER[model];
  const govde = {
    model: id,
    max_tokens: 4000,
    system: sistem,
    output_config: {effort: efor},
    tools: araclar_(model),
    messages: mesajlar
  };
  const basliklar = {'x-api-key': anahtar, 'anthropic-version': '2023-06-01'};
  if (model !== 'haiku') {   // ret durumunda sunucu kendisi başka modelle dener
    govde.fallbacks = 'default';
    basliklar['anthropic-beta'] = 'server-side-fallback-2026-07-01';
  }
  let r, kod = 0;
  for (let deneme = 0; deneme < 3; deneme++) {
    r = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post', contentType: 'application/json', headers: basliklar,
      payload: JSON.stringify(govde), muteHttpExceptions: true
    });
    kod = r.getResponseCode();
    if (kod !== 429 && kod !== 529 && kod < 500) break;
    Utilities.sleep(1500 * (deneme + 1));
  }
  const yanit = JSON.parse(r.getContentText() || '{}');
  if (kod === 401) throw new Error('API anahtarı geçersiz.');
  if (kod === 429) throw new Error('Kullanım sınırı doldu, biraz sonra dene.');
  if (kod >= 400) throw new Error('Claude hata verdi (' + kod + '): ' + ((yanit.error && yanit.error.message) || '').slice(0, 160));
  return yanit;
}

function araclar_(model) {
  return [
    {type: model === 'haiku' ? 'web_search_20250305' : 'web_search_20260209', name: 'web_search', max_uses: 3,
     user_location: {type: 'approximate', city: 'Rome', country: 'IT', timezone: TZ}},
    {name: 'hayat_kaydet',
     description: 'Kerem\'in Hayat Paneli uygulamasına kayıt yazar (plan, alışkanlık sayaçları, uyku, ruh hali, sağlık, kazanım, not, hedef, odak listesi). ' +
       'Kerem bir şey yaptığını, yapacağını ya da plana eklenmesini/çıkarılmasını söylediğinde kullan. Uygulamada 5 dakika içinde görünür. ' +
       'ops dizisindeki biçimler: ' +
       '{"op":"gun","tarih":"YYYY-MM-DD","sayac_ekle":{"sigara":2,"su":1,"cis":1,"buyuk":1},"sayac_ayarla":{"sigara":5},"isaretle":{"spor":true,"okuma":true},' +
       '"uyku":7,"enerji":6,"ruh_hali":7,"odak":5,"saglik":["baş ağrısı"],"kazanim":["..."],"not":"...","plan_ekle":[{"saat":"HH:MM","baslik":"..."}],' +
       '"plan_tamamla":["başlığın bir parçası"],"plan_yaz":[{"saat":"HH:MM","baslik":"..."}]} (yalnızca söylenen alanları gönder; sayaçlar artıştır, ' +
       '"toplam 5" denirse sayac_ayarla; plan_yaz o günün planının TAMAMINI yeniden yazar, bir şeyi plandan çıkarmak için mevcut planı onsuz plan_yaz ile gönder). ' +
       '{"op":"hedef","islem":"ekle"|"guncelle","baslik":"...","sure":"2026","alan":"is|saglik|para|kisisel","sonraki":"...","ilerleme":0-100}. ' +
       '{"op":"odak","tur":"konus|gelistir|calis","metin":"..."}.',
     input_schema: {type: 'object', properties: {ops: {type: 'array', items: {type: 'object'}, description: 'Uygulanacak işlemler'}}, required: ['ops']}},
    {name: 'takvime_ekle',
     description: 'Google Takvim\'e randevu ya da hatırlatma ekler (60 ve 15 dakika önce bildirim). Randevu, toplantı, "hatırlat" denince kullan; aynı şeyi hayat_kaydet ile o günün planına da ekle.',
     input_schema: {type: 'object', additionalProperties: false, required: ['baslik', 'tarih', 'saat'],
       properties: {baslik: {type: 'string'}, tarih: {type: 'string', description: 'YYYY-MM-DD'}, saat: {type: 'string', description: 'HH:MM'},
         sure_dk: {type: 'integer', description: 'Süre, varsayılan 60'}, yer: {type: 'string'}}}},
    {name: 'ayar_degistir',
     description: 'Bu saat sohbetinin modelini ya da eforunu değiştirir. Yalnızca Kerem açıkça isterse kullan ("modeli Opus yap", "daha hızlı cevap ver", "eforu yükselt"). Değişiklik bir sonraki sorudan itibaren geçerli olur.',
     input_schema: {type: 'object', additionalProperties: false, properties: {model: {type: 'string', enum: ['haiku', 'sonnet', 'opus']}, efor: {type: 'string', enum: ['low', 'medium', 'high']}}}}
  ];
}

function aracCalistir_(ad, girdi) {
  if (ad === 'hayat_kaydet') {
    const ops = Array.isArray(girdi.ops) ? girdi.ops.filter(o => o && typeof o === 'object' && /^(gun|hedef|odak)$/.test(o.op)) : [];
    if (!ops.length) throw new Error('Geçerli işlem yok (op: gun, hedef ya da odak olmalı).');
    const kid = PropertiesService.getScriptProperties().getProperty('KOMUT_ID');
    if (!kid) throw new Error('Komut klasörü bilinmiyor; kur fonksiyonunu çalıştır.');
    const ad_ = 'komut-saat-' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd-HHmmss') + '-' + Utilities.getUuid().slice(0, 4) + '.json';
    DriveApp.getFolderById(kid).createFile(ad_, JSON.stringify({ops}), 'application/json');
    return 'Kaydedildi; uygulamada 5 dakika içinde görünür.';
  }
  if (ad === 'takvime_ekle') {
    const baslik = String(girdi.baslik || '').trim().slice(0, 200), tarih = String(girdi.tarih || '');
    const m = String(girdi.saat || '').match(/^(\d{1,2})[:.](\d{2})$/);
    if (!baslik || !/^\d{4}-\d{2}-\d{2}$/.test(tarih) || !m) throw new Error('Başlık, tarih (YYYY-MM-DD) ve saat (HH:MM) gerekli.');
    const bas = Utilities.parseDate(tarih + ' ' + m[1].padStart(2, '0') + ':' + m[2], TZ, 'yyyy-MM-dd HH:mm');
    const sure = Math.max(10, Math.min(600, Math.round(Number(girdi.sure_dk) || 60)));
    const ev = CalendarApp.getDefaultCalendar().createEvent(baslik, bas, new Date(bas.getTime() + sure * 60000), {location: String(girdi.yer || ''), description: 'Hayat Saat'});
    ev.removeAllReminders(); ev.addPopupReminder(60); ev.addPopupReminder(15);
    return 'Takvime eklendi: ' + baslik + ', ' + tarih + ' ' + m[1] + ':' + m[2];
  }
  if (ad === 'ayar_degistir') {
    const p = PropertiesService.getScriptProperties(), d = [];
    if (MODELLER[girdi.model]) { p.setProperty('MODEL', girdi.model); d.push('model ' + girdi.model); }
    if (EFORLAR[girdi.efor]) { p.setProperty('EFOR', girdi.efor); d.push('efor ' + girdi.efor); }
    return d.length ? 'Değişti: ' + d.join(', ') + '. Bir sonraki sorudan itibaren geçerli.' : 'Değişiklik yok.';
  }
  throw new Error('Bilinmeyen araç: ' + ad);
}

/* ===================== bağlam: program, turlar, hava ===================== */

function sistemMetni_() {
  const simdi = new Date();
  const bugun = Utilities.formatDate(simdi, TZ, 'yyyy-MM-dd'), yarin = Utilities.formatDate(new Date(simdi.getTime() + 864e5), TZ, 'yyyy-MM-dd');
  const gunAd = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const ad = t => gunAd[new Date(t + 'T12:00:00Z').getUTCDay()];
  const bolum = (baslik, f) => { try { return '## ' + baslik + '\n' + f(); } catch (e) { return '## ' + baslik + '\n(alınamadı: ' + String(e.message || e).slice(0, 120) + ')'; } };
  return [
    'Sen Claude\'sun; Kerem Apple Watch\'undan seninle sesli konuşuyor. Cevabın saatte SESLİ okunacak.',
    'Kurallar: Kerem hangi dilde konuşursa o dilde (genelde Türkçe) cevap ver. Kısa ve konuşur gibi yaz: çoğu cevap 1-3 cümle. ' +
      'Madde işareti, başlık, tablo, emoji, link ve markdown kullanma. Saatleri "on dört otuz" değil "14:30" diye yazabilirsin. ' +
      'Kayıt yaptıysan bir cümleyle neyi kaydettiğini söyle. Emin değilsen tahmin etme, kısaca sor. ' +
      'Güncel bilgi (haber, açılış saati, sonuç) gerekirse web_search kullan; hava için aşağıdaki veri yeterliyse arama yapma.',
    'Şu an: ' + Utilities.formatDate(simdi, TZ, 'yyyy-MM-dd HH:mm') + ' (' + ad(bugun) + '), Roma. Yarın: ' + yarin + ' (' + ad(yarin) + ').',
    'Turlar hakkında: başlık biçimi "HH:MM  İsim  (kişi)  GYG|VIA". "IPTAL - ..." iptal demektir, sayma. "DIŞ ..." dış turdur, ayrı say. ' +
      'Açıklamadaki "Net: EUR 117,80" net tutar, "Kapanış: yapıldı" turun kapandığını gösterir.',
    bolum('Hava (Roma)', havaOzet_),
    bolum('Turlar (bugün ve yarın)', () => turOzet_(bugun)),
    bolum('Hayat Paneli', () => hayatOzet_(bugun, yarin))
  ].join('\n\n');
}

function hayatOzet_(bugun, yarin) {
  const id = PropertiesService.getScriptProperties().getProperty('OZET_ID');
  if (!id) return '(hayat-veri.json bilinmiyor)';
  const v = JSON.parse(DriveApp.getFileById(id).getBlob().getDataAsString('UTF-8') || '{}');
  if (!v.gunler) return '(Hayat verisi henüz yok)';
  const habits = v.aliskanliklar || [];
  const gun = t => {
    const d = v.gunler[t];
    if (!d) return t + ': kayıt yok';
    const plan = (d.plan || []).slice().sort((a, b) => (a.time || '99') < (b.time || '99') ? -1 : 1)
      .map(x => (x.time ? x.time + ' ' : '') + x.title + (x.done ? ' (yapıldı)' : '')).join('; ') || 'boş';
    const al = habits.map(h => h.type === 'check' ? (d.checks && d.checks[h.key] ? h.label + ' ✓' : '') : (d.counts && d.counts[h.key] != null ? h.label + ' ' + d.counts[h.key] : '')).filter(String).join(', ');
    const diger = [d.sleep != null ? 'uyku ' + d.sleep + ' sa' : '', d.energy != null ? 'enerji ' + d.energy : '', d.mood != null ? 'ruh hali ' + d.mood : '', d.note ? 'not: ' + String(d.note).slice(0, 200) : ''].filter(String).join(', ');
    return t + ' plan: ' + plan + (al ? '. Alışkanlıklar: ' + al : '') + (diger ? '. ' + diger : '');
  };
  const son7 = [];
  for (let i = 1; i <= 7; i++) {
    const t = Utilities.formatDate(new Date(Date.now() - i * 864e5), TZ, 'yyyy-MM-dd'), d = v.gunler[t];
    if (d && d.counts) son7.push(t.slice(5) + ' sigara ' + (d.counts.sigara ?? '-') + (d.checks && d.checks.spor ? ' spor ✓' : ''));
  }
  const hedefler = Object.values(v.hedefler || {}).slice(0, 8).map(g => g.title + ' %' + (g.progress || 0) + (g.next ? ' (sıradaki: ' + g.next + ')' : '')).join('; ');
  const odak = Object.values(v.odak || {}).filter(o => !o.done).slice(0, 8).map(o => o.kind + ': ' + o.text).join('; ');
  return [gun(bugun), gun(yarin), son7.length ? 'Son günler: ' + son7.join(' | ') : '',
    'Alışkanlık anahtarları: ' + habits.map(h => h.key + '=' + h.label).join(', '),
    hedefler ? 'Hedefler: ' + hedefler : '', odak ? 'Odak listesi: ' + odak : ''].filter(String).join('\n');
}

function turOzet_(bugun) {
  const t = CalendarApp.getCalendarById(TUR_TAKVIM_ID);
  if (!t) return '(Tur Programı takvimi bu hesapta yok)';
  const bas = Utilities.parseDate(bugun + ' 00:00', TZ, 'yyyy-MM-dd HH:mm');
  const ev = t.getEvents(bas, new Date(bas.getTime() + 2 * 864e5)).filter(e => !e.isAllDayEvent());
  if (!ev.length) return 'Tur yok.';
  return ev.map(e => {
    const acik = e.getDescription() || '';
    const net = (acik.match(/Net:\s*EUR\s*[\d.,]+/i) || [''])[0], kap = (acik.match(/Kapanış:\s*[^\n<]+/i) || [''])[0];
    const ekip = (acik.match(/(Guide|Drivers):\s*[^\n<]+/gi) || []).join(' ');
    return Utilities.formatDate(e.getStartTime(), TZ, 'yyyy-MM-dd') + ' ' + e.getTitle() + [net, kap, ekip].filter(String).map(x => ' · ' + x.trim()).join('');
  }).join('\n');
}

function havaOzet_() {
  const onbellek = CacheService.getScriptCache(), eski = onbellek.get('hava');
  if (eski) return eski;
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + ROMA.lat + '&longitude=' + ROMA.lon +
    '&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
    '&hourly=precipitation_probability&forecast_days=3&timezone=Europe%2FRome';
  const v = JSON.parse(UrlFetchApp.fetch(url).getContentText());
  const d = v.daily, c = v.current;
  const gunler = d.time.map((t, i) => t + ': ' + havaKodu_(d.weather_code[i]) + ', ' + Math.round(d.temperature_2m_min[i]) + '-' + Math.round(d.temperature_2m_max[i]) + '°C, yağış ihtimali %' + d.precipitation_probability_max[i]);
  const simdiSaat = Number(Utilities.formatDate(new Date(), TZ, 'H'));
  const yagmurSaat = (v.hourly.time || []).map((t, i) => ({t, p: v.hourly.precipitation_probability[i]}))
    .filter((x, i) => i >= simdiSaat && i < simdiSaat + 12 && x.p >= 40).map(x => x.t.slice(11, 16) + ' %' + x.p);
  const metin = 'Şu an ' + Math.round(c.temperature_2m) + '°C, ' + havaKodu_(c.weather_code) + ', rüzgar ' + Math.round(c.wind_speed_10m) + ' km/s.\n' +
    gunler.join('\n') + (yagmurSaat.length ? '\nÖnümüzdeki 12 saatte yağış riski olan saatler: ' + yagmurSaat.join(', ') : '');
  onbellek.put('hava', metin, 20 * 60);
  return metin;
}
function havaKodu_(k) {
  if (k === 0) return 'açık';
  if (k <= 2) return 'az bulutlu';
  if (k === 3) return 'kapalı';
  if (k <= 48) return 'sisli';
  if (k <= 57) return 'çiseleme';
  if (k <= 67) return 'yağmurlu';
  if (k <= 77) return 'karlı';
  if (k <= 82) return 'sağanak';
  if (k <= 86) return 'kar sağanağı';
  return 'gök gürültülü fırtına';
}

/* Saatte okunacak metinden markdown ve emoji kalıntılarını temizler. */
function sesIcinTemizle_(t) {
  return String(t || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*_`#>|]+/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}
