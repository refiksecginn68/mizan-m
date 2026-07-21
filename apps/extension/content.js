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

  // ═══════════════════ A1 DERİN TARAMA MOTORU ═══════════════════
  // Canlı portaldan doğrulanmış DOM yapısı: DevExtreme SPA, URL değişmez,
  // dosya detayı modal overlay olarak açılır. Sekmeler [role="tab"] + aria-controls,
  // evrak ağacı .evrak-treeview.dx-treeview (lazy load + .evrak-tree-pagination).

  const deep = {
    running: false,
    paused: false,
    stopRequested: false,
    done: {},          // "esasNo|birim" → true (resumable)
    doneQueries: {},   // "türü|birim" → true
    progress: { phase: "hazır", detay: "", islenen: 0, toplam: 0, hatalar: [] },
  };

  function deepLog(msg) {
    // Sessiz boş dönüş YASAK: her sorun hem konsola hem ilerleme paneline yazılır
    console.warn("[MizanımDeep]", msg);
    deep.progress.hatalar.push(msg);
    if (deep.progress.hatalar.length > 50) deep.progress.hatalar.shift();
    saveDeepState();
  }

  function saveDeepState() {
    try {
      chrome.storage.local.set({
        mzDeep: {
          running: deep.running,
          paused: deep.paused,
          done: deep.done,
          doneQueries: deep.doneQueries,
          progress: deep.progress,
          ts: Date.now(),
        },
      });
    } catch (_) { /* extension context kapanmış olabilir */ }
  }

  async function loadDeepState() {
    try {
      const data = await chrome.storage.local.get(["mzDeep"]);
      if (data.mzDeep) {
        deep.done = data.mzDeep.done || {};
        deep.doneQueries = data.mzDeep.doneQueries || {};
      }
    } catch (_) { /* yoksay */ }
  }

  function setPhase(phase, detay) {
    deep.progress.phase = phase;
    if (detay !== undefined) deep.progress.detay = detay;
    saveDeepState();
  }

  // HESAP GÜVENLİĞİ: istekler arası insan hızında rastgele gecikme (zorunlu; UYAP
  // anormal trafik algılarsa avukatın hesabı riske girer)
  const rateDelay = () => sleep(800 + Math.floor(Math.random() * 700));

  // Duraklat/durdur kapısı — her adım arasında kontrol edilir
  async function gate() {
    while (deep.paused && !deep.stopRequested) await sleep(400);
    if (deep.stopRequested) throw new Error("__DEEP_STOP__");
  }

  // Koşul sağlanana dek bekle (SPA'da sayfa yönlendirmesi yok; DOM polling şart)
  async function waitFor(fn, timeoutMs = 15000, intervalMs = 150) {
    const t0 = Date.now();
    for (;;) {
      let v;
      try { v = fn(); } catch (_) { v = null; }
      if (v) return v;
      if (Date.now() - t0 > timeoutMs) return null;
      await sleep(intervalMs);
    }
  }

  function visible(el) {
    if (!el) return false;
    if (el.classList && el.classList.contains("dx-state-invisible")) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  // ── DevExtreme selectbox sürücüsü (sorgu formu: Yargı Türü / Yargı Birimi) ──

  function findSelectboxByLabel(labelRe) {
    const boxes = deepQueryAll(".dx-selectbox, .dx-dropdowneditor").filter(visible);
    for (const box of boxes) {
      const aria = box.getAttribute("aria-label") || "";
      const input = box.querySelector("input.dx-texteditor-input");
      const ph = (input && (input.getAttribute("placeholder") || input.getAttribute("aria-label"))) || "";
      if (labelRe.test(aria) || labelRe.test(ph)) return box;
      // Etiket kutunun dışında olabilir: form alanı kabındaki metne bak
      const field = box.closest("[class*='field'], [class*='form-item'], .dx-field");
      if (field) {
        const lbl = field.querySelector("label, .dx-field-item-label-text, .dx-field-label");
        if (lbl && labelRe.test(clean(lbl.textContent))) return box;
      }
      const prev = box.previousElementSibling;
      if (prev && labelRe.test(clean(prev.textContent).slice(0, 60))) return box;
    }
    return null;
  }

  function visibleListItems() {
    // DevExtreme dropdown listesi body'ye eklenen overlay içinde açılır
    return deepQueryAll(".dx-overlay-wrapper .dx-list-item").filter(visible);
  }

  async function openDropdown(box) {
    const btn = box.querySelector(".dx-dropdowneditor-button") || box;
    btn.click();
    const items = await waitFor(() => {
      const its = visibleListItems();
      return its.length > 0 ? its : null;
    }, 6000);
    return items || [];
  }

  async function closeDropdown() {
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await sleep(200);
  }

  async function listOptions(box) {
    const items = await openDropdown(box);
    const texts = items.map((i) => clean(i.textContent)).filter(Boolean);
    await closeDropdown();
    return texts;
  }

  async function selectOption(box, text) {
    const items = await openDropdown(box);
    const hit = items.find((i) => clean(i.textContent) === text);
    if (!hit) { await closeDropdown(); return false; }
    hit.click();
    // Seçimin input'a yansımasını bekle
    await waitFor(() => {
      const input = box.querySelector("input.dx-texteditor-input");
      return input && clean(input.value).length > 0;
    }, 4000);
    await sleep(250);
    return true;
  }

  function findSorgulaButton() {
    const btns = deepQueryAll("button, .dx-button, a[role='button']").filter(visible);
    return btns.find((b) => /sorgula|listele|\bara\b/i.test(clean(b.textContent))) || null;
  }

  // ── Ana grid yardımcıları ──

  function mainGrid() {
    return deepQueryAll(".dx-datagrid").find((g) => {
      const caps = Array.from(g.querySelectorAll(".dx-header-row td")).map((c) => clean(c.textContent).toLowerCase());
      return caps.some((c) => /dosya no/.test(c)) && visible(g);
    }) || null;
  }

  function gridHeaderIndex(grid, re) {
    const caps = Array.from(grid.querySelectorAll(".dx-header-row td")).map((c) => clean(c.textContent).toLowerCase());
    return caps.findIndex((c) => re.test(c));
  }

  // Sayfa boyutunu "Tümü"ye (yoksa en büyüğe) çek — sanal kaydırma/sayfalama riskini azaltır
  async function setPageSizeMax() {
    const sizes = deepQueryAll(".dx-pager .dx-page-size").filter(visible);
    if (sizes.length === 0) return;
    const tumu = sizes.find((s) => /t[üu]m[üu]|all/i.test(clean(s.textContent))) || sizes[sizes.length - 1];
    if (tumu.classList.contains("dx-selection")) return;
    tumu.click();
    await sleep(1200);
  }

  // Sanal kaydırma varsa grid gövdesini sonuna dek kaydırarak tüm satırları DOM'a getirir
  async function collectGridRows(grid) {
    const scrollable = grid.querySelector(".dx-datagrid-rowsview .dx-scrollable-container");
    const byKey = new Map();
    const absorb = () => {
      grid.querySelectorAll(".dx-datagrid-rowsview .dx-data-row").forEach((row) => {
        const cells = Array.from(row.querySelectorAll("td")).map((c) => clean(c.textContent));
        const key = cells.join("|");
        if (key.replace(/\|/g, "").length > 0 && !byKey.has(key)) byKey.set(key, row);
      });
    };
    absorb();
    if (scrollable) {
      let lastCount = -1;
      for (let i = 0; i < 60 && byKey.size !== lastCount; i++) {
        lastCount = byKey.size;
        scrollable.scrollTop = scrollable.scrollHeight;
        await sleep(350);
        absorb();
      }
      scrollable.scrollTop = 0;
      await sleep(250);
    }
    return byKey;
  }

  function parseRowFields(grid, row) {
    const iBirim = gridHeaderIndex(grid, /birim/);
    const iNo = gridHeaderIndex(grid, /dosya no/);
    const iTur = gridHeaderIndex(grid, /dosya t[üu]r/);
    const iDurum = gridHeaderIndex(grid, /dosya durum/);
    const iAcilis = gridHeaderIndex(grid, /a[çc][ıi]l[ıi][şs]/);
    const cells = Array.from(row.querySelectorAll("td")).map((c) => clean(c.textContent));
    const esasNo = (cells[iNo] || "").match(ESAS_RE) ? cells[iNo].match(ESAS_RE)[0] : (cells.join(" ").match(ESAS_RE) || [])[0];
    return {
      esasNo,
      mahkemeAdi: iBirim >= 0 ? cells[iBirim] : undefined,
      davaTuru: iTur >= 0 ? cells[iTur] : undefined,
      durumu: iDurum >= 0 ? cells[iDurum] : undefined,
      acilisTarihi: iAcilis >= 0 ? cells[iAcilis] : undefined,
    };
  }

  // ── Modal (dosya detayı) yardımcıları ──

  function modalTabs() {
    return deepQueryAll("[role='tab'].dx-tab, .dx-item.dx-tab").filter((t) => visible(t) && t.querySelector(".dx-tab-text-span"));
  }

  function findTab(nameRe) {
    return modalTabs().find((t) => nameRe.test(clean(t.textContent))) || null;
  }

  async function waitModalOpen() {
    return waitFor(() => findTab(/taraf bilgileri/i), 15000);
  }

  // Sekme→panel eşleşmesi: aria-controls = panel id; panel .dx-item-selected olmalı
  async function switchTab(nameRe) {
    const tab = findTab(nameRe);
    if (!tab) { deepLog("Sekme bulunamadı: " + nameRe); return null; }
    if (tab.getAttribute("aria-selected") !== "true") {
      tab.click();
    }
    const panelId = tab.getAttribute("aria-controls");
    const panel = await waitFor(() => {
      const p = panelId
        ? document.getElementById(panelId)
        : deepQueryAll(".dx-multiview-item.dx-item-selected[role='tabpanel']")[0];
      return p && p.classList.contains("dx-item-selected") && !p.classList.contains("dx-multiview-item-hidden") ? p : null;
    }, 8000);
    if (!panel) deepLog("Sekme paneli açılmadı: " + nameRe);
    await sleep(400);
    return panel;
  }

  // Taraf Bilgileri: Rol | Tipi | Adı | Vekil (KESİN başlıklar)
  function parseTarafPanel(panel) {
    const taraflar = [];
    const grids = Array.from(panel.querySelectorAll(".dx-datagrid, table"));
    grids.forEach((g) => {
      const isDx = g.classList.contains("dx-datagrid");
      const caps = Array.from(g.querySelectorAll(isDx ? ".dx-header-row td" : "thead th, thead td"))
        .map((c) => clean(c.textContent).toLowerCase());
      const iRol = caps.findIndex((c) => /rol/.test(c));
      const iTip = caps.findIndex((c) => /tip/.test(c));
      const iAd = caps.findIndex((c) => /ad[ıi]/.test(c));
      const iVekil = caps.findIndex((c) => /vekil/.test(c));
      if (iRol < 0 && iAd < 0) return;
      g.querySelectorAll(isDx ? ".dx-data-row" : "tbody tr").forEach((row) => {
        const cells = Array.from(row.querySelectorAll("td")).map((c) => clean(c.textContent));
        if (cells.length < 2) return;
        const ad = iAd >= 0 ? cells[iAd] : cells[2];
        if (!ad) return;
        taraflar.push({
          rol: iRol >= 0 ? cells[iRol] : undefined,
          tip: iTip >= 0 ? cells[iTip] : undefined,
          ad,
          vekil: iVekil >= 0 ? cells[iVekil] : undefined,
        });
      });
    });
    return taraflar;
  }

  // Safahat: tarih + işlem/açıklama sütunları
  function parseSafahatPanel(panel) {
    const out = [];
    panel.querySelectorAll(".dx-datagrid").forEach((g) => {
      const caps = Array.from(g.querySelectorAll(".dx-header-row td")).map((c) => clean(c.textContent).toLowerCase());
      g.querySelectorAll(".dx-data-row").forEach((row) => {
        const cells = Array.from(row.querySelectorAll("td")).map((c) => clean(c.textContent));
        if (cells.length < 2) return;
        const iTarih = caps.findIndex((c) => /tarih/.test(c));
        const iIslem = caps.findIndex((c) => /i[şs]lem|t[üu]r/.test(c));
        const iAcik = caps.findIndex((c) => /a[çc][ıi]klama/.test(c));
        const tarih = iTarih >= 0 ? cells[iTarih] : cells.find((c) => /\d{2}[./]\d{2}[./]\d{4}/.test(c));
        const aciklama = iAcik >= 0 ? cells[iAcik] : cells.filter((c) => c !== tarih).sort((a, b) => b.length - a.length)[0];
        if (!aciklama && !tarih) return;
        out.push({ tarih, islem: iIslem >= 0 ? cells[iIslem] : undefined, aciklama });
      });
    });
    return out.slice(0, 120);
  }

  // ── Evrak ağacı (KESİN yapı: .evrak-treeview.dx-treeview, lazy load + sayfalama) ──

  function evrakTree(panel) {
    return panel.querySelector(".evrak-treeview.dx-treeview") ||
           panel.querySelector(".evrak-list-panel-area .dx-treeview") ||
           panel.querySelector(".dx-treeview");
  }

  // Lazy-load göstergesi kaybolana dek bekle — beklemeden okumak BOŞ çeker
  async function waitTreeLoaded(tree) {
    await waitFor(() => {
      const loaders = Array.from(tree.querySelectorAll(".dx-treeview-node-loadindicator"));
      return loaders.every((l) => !visible(l)) ? true : null;
    }, 12000);
  }

  // Kapalı tüm klasörleri döngüyle aç (asenkron çocuklar geldikçe yeni kapalılar çıkar)
  async function expandTreeAll(tree) {
    for (let round = 0; round < 40; round++) {
      await gate();
      const closed = Array.from(tree.querySelectorAll("li.dx-treeview-node[aria-expanded='false']"))
        .filter((n) => {
          const toggle = n.querySelector(":scope > .dx-treeview-toggle-item-visibility, :scope > .dx-item-content .dx-treeview-toggle-item-visibility, .dx-treeview-toggle-item-visibility");
          return toggle && visible(toggle) && !/son 20 evrak/i.test(n.getAttribute("aria-label") || "");
        });
      if (closed.length === 0) return;
      const node = closed[0];
      const toggle = node.querySelector(".dx-treeview-toggle-item-visibility");
      toggle.click();
      await waitTreeLoaded(tree);
      await sleep(250 + Math.floor(Math.random() * 250));
    }
    deepLog("Evrak ağacı 40 turda tamamen açılamadı — kalan düğümler atlandı");
  }

  // Yaprakları hiyerarşi yoluyla topla (aria-level + data-item-id + üst klasör adları)
  function collectTreeLeaves(tree) {
    const out = [];
    tree.querySelectorAll("li.dx-treeview-node").forEach((node) => {
      const toggle = node.querySelector(":scope > .dx-treeview-toggle-item-visibility");
      const hasChildren = node.getAttribute("aria-expanded") !== null || (toggle && visible(toggle));
      if (hasChildren) return; // klasör, yaprak değil
      const label = clean(node.getAttribute("aria-label") ||
        (node.querySelector(".dx-treeview-item") && node.querySelector(".dx-treeview-item").getAttribute("title")) ||
        (node.querySelector(".dx-treeview-item-content") && node.querySelector(".dx-treeview-item-content").textContent));
      if (!label) return;
      // Klasör yolu: üst li düğümlerinin etiketleri (Son 20 Evrak altındakiler atlanır — mükerrer)
      const path = [];
      let p = node.parentElement;
      while (p && !p.classList.contains("dx-treeview")) {
        if (p.matches("li.dx-treeview-node")) {
          const pl = clean(p.getAttribute("aria-label"));
          if (pl) path.unshift(pl);
        }
        p = p.parentElement;
      }
      if (path.some((s) => /son 20 evrak/i.test(s))) return;
      const tarih = (label.match(/\d{2}[./]\d{2}[./]\d{4}/) || [])[0];
      const ad = clean(label.replace(tarih || "", ""));
      out.push({
        ad: ad || label,
        tarih,
        klasor: path.join(" / ") || undefined,
        itemId: node.getAttribute("data-item-id") || undefined,
      });
    });
    return out;
  }

  // Ağaç sayfalaması: .evrak-tree-pagination → tüm sayfaları dolaş, yoksa evrak atlanır
  async function crawlEvrakPanel(panel) {
    const tree = evrakTree(panel);
    if (!tree) { deepLog("Evrak ağacı (.evrak-treeview) bulunamadı"); return []; }
    await waitTreeLoaded(tree);

    const all = [];
    const seen = new Set();
    const absorb = () => {
      collectTreeLeaves(tree).forEach((e) => {
        const key = `${e.ad}|${e.tarih || ""}|${e.klasor || ""}`;
        if (seen.has(key)) return;
        seen.add(key);
        all.push(e);
      });
    };

    for (let page = 0; page < 30; page++) {
      await gate();
      await expandTreeAll(tree);
      absorb();
      const pag = panel.querySelector(".evrak-tree-pagination");
      if (!pag) break;
      const next = pag.querySelector(".dx-next-button");
      const disabled = !next || next.classList.contains("dx-button-disable") ||
        next.getAttribute("aria-disabled") === "true";
      if (disabled) break;
      const before = all.length;
      next.click();
      await sleep(600);
      await waitTreeLoaded(tree);
      await expandTreeAll(tree);
      absorb();
      if (all.length === before) break; // yeni evrak gelmedi → son sayfa
    }
    return all.slice(0, 500);
  }

  async function closeModal() {
    const closeBtn = deepQueryAll(".dx-popup-title .dx-closebutton, .dx-closebutton").filter(visible)[0];
    if (closeBtn) closeBtn.click();
    else document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await waitFor(() => (findTab(/taraf bilgileri/i) ? null : true), 8000);
    await sleep(300);
  }

  // Bir grid satırının detay modalını açıp Taraf → Evrak → Safahat verilerini çeker
  async function crawlDosyaDetay(grid, row) {
    const fields = parseRowFields(grid, row);
    if (!fields.esasNo) { deepLog("Satırda esas no okunamadı — atlandı"); return null; }

    const iGoruntule = gridHeaderIndex(grid, /g[öo]r[üu]nt[üu]le/);
    const cells = row.querySelectorAll("td");
    const cell = iGoruntule >= 0 ? cells[iGoruntule] : null;
    const clickTarget = (cell && (cell.querySelector("a, button, i, span, img, [role='button']") || cell)) || null;
    if (!clickTarget) { deepLog(`${fields.esasNo}: Dosya Görüntüle hücresi bulunamadı — atlandı`); return null; }
    clickTarget.click();

    const opened = await waitModalOpen();
    if (!opened) { deepLog(`${fields.esasNo}: detay modalı açılmadı — atlandı`); return null; }

    const dava = { ...fields, taraflar: [], evraklar: [], safahat: [], _derin: true };
    try {
      const tarafPanel = await switchTab(/taraf bilgileri/i);
      if (tarafPanel) dava.taraflar = parseTarafPanel(tarafPanel);
      await rateDelay();
      await gate();

      const evrakPanel = await switchTab(/^evrak$/i) || await switchTab(/evrak/i);
      if (evrakPanel) dava.evraklar = await crawlEvrakPanel(evrakPanel);
      await rateDelay();
      await gate();

      const safahatPanel = await switchTab(/safahat/i);
      if (safahatPanel) dava.safahat = parseSafahatPanel(safahatPanel);
    } finally {
      await closeModal();
    }
    return dava;
  }

  // Toplanan dosyaları arka plan üzerinden Mizanım'a gönder (parça parça — kesilirse veri kaybolmaz)
  async function flushBatch(batch) {
    if (batch.length === 0) return;
    try {
      const res = await chrome.runtime.sendMessage({ type: "MIZANIM_TRANSFER", davalar: batch.splice(0) });
      if (!res || !res.ok) deepLog("Aktarım hatası: " + ((res && res.error) || "bilinmeyen"));
      else {
        deep.progress.aktarilan = (deep.progress.aktarilan || 0) + (res.eklendi || 0) + (res.guncellendi || 0);
        saveDeepState();
      }
    } catch (e) {
      deepLog("Aktarım gönderilemedi: " + String(e));
    }
  }

  // Ekrandaki mevcut sorgu sonucunu derinlemesine tara (tüm satırlar × detay modalı)
  async function crawlCurrentResults(etiket, batch) {
    const grid = await waitFor(mainGrid, 10000);
    if (!grid) { deepLog(`${etiket}: sonuç grid'i bulunamadı`); return 0; }
    await setPageSizeMax();

    let taranan = 0;
    for (let page = 0; page < 40; page++) {
      const g = mainGrid();
      if (!g) break;
      const rowsByKey = await collectGridRows(g);
      const keys = Array.from(rowsByKey.keys());
      deep.progress.toplam += keys.length;
      saveDeepState();

      for (let i = 0; i < keys.length; i++) {
        await gate();
        // Satır referansı bayatlamış olabilir (grid re-render) — hücre metniyle tazele
        let row = rowsByKey.get(keys[i]);
        if (!row || !row.isConnected) {
          const fresh = await collectGridRows(mainGrid() || g);
          row = fresh.get(keys[i]);
          if (!row) { deepLog(`${etiket}: satır kayboldu (${keys[i].slice(0, 60)}) — atlandı`); continue; }
        }
        const fields = parseRowFields(mainGrid() || g, row);
        const doneKey = `${fields.esasNo}|${norm(fields.mahkemeAdi || "")}`;
        setPhase("tarama", `${etiket} — ${i + 1}/${keys.length}${fields.esasNo ? " · " + fields.esasNo : ""}`);
        if (fields.esasNo && deep.done[doneKey]) { taranan++; continue; }

        try {
          const dava = await crawlDosyaDetay(mainGrid() || g, row);
          if (dava) {
            batch.push(dava);
            deep.done[doneKey] = true;
            deep.progress.islenen++;
            taranan++;
            saveDeepState();
            if (batch.length >= 5) await flushBatch(batch);
          }
        } catch (e) {
          if (String(e).includes("__DEEP_STOP__")) throw e;
          deepLog(`${fields.esasNo || "?"}: detay hatası — ${String(e).slice(0, 120)}`);
          await closeModal(); // modal açık kalmasın
        }
        await rateDelay();
      }

      if (!gotoNextPage()) break;
      await sleep(1000);
    }
    return taranan;
  }

  function norm(s) { return clean(s).toLocaleLowerCase("tr"); }

  // Tam zincir: tüm yargı türleri × birimler → sorgula → tüm sayfalar → her dosya detayı
  async function runDeepScan() {
    if (deep.running) return;
    deep.running = true;
    deep.stopRequested = false;
    deep.paused = false;
    deep.progress = { phase: "başlıyor", detay: "", islenen: 0, toplam: 0, aktarilan: 0, hatalar: [] };
    await loadDeepState();
    saveDeepState();
    const batch = [];

    try {
      const turuBox = findSelectboxByLabel(/yarg[ıi]\s*t[üu]r/i);
      const birimBox = findSelectboxByLabel(/yarg[ıi]\s*birim|birim/i);
      const sorgula = findSorgulaButton();

      if (!turuBox || !sorgula) {
        // Form sürülemiyorsa dürüstçe söyle ve ekrandaki sonuçları derin tara
        deepLog("Yargı Türü seçicisi/Sorgula butonu bulunamadı — yalnız ekrandaki sorgu sonuçları taranıyor");
        await crawlCurrentResults("Mevcut sonuçlar", batch);
      } else {
        const turler = await listOptions(turuBox);
        if (turler.length === 0) deepLog("Yargı türü listesi boş geldi");
        deep.progress.turler = turler;
        saveDeepState();

        for (const turu of turler) {
          await gate();
          setPhase("sorgu", `${turu} seçiliyor`);
          if (!(await selectOption(turuBox, turu))) { deepLog(`Yargı türü seçilemedi: ${turu}`); continue; }
          await sleep(600);

          // Birim listesi türe göre asenkron dolar
          const birimler = birimBox ? await listOptions(birimBox) : [];
          const hedefBirimler = birimler.length > 0 ? birimler : [""];

          for (const birim of hedefBirimler) {
            await gate();
            const qKey = `${turu}|${birim}`;
            if (deep.doneQueries[qKey]) continue;
            if (birim && birimBox && !(await selectOption(birimBox, birim))) {
              deepLog(`Birim seçilemedi: ${turu} / ${birim}`);
              continue;
            }
            setPhase("sorgu", `${turu}${birim ? " / " + birim : ""} sorgulanıyor`);
            (findSorgulaButton() || sorgula).click();
            await sleep(1200 + Math.floor(Math.random() * 800));
            await crawlCurrentResults(`${turu}${birim ? "/" + birim : ""}`, batch);
            deep.doneQueries[qKey] = true;
            saveDeepState();
            await rateDelay();
          }
        }
      }

      await flushBatch(batch);
      setPhase("bitti", `${deep.progress.islenen} dosya derin tarandı, ${deep.progress.aktarilan || 0} aktarıldı`);
    } catch (e) {
      if (String(e).includes("__DEEP_STOP__")) {
        await flushBatch(batch);
        setPhase("durduruldu", `${deep.progress.islenen} dosya işlendi (kaldığı yerden devam edilebilir)`);
      } else {
        deepLog("Derin tarama beklenmedik hata: " + String(e).slice(0, 200));
        await flushBatch(batch);
        setPhase("hata", String(e).slice(0, 150));
      }
    } finally {
      deep.running = false;
      saveDeepState();
    }
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
    if (msg.type === "MIZANIM_DEEP_START") {
      // Yalnız sorgu grid'inin/formunun olduğu çerçevede çalış (all_frames yayını)
      const uygun = !!(mainGrid() || findSelectboxByLabel(/yarg[ıi]\s*t[üu]r/i));
      if (!uygun) { sendResponse({ ok: false, notHere: true }); return true; }
      if (deep.running) { sendResponse({ ok: true, alreadyRunning: true }); return true; }
      if (msg.reset) { deep.done = {}; deep.doneQueries = {}; }
      runDeepScan(); // arka planda sürer; ilerleme chrome.storage.local.mzDeep'te
      sendResponse({ ok: true, started: true });
      return true;
    }
    if (msg.type === "MIZANIM_DEEP_PAUSE") {
      deep.paused = true; saveDeepState(); sendResponse({ ok: true });
      return true;
    }
    if (msg.type === "MIZANIM_DEEP_RESUME") {
      deep.paused = false; saveDeepState(); sendResponse({ ok: true });
      return true;
    }
    if (msg.type === "MIZANIM_DEEP_STOP") {
      deep.stopRequested = true; deep.paused = false; sendResponse({ ok: true });
      return true;
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
