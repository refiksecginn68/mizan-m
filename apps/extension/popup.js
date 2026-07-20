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
  for (const f of frames) {
    try {
      const res = await chrome.tabs.sendMessage(tabId, { type: msgType }, { frameId: f.frameId });
      if (res) yanitVeren++;
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
  return { merged, yanitVeren };
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
    if (mode === "uyap") { davalar = sonuc.merged; renderList(davalar, (d) => `<b>${d.esasNo}</b> ${d.mahkemeAdi || ""}${d.davaTuru ? " · " + d.davaTuru : ""}${d._detay ? " · detay" : ""}`); }
    else { tebligatlar = sonuc.merged; renderList(tebligatlar, (t) => `<b>${t.tebligTarihi || "?"}</b> ${t.gonderen || ""}<br><span style='color:#888'>${(t.konu || "").slice(0, 70)}</span>`); }
    const n = mode === "uyap" ? davalar.length : tebligatlar.length;
    $("count").textContent = String(n);
    $("transfer").disabled = n === 0;
    $("transferStatus").className = "status";
    if (n === 0) {
      setStatus($("transferStatus"), mode === "uyap"
        ? "Bu sayfada dosya bulunamadı. Dosya sorgulama listesini açıp tekrar tarayın."
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
    $("count").textContent = String(davalar.length);
    renderList(davalar, (d) => `<b>${d.esasNo}</b> ${d.mahkemeAdi || ""}${d.davaTuru ? " · " + d.davaTuru : ""}`);
    if (davalar.length === 0) {
      setStatus($("transferStatus"), "Dosya bulunamadı. Dosya sorgulama sonuç listesini açıp tekrar deneyin. Sorun sürerse 'Teşhis Kopyala' ile bize ulaşın.", "info");
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
