// Mizanım UYAP Aktarım — background service worker
// Content script'in okuduğu verileri güvenli token ile Mizanım API'ye gönderir.

// ÖNEMLİ: www zorunlu — apex alan adı www'ya 308 yönlendirir ve tarayıcı fetch,
// cross-origin yönlendirmede Authorization başlığını düşürür (401'e yol açar).
const DEFAULT_API = "https://www.xn--mizanm-t9a.com";

async function getSettings() {
  const data = await chrome.storage.local.get(["token", "apiBase"]);
  let apiBase = (data.apiBase || DEFAULT_API).replace(/\/$/, "");
  // Apex alan adı www'ya 308 yönlendirir ve Authorization düşer → her zaman www'ya zorla
  apiBase = apiBase.replace(/^https:\/\/xn--mizanm-t9a\.com/, "https://www.xn--mizanm-t9a.com");
  return { token: data.token || "", apiBase };
}

// Geçici hatalarda (ağ/kesinti/5xx) bir kez daha dener — bağlantı kodunun
// "ilk denemede hata verip sonra düzelmesi" davranışını önler.
async function fetchWithRetry(url, options, tries = 2) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status >= 500 && i < tries - 1) { await new Promise((r) => setTimeout(r, 600)); continue; }
      return res;
    } catch (e) {
      lastErr = e;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, 600));
    }
  }
  throw lastErr;
}

// Rozet: bulunan dosya sayısı
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg && msg.type === "MIZANIM_FOUND" && sender.tab) {
    chrome.action.setBadgeText({ text: String(msg.count), tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: "#c9a84c" });
  }
});

// Popup'tan gelen komutlar
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg) return;

  if (msg.type === "MIZANIM_VERIFY") {
    (async () => {
      const { token, apiBase } = await getSettings();
      if (!token) return sendResponse({ ok: false, error: "Bağlantı kodu girilmedi" });
      try {
        const res = await fetchWithRetry(`${apiBase}/api/extension/aktar`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        sendResponse(res.ok ? { ok: true, lawyerName: data.lawyerName } : { ok: false, error: data.error || `HTTP ${res.status}` });
      } catch (e) {
        sendResponse({ ok: false, error: "Mizanım'a ulaşılamadı: " + String(e) });
      }
    })();
    return true; // async yanıt
  }

  if (msg.type === "MIZANIM_TRANSFER_UETS") {
    (async () => {
      const { token, apiBase } = await getSettings();
      if (!token) return sendResponse({ ok: false, error: "Önce bağlantı kodu girin" });
      try {
        const res = await fetch(`${apiBase}/api/extension/tebligat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tebligatlar: msg.tebligatlar || [] }),
        });
        const data = await res.json();
        sendResponse(res.ok ? { ok: true, ...data } : { ok: false, error: data.error || `HTTP ${res.status}` });
      } catch (e) {
        sendResponse({ ok: false, error: "Aktarım hatası: " + String(e) });
      }
    })();
    return true; // async yanıt
  }

  if (msg.type === "MIZANIM_TRANSFER") {
    (async () => {
      const { token, apiBase } = await getSettings();
      if (!token) return sendResponse({ ok: false, error: "Önce bağlantı kodu girin" });
      try {
        const res = await fetchWithRetry(`${apiBase}/api/extension/aktar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ davalar: msg.davalar || [] }),
        });
        const data = await res.json();
        sendResponse(res.ok ? { ok: true, ...data } : { ok: false, error: data.error || `HTTP ${res.status}` });
      } catch (e) {
        sendResponse({ ok: false, error: "Aktarım hatası: " + String(e) });
      }
    })();
    return true; // async yanıt
  }
});
