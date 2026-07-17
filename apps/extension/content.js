// Mizanım UYAP Aktarım — content script
// UYAP Avukat Portal'daki AÇIK oturumda görünen dosya listesi/detayını DOM'dan okur.
// Otomatik giriş veya e-imza işlemi YAPMAZ.

(function () {
  "use strict";

  // Esas no deseni: 2023/1234 gibi
  const ESAS_RE = /\b(19|20)\d{2}\/\d{1,6}\b/;
  const ESAS_RE_G = /\b(19|20)\d{2}\/\d{1,6}\b/g;

  // Mahkeme adı deseni
  const MAHKEME_RE = /(mahkemesi|mahkeme|icra dairesi|savcılığı|savcılık|adliyesi|hakimliği|dairesi)/i;

  function clean(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }

  // Açık shadow root'lar dahil tüm eşleşmeleri toplar (Avukat Portalı React+DevExtreme,
  // shadow DOM kullanmaz; bu genel güvenlik ağıdır)
  function deepQueryAll(selector) {
    const out = [];
    function walk(root) {
      root.querySelectorAll(selector).forEach((el) => out.push(el));
      root.querySelectorAll("*").forEach((el) => {
        if (el.shadowRoot) walk(el.shadowRoot);
      });
    }
    walk(document);
    return out;
  }

  // Avukat Portalı (avukat.uyap.gov.tr) dosya sorgulama: DevExtreme DataGrid.
  // Başlık satırındaki sütun adlarını (Birim | Dosya No | Dosya Türü | Dosya Durumu)
  // hücre sırasıyla eşleyip veri satırlarını alan alan okur.
  function parseDxGrids() {
    const davalar = [];
    const seen = new Set();

    deepQueryAll(".dx-datagrid, .dx-treelist").forEach((grid) => {
      const headerCells = grid.querySelectorAll(".dx-header-row td");
      const captions = Array.from(headerCells).map((c) => clean(c.textContent).toLowerCase());

      function colIndex(re) {
        return captions.findIndex((c) => re.test(c));
      }
      const iBirim = colIndex(/birim|mahkeme/);
      const iDosyaNo = colIndex(/dosya no|esas/);
      const iTur = colIndex(/t[üu]r/);
      const iDurum = colIndex(/durum/);

      grid.querySelectorAll(".dx-data-row").forEach((row) => {
        const cells = Array.from(row.querySelectorAll("td")).map((c) => clean(c.textContent));
        if (cells.length < 2) return;

        // Sütun eşleşmesi varsa doğrudan, yoksa satır metninden desenle bul
        let esasNo = iDosyaNo >= 0 && cells[iDosyaNo] ? (cells[iDosyaNo].match(ESAS_RE) || [])[0] : undefined;
        if (!esasNo) esasNo = (cells.join(" | ").match(ESAS_RE) || [])[0];
        if (!esasNo || seen.has(esasNo)) return;
        seen.add(esasNo);

        const mahkeme = (iBirim >= 0 && cells[iBirim]) || cells.find((c) => MAHKEME_RE.test(c)) || "";
        davalar.push({
          esasNo,
          mahkemeAdi: mahkeme || undefined,
          davaTuru: (iTur >= 0 && cells[iTur]) || undefined,
          davaliAdi: undefined,
          durumu: (iDurum >= 0 && cells[iDurum]) || undefined,
        });
      });
    });

    return davalar;
  }

  // Genel tablo satırlarından dava listesi çıkar (Vatandaş Portalı ve klasik ekranlar)
  function parseTables() {
    const davalar = [];
    const seen = new Set();

    const rows = deepQueryAll("table tr, [role='row'], mat-row, .mat-row, .cdk-row, .dx-data-row");
    rows.forEach((row) => {
      // Klasik tablo hücreleri + SPA (Angular/Material/DevExtreme) hücre desenleri
      let cellEls = row.querySelectorAll("td, [role='gridcell'], [role='cell'], mat-cell, .mat-cell, .cdk-cell");
      // Hücre bulunamadıysa (div tabanlı grid) doğrudan alt öğeleri hücre say
      if (cellEls.length < 2 && !row.closest("table")) cellEls = row.children;
      if (cellEls.length < 2) return;
      const cells = Array.from(cellEls).map((c) => clean(c.textContent));
      // Detay ekranındaki etiket/değer satırlarını atla ("Dosya No | 2026/198" gibi) —
      // bunlar liste kaydı değildir, parseDetail tarafından okunur
      if (cells.length === 2 && /^(dosya no|esas no|birim|mahkeme|gelen dosya no|değişik iş)/i.test(cells[0])) return;
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
        davaTuru: digerHucreler.find((c) => /dava|ceza|hukuk|icra|talep|dosya/i.test(c) && c.length < 60) || undefined,
        davaliAdi: undefined,
        durumu: digerHucreler.find((c) => /açık|kapalı|derdest|karar|kesinleş/i.test(c) && c.length < 40) || undefined,
      });
    });

    return davalar;
  }

  // Son çare: hiçbir tablo deseni tutmadıysa, esas no içeren küçük yaprak öğelerden
  // satır atalarına tırmanarak dosyaları bul (bilinmeyen div-grid yapıları için)
  function parseLeafScan() {
    const davalar = [];
    const seen = new Set();

    deepQueryAll("body *").forEach((el) => {
      if (el.childElementCount > 0) return;
      const text = clean(el.textContent);
      if (text.length > 30 || !ESAS_RE.test(text)) return;
      const esasNo = text.match(ESAS_RE)[0];
      if (seen.has(esasNo)) return;

      // Tek esas no içeren en geniş atayı "satır" kabul et
      let row = el;
      let p = el.parentElement;
      while (p && p !== document.body) {
        const matches = (p.textContent.match(ESAS_RE_G) || []);
        if (new Set(matches).size > 1) break;
        row = p;
        p = p.parentElement;
      }
      const rowText = clean(row.textContent);
      if (rowText.length > 600) return; // satır değil, sayfa bloğu

      seen.add(esasNo);
      const mahkemeMatch = rowText.match(new RegExp("([A-ZÇĞİÖŞÜ][^|•\\n]{2,60}?" + MAHKEME_RE.source + ")", "i"));
      davalar.push({
        esasNo,
        mahkemeAdi: mahkemeMatch ? clean(mahkemeMatch[1]) : undefined,
        davaTuru: (rowText.match(/\b[\wÇĞİÖŞÜçğıöşü ]{3,40}(Dava Dosyası|Dosyası|Değişik İş|Talimat)\b/i) || [])[0] || undefined,
        davaliAdi: undefined,
        durumu: (rowText.match(/\b(Açık|Kapalı|Derdest|Karara Çıktı|Kesinleşti)\b/i) || [])[0] || undefined,
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
    // Önce DevExtreme grid (Avukat Portalı), sonra genel tablolar
    let liste = parseDxGrids();
    if (liste.length === 0) liste = parseTables();
    if (liste.length > 0) return liste;

    // Tablo bulunamadı: yaprak taraması birden çok dosya bulursa liste sayfasıdır;
    // tek/sıfır sonuçta detay ekranı etiket/değer ayrıştırması daha güvenilirdir
    const leaf = parseLeafScan();
    if (leaf.length > 1) return leaf;
    const detay = parseDetail();
    if (detay) return [detay];
    return leaf;
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

  // İzole dünyada test/teşhis kancası (sayfa JS'i göremez)
  try { window.__MIZANIM_SCAN = collect; } catch (_) { /* yoksay */ }

  // Sayfa yüklendiğinde arka plana özet bildir (rozet için) — SPA geç render eder,
  // kısa aralıklarla birkaç kez dene
  let denemeSayisi = 0;
  function rozetBildir() {
    try {
      const found = collect();
      if (found.length > 0) {
        chrome.runtime.sendMessage({ type: "MIZANIM_FOUND", count: found.length });
        return;
      }
    } catch (_) { /* yoksay */ }
    if (++denemeSayisi < 5) setTimeout(rozetBildir, 2000);
  }
  rozetBildir();
})();
