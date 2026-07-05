// Mizanım UYAP Aktarım — content script
// UYAP Avukat Portal'daki AÇIK oturumda görünen dosya listesi/detayını DOM'dan okur.
// Otomatik giriş veya e-imza işlemi YAPMAZ.

(function () {
  "use strict";

  // Esas no deseni: 2023/1234 gibi
  const ESAS_RE = /\b(19|20)\d{2}\/\d{1,6}\b/;

  // Mahkeme adı deseni
  const MAHKEME_RE = /(mahkemesi|mahkeme|icra dairesi|savcılığı|adliyesi)/i;

  function clean(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }

  // Tablo satırlarından dava listesi çıkar (UYAP dosya sorgulama ekranları tablo tabanlıdır)
  function parseTables() {
    const davalar = [];
    const seen = new Set();

    const rows = document.querySelectorAll("table tr, [role='row']");
    rows.forEach((row) => {
      const cellEls = row.querySelectorAll("td, [role='gridcell']");
      if (cellEls.length < 2) return;
      const cells = Array.from(cellEls).map((c) => clean(c.textContent));
      const rowText = cells.join(" | ");

      const esasMatch = rowText.match(ESAS_RE);
      if (!esasMatch) return;
      const esasNo = esasMatch[0];
      if (seen.has(esasNo)) return;

      const mahkeme = cells.find((c) => MAHKEME_RE.test(c)) || "";
      // Esas no ve mahkeme dışındaki en uzun hücre genellikle taraf/tür bilgisidir
      const digerHucreler = cells.filter((c) => c && c !== esasNo && c !== mahkeme);

      seen.add(esasNo);
      davalar.push({
        esasNo,
        mahkemeAdi: mahkeme || undefined,
        davaTuru: digerHucreler.find((c) => /dava|ceza|hukuk|icra|talep/i.test(c) && c.length < 60) || undefined,
        davaliAdi: undefined,
        durumu: digerHucreler.find((c) => /açık|kapalı|derdest|karar|kesinleş/i.test(c) && c.length < 40) || undefined,
      });
    });

    return davalar;
  }

  // Dosya detay sayfası — etiket/değer çiftlerinden alanları çıkar
  function parseDetail() {
    const bodyText = document.body ? document.body.innerText : "";
    const esasMatch = bodyText.match(ESAS_RE);
    if (!esasMatch) return null;

    function findAfterLabel(labels) {
      for (const label of labels) {
        const re = new RegExp(label + "\\s*:?\\s*([^\\n]{2,80})", "i");
        const m = bodyText.match(re);
        if (m) return clean(m[1]);
      }
      return undefined;
    }

    return {
      esasNo: esasMatch[0],
      mahkemeAdi: findAfterLabel(["Birim(?:i)?", "Mahkeme(?:si)?"]),
      davaTuru: findAfterLabel(["Dava Türü", "Dosya Türü"]),
      davaciAdi: findAfterLabel(["Davacı", "Alacaklı", "Müşteki"]),
      davaliAdi: findAfterLabel(["Davalı", "Borçlu", "Sanık", "Şüpheli"]),
      acilisTarihi: findAfterLabel(["Açılış Tarihi", "Dosya Açılış"]),
      durumu: findAfterLabel(["Dosya Durumu", "Durum"]),
    };
  }

  function collect() {
    const liste = parseTables();
    const detay = parseDetail();
    const davalar = [...liste];
    if (detay && !davalar.some((d) => d.esasNo === detay.esasNo)) {
      davalar.push(detay);
    } else if (detay) {
      // Detay bilgisi liste kaydından zengindir — birleştir
      const idx = davalar.findIndex((d) => d.esasNo === detay.esasNo);
      davalar[idx] = { ...davalar[idx], ...Object.fromEntries(Object.entries(detay).filter(([, v]) => v)) };
    }
    return davalar;
  }

  // Popup'tan gelen tarama isteğini yanıtla
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === "MIZANIM_SCAN") {
      try {
        sendResponse({ ok: true, davalar: collect(), url: location.href });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    }
    return true;
  });

  // Sayfa yüklendiğinde arka plana özet bildir (rozet için)
  try {
    const found = collect();
    if (found.length > 0) {
      chrome.runtime.sendMessage({ type: "MIZANIM_FOUND", count: found.length });
    }
  } catch (_) { /* yoksay */ }
})();
