// Mizanım UYAP Aktarım — background service worker
// Content script'in okuduğu verileri güvenli token ile Mizanım API'ye gönderir.

const DEFAULT_API = "https://xn--mizanm-t9a.com";

async function getSettings() {
  const data = await chrome.storage.local.get(["token", "apiBase"]);
  return {
    token: data.token || "",
    apiBase: (data.apiBase || DEFAULT_API).replace(/\/$/, ""),
  };
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
        const res = await fetch(`${apiBase}/api/extension/aktar`, {
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

  if (msg.type === "MIZANIM_TRANSFER") {
    (async () => {
      const { token, apiBase } = await getSettings();
      if (!token) return sendResponse({ ok: false, error: "Önce bağlantı kodu girin" });
      try {
        const res = await fetch(`${apiBase}/api/extension/aktar`, {
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
