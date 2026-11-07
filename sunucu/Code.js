/**
 * Hayat Paneli — sunucu (Google Apps Script) · ortak sürümü
 *
 * Bu kod senin Google hesabında çalışır; verilerin yalnızca senin Drive'ında durur.
 *
 * KURULUM (bir kez, bilgisayardan):
 *  1. script.new adresini aç (Google hesabınla). Açılan projede ne yazıyorsa sil, bu dosyanın tamamını yapıştır.
 *     Üstteki proje adını "Hayat Paneli" yap, Kaydet (disket simgesi).
 *  2. Sağ üstte Dağıt → Yeni dağıtım → çark simgesi → Web uygulaması.
 *       Çalıştıran: Ben   ·   Erişimi olan: Herkes   → Dağıt.
 *  3. "Erişimi yetkilendir" → hesabını seç. "Google bu uygulamayı doğrulamadı" çıkarsa:
 *       Gelişmiş → "Hayat Paneli (güvenli değil) sayfasına git" → İzin ver. (Uygulama senin; sadece senin hesabında çalışır.)
 *  4. Çıkan Web uygulaması adresini kopyala, sonuna  ?kurulum=1  ekleyip aç.
 *     Kurulum Drive'ında "Hayat Paneli" klasörünü ve tabloyu kendisi açar, sonra giriş linkini gösterir.
 *  Giriş linkini kaybedersen: bu editörde yukarıdan yeniAnahtar fonksiyonunu seç, Çalıştır; yeni link Yürütme günlüğünde çıkar.
 *
 * GÜNCELLEME (2.6 ve sonrası): kodun hepsini bununla değiştir → Kaydet → üstteki listeden kurulum26'yı seç → Çalıştır → izinleri onayla
 *   (Google Dokümanlar, dış istek, zamanlayıcı). Sonra Dağıt → Dağıtımları yönet → kalem → Sürüm: Yeni sürüm → Dağıt. Adres değişmez.
 */

const TZ = 'Europe/Rome';
const SURUM = '2.2.0';
const UYGULAMA_ADRESI = 'https://ykdikmen.github.io/hayat/';
// Şirketin Tur Programı takvimi. Seninle paylaşılmışsa turlar Bugün ekranında görünür; paylaşılmamışsa uygulama yine çalışır.
// Tur görmek istemezsen tırnak içini boşalt: ''
const TUR_TAKVIM_ID = '8f4c9f2141ad6f5c3b2d420bfc83c9f2ed49426659730e24056f9693a6d61572@group.calendar.google.com';
// Tablo, Claude'un okuduğu özet dosyası ve komut klasörü kurulumda otomatik açılır; kimlikleri Script Properties'te tutulur.

const VARSAYILAN_ALISKANLIKLAR = [
  {key: 'spor', label: 'Spor', type: 'check'},
  {key: 'okuma', label: 'Okuma', type: 'check'},
  {key: 'sigara', label: 'Sigara', type: 'count', lower: true},
  {key: 'su', label: 'Su (bardak)', type: 'count'},
  {key: 'cis', label: 'Çiş', type: 'count'},
  {key: 'buyuk', label: 'Büyük tuvalet', type: 'count'}
];
const ALANLAR = {is: 1, saglik: 1, para: 1, kisisel: 1};
const ODAK_TURLERI = {konus: 1, gelistir: 1, calis: 1};

/* ===================== web ===================== */

function doGet(e) {
  const p = PropertiesService.getScriptProperties();
  const sayfa = govde => HtmlService.createHtmlOutput(
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<div style="font-family:-apple-system,system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 20px;line-height:1.5;color:#1d1d1f">' + govde + '</div>'
  ).setTitle('Hayat Paneli');
  if (e && e.parameter && e.parameter.kurulum === '1' && !p.getProperty('ANAHTAR')) {
    const link = kurulum_();
    const tur = turDurumu_();
    return sayfa(
      '<h2>Hayat Paneli kuruldu 🎉</h2>' +
      '<p>Drive\'ında <b>Hayat Paneli</b> klasörü ve veri tablon hazır. Şimdi uygulamayı aç:</p>' +
      '<p><a href="' + link + '" target="_top" style="display:inline-block;background:#ff8a3d;color:#1d0e03;padding:12px 18px;border-radius:12px;font-weight:700;text-decoration:none">Uygulamayı aç</a></p>' +
      '<p style="font-size:14px">Bilgisayardaysan bu linki kendine gönder (WhatsApp, mail) ve <b>telefonda</b> aç. iPhone\'da önce Safari\'de açıp Paylaş → "Ana Ekrana Ekle" de; ikondan açınca linki bir kez daha yapıştırman istenir.</p>' +
      '<p style="word-break:break-all;font-size:13px;color:#555;background:#f4f4f6;padding:10px;border-radius:10px">' + link + '</p>' +
      '<p style="font-size:14px">Tur Programı takvimi: <b>' + tur + '</b></p>' +
      '<p style="font-size:13px;color:#555">Bu link senin anahtarın: kimseyle paylaşma. Bu sayfa bir daha gösterilmez; linki kaybedersen editörde <i>yeniAnahtar</i> fonksiyonunu çalıştır.</p>');
  }
  if (!p.getProperty('ANAHTAR')) {
    const url = ScriptApp.getService().getUrl();
    return sayfa('<h2>Hayat Paneli</h2><p>Sunucu hazır ama kurulum yapılmamış.</p><p><a href="' + url + '?kurulum=1" target="_top" style="display:inline-block;background:#ff8a3d;color:#1d0e03;padding:12px 18px;border-radius:12px;font-weight:700;text-decoration:none">Kurulumu başlat</a></p>');
  }
  return sayfa('<p>Hayat Paneli sunucusu çalışıyor (sürüm ' + SURUM + ').</p>');
}

function doPost(e) {
  let govde;
  try { govde = JSON.parse(e.postData.contents); } catch (x) { return cevap_({hata: 'istek okunamadı'}); }
  if (!anahtarDogru_(govde.k)) return cevap_({hata: 'yetki'});
  try {
    switch (govde.op) {
      case 'yukle':
        komutlariIceAktar();
        return cevap_(yukle_(govde));
      case 'kaydet':
        yaz_(Array.isArray(govde.belgeler) ? govde.belgeler : []);
        return cevap_({tamam: true});
      case 'gelen': {
        const k = govde.kayit || {}, yeni = gelenEkle_(k), c = {tamam: true};
        if (yeni === 'bekliyor' && !OTOMATIK_ISTEK_.test(String(k.metin || ''))) c.anlik = claudeUyandir_('mesaj');
        return cevap_(c);
      }
      case 'claudeTetik':
        return cevap_(claudeTetik_(govde));
      case 'gelenIptal':
        gelenGuncelle_(String(govde.id || ''), {durum: 'iptal'});
        ozetYaz_();
        return cevap_({tamam: true});
      case 'turlar':
        return cevap_({hafta: govde.hafta, turlar: turlar_(govde.hafta)});
      case 'randevu':
        return cevap_(randevu_(govde));
      case 'gunluk':
        return cevap_(gunlukYaz_(govde));
      case 'bildirim':
        return cevap_(bildirim_(govde));
      case 'bildirimAl':
        return cevap_(bildirimAl_());
      default:
        return cevap_({hata: 'bilinmeyen işlem'});
    }
  } catch (err) {
    console.error(err);
    return cevap_({hata: String((err && err.message) || err)});
  }
}

function cevap_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function anahtarDogru_(k) {
  const a = PropertiesService.getScriptProperties().getProperty('ANAHTAR');
  return !!a && typeof k === 'string' && k.length === a.length && k === a;
}

/* ===================== kurulum ===================== */

function kurulum_() {
  const p = PropertiesService.getScriptProperties();
  const anahtar = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').slice(0, 40);
  dosyalariHazirla_();
  p.setProperty('ANAHTAR', anahtar);
  veriSayfasi_(); gelenSayfasi_(); tabloSayfasi_();
  const d = defter_(); const bos = d.getSheetByName('Sayfa1') || d.getSheetByName('Sheet1');
  if (bos && d.getSheets().length > 1 && bos.getLastRow() === 0) d.deleteSheet(bos);
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === 'komutlariIceAktar' || t.getHandlerFunction() === 'bildirimTur') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('bildirimTur').timeBased().everyMinutes(5).create();   // Claude komutlarını içeri alır + bildirimleri yollar
  ozetYaz_();
  const url = ScriptApp.getService().getUrl();
  return UYGULAMA_ADRESI + '#giris=' + encodeURIComponent(url + '?k=' + anahtar);
}
/** Elle çalıştır: yeni giriş linki üretir (eskisi geçersiz olur). Link Günlük'te görünür. */
function yeniAnahtar() {
  PropertiesService.getScriptProperties().deleteProperty('ANAHTAR');
  const link = kurulum_();
  console.log('Yeni giriş linki: ' + link);
  return link;
}

/* Drive'da "Hayat Paneli" klasörü, veri tablosu, Claude'un okuduğu özet dosyası ve komut klasörü (yoksa açılır) */
function ozellik_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function dosyaVar_(id) { if (!id) return false; try { return !DriveApp.getFileById(id).isTrashed(); } catch (e) { return false; } }
function klasorVar_(id) { if (!id) return false; try { return !DriveApp.getFolderById(id).isTrashed(); } catch (e) { return false; } }
function dosyalariHazirla_() {
  const p = PropertiesService.getScriptProperties();
  let klasor;
  if (klasorVar_(p.getProperty('KLASOR_ID'))) klasor = DriveApp.getFolderById(p.getProperty('KLASOR_ID'));
  else { klasor = DriveApp.createFolder('Hayat Paneli'); p.setProperty('KLASOR_ID', klasor.getId()); }
  if (!dosyaVar_(p.getProperty('DEFTER_ID'))) {
    let d = null;
    try { d = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { d = null; }
    if (!d) { d = SpreadsheetApp.create('Hayat Paneli (veri)'); try { DriveApp.getFileById(d.getId()).moveTo(klasor); } catch (e) {} }
    p.setProperty('DEFTER_ID', d.getId());
  }
  if (!dosyaVar_(p.getProperty('OZET_DOSYA_ID'))) p.setProperty('OZET_DOSYA_ID', klasor.createFile('hayat-veri.json', '{}', 'application/json').getId());
  if (!klasorVar_(p.getProperty('KOMUT_KLASOR_ID'))) p.setProperty('KOMUT_KLASOR_ID', klasor.createFolder('komutlar').getId());
}
/** Claude kurulumu için: Drive kimlikleri */
function kimlik_() {
  return {surum: SURUM, klasor: ozellik_('KLASOR_ID'), ozetDosya: ozellik_('OZET_DOSYA_ID'), komutKlasor: ozellik_('KOMUT_KLASOR_ID'), turTakvim: TUR_TAKVIM_ID || ''};
}

/* ===================== tablolar ===================== */

let defterOnbellek_ = null;
function defter_() {
  if (defterOnbellek_) return defterOnbellek_;
  if (!ozellik_('DEFTER_ID')) dosyalariHazirla_();
  try { defterOnbellek_ = SpreadsheetApp.openById(ozellik_('DEFTER_ID')); }
  catch (e) { PropertiesService.getScriptProperties().deleteProperty('DEFTER_ID'); dosyalariHazirla_(); defterOnbellek_ = SpreadsheetApp.openById(ozellik_('DEFTER_ID')); }
  return defterOnbellek_;
}
function sayfa_(ad, basliklar) {
  const d = defter_();
  let s = d.getSheetByName(ad);
  if (!s) {
    s = d.insertSheet(ad);
    s.getRange(1, 1, 1, basliklar.length).setValues([basliklar]).setFontWeight('bold');
    s.setFrozenRows(1);
  }
  return s;
}
function veriSayfasi_() { return sayfa_('veri', ['yol', 'json', 'guncelleme']); }
function gelenSayfasi_() { return sayfa_('gelen', ['id', 'zaman', 'metin', 'durum', 'sonuc', 'islenme']); }
function tabloSayfasi_() { const s = sayfa_('tablo', ['Tarih', 'Gün', 'Plan', 'Spor', 'Okuma', 'Sigara', 'Su', 'Çiş', 'Büyük', 'Uyku', 'Enerji', 'Ruh hali', 'Odak', 'Diğer', 'Sağlık', 'Kazanımlar', 'Not']); s.getRange('A:A').setNumberFormat('@'); return s; }

function hepsiniOku_() {
  const s = veriSayfasi_();
  const n = s.getLastRow();
  const harita = {}, satir = {};
  if (n > 1) {
    s.getRange(2, 1, n - 1, 2).getValues().forEach((r, i) => {
      if (!r[0]) return;
      try { harita[r[0]] = JSON.parse(r[1]); } catch (x) { /* bozuk satır atlanır */ }
      satir[r[0]] = i + 2;
    });
  }
  return {harita, satir};
}
function gecerliYol_(y) { return typeof y === 'string' && /^(days\/\d{4}-\d{2}-\d{2}|goals\/[A-Za-z0-9_-]{1,40}|notes\/[A-Za-z0-9_-]{1,40}|meta\/settings)$/.test(y); }

/** belgeler: [{yol, veri|null}] — null siler */
function yaz_(belgeler) {
  if (!belgeler.length) return;
  const kilit = LockService.getScriptLock();
  kilit.waitLock(30000);
  try { yazKilitsiz_(belgeler); } finally { kilit.releaseLock(); }
  ozetYaz_();
}
function yazKilitsiz_(belgeler) {
    const s = veriSayfasi_();
    const {satir} = hepsiniOku_();
    const simdi = new Date().toISOString(), silinecek = [];
    belgeler.forEach(b => {
      if (!b || !gecerliYol_(b.yol)) return;
      if (b.veri === null || b.veri === undefined) { if (satir[b.yol]) silinecek.push(satir[b.yol]); return; }
      const json = JSON.stringify(b.veri);
      if (json.length > 45000) throw new Error('Kayıt çok büyük: ' + b.yol);
      if (satir[b.yol]) s.getRange(satir[b.yol], 2, 1, 2).setValues([[json, simdi]]);
      else { s.appendRow([b.yol, json, simdi]); satir[b.yol] = s.getLastRow(); }
    });
    silinecek.sort((a, b) => b - a).forEach(r => s.deleteRow(r));
    const habits = (hepsiniOku_().harita['meta/settings'] || {}).habits || VARSAYILAN_ALISKANLIKLAR;
    belgeler.filter(b => b && /^days\//.test(b.yol) && b.veri).forEach(b => tabloSatiri_(b.veri, habits));
}

function tabloSatiri_(d, habits) {
  const s = tabloSayfasi_();
  const gunAd = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][new Date(d.date + 'T12:00:00Z').getUTCDay()];
  const p = d.plan || [], c = d.counts || {}, k = d.checks || {};
  const sabit = {spor: 1, okuma: 1, sigara: 1, su: 1, cis: 1, buyuk: 1};
  const diger = habits.filter(h => !sabit[h.key]).map(h => h.type === 'check' ? (k[h.key] ? h.label + ' ✓' : '') : (c[h.key] != null ? h.label + ' ' + c[h.key] : '')).filter(String).join(', ');
  const sat = [d.date, gunAd, p.length ? p.filter(x => x.done).length + '/' + p.length : '',
    k.spor ? '✓' : '', k.okuma ? '✓' : '', c.sigara ?? '', c.su ?? '', c.cis ?? '', c.buyuk ?? '',
    d.sleep ?? '', d.energy ?? '', d.mood ?? '', d.focus ?? '', diger,
    (d.health || []).map(x => (x.time ? x.time + ' ' : '') + x.text).join('; '),
    (d.wins || []).map(x => x.text).join('; '), d.note || ''];
  const n = s.getLastRow();
  const tarihler = n > 1 ? s.getRange(2, 1, n - 1, 1).getDisplayValues().map(r => r[0]) : [];
  const i = tarihler.indexOf(d.date);
  const satirNo = i >= 0 ? i + 2 : n + 1;
  s.getRange(satirNo, 1, 1, sat.length).setNumberFormat('@').setValues([sat.map(String)]);
}

/* ===================== gelen kutusu ===================== */

function gelenEkle_(k) {
  const id = String(k.id || Utilities.getUuid().slice(0, 8)).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
  const metin = String(k.metin || '').slice(0, 9000);
  if (!metin) return;
  const durum = k.durum === 'uygulama' ? 'uygulama' : 'bekliyor';
  const s = gelenSayfasi_();
  const n = s.getLastRow();
  if (n > 1 && s.getRange(2, 1, n - 1, 1).getValues().some(r => r[0] === id)) return; // aynı kayıt iki kez gelmesin
  s.appendRow([id, new Date().toISOString(), metin, durum, String(k.sonuc || '').slice(0, 9000), durum === 'uygulama' ? new Date().toISOString() : '']);
  ozetYaz_();
  return durum;
}
function gelenOku_(adet) {
  const s = gelenSayfasi_();
  const n = s.getLastRow();
  if (n < 2) return [];
  const bas = Math.max(2, n - (adet || 60) + 1);
  return s.getRange(bas, 1, n - bas + 1, 6).getValues().map(r => ({
    id: String(r[0]), zaman: r[1] instanceof Date ? r[1].toISOString() : String(r[1]), metin: String(r[2]),
    durum: String(r[3]), sonuc: String(r[4]), islenme: r[5] instanceof Date ? r[5].toISOString() : String(r[5] || '')
  })).filter(x => x.id);
}
function gelenGuncelle_(id, alanlar) {
  if (!id) return false;
  const s = gelenSayfasi_();
  const n = s.getLastRow();
  if (n < 2) return false;
  const idler = s.getRange(2, 1, n - 1, 1).getValues().map(r => String(r[0]));
  const i = idler.lastIndexOf(id);
  if (i < 0) return false;
  const satir = i + 2;
  if (alanlar.durum) s.getRange(satir, 4).setValue(alanlar.durum);
  if (alanlar.sonuc != null) s.getRange(satir, 5).setValue(String(alanlar.sonuc).slice(0, 9000));
  if (alanlar.durum === 'islendi') s.getRange(satir, 6).setValue(new Date().toISOString());
  return true;
}

/* ===================== yükleme ve Claude özeti ===================== */

function bugun_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function gunEkle_(tarih, n) { const d = new Date(tarih + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function haftaBasi_(tarih) { const g = new Date(tarih + 'T12:00:00Z').getUTCDay(); return gunEkle_(tarih, -((g + 6) % 7)); }

function yukle_(govde) {
  const {harita} = hepsiniOku_();
  const bugun = bugun_(), alt = gunEkle_(bugun, -150);
  const days = {}, goals = {}, notes = {};
  Object.keys(harita).forEach(y => {
    const [tur, id] = y.split('/');
    if (tur === 'days' && id >= alt) days[id] = harita[y];
    else if (tur === 'goals') goals[id] = harita[y];
    else if (tur === 'notes') notes[id] = harita[y];
  });
  const hafta = /^\d{4}-\d{2}-\d{2}$/.test(govde.hafta || '') ? govde.hafta : haftaBasi_(bugun);
  let turlar = null, turHata = null;
  try { turlar = turlar_(hafta); } catch (e) { turHata = String(e.message || e); }
  return {surum: SURUM, bugun, days, goals, notes, settings: harita['meta/settings'] || null,
          gelen: gelenOku_(40), hafta, turlar, turHata, kimlik: kimlik_()};
}

function ozetYaz_() {
  const {harita} = hepsiniOku_();
  const bugun = bugun_(), alt = gunEkle_(bugun, -45), ust = gunEkle_(bugun, 30);
  const gunler = {}, hedefler = {}, odak = {};
  Object.keys(harita).forEach(y => {
    const [tur, id] = y.split('/');
    if (tur === 'days' && id >= alt && id <= ust) gunler[id] = harita[y];
    else if (tur === 'goals') hedefler[id] = harita[y];
    else if (tur === 'notes') odak[id] = harita[y];
  });
  const gelen = gelenOku_(80);
  const ozet = {
    uygulama: 'Hayat Paneli', surum: SURUM, guncelleme: new Date().toISOString(), bugun,
    aliskanliklar: (harita['meta/settings'] || {}).habits || VARSAYILAN_ALISKANLIKLAR,
    gunler, hedefler, odak,
    bekleyen: gelen.filter(g => g.durum === 'bekliyor'),
    son_gelen: gelen.filter(g => g.durum !== 'bekliyor').slice(-25),
    komut_klasoru: ozellik_('KOMUT_KLASOR_ID')
  };
  const icerik = JSON.stringify(ozet);
  try { DriveApp.getFileById(ozellik_('OZET_DOSYA_ID')).setContent(icerik); }
  catch (e) { PropertiesService.getScriptProperties().deleteProperty('OZET_DOSYA_ID'); dosyalariHazirla_(); DriveApp.getFileById(ozellik_('OZET_DOSYA_ID')).setContent(icerik); }
}

/* ===================== Claude komutları ===================== */

/** 5 dakikada bir (ve uygulama her açıldığında) çalışır: komutlar klasöründeki JSON dosyalarını uygular. */
function komutlariIceAktar() {
  let klasor;
  try { klasor = DriveApp.getFolderById(ozellik_('KOMUT_KLASOR_ID')); } catch (e) { return 0; }
  const it = klasor.getFiles(), dosyalar = [];
  while (it.hasNext()) { const f = it.next(); if (!/^HATALI/.test(f.getName())) dosyalar.push(f); }
  if (!dosyalar.length) return 0;
  dosyalar.sort((a, b) => a.getDateCreated() - b.getDateCreated());
  let n = 0;
  dosyalar.forEach(f => {
    try {
      const komut = JSON.parse(f.getBlob().getDataAsString('UTF-8'));
      komutUygula_(komut);
      f.setTrashed(true); n++;
    } catch (e) {
      console.error('Komut uygulanamadı: ' + f.getName() + ' — ' + e);
      f.setName('HATALI-' + f.getName());
    }
  });
  return n;
}

function komutUygula_(komut) {
  const ops = Array.isArray(komut && komut.ops) ? komut.ops : [];
  if (!ops.length) return;
  const kilit = LockService.getScriptLock();
  kilit.waitLock(30000);
  try {
    const {harita} = hepsiniOku_();
    const durum = {harita, degisen: {}};
    ops.forEach(op => {
      if (!op) return;
      if (op.op === 'gun') gunUygula(durum, op, bugun_(), Utilities.formatDate(new Date(), TZ, 'HH:mm'));
      else if (op.op === 'hedef') hedefUygula(durum, op, Utilities.getUuid().slice(0, 8));
      else if (op.op === 'odak') odakUygula(durum, op, Utilities.getUuid().slice(0, 8));
      else if (op.op === 'gelen') { if (gelenGuncelle_(String(op.id || ''), {durum: 'islendi', sonuc: op.sonuc || ''})) bildirimClaude_(String(op.id || ''), op.sonuc); }
    });
    const belgeler = Object.keys(durum.degisen).map(y => ({yol: y, veri: durum.harita[y]}));
    if (belgeler.length) yazKilitsiz_(belgeler);
  } finally { kilit.releaseLock(); }
  ozetYaz_();
}

/* --- saf fonksiyonlar (Node'da da test edilir) --- */
function trKucuk(s) { return String(s || '').toLocaleLowerCase('tr').trim(); }
const ESANLAM = {'çiş': 'cis', 'cis': 'cis', 'küçük tuvalet': 'cis', 'idrar': 'cis', 'kaka': 'buyuk', 'büyük': 'buyuk', 'büyük tuvalet': 'buyuk', 'buyuk': 'buyuk', 'sigara': 'sigara', 'su': 'su', 'spor': 'spor', 'gym': 'spor', 'antrenman': 'spor', 'okuma': 'okuma', 'kitap': 'okuma'};
function aliskanliklar(durum) { const s = durum.harita['meta/settings']; return (s && Array.isArray(s.habits) && s.habits.length) ? s.habits : VARSAYILAN_ALISKANLIKLAR.slice(); }
function aliskanlikAnahtari(durum, k) {
  const l = trKucuk(k);
  if (ESANLAM[l]) return ESANLAM[l];
  const h = aliskanliklar(durum).find(x => x.key === l || trKucuk(x.label) === l);
  if (h) return h.key;
  return l.replace(/[^a-z0-9çğıöşü]+/g, '_').replace(/^_|_$/g, '').slice(0, 24) || 'diger';
}
function aliskanlikGaranti(durum, key, type) {
  const hs = aliskanliklar(durum);
  if (hs.some(h => h.key === key)) return;
  const label = key.replace(/_/g, ' ').replace(/^./, c => c.toLocaleUpperCase('tr'));
  durum.harita['meta/settings'] = {habits: hs.concat([{key, label, type}])};
  durum.degisen['meta/settings'] = true;
}
function saatDuzelt(s) { const m = String(s || '').match(/^(\d{1,2})[:.](\d{2})$/); return m && +m[1] < 24 && +m[2] < 60 ? m[1].padStart(2, '0') + ':' + m[2] : ''; }
function kisaId() { return Math.random().toString(36).slice(2, 10); }

function gunUygula(durum, i, bugun, simdiSaat) {
  const tarih = /^\d{4}-\d{2}-\d{2}$/.test(String(i.tarih || '')) ? String(i.tarih) : bugun;
  const yol = 'days/' + tarih;
  const d = durum.harita[yol] || {date: tarih, plan: [], checks: {}, counts: {}, sleep: null, energy: null, mood: null, focus: null, health: [], wins: [], note: ''};
  d.counts = d.counts || {}; d.checks = d.checks || {};
  const sayi = v => { const n = Math.round(Number(v)); return isFinite(n) ? n : null; };
  Object.keys(i.sayac_ekle || {}).forEach(k0 => { const n = sayi(i.sayac_ekle[k0]); if (n === null) return; const k = aliskanlikAnahtari(durum, k0); aliskanlikGaranti(durum, k, 'count'); d.counts[k] = Math.max(0, (d.counts[k] || 0) + n); });
  Object.keys(i.sayac_ayarla || {}).forEach(k0 => { const n = sayi(i.sayac_ayarla[k0]); if (n === null) return; const k = aliskanlikAnahtari(durum, k0); aliskanlikGaranti(durum, k, 'count'); d.counts[k] = Math.max(0, n); });
  Object.keys(i.isaretle || {}).forEach(k0 => { const k = aliskanlikAnahtari(durum, k0); aliskanlikGaranti(durum, k, 'check'); d.checks[k] = !!i.isaretle[k0]; });
  if (i.uyku != null && isFinite(Number(i.uyku))) d.sleep = Math.max(0, Math.min(16, Math.round(Number(i.uyku) * 2) / 2));
  [['enerji', 'energy'], ['ruh_hali', 'mood'], ['odak', 'focus']].forEach(([f, k]) => { if (i[f] != null && isFinite(Number(i[f]))) d[k] = Math.max(1, Math.min(10, Math.round(Number(i[f])))); });
  [].concat(i.saglik || []).forEach(t => { if (String(t).trim()) d.health = (d.health || []).concat([{id: kisaId(), time: tarih === bugun ? simdiSaat : '', text: String(t).trim().slice(0, 300)}]); });
  [].concat(i.kazanim || []).forEach(t => { if (String(t).trim()) d.wins = (d.wins || []).concat([{id: kisaId(), text: String(t).trim().slice(0, 300)}]); });
  if (i.not && String(i.not).trim()) d.note = (d.note ? d.note + '\n' : '') + String(i.not).trim().slice(0, 1000);
  if (Array.isArray(i.plan_yaz)) {   /* replace the whole day's plan; keeps ticks of items that stay */
    const eski = d.plan || [];
    d.plan = i.plan_yaz.map(p => { const b = String((p && p.baslik) || '').trim().slice(0, 120); if (!b) return null; const e = eski.find(x => String(x.title || '').toLowerCase() === b.toLowerCase());
      return {id: e ? e.id : kisaId(), time: /^\d{2}:\d{2}$/.test((p && p.saat) || '') ? p.saat : '', title: b, done: e ? !!e.done : false}; }).filter(Boolean)
      .sort((a, b) => (a.time || '99') < (b.time || '99') ? -1 : 1);
  }
  [].concat(i.plan_ekle || []).forEach(p => { const b = String((p && p.baslik) || '').trim(); if (b) d.plan = (d.plan || []).concat([{id: kisaId(), time: saatDuzelt(p.saat), title: b.slice(0, 200), done: false}]); });
  [].concat(i.plan_tamamla || []).forEach(q => {
    const ql = trKucuk(q); if (!ql) return;
    const it = (d.plan || []).find(x => !x.done && trKucuk(x.title).includes(ql)) || (d.plan || []).find(x => trKucuk(x.title).includes(ql));
    if (it) it.done = true;
  });
  d.updatedAt = new Date().toISOString();
  durum.harita[yol] = d; durum.degisen[yol] = true;
  return d;
}
function hedefUygula(durum, i, yeniId) {
  if (i.islem !== 'guncelle') {
    const y = 'goals/' + yeniId;
    durum.harita[y] = {title: String(i.baslik || '').slice(0, 200), horizon: String(i.sure || bugun_().slice(0, 4)), area: ALANLAR[i.alan] ? i.alan : 'kisisel',
      next: String(i.sonraki || '').slice(0, 200), progress: Math.max(0, Math.min(100, Math.round(Number(i.ilerleme) || 0))), createdAt: new Date().toISOString()};
    durum.degisen[y] = true; return durum.harita[y];
  }
  const q = trKucuk(i.baslik);
  const y = Object.keys(durum.harita).find(k => /^goals\//.test(k) && trKucuk(durum.harita[k].title).includes(q));
  if (!y) return null;
  const g = durum.harita[y];
  if (i.ilerleme != null && isFinite(Number(i.ilerleme))) g.progress = Math.max(0, Math.min(100, Math.round(Number(i.ilerleme))));
  if (i.sonraki) g.next = String(i.sonraki).slice(0, 200);
  durum.degisen[y] = true; return g;
}
function odakUygula(durum, i, yeniId) {
  const y = 'notes/' + yeniId;
  durum.harita[y] = {kind: ODAK_TURLERI[i.tur] ? i.tur : 'gelistir', text: String(i.metin || '').slice(0, 200), done: false, createdAt: new Date().toISOString()};
  durum.degisen[y] = true; return durum.harita[y];
}

/* ===================== takvim ===================== */

function turTakvimi_() {
  if (!TUR_TAKVIM_ID) return null;
  let t = null;
  try { t = CalendarApp.getCalendarById(TUR_TAKVIM_ID); } catch (e) { t = null; }
  if (!t) { try { t = CalendarApp.subscribeToCalendar(TUR_TAKVIM_ID); } catch (e) { t = null; } }  // paylaşılmış ama listede yoksa ekler
  return t;
}
function turDurumu_() { if (!TUR_TAKVIM_ID) return 'kapalı'; return turTakvimi_() ? 'bağlandı ✓' : 'henüz paylaşılmamış (paylaşılınca kendiliğinden görünür)'; }
function turlar_(hafta) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(hafta || ''))) throw new Error('hafta tarihi yok');
  const bas = Utilities.parseDate(hafta + ' 00:00', TZ, 'yyyy-MM-dd HH:mm');
  const son = Utilities.parseDate(gunEkle_(hafta, 7) + ' 00:00', TZ, 'yyyy-MM-dd HH:mm');
  if (!TUR_TAKVIM_ID) return [];
  const takvim = turTakvimi_();
  if (!takvim) throw new Error('takvim bu Google hesabıyla paylaşılmamış. Kerem\'den Tur Programı takvimini Gmail adresinle paylaşmasını iste.');
  return takvim.getEvents(bas, son).filter(e => !e.isAllDayEvent()).map(e => ({
    tarih: Utilities.formatDate(e.getStartTime(), TZ, 'yyyy-MM-dd'),
    saat: Utilities.formatDate(e.getStartTime(), TZ, 'HH:mm'),
    baslik: e.getTitle() || '',
    aciklama: (e.getDescription() || '').slice(0, 1500)
  }));
}

function randevu_(b) {
  const baslik = String(b.baslik || '').trim().slice(0, 200);
  const tarih = String(b.tarih || ''), saat = saatDuzelt(b.saat);
  if (!baslik || !/^\d{4}-\d{2}-\d{2}$/.test(tarih) || !saat) throw new Error('Randevu için başlık, tarih ve saat gerekli');
  const sure = Math.max(10, Math.min(600, Math.round(Number(b.sure_dk) || 60)));
  const bas = Utilities.parseDate(tarih + ' ' + saat, TZ, 'yyyy-MM-dd HH:mm');
  const son = new Date(bas.getTime() + sure * 60000);
  const ev = CalendarApp.getDefaultCalendar().createEvent(baslik, bas, son, {location: String(b.yer || ''), description: String(b.aciklama || 'Hayat Paneli')});
  ev.removeAllReminders();
  (Array.isArray(b.hatirlat_dk) && b.hatirlat_dk.length ? b.hatirlat_dk : [60, 15]).slice(0, 5).forEach(m => { const n = Math.round(Number(m)); if (n >= 0 && n <= 40320) ev.addPopupReminder(n); });
  return {tamam: true, baslik, tarih, saat};
}

/* ===================== 2.6: sesli günlük → Google Docs, uygulamadan bildirim ===================== */

const AYLAR_ = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const GUNLER_ = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

/**
 * GÜNCELLEMEDEN SONRA BİR KEZ: yukarıdaki listeden kurulum26'yı seç → Çalıştır → izinleri onayla.
 * Google Dokümanlar (günlük), dış istek (bildirim) ve zamanlayıcı izinlerini ister, 5 dakikalık bildirim zamanlayıcısını kurar.
 */
function kurulum26() {
  const sonuc = [];
  sonuc.push('Günlük klasörü: Hayat Paneli/' + gunlukKlasoru_().getName() + ' ✓');
  sonuc.push(bildirimZamanlayici_());
  try { UrlFetchApp.fetch('https://www.google.com/generate_204', {muteHttpExceptions: true}); sonuc.push('Bildirim gönderme izni ✓'); } catch (e) { sonuc.push('Bildirim gönderme izni yok: ' + e); }
  sonuc.push('Google Dokümanlar izni ' + (DocumentApp.ParagraphHeading.HEADING2 ? '✓' : '?'));
  console.log(sonuc.join('\n'));
  return sonuc.join('\n');
}
function bildirimZamanlayici_() {
  const ts = ScriptApp.getProjectTriggers();
  ts.forEach(t => { if (t.getHandlerFunction() === 'komutlariIceAktar') ScriptApp.deleteTrigger(t); });   // bildirimTur onu da yapar
  if (!ts.some(t => t.getHandlerFunction() === 'bildirimTur')) ScriptApp.newTrigger('bildirimTur').timeBased().everyMinutes(5).create();
  return 'Bildirim zamanlayıcısı ✓';
}

/* ---- sesli günlük: her ay tek Google Dokümanı, her gün bir başlık ---- */
function gunlukKlasoru_() {
  try { defter_(); } catch (e) { /* ortak sürümde klasörü ilk kurulum açar */ }
  let ust = null;
  const kid = PropertiesService.getScriptProperties().getProperty('KLASOR_ID');
  if (kid) { try { ust = DriveApp.getFolderById(kid); } catch (e) { ust = null; } }
  if (!ust) { const it = DriveApp.getFoldersByName('Hayat Paneli'); ust = it.hasNext() ? it.next() : DriveApp.createFolder('Hayat Paneli'); }
  const alt = ust.getFoldersByName('Günlük');
  return alt.hasNext() ? alt.next() : ust.createFolder('Günlük');
}
function gunlukSayfasi_() { return sayfa_('gunluk', ['id', 'tarih', 'saat', 'belge', 'zaman']); }
function gunlukBaslik_(tarih) {
  const [y, m, g] = tarih.split('-').map(Number);
  return g + ' ' + AYLAR_[m - 1] + ' ' + y + ', ' + GUNLER_[new Date(Date.UTC(y, m - 1, g, 12)).getUTCDay()];
}
function gunlukYaz_(b) {
  const id = String(b.id || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
  const tarih = String(b.tarih || ''), saat = String(b.saat || '').replace(/[^0-9:]/g, '').slice(0, 5);
  const metin = String(b.metin || '').replace(/\r/g, '').trim().slice(0, 20000);
  if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(tarih) || !metin) return {hata: 'günlük eksik'};
  const kilit = LockService.getScriptLock();
  kilit.waitLock(30000);
  try {
    const s = gunlukSayfasi_(), n = s.getLastRow();
    if (n > 1) {
      const eski = s.getRange(2, 1, n - 1, 4).getValues().find(r => String(r[0]) === id);
      if (eski) return {tamam: true, zaten: true, url: 'https://docs.google.com/document/d/' + eski[3] + '/edit'};
    }
    const [y, m] = tarih.split('-').map(Number);
    const ad = 'Hayat Günlüğü – ' + AYLAR_[m - 1] + ' ' + y;
    const klasor = gunlukKlasoru_(), dosyalar = klasor.getFilesByName(ad);
    let doc;
    if (dosyalar.hasNext()) doc = DocumentApp.openById(dosyalar.next().getId());
    else {
      doc = DocumentApp.create(ad);
      DriveApp.getFileById(doc.getId()).moveTo(klasor);
      doc.getBody().getParagraphs()[0].setText(ad).setHeading(DocumentApp.ParagraphHeading.TITLE);
    }
    gunlukEkle_(doc.getBody(), gunlukBaslik_(tarih), saat, metin);
    doc.saveAndClose();
    s.appendRow([id, tarih, saat, doc.getId(), new Date().toISOString()]);
    return {tamam: true, url: 'https://docs.google.com/document/d/' + doc.getId() + '/edit'};
  } finally { kilit.releaseLock(); }
}
/* Günün başlığı varsa o günün sonuna, yoksa belgenin sonuna yeni başlıkla ekler. */
function gunlukEkle_(body, baslik, saat, metin) {
  const H = DocumentApp.ParagraphHeading, ps = body.getParagraphs();
  let bas = -1, son = ps.length;
  for (let i = 0; i < ps.length; i++) {
    const h = ps[i].getHeading();
    if (bas < 0 && h === H.HEADING2 && ps[i].getText() === baslik) bas = i;
    else if (bas >= 0 && (h === H.HEADING2 || h === H.HEADING1)) { son = i; break; }
  }
  const satirlar = [];
  if (saat) satirlar.push({t: '🎙 ' + saat, h: H.HEADING4});
  metin.split(/\n{2,}/).forEach(p => { if (p.trim()) satirlar.push({t: p.trim(), h: H.NORMAL}); });
  if (bas < 0) {
    body.appendParagraph(baslik).setHeading(H.HEADING2);
    satirlar.forEach(x => body.appendParagraph(x.t).setHeading(x.h));
  } else {
    const yer = body.getChildIndex(son < ps.length ? ps[son] : ps[ps.length - 1]) + (son < ps.length ? 0 : 1);
    satirlar.forEach((x, j) => {
      if (yer + j >= body.getNumChildren()) body.appendParagraph(x.t).setHeading(x.h);
      else body.insertParagraph(yer + j, x.t).setHeading(x.h);
    });
  }
}

/* ---- bildirimler: uygulama kendi anahtarıyla imzalar, sunucu zamanı gelince "dürtme" yollar ---- */
function bildirimSayfasi_() { return sayfa_('bildirim', ['id', 'zaman', 'baslik', 'metin', 'hash', 'tur', 'durum', 'kaynak']); }
function pushAyar_() { try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('PUSH') || 'null'); } catch (e) { return null; } }
function pushAyarYaz_(o) { const p = PropertiesService.getScriptProperties(); if (o) p.setProperty('PUSH', JSON.stringify(o)); else p.deleteProperty('PUSH'); }
function satirlar_(s) { const n = s.getLastRow(); return n > 1 ? s.getRange(2, 1, n - 1, 8).getValues() : []; }
function satirlariYaz_(s, v) {
  const n = s.getLastRow();
  if (n > 1) s.getRange(2, 1, n - 1, 8).clearContent();
  if (v.length) s.getRange(2, 1, v.length, 8).setValues(v);
}

function bildirim_(b) {
  const kilit = LockService.getScriptLock();
  kilit.waitLock(30000);
  const cevap = {tamam: true};
  try {
    if (b.kapat) {
      pushAyarYaz_(null);
      const s = bildirimSayfasi_();
      satirlariYaz_(s, satirlar_(s).filter(r => r[6] !== 'bekliyor'));
      return cevap;
    }
    let ayar = pushAyar_();
    if (b.abonelik && b.abonelik.endpoint) {
      if (!/^https:\/\//.test(b.abonelik.endpoint)) return {hata: 'abonelik geçersiz'};
      ayar = {endpoint: String(b.abonelik.endpoint), pub: String(b.pub || '').slice(0, 120), jwt: (Array.isArray(b.jwt) ? b.jwt : []).filter(x => x && x.t && x.exp).slice(0, 24), tercih: (ayar && ayar.tercih) || {}};
      while (JSON.stringify(ayar).length > 8600 && ayar.jwt.length > 4) ayar.jwt.pop();
      try { cevap.zamanlayici = bildirimZamanlayici_(); } catch (e) { cevap.zamanlayici = 'zamanlayıcı kurulamadı: Apps Script editöründe kurulum26 bir kez çalıştırılmalı'; }
    }
    if (!ayar) return {hata: 'bildirim aboneliği yok'};
    if (b.tercih && typeof b.tercih === 'object') ayar.tercih = b.tercih;
    pushAyarYaz_(ayar);
    if (Array.isArray(b.liste)) bildirimListe_(b.liste);
    if (b.test) {
      bildirimEkle_({id: 't' + Date.now(), baslik: '🔔 Hayat bildirimi', metin: 'Bildirimler çalışıyor. Hatırlatmaları artık uygulama gönderecek.', hash: '#bugun', tur: 'test'}, 'gonderildi');
    }
  } finally { kilit.releaseLock(); }
  if (b.test) cevap.test = pushGonder_();
  return cevap;
}
/* Uygulamanın planladığı bildirimler: bekleyenler yenisiyle değişir; gönderilmiş olanlar tekrar eklenmez; 3 günden eskiler silinir. */
function bildirimListe_(liste) {
  const s = bildirimSayfasi_(), simdi = Date.now();
  const v = satirlar_(s).filter(r => r[0] && !(r[7] === 'uygulama' && r[6] === 'bekliyor') && Number(r[1]) > simdi - 3 * 86400000);
  const gorulen = {}; v.forEach(r => { gorulen[String(r[0])] = 1; });
  liste.slice(0, 200).forEach(x => {
    const id = String((x && x.id) || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60), z = Number(x && x.zaman);
    if (!id || gorulen[id] || !(z > simdi - 600000 && z < simdi + 8 * 86400000)) return;
    gorulen[id] = 1;
    v.push([id, z, String(x.baslik || 'Hayat').slice(0, 120), String(x.metin || '').slice(0, 300), String(x.hash || '#bugun').slice(0, 20), String(x.tur || '').slice(0, 12), 'bekliyor', 'uygulama']);
  });
  satirlariYaz_(s, v);
}
function bildirimEkle_(x, durum) {
  const s = bildirimSayfasi_(), id = String(x.id).slice(0, 60);
  if (satirlar_(s).some(r => String(r[0]) === id)) return;
  s.appendRow([id, Date.now(), String(x.baslik || 'Hayat').slice(0, 120), String(x.metin || '').slice(0, 300), x.hash || '#bugun', x.tur || '', durum || 'bekliyor', 'sunucu']);
}
/* Claude bir mesaja cevap verince (komut klasöründen) */
function bildirimClaude_(id, sonuc) {
  const ayar = pushAyar_();
  if (!ayar || (ayar.tercih || {}).claude === false) return;
  const k = gelenOku_(150).find(x => x.id === id);
  if (!k) return;
  const m = String(k.metin).match(/BR[İI]F[İI]NG\s+(SABAH|ÖĞLE|ÖĞLEN|AKŞAM)/i);
  const tur = m ? m[1].toLocaleUpperCase('tr') : '';
  const baslik = tur === 'SABAH' ? '☀️ Sabah brifingin hazır' : tur === 'AKŞAM' ? '🌙 Akşam brifingin hazır' : tur ? '🍝 Öğle brifingin hazır' : '💬 Claude cevap verdi';
  const temiz = String(sonuc || '').replace(/\[\[[\s\S]*?\]\]/g, '').replace(/[*#_>`]/g, '').replace(/\s+/g, ' ').trim();
  bildirimEkle_({id: 'c' + id, baslik, metin: m ? 'Dinlemek için dokun.' : temiz.slice(0, 160), hash: m ? '#bugun' : '#claude', tur: 'claude'});
}
/* Zamanlayıcı (5 dk): Claude'un cevaplarını içeri alır, zamanı gelen bildirimleri hazırlar ve telefonu dürter. */
function bildirimTur() {
  try { komutlariIceAktar(); } catch (e) { console.error(e); }
  try { tetikBekleyen_(); } catch (e) { console.error(e); }
  const ayar = pushAyar_();
  if (!ayar) return;
  const kilit = LockService.getScriptLock();
  if (!kilit.tryLock(20000)) return;
  let hazir = 0;
  try {
    const s = bildirimSayfasi_(), v = satirlar_(s), simdi = Date.now();
    let harita = null;
    const veri = () => harita || (harita = hepsiniOku_().harita);
    v.forEach((r, i) => {
      if (r[6] !== 'bekliyor' || Number(r[1]) > simdi + 150000) return;
      let durum = 'gonderildi';
      if (simdi - Number(r[1]) > 30 * 60000) durum = 'atlandi';
      else { const k = bildirimKontrol_(r, veri, ayar.tercih || {}); if (k === false) durum = 'atlandi'; else if (typeof k === 'string') r[3] = k; }
      if (durum === 'gonderildi') hazir++;
      s.getRange(i + 2, 4, 1, 4).setValues([[r[3], r[4], r[5], durum]]);
    });
  } finally { kilit.releaseLock(); }
  if (hazir) console.log(pushGonder_(ayar));
}
/* false: gönderme · metin: bu metinle gönder · true: olduğu gibi */
function bildirimKontrol_(r, veri, tercih) {
  const tur = String(r[5]), id = String(r[0]);
  if (tercih[tur] === false) return false;
  if (tur === 'su' || tur === 'kapat' || tur === 'plan') {
    const h = veri(), gun = h['days/' + bugun_()] || {};
    if (tur === 'kapat') return gun.mood == null;
    if (tur === 'plan') {
      const m = id.match(/^p-(\d{4}-\d{2}-\d{2})-(.+)$/);
      if (!m) return true;
      const p = ((h['days/' + m[1]] || {}).plan || []).find(x => x.id === m[2]);
      return !!(p && !p.done);
    }
    const ayarlar = h['meta/settings'] || {}, al = (ayarlar.habits || []).find(x => x.key === 'su') || {};
    const hedef = Number(al.hedef) || 8, n = Number((gun.counts || {}).su) || 0;
    if (n >= hedef) return false;
    return n ? 'Bugün ' + n + '/' + hedef + ' bardak. Bir bardak daha iç.' : 'Bugün henüz su kaydı yok. Bir bardak su iç.';
  }
  return true;
}
function pushGonder_(ayar) {
  ayar = ayar || pushAyar_();
  if (!ayar) return 'abonelik yok';
  const simdi = Math.floor(Date.now() / 1000);
  const j = (ayar.jwt || []).filter(x => x.exp - simdi > 120 && x.exp - simdi <= 86340).sort((a, b) => a.exp - b.exp)[0];
  if (!j) return 'imzaların süresi doldu — uygulamayı bir kez aç';
  const r = UrlFetchApp.fetch(ayar.endpoint, {method: 'post', headers: {TTL: '21600', Urgency: 'high', Authorization: 'vapid t=' + j.t + ', k=' + ayar.pub}, muteHttpExceptions: true, followRedirects: false});
  const kod = r.getResponseCode();
  if (kod === 404 || kod === 410) { pushAyarYaz_(null); return 'abonelik artık geçersiz (' + kod + ') — uygulamada bildirimleri yeniden aç'; }
  return kod >= 200 && kod < 300 ? 'gönderildi (' + kod + ')' : 'hata ' + kod + ': ' + r.getContentText().slice(0, 160);
}
/* Telefon (service worker) dürtülünce buradan metni alır. */
function bildirimAl_() {
  const kilit = LockService.getScriptLock();
  kilit.waitLock(15000);
  try {
    const s = bildirimSayfasi_(), v = satirlar_(s), out = [];
    v.forEach((r, i) => { if (r[6] === 'gonderildi') { out.push({id: String(r[0]), baslik: String(r[2]), metin: String(r[3]), hash: String(r[4] || '#bugun')}); s.getRange(i + 2, 7).setValue('alindi'); } });
    return {bildirimler: out.slice(-4)};
  } finally { kilit.releaseLock(); }
}

/* ===================== 2.7: Claude'u anında uyandır ===================== */
/* Uygulamadan gerçek bir mesaj gelince Claude'daki "Hayat gelen kutusu" görevi API tetikleyicisiyle hemen çalışır
   (claude.ai/code/routines → görev → Add another trigger → API → Generate token). Adres ve anahtar sadece burada,
   Script Properties'te durur; uygulamaya geri verilmez. */
const OTOMATIK_ISTEK_ = /^\s*(📣|📬)/;
function tetikAyar_() { try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('CLAUDE_TETIK') || 'null'); } catch (e) { return null; } }
function claudeTetik_(b) {
  const p = PropertiesService.getScriptProperties();
  if (b.sil) { p.deleteProperty('CLAUDE_TETIK'); p.deleteProperty('CLAUDE_TETIK_BEKLIYOR'); return {tamam: true, kurulu: false}; }
  if (b.url || b.token) {
    const url = String(b.url || '').trim(), token = String(b.token || '').trim();
    if (!/^https:\/\/api\.anthropic\.com\/v1\/claude_code\/routines\/trig_[A-Za-z0-9]+\/fire$/.test(url)) return {hata: 'Adres https://api.anthropic.com/v1/claude_code/routines/trig_…/fire biçiminde olmalı.'};
    if (!/^sk-ant-[A-Za-z0-9_-]{20,}$/.test(token)) return {hata: 'Anahtar sk-ant- ile başlamalı.'};
    p.setProperty('CLAUDE_TETIK', JSON.stringify({url, token}));
  }
  const cevap = {tamam: true, kurulu: !!tetikAyar_(), son: p.getProperty('CLAUDE_TETIK_SON') || ''};
  if (b.dene && cevap.kurulu) { cevap.dene = claudeUyandir_('deneme', true); cevap.son = p.getProperty('CLAUDE_TETIK_SON') || ''; }
  return cevap;
}
/* Art arda mesajlar tek oturumda işlensin: son uyandırmadan 3 dk geçmediyse bekletir, zamanlayıcı sonra uyandırır. */
function claudeUyandir_(neden, zorla) {
  const k = tetikAyar_();
  if (!k) return 'kurulu değil';
  const p = PropertiesService.getScriptProperties(), simdi = Date.now(), son = Number(p.getProperty('CLAUDE_TETIK_ZAMAN') || 0);
  if (!zorla && simdi - son < 3 * 60000) { p.setProperty('CLAUDE_TETIK_BEKLIYOR', '1'); return 'bekletildi'; }
  p.setProperty('CLAUDE_TETIK_ZAMAN', String(simdi));
  p.deleteProperty('CLAUDE_TETIK_BEKLIYOR');
  let durum;
  try {
    const metin = neden === 'deneme' ? 'Hayat uygulamasından deneme: gelen kutusunda bekleyen varsa işle, yoksa "Bekleyen yok." de ve bildirim gönderme.'
      : 'Hayat uygulamasından az önce yeni mesaj geldi; saatlik çalışmayı beklemeden gelen kutusundaki bekleyenleri şimdi işle.';
    const r = UrlFetchApp.fetch(k.url, {method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: {Authorization: 'Bearer ' + k.token, 'anthropic-version': '2023-06-01'}, payload: JSON.stringify({text: metin})});
    const kod = r.getResponseCode();
    durum = kod >= 200 && kod < 300 ? 'çalıştı' : kod === 401 ? 'hata 401: anahtar geçersiz (yeni anahtar üret ve yeniden kaydet)' : kod === 429 ? 'hata 429: saatlik sınır doldu, saatlik görev işleyecek' : 'hata ' + kod + ': ' + r.getContentText().slice(0, 160);
    if (kod >= 200 && kod < 300) hizliIzle_();
  } catch (e) { durum = 'hata: ' + e; }
  p.setProperty('CLAUDE_TETIK_SON', Utilities.formatDate(new Date(), TZ, 'dd.MM HH:mm') + ' · ' + durum);
  return durum;
}
function kullaniciBekleyen_() { return gelenOku_(80).filter(x => x.durum === 'bekliyor' && !OTOMATIK_ISTEK_.test(String(x.metin))).length; }
/* Uyandırdıktan sonra 15 dk boyunca dakikada bir Claude'un cevabına bakar; gelince içeri alır ve telefona bildirir. */
function hizliIzle_() {
  PropertiesService.getScriptProperties().setProperty('HIZLI_BITIS', String(Date.now() + 15 * 60000));
  hizliKur_(75);
}
function hizliKur_(sn) {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === 'hizliTur') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('hizliTur').timeBased().after(sn * 1000).create();
}
function hizliTur() {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === 'hizliTur') ScriptApp.deleteTrigger(t); });
  bildirimTur();
  if (kullaniciBekleyen_() && Date.now() < Number(PropertiesService.getScriptProperties().getProperty('HIZLI_BITIS') || 0)) hizliKur_(60);
}
/* bildirimTur her 5 dakikada: bekletilmiş bir uyandırma varsa ve hâlâ bekleyen mesaj varsa şimdi uyandır */
function tetikBekleyen_() {
  const p = PropertiesService.getScriptProperties();
  if (p.getProperty('CLAUDE_TETIK_BEKLIYOR') && kullaniciBekleyen_()) claudeUyandir_('bekleyen');
  else if (p.getProperty('CLAUDE_TETIK_BEKLIYOR') && !kullaniciBekleyen_()) p.deleteProperty('CLAUDE_TETIK_BEKLIYOR');
}
