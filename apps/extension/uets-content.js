// Mizanım UETS Modülü — content script
// UETS / e-Tebligat portalındaki AÇIK oturumda görünen tebligat listesini DOM'dan okur.
// Otomatik giriş veya e-imza işlemi YAPMAZ; yalnızca kullanıcının açtığı ekranı okur.

(function () {
  "use strict";

  // Tarih desenleri: 02.05.2026 / 02/05/2026 / 2026-05-02
  const TARIH_RE = /\b(\d{2}[./]\d{2}[./]\d{4}|\d{4}-\d{2}-\d{2})\b/;
  // Barkod / tebligat no: 10+ haneli sayı
  const BARKOD_RE = /\b\d{10,20}\b/;
  // Gönderen kurum desenleri
  const KURUM_RE = /(mahkemesi|müdürlüğü|başkanlığı|savcılığı|icra dairesi|kurumu|belediyesi|valiliği|kaymakamlığı|barosu|noterliği)/i;
  // Esas no (dosya eşleştirme için)
  const ESAS_RE = /\b(19|20)\d{2}\/\d{1,6}\b/;

  function clean(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }

  function trToIso(t) {
    // 02.05.2026 → 2026-05-02
    const m = (t || "").match(/^(\d{2})[./](\d{2})[./](\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return t || undefined;
  }

  // Tablo/liste satırlarından tebligat kayıtları çıkar.
  // UETS ekranları tablo veya kart tabanlıdır; genel desenlerle okunur —
  // gerçek portal doğrulaması kullanıcı adımıdır.
  function parseTebligatlar() {
    const kayitlar = [];
    const seen = new Set();

    const rows = document.querySelectorAll(
      "table tr, [role='row'], .tebligat-item, .notification-item, li.list-group-item, .card"
    );
    rows.forEach((row) => {
      const text = clean(row.innerText || row.textContent);
      if (!text || text.length < 15) return;

      const tarih = text.match(TARIH_RE);
      if (!tarih) return; // tarihsiz satır tebligat kaydı değildir

      // Başlık satırlarını ele (th içeren)
      if (row.querySelector && row.querySelector("th")) return;

      const barkod = text.match(BARKOD_RE);
      const anahtar = barkod ? barkod[0] : text.slice(0, 80);
      if (seen.has(anahtar)) return;

      // Hücre bazlı ayrıştırma
      const cellEls = row.querySelectorAll ? row.querySelectorAll("td, [role='gridcell']") : [];
      const cells = Array.from(cellEls).map((c) => clean(c.textContent)).filter(Boolean);
      const kaynak = cells.length >= 2 ? cells : [text];

      const gonderen = kaynak.find((c) => KURUM_RE.test(c) && c.length < 120);
      // Konu: kurum ve tarih dışındaki en uzun anlamlı hücre
      const konu = kaynak
        .filter((c) => c !== gonderen && !TARIH_RE.test(c.slice(0, 12)) && c.length >= 5)
        .sort((a, b) => b.length - a.length)[0];

      const esas = text.match(ESAS_RE);

      seen.add(anahtar);
      kayitlar.push({
        barkod: barkod ? barkod[0] : undefined,
        gonderen: gonderen || undefined,
        konu: clean((konu || text).slice(0, 200)),
        tebligTarihi: trToIso(tarih[0]),
        esasNo: esas ? esas[0] : undefined,
        okundu: /okundu|görüldü|açıldı/i.test(text),
      });
    });

    return kayitlar.slice(0, 100);
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === "MIZANIM_SCAN_UETS") {
      try {
        sendResponse({ ok: true, tebligatlar: parseTebligatlar(), url: location.href });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    }
    return true;
  });

  // Rozet için arka plana bildir
  try {
    const found = parseTebligatlar();
    if (found.length > 0) {
      chrome.runtime.sendMessage({ type: "MIZANIM_FOUND", count: found.length });
    }
  } catch (_) { /* yoksay */ }
})();
