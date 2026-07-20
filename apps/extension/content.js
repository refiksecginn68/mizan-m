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

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
      const iDavaci = colIndex(/davac[ıi]|alacakl[ıi]|m[üu][şs]teki/);
      const iDavali = colIndex(/daval[ıi]|bor[çc]lu|san[ıi]k|[şs][üu]pheli/);
      const iAcilis = colIndex(/a[çc][ıi]l[ıi][şs]/);

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
          davaciAdi: (iDavaci >= 0 && cells[iDavaci]) || undefined,
          davaliAdi: (iDavali >= 0 && cells[iDavali]) || undefined,
          acilisTarihi: (iAcilis >= 0 && cells[iAcilis]) || undefined,
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

  // Dosya detay sayfasındaki Taraf Bilgileri tablosunu okur.
  // UYAP: Rol | Tipi | Adı | Vekil sütunları. Grid veya klasik tablo olabilir.
  function parseTaraflar() {
    const taraflar = [];
    const seen = new Set();

    // Taraf/vekil desenli başlık içeren tabloyu ve grid'i tara
    const candidates = deepQueryAll("table, .dx-datagrid, .dx-treelist");
    candidates.forEach((tbl) => {
      const head = clean(tbl.textContent).toLowerCase();
      // Tablo taraf tablosuna benziyor mu? (rol + vekil/taraf sinyali)
      if (!/(rol|taraf).*(vekil|ad[ıi]|kimlik)|davac[ıi]|daval[ıi]/i.test(head)) return;

      const headerCells = tbl.querySelectorAll(".dx-header-row td, thead th, thead td, tr:first-child th");
      const caps = Array.from(headerCells).map((c) => clean(c.textContent).toLowerCase());
      const idx = (re) => caps.findIndex((c) => re.test(c));
      const iRol = idx(/rol|s[ıi]fat/);
      const iTip = idx(/tip/);
      const iAd = idx(/ad[ıi]|isim|unvan/);
      const iVekil = idx(/vekil|avukat/);

      const dataRows = tbl.querySelectorAll(".dx-data-row, tbody tr, tr");
      dataRows.forEach((row) => {
        if (row.querySelector("th")) return; // başlık satırı
        const cells = Array.from(row.querySelectorAll("td, .dx-data-row td")).map((c) => clean(c.textContent));
        if (cells.length < 2) return;
        const rol = iRol >= 0 ? cells[iRol] : cells[0];
        const ad = iAd >= 0 ? cells[iAd] : cells.find((c) => c && !/^(davac[ıi]|daval[ıi]|vekil)$/i.test(c) && c.length > 2);
        if (!ad || !/(davac[ıi]|daval[ıi]|vekil|[şs][üu]pheli|san[ıi]k|m[üu][şs]teki|alacakl|bor[çc]lu|kat[ıi]lan)/i.test(rol || cells.join(" "))) return;
        const key = (rol || "") + "|" + ad;
        if (seen.has(key)) return;
        seen.add(key);
        taraflar.push({
          rol: rol || undefined,
          tip: iTip >= 0 ? cells[iTip] : undefined,
          ad,
          vekil: iVekil >= 0 ? cells[iVekil] : undefined,
        });
      });
    });

    return taraflar;
  }

  // Safahat (dosya hareketleri) tablosunu okur: Tarih | İşlem/Açıklama
  function parseSafahat() {
    const safahat = [];
    const seen = new Set();
    const tables = deepQueryAll("table, .dx-datagrid");
    tables.forEach((tbl) => {
      const head = clean(tbl.textContent).toLowerCase();
      if (!/safahat|i[şs]lem tarih|a[çc][ıi]klama|evrak tarih/i.test(head)) return;
      const rows = tbl.querySelectorAll(".dx-data-row, tbody tr, tr");
      rows.forEach((row) => {
        if (row.querySelector("th")) return;
        const cells = Array.from(row.querySelectorAll("td")).map((c) => clean(c.textContent));
        if (cells.length < 2) return;
        const tarih = cells.find((c) => /\d{2}[./]\d{2}[./]\d{4}/.test(c));
        const aciklama = cells.filter((c) => c !== tarih).sort((a, b) => b.length - a.length)[0];
        if (!aciklama) return;
        const key = (tarih || "") + "|" + aciklama.slice(0, 40);
        if (seen.has(key)) return;
        seen.add(key);
        safahat.push({ tarih: tarih || undefined, aciklama });
      });
    });
    return safahat.slice(0, 60);
  }

  // Evrak listesi (klasör ağacı / evrak tablosu) — ad + tarih metadatası.
  // Gerçek dosya indirmesi yapılmaz; yalnızca listelenen evrak adları okunur.
  function parseEvraklar() {
    const evraklar = [];
    const seen = new Set();
    const tables = deepQueryAll("table, .dx-datagrid, .dx-treelist");
    tables.forEach((tbl) => {
      const head = clean(tbl.textContent).toLowerCase();
      if (!/(evrak|belge|karar|tensip|m[üu]talaa|zapt)/i.test(head)) return;
      const rows = tbl.querySelectorAll(".dx-data-row, tbody tr, tr");
      rows.forEach((row) => {
        if (row.querySelector("th")) return;
        const cells = Array.from(row.querySelectorAll("td")).map((c) => clean(c.textContent));
        const ad = cells.filter(Boolean).sort((a, b) => b.length - a.length)[0];
        if (!ad || ad.length < 4 || seen.has(ad)) return;
        const tarih = cells.find((c) => /\d{2}[./]\d{2}[./]\d{4}/.test(c));
        seen.add(ad);
        evraklar.push({ ad, tarih: tarih || undefined });
      });
    });
    return evraklar.slice(0, 100);
  }

  // Dosya detay sayfası — etiket/değer çiftlerinden alanları + taraf/safahat/evrak çıkarır
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

    const taraflar = parseTaraflar();
    const davaci = findAfterLabel(["Davacı", "Alacaklı", "Müşteki", "Katılan"])
      || (taraflar.find((t) => /davac[ıi]|alacakl|m[üu][şs]teki|kat[ıi]lan/i.test(t.rol || "")) || {}).ad;
    const davali = findAfterLabel(["Davalı", "Borçlu", "Sanık", "Şüpheli"])
      || (taraflar.find((t) => /daval[ıi]|bor[çc]lu|san[ıi]k|[şs][üu]pheli/i.test(t.rol || "")) || {}).ad;

    return {
      esasNo: esasMatch[0],
      mahkemeAdi: findAfterLabel(["Birim(?:i)?", "Mahkeme(?:si)?"]),
      davaTuru: findAfterLabel(["Dava Türü", "Dosya Türü"]),
      davaciAdi: davaci,
      davaliAdi: davali,
      acilisTarihi: findAfterLabel(["Açılış Tarihi", "Dosya Açılış"]),
      durumu: findAfterLabel(["Dosya Durumu", "Durum"]),
      taraflar: taraflar.length ? taraflar : undefined,
      safahat: parseSafahat(),
      evraklar: parseEvraklar(),
      _detay: true,
    };
  }

  function collect() {
    // Önce DevExtreme grid (Avukat Portalı), sonra genel tablolar
    let liste = parseDxGrids();
    if (liste.length === 0) liste = parseTables();

    // Detay sayfası zenginliği: tek dosya + taraf/safahat varsa detay olarak dön
    const detay = parseDetail();
    if (detay && (detay.taraflar || (detay.safahat && detay.safahat.length) || liste.length <= 1)) {
      // Liste tek satırsa ve detay zengintse detayı tercih et
      if (liste.length <= 1 && (detay.taraflar || detay.safahat?.length || detay.evraklar?.length)) {
        return [detay];
      }
    }
    if (liste.length > 0) return liste;

    // Tablo bulunamadı: yaprak taraması birden çok dosya bulursa liste sayfasıdır
    const leaf = parseLeafScan();
    if (leaf.length > 1) return leaf;
    if (detay) return [detay];
    return leaf;
  }

  // DevExtreme sayfalayıcıda sonraki sayfaya geç. Başarılıysa true döner.
  function gotoNextPage() {
    const nextBtns = deepQueryAll(".dx-pager .dx-navigate-button.dx-next-button, .dx-pager .dx-next-button, .dx-page-navigation .dx-next-button");
    for (const btn of nextBtns) {
      const disabled = btn.classList.contains("dx-button-disable") || btn.getAttribute("aria-disabled") === "true";
      if (!disabled) { btn.click(); return true; }
    }
    return false;
  }

  // Tüm sayfaları gezerek liste dosyalarını topla (tek tıkla tam senkron).
  async function collectAllPages(maxPages = 40, onProgress) {
    const merged = [];
    const seen = new Set();
    function absorb() {
      collect().forEach((d) => {
        if (!d.esasNo || seen.has(d.esasNo)) return;
        seen.add(d.esasNo);
        merged.push(d);
      });
    }
    absorb();
    for (let page = 1; page < maxPages; page++) {
      if (onProgress) try { onProgress(merged.length, page); } catch (_) { /* yoksay */ }
      const before = merged.length;
      if (!gotoNextPage()) break;
      await sleep(900); // grid yeniden render beklemesi
      absorb();
      if (merged.length === before) break; // yeni kayıt gelmedi → son sayfa
    }
    return merged;
  }

  // Bir öğe için kısa, benzersizce yeniden bulunabilir bir CSS yol ipucu üretir
  function selectorHint(el) {
    if (!el || !el.tagName) return "";
    const tag = el.tagName.toLowerCase();
    const id = el.id ? "#" + el.id : "";
    const cls = (el.className && typeof el.className === "string")
      ? "." + el.className.trim().split(/\s+/).slice(0, 4).join(".")
      : "";
    return (tag + id + cls).slice(0, 160);
  }

  // Sorgu formundaki kontrolleri (yargı türü/birim seçicileri, sorgula butonu) döker.
  // A1 auto-crawler'ın hangi selector'ları süreceğini Seyma'nın canlı DOM'undan çıkarmak için.
  function dumpFormControls() {
    const controls = [];

    // Klasik <select> öğeleri
    deepQueryAll("select").forEach((sel) => {
      const label = clean(
        (sel.labels && sel.labels[0] && sel.labels[0].textContent) ||
        (sel.getAttribute("aria-label")) ||
        (sel.previousElementSibling && sel.previousElementSibling.textContent) || ""
      ).slice(0, 60);
      controls.push({
        kind: "select",
        hint: selectorHint(sel),
        label,
        name: sel.name || undefined,
        options: Array.from(sel.options).slice(0, 40).map((o) => clean(o.textContent)).filter(Boolean),
      });
    });

    // DevExtreme seçiciler (.dx-selectbox / .dx-dropdowneditor) — UYAP formu bunları kullanır
    deepQueryAll(".dx-selectbox, .dx-dropdowneditor, .dx-lookup").forEach((box) => {
      const input = box.querySelector("input, .dx-texteditor-input");
      const nearby = clean(
        (box.getAttribute("aria-label")) ||
        (box.closest("[class*='field'],[class*='form']") &&
          box.closest("[class*='field'],[class*='form']").querySelector("label, .dx-field-item-label-text")
          ? box.closest("[class*='field'],[class*='form']").querySelector("label, .dx-field-item-label-text").textContent
          : "")
      ).slice(0, 60);
      controls.push({
        kind: "dx-selectbox",
        hint: selectorHint(box),
        label: nearby,
        currentValue: input ? clean(input.value || input.getAttribute("value") || input.textContent) : undefined,
      });
    });

    // Sorgula / Ara / Listele butonları
    const btns = [];
    deepQueryAll("button, .dx-button, input[type='submit'], a[role='button']").forEach((b) => {
      const t = clean(b.textContent || b.value || b.getAttribute("aria-label"));
      if (/sorgula|listele|\bara\b|getir|sorgu|filtrele/i.test(t)) {
        btns.push({ text: t.slice(0, 40), hint: selectorHint(b) });
      }
    });

    return { selectors: controls.slice(0, 30), actionButtons: btns.slice(0, 15) };
  }

  // Grid'in başlık + ilk veri satırının hücre yapısını döker (sütun eşleme doğrulaması için)
  function dumpGridStructure() {
    const grids = [];
    deepQueryAll(".dx-datagrid, .dx-treelist, table").slice(0, 4).forEach((grid) => {
      const isDx = grid.matches(".dx-datagrid, .dx-treelist");
      const headerSel = isDx ? ".dx-header-row td" : "thead th, thead td, tr:first-child th";
      const rowSel = isDx ? ".dx-data-row" : "tbody tr, tr";
      const headers = Array.from(grid.querySelectorAll(headerSel)).map((c) => clean(c.textContent)).filter(Boolean);
      const firstRow = grid.querySelector(rowSel);
      const firstRowCells = firstRow
        ? Array.from(firstRow.querySelectorAll("td")).map((c) => clean(c.textContent).slice(0, 40))
        : [];
      grids.push({
        type: isDx ? (grid.matches(".dx-treelist") ? "dx-treelist" : "dx-datagrid") : "table",
        hint: selectorHint(grid),
        rowSelector: rowSel,
        headers,
        rowCount: grid.querySelectorAll(rowSel).length,
        firstRowCells,
      });
    });
    return grids;
  }

  // Detay sayfası: Taraf Bilgileri sekmesi/tablosu ile safahat/evrak yapısını döker
  function dumpDetailStructure() {
    // Sekme başlıkları (Taraf Bilgileri, Safahat, Evraklar...) — DevExtreme tab veya klasik
    const tabs = [];
    deepQueryAll(".dx-tab, [role='tab'], .nav-link, .tab, li[class*='tab']").forEach((t) => {
      const txt = clean(t.textContent);
      if (txt && txt.length < 40) tabs.push({ text: txt, hint: selectorHint(t) });
    });

    const taraflar = parseTaraflar();
    // Taraf tablosunun ham yapısını da ver (parse tutmazsa Seyma'nın DOM'undan düzeltiriz)
    const tarafTablo = deepQueryAll("table, .dx-datagrid").map((tbl) => {
      const head = clean(tbl.textContent).toLowerCase();
      if (!/(rol|taraf|vekil|davac[ıi]|daval[ıi])/i.test(head)) return null;
      const caps = Array.from(tbl.querySelectorAll(".dx-header-row td, thead th, thead td, tr:first-child th"))
        .map((c) => clean(c.textContent)).filter(Boolean);
      return { hint: selectorHint(tbl), headerCaptions: caps };
    }).filter(Boolean).slice(0, 3);

    return {
      tabs: tabs.slice(0, 15),
      tarafParseCount: taraflar.length,
      tarafSample: taraflar.slice(0, 4),
      tarafTables: tarafTablo,
      safahatCount: parseSafahat().length,
      evrakCount: parseEvraklar().length,
    };
  }

  // Teşhis: sayfa yapısını özetle (Seyma'nın oturumunda selector'ları doğrulamak için).
  // A1 derin taramanın gerçek selector'larını bu çıktıdan çıkaracağız:
  // sorgu formu (yargı türü/birim seçiciler + Sorgula butonu), grid yapısı, detay/taraf yapısı.
  function diagnostics() {
    const grids = deepQueryAll(".dx-datagrid, .dx-treelist").length;
    const tables = deepQueryAll("table").length;
    const headerSamples = deepQueryAll(".dx-header-row").slice(0, 3).map((h) => clean(h.textContent).slice(0, 200));
    const pager = deepQueryAll(".dx-pager").length;
    const found = collect();
    return {
      url: location.href,
      grids, tables, pager,
      headerSamples,
      foundCount: found.length,
      firstItem: found[0] || null,
      bodyLen: (document.body && document.body.innerText || "").length,
      // A1 için yeni: sorgu formu + grid + detay yapısı
      form: dumpFormControls(),
      gridStructure: dumpGridStructure(),
      detail: dumpDetailStructure(),
    };
  }

  // Popup'tan gelen tarama isteğini yanıtla
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg) return;
    if (msg.type === "MIZANIM_SCAN") {
      try {
        sendResponse({ ok: true, davalar: collect(), url: location.href });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
      return true;
    }
    if (msg.type === "MIZANIM_SCAN_ALL") {
      collectAllPages(40).then((davalar) => {
        sendResponse({ ok: true, davalar, url: location.href });
      }).catch((e) => sendResponse({ ok: false, error: String(e) }));
      return true; // async
    }
    if (msg.type === "MIZANIM_DIAG") {
      try { sendResponse({ ok: true, diag: diagnostics() }); }
      catch (e) { sendResponse({ ok: false, error: String(e) }); }
      return true;
    }
    return true;
  });

  // İzole dünyada test/teşhis kancası (sayfa JS'i göremez)
  try {
    window.__MIZANIM_SCAN = collect;
    window.__MIZANIM_DIAG = diagnostics;
  } catch (_) { /* yoksay */ }

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
