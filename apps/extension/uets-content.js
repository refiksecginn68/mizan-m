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

  const EK_UZANTI_RE = /\.(pdf|docx?|udf)(\?|$)/i;
  const MIME_BY_EXT = { pdf: "application/pdf", doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };

  // Satır içindeki ek/indirme linklerini toplar. UETS'in ek indirme UX'i
  // portal sürümüne göre değişebilir — bu yüzden BEST-EFFORT'tur: link
  // bulunamazsa veya aynı origin değilse ekler boş döner, senkron durmaz
  // (sunucu tarafı "indirilemedi" olarak işaretler, bkz. /api/extension/tebligat).
  async function ekleriTopla(row) {
    const linkler = Array.from(row.querySelectorAll ? row.querySelectorAll("a[href]") : [])
      .filter((a) => EK_UZANTI_RE.test(a.getAttribute("href") || "") || /ek|indir|belge/i.test(a.textContent || ""));

    const sonuc = [];
    for (const a of linkler.slice(0, 5)) {
      const href = a.href; // mutlak URL'ye çözümlenmiş hali
      const ad = clean(a.textContent) || href.split("/").pop() || "ek";
      const uzanti = (href.match(EK_UZANTI_RE) || [])[1]?.toLowerCase();
      const mime = uzanti ? MIME_BY_EXT[uzanti] : undefined;

      try {
        // Aynı origin ise oturum çerezleriyle gider — cross-origin ise zaten
        // CORS engelleyecektir, o durumda sadece isim/URL gönderilir.
        const isSameOrigin = new URL(href).origin === location.origin;
        if (!isSameOrigin) { sonuc.push({ ad }); continue; }
        const res = await fetch(href, { credentials: "include" });
        if (!res.ok) { sonuc.push({ ad }); continue; }
        const buf = await res.arrayBuffer();
        const base64 = btoa(new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ""));
        sonuc.push({ ad, base64, mime: mime || res.headers.get("content-type") || undefined });
      } catch {
        sonuc.push({ ad });
      }
    }
    return sonuc;
  }

  function trToIso(t) {
    // 02.05.2026 → 2026-05-02
    const m = (t || "").match(/^(\d{2})[./](\d{2})[./](\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return t || undefined;
  }

  // Satırları eşleşen tebligat adaylarına çevirir (ek toplama HARİÇ — hızlı,
  // senkron; rozet sayacı için kullanılır).
  function eslesenSatirlar() {
    const eslesenler = [];
    const seen = new Set();
    const rows = document.querySelectorAll(
      "table tr, [role='row'], .tebligat-item, .notification-item, li.list-group-item, .card"
    );
    rows.forEach((row) => {
      const text = clean(row.innerText || row.textContent);
      if (!text || text.length < 15) return;
      const tarih = text.match(TARIH_RE);
      if (!tarih) return; // tarihsiz satır tebligat kaydı değildir
      if (row.querySelector && row.querySelector("th")) return;
      const barkod = text.match(BARKOD_RE);
      const anahtar = barkod ? barkod[0] : text.slice(0, 80);
      if (seen.has(anahtar)) return;
      seen.add(anahtar);
      eslesenler.push({ row, text, tarih, barkod });
    });
    return eslesenler.slice(0, 100);
  }

  // Tam ayrıştırma: ek toplama dahil (async, fetch içerir) — kullanıcının
  // "Sayfayı Tara" eylemiyle tetiklenir, pasif rozet taramasında kullanılmaz.
  async function parseTebligatlar() {
    const kayitlar = [];
    for (const { row, text, tarih, barkod } of eslesenSatirlar()) {
      const cellEls = row.querySelectorAll ? row.querySelectorAll("td, [role='gridcell']") : [];
      const cells = Array.from(cellEls).map((c) => clean(c.textContent)).filter(Boolean);
      const kaynak = cells.length >= 2 ? cells : [text];

      const gonderen = kaynak.find((c) => KURUM_RE.test(c) && c.length < 120);
      const konu = kaynak
        .filter((c) => c !== gonderen && !TARIH_RE.test(c.slice(0, 12)) && c.length >= 5)
        .sort((a, b) => b.length - a.length)[0];

      const esas = text.match(ESAS_RE);
      const ekler = await ekleriTopla(row);

      kayitlar.push({
        barkod: barkod ? barkod[0] : undefined,
        gonderen: gonderen || undefined,
        konu: clean((konu || text).slice(0, 200)),
        tebligTarihi: trToIso(tarih[0]),
        esasNo: esas ? esas[0] : undefined,
        okundu: /okundu|görüldü|açıldı/i.test(text),
        ekler: ekler.length > 0 ? ekler : undefined,
      });
    }
    return kayitlar;
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === "MIZANIM_SCAN_UETS") {
      parseTebligatlar()
        .then((tebligatlar) => sendResponse({ ok: true, tebligatlar, url: location.href }))
        .catch((e) => sendResponse({ ok: false, error: String(e) }));
    }
    return true;
  });

  // Rozet için arka plana bildir (hızlı sayaç — ek toplamaz)
  try {
    const found = eslesenSatirlar();
    if (found.length > 0) {
      chrome.runtime.sendMessage({ type: "MIZANIM_FOUND", count: found.length });
    }
  } catch (_) { /* yoksay */ }
})();
