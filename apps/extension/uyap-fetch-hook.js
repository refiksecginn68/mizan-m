// Mizanım UYAP Aktarım — MAIN-world fetch hook
// Sayfanın kendi window.fetch'ini sarar; view_document_brd.uyap isteğini (PDF bayt akışı)
// yakalar ve isteği DEĞİŞTİRMEDEN sonucu window'a CustomEvent olarak yayınlar.
// İçerik betiği (izole dünya) bunu dinleyip pdf.js ile metin çıkarır. Otomatik giriş
// veya belge indirme YAPMAZ — sadece kullanıcının tıklamasıyla zaten oluşan isteği okur.
(function () {
  "use strict";
  const originalFetch = window.fetch;
  if (!originalFetch || originalFetch.__mizanimHooked) return;

  window.fetch = async function (...args) {
    const res = await originalFetch.apply(this, args);
    try {
      const url = typeof args[0] === "string" ? args[0] : (args[0] && args[0].url) || "";
      if (/view_document_brd\.uyap/i.test(url)) {
        const clone = res.clone();
        clone.arrayBuffer().then((buf) => {
          let binary = "";
          const bytes = new Uint8Array(buf);
          const chunk = 0x8000;
          for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
          }
          window.dispatchEvent(new CustomEvent("mizanim:evrak-pdf", {
            detail: { url, base64: btoa(binary) },
          }));
        }).catch(() => { /* yakalama en iyi çaba — orijinal isteği bozmaz */ });
      }
    } catch (_) { /* yakalama en iyi çaba — orijinal isteği bozmaz */ }
    return res;
  };
  window.fetch.__mizanimHooked = true;
})();
