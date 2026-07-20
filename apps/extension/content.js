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

  // Teşhis: sayfa yapısını özetle (Seyma'nın oturumunda selector'ları doğrulamak için)
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
