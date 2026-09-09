// Mizanım UYAP + UETS Aktarım — popup
let davalar = [];
let tebligatlar = [];
let mode = "uyap"; // aktif sekmeye göre: uyap | uets

const $ = (id) => document.getElementById(id);

function setStatus(el, text, cls) {
  el.textContent = text;
  el.className = "status " + cls;
}

async function verify() {
  const res = await chrome.runtime.sendMessage({ type: "MIZANIM_VERIFY" });
  if (res && res.ok) {
    $("connStatus").textContent = "Bağlı: Av. " + (res.lawyerName || "");
    setStatus($("tokenStatus"), "Bağlantı doğrulandı ✓", "ok");
    return true;
  }
  $("connStatus").textContent = "Bağlı değil";
  if (res && res.error) setStatus($("tokenStatus"), res.error, "err");
  return false;
}

// Tüm çerçevelere (iframe dahil) mesaj gönderip yanıtları birleştirir —
// SPA portallar içeriği iframe içinde render edebilir
async function scanAllFrames(tabId, msgType, listKey, dedupeKey) {
  let frames = [{ frameId: 0 }];
  try {
    const all = await chrome.webNavigation.getAllFrames({ tabId });
    if (all && all.length) frames = all;
  } catch (_) { /* izin yoksa üst çerçeveyle devam */ }

  const merged = [];
  const seen = new Set();
  let yanitVeren = 0; // içerik betiği yüklü olmayan sekmeyi ayırt etmek için
  let notReady = false; // grid henüz yüklenmedi (yarış) — gerçek 0'dan ayırt için
  let empty = false;    // UYAP "kayıt yok" bildirdi (gerçek 0 kayıt)
  for (const f of frames) {
    try {
      const res = await chrome.tabs.sendMessage(tabId, { type: msgType }, { frameId: f.frameId });
      if (res) yanitVeren++;
      if (res && res.notReady) notReady = true;
      if (res && res.empty) empty = true;
      if (res && res.ok && Array.isArray(res[listKey])) {
        res[listKey].forEach((item) => {
          const key = item[dedupeKey] || JSON.stringify(item);
          if (seen.has(key)) return;
          seen.add(key);
          merged.push(item);
        });
      }
    } catch (_) { /* bu çerçevede içerik betiği yok */ }
  }
  return { merged, yanitVeren, notReady, empty };
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function detectMode(url) {
  if (url.includes("uyap.gov.tr")) return "uyap";
  if (url.includes("etebligat.gov.tr")) return "uets";
  return null;
}

// Tek sayfayı tara (önizleme) — UYAP'ta detay/liste, UETS'te tebligat
async function scan() {
  const tab = await activeTab();
  const url = (tab && tab.url) || "";
  const m = detectMode(url);
  if (!m) {
    setStatus($("transferStatus"), "Bu sekme UYAP veya UETS sayfası değil. Portalı açıp tekrar deneyin.", "err");
    $("count").textContent = "0";
    return;
  }
  mode = m;
  $("modeLabel").textContent = mode === "uyap" ? "UYAP Dosyaları" : "UETS e-Tebligatları";

  const cfg = mode === "uyap"
    ? { msg: "MIZANIM_SCAN", key: "davalar", dedupe: "esasNo" }
    : { msg: "MIZANIM_SCAN_UETS", key: "tebligatlar", dedupe: "barkod" };

  try {
    const sonuc = await scanAllFrames(tab.id, cfg.msg, cfg.key, cfg.dedupe);
    if (sonuc.yanitVeren === 0) {
      setStatus($("transferStatus"), `Eklenti bu sayfaya henüz bağlanamadı. ${mode === "uyap" ? "UYAP" : "UETS"} sayfasını yenileyin (F5) ve tekrar deneyin.`, "err");
      $("count").textContent = "0";
      $("transfer").disabled = true;
      return;
    }
    // YARIŞ FIX: "henüz yüklenmedi" ile "gerçekten 0 kayıt"ı ayır
    if (mode === "uyap" && sonuc.merged.length === 0 && sonuc.notReady && !sonuc.empty) {
      setStatus($("transferStatus"), "Dosya tablosu henüz yüklenmedi. Sorgu yaptığınızdan emin olun; liste geldiğinde tekrar tarayın.", "err");
      $("count").textContent = "0";
      $("transfer").disabled = true;
      return;
    }
    if (mode === "uyap") { davalar = sonuc.merged; renderList(davalar, (d) => `<b>${d.esasNo}</b> ${d.mahkemeAdi || ""}${d.davaTuru ? " · " + d.davaTuru : ""}${d._detay ? " · detay" : ""}`); }
    else { tebligatlar = sonuc.merged; renderList(tebligatlar, (t) => `<b>${t.tebligTarihi || "?"}</b> ${t.gonderen || ""}<br><span style='color:#888'>${(t.konu || "").slice(0, 70)}</span>`); }
    const n = mode === "uyap" ? davalar.length : tebligatlar.length;
    $("count").textContent = String(n);
    $("transfer").disabled = n === 0;
    $("transferStatus").className = "status";
    if (n === 0) {
      setStatus($("transferStatus"), mode === "uyap"
        ? (sonuc.empty
            ? "UYAP bu sorgu için 0 kayıt bildirdi (gösterilecek veri yok)."
            : "Bu sayfada dosya bulunamadı. Dosya sorgulama listesini açıp tekrar tarayın.")
        : "Bu sayfada tebligat bulunamadı. Tebligat listesini açıp tekrar tarayın.", "info");
    }
  } catch (e) {
    setStatus($("transferStatus"), "Sayfa okunamadı (içerik betiği yüklü değil). Sayfayı yenileyin.", "err");
  }
}

function renderList(items, fmt) {
  const list = $("list");
  list.innerHTML = "";
  items.slice(0, 30).forEach((it) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = fmt(it);
    list.appendChild(div);
  });
}

async function transferNow() {
  let res;
  if (mode === "uets") {
    if (tebligatlar.length === 0) return;
    res = await chrome.runtime.sendMessage({ type: "MIZANIM_TRANSFER_UETS", tebligatlar });
  } else {
    if (davalar.length === 0) return;
    res = await chrome.runtime.sendMessage({ type: "MIZANIM_TRANSFER", davalar });
  }
  if (res && res.ok) {
    setStatus($("transferStatus"), `✓ ${res.eklendi} yeni, ${res.guncellendi} güncellendi` + (res.hata ? `, ${res.hata} hata` : ""), "ok");
  } else {
    setStatus($("transferStatus"), (res && res.error) || "Aktarım başarısız", "err");
  }
}

// TEK TIKLA TAM SENKRON: tüm sayfaları gez → topla → aktar
async function syncAll() {
  const tab = await activeTab();
  const url = (tab && tab.url) || "";
  const m = detectMode(url);
  if (!m) {
    setStatus($("transferStatus"), "Bu sekme UYAP veya UETS sayfası değil.", "err");
    return;
  }
  mode = m;
  $("syncAll").disabled = true;
  $("transfer").disabled = true;

  if (mode === "uets") {
    // UETS için sayfalama yok; tek tarama + aktar
    setStatus($("transferStatus"), "Tebligatlar taranıyor...", "info");
    await scan();
    if (tebligatlar.length > 0) { setStatus($("transferStatus"), "Aktarılıyor...", "info"); await transferNow(); }
    $("syncAll").disabled = false;
    return;
  }

  setStatus($("transferStatus"), "Tüm sayfalar geziliyor... (bekleyin)", "info");
  try {
    // Sayfalama gezme ana çerçevede yürür; iframe'lerde de dene, birleştir
    const sonuc = await scanAllFrames(tab.id, "MIZANIM_SCAN_ALL", "davalar", "esasNo");
    davalar = sonuc.merged;
    if (sonuc.yanitVeren === 0) {
      setStatus($("transferStatus"), "Eklenti bu sayfaya bağlanamadı. UYAP dosya listesini açıp sayfayı yenileyin (F5).", "err");
      $("syncAll").disabled = false;
      return;
    }
    if (davalar.length === 0 && sonuc.notReady && !sonuc.empty) {
      setStatus($("transferStatus"), "Dosya tablosu henüz yüklenmedi. Sorgu yaptığınızdan emin olun; liste geldiğinde tekrar deneyin.", "err");
      $("syncAll").disabled = false;
      return;
    }
    $("count").textContent = String(davalar.length);
    renderList(davalar, (d) => `<b>${d.esasNo}</b> ${d.mahkemeAdi || ""}${d.davaTuru ? " · " + d.davaTuru : ""}`);
    if (davalar.length === 0) {
      setStatus($("transferStatus"), sonuc.empty
        ? "UYAP bu sorgu için 0 kayıt bildirdi (gösterilecek veri yok)."
        : "Dosya bulunamadı. Dosya sorgulama sonuç listesini açıp tekrar deneyin. Sorun sürerse 'Teşhis Kopyala' ile bize ulaşın.", "info");
      $("syncAll").disabled = false;
      return;
    }
    setStatus($("transferStatus"), `${davalar.length} dosya bulundu, aktarılıyor...`, "info");
    await transferNow();
  } catch (e) {
    setStatus($("transferStatus"), "Senkron hatası: " + String(e), "err");
  } finally {
    $("syncAll").disabled = false;
  }
}

// ── A1 DERİN TARAMA: tüm yargı türleri × birimler × sayfalar × dosya detayları ──
// Motor content script'te çalışır (popup kapansa da sürer); ilerleme storage'dan okunur.

let deepPaused = false;

function fmtSure(ms) {
  if (!ms || ms < 0) return "–";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} sn`;
  const dk = Math.floor(s / 60), sn = s % 60;
  return sn ? `${dk} dk ${sn} sn` : `${dk} dk`;
}

function renderDeepProgress(st) {
  if (!st) return;
  $("deepPanel").style.display = "block";
  const p = st.progress || {};
  const durum = st.running ? (st.paused ? "⏸ Duraklatıldı" : "⏳ Çalışıyor") : "";
  $("deepPhase").textContent = `${durum} ${p.phase || ""}`.trim();

  // Canlı sayaç: X/Y + geçen süre + tahmini kalan (ETA)
  const islenen = p.islenen || 0;
  const toplam = p.toplam || 0;
  const gecen = p.startTs ? Date.now() - p.startTs : 0;
  const eta = (islenen > 0 && toplam > islenen && st.running && !st.paused)
    ? (gecen / islenen) * (toplam - islenen) : 0;
  const sayac = toplam ? `${islenen}/${toplam}` : `${islenen}`;
  const hataliN = (p.hataliDosyalar || []).length;
  $("deepProgress").textContent =
    `${sayac} dosya · ${p.aktarilan || 0} aktarıldı` +
    (hataliN ? ` · ${hataliN} hatalı` : "") +
    (p.kapsamDisi ? ` · ${p.kapsamDisi} kapsam dışı` : "") +
    ` · geçen ${fmtSure(gecen)}` + (eta ? ` · ~kalan ${fmtSure(eta)}` : "");

  $("deepDetail").textContent = p.detay || "";
  $("deepErrors").textContent = (p.hatalar || []).slice(-4).join(" · ");
  deepPaused = !!st.paused;
  $("deepPause").textContent = deepPaused ? "Devam Et" : "Duraklat";
  $("deepScan").disabled = !!st.running;
  // Hatalı dosya varsa ve tarama durmuşsa "Tekrar Dene" göster (resume başarısızları toplar)
  $("deepRetry").style.display = (!st.running && hataliN > 0) ? "block" : "none";
}

function readScope() {
  const durum = $("scopeDurum").value;
  const tur = $("scopeTur").value.trim();
  const bas = $("scopeBas").value; // yyyy-mm-dd
  const bit = $("scopeBit").value;
  const scope = {};
  if (durum && durum !== "hepsi") scope.durum = durum;
  if (tur) scope.yargiTuru = tur;
  if (bas) scope.tarihBaslangic = bas;
  if (bit) scope.tarihBitis = bit;
  return scope;
}

// Derin tarama komutunu uygun çerçeveye ilet (grid/form hangi frame'deyse orada başlar)
async function deepSend(msgType, extra) {
  const tab = await activeTab();
  let frames = [{ frameId: 0 }];
  try {
    const all = await chrome.webNavigation.getAllFrames({ tabId: tab.id });
    if (all && all.length) frames = all;
  } catch (_) { /* üst çerçeveyle devam */ }
  for (const f of frames) {
    try {
      const res = await chrome.tabs.sendMessage(tab.id, { type: msgType, ...extra }, { frameId: f.frameId });
      if (res && res.ok) return res;
    } catch (_) { /* bu çerçevede içerik betiği yok */ }
  }
  return null;
}

async function startDeepScan() {
  const tab = await activeTab();
  if (!tab || !(tab.url || "").includes("uyap.gov.tr")) {
    setStatus($("transferStatus"), "Derin tarama için UYAP dosya sorgulama sayfasını açın.", "err");
    return;
  }
  const ok = await verify();
  if (!ok) {
    setStatus($("transferStatus"), "Önce bağlantı kodunu girin (aktarım için gerekli).", "err");
    return;
  }
  const res = await deepSend("MIZANIM_DEEP_START", { scope: readScope() });
  if (!res) {
    setStatus($("transferStatus"), "Dosya sorgulama ekranı bulunamadı. UYAP'ta 'Dosya Sorgulama' sayfasını açıp tekrar deneyin.", "err");
    return;
  }
  $("deepPanel").style.display = "block";
  setStatus($("transferStatus"), res.alreadyRunning ? "Derin tarama zaten sürüyor." : "Derin tarama başladı — bu pencereyi kapatabilirsiniz, tarama sürer.", "ok");
}

$("deepScan").addEventListener("click", startDeepScan);
$("deepPause").addEventListener("click", async () => {
  await deepSend(deepPaused ? "MIZANIM_DEEP_RESUME" : "MIZANIM_DEEP_PAUSE", {});
});
$("deepStop").addEventListener("click", async () => {
  await deepSend("MIZANIM_DEEP_STOP", {});
});
// Tekrar Dene: reset OLMADAN yeniden başlat — başarılılar deep.done'da atlanır, yalnız hatalılar çekilir
$("deepRetry").addEventListener("click", async () => {
  const res = await deepSend("MIZANIM_DEEP_START", { scope: readScope() });
  if (res) setStatus($("transferStatus"), "Hatalı dosyalar yeniden deneniyor...", "info");
});

// İlerlemeyi canlı izle: storage.onChanged + açılışta mevcut durum
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.mzDeep) renderDeepProgress(changes.mzDeep.newValue);
});
chrome.storage.local.get(["mzDeep"]).then((d) => {
  if (d.mzDeep && (d.mzDeep.running || (d.mzDeep.progress && d.mzDeep.progress.islenen > 0))) {
    renderDeepProgress(d.mzDeep);
  }
});

// Teşhis: sayfa yapısını panoya kopyala (destek için)
async function copyDiag() {
  const tab = await activeTab();
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: "MIZANIM_DIAG" });
    const text = "MIZANIM_DIAG " + JSON.stringify((res && res.diag) || res, null, 2);
    await navigator.clipboard.writeText(text);
    setStatus($("transferStatus"), "Teşhis panoya kopyalandı — destek ekibine iletebilirsiniz.", "ok");
  } catch (e) {
    setStatus($("transferStatus"), "Teşhis alınamadı: sayfayı yenileyip tekrar deneyin.", "err");
  }
}

$("saveToken").addEventListener("click", async () => {
  const token = $("token").value.trim();
  if (!token) return setStatus($("tokenStatus"), "Kod boş olamaz", "err");
  await chrome.storage.local.set({ token });
  setStatus($("tokenStatus"), "Doğrulanıyor...", "info");
  await verify();
});

$("scan").addEventListener("click", scan);
$("syncAll").addEventListener("click", syncAll);
$("transfer").addEventListener("click", async () => {
  $("transfer").disabled = true;
  setStatus($("transferStatus"), "Aktarılıyor...", "info");
  await transferNow();
  $("transfer").disabled = mode === "uyap" ? davalar.length === 0 : tebligatlar.length === 0;
});
$("diag").addEventListener("click", copyDiag);

// Açılışta: kayıtlı token varsa doğrula + sayfayı önizle
(async () => {
  const data = await chrome.storage.local.get(["token"]);
  if (data.token) {
    $("token").value = data.token;
    verify();
  }
  scan();
})();
