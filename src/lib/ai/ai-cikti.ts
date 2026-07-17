// Merkezi AI çıktı temizleyici — TÜM AI yüzeylerinin ortak katmanı.
// Prompt'ta markdown yasak olsa da model zaman zaman sembol üretiyor; bu katman
// deterministik güvence sağlar. Sunucu (kayıt öncesi) ve istemci (render öncesi)
// tarafında aynı fonksiyon kullanılır — eski kayıtlı mesajlardaki semboller de
// görüntülenirken temizlenmiş olur.
//
// dilekce-temizle.ts'den farkı: sohbet/özet metinlerinde liste yapısı korunmalı
// ("- madde" → "• madde") ve markdown tabloları satır satır düz metne çevrilir.

function tabloSatiriMi(satir: string): boolean {
  const s = satir.trim();
  return s.startsWith("|") && s.endsWith("|") && s.length > 2;
}

function tabloAyraciMi(satir: string): boolean {
  // |---|:---:|--- | gibi hizalama satırları
  return /^\s*\|?[\s:|-]+\|?\s*$/.test(satir) && satir.includes("-") && satir.includes("|");
}

function tabloSatiriDuzMetin(satir: string): string {
  const hucreler = satir.trim().replace(/^\|/, "").replace(/\|$/, "")
    .split("|").map((h) => h.trim()).filter(Boolean);
  return hucreler.join(" · ");
}

function satirTemizle(satir: string): string {
  let s = satir;

  // Başlık işaretleri: "## AÇIKLAMALAR" → "AÇIKLAMALAR"
  s = s.replace(/^\s{0,3}#{1,6}\s+/, "");

  // Alıntı işareti: "> metin" → "metin"
  s = s.replace(/^\s{0,3}>\s?/, "");

  // Liste işareti: "- madde", "* madde", "+ madde" → "• madde" (yapı korunur)
  s = s.replace(/^(\s*)[-*+]\s+/, "$1• ");

  return s;
}

export function aiCiktiTemizle(ham: string): string {
  if (!ham) return "";

  let metin = ham.replace(/\r\n/g, "\n");

  // Kod çiti: ```...``` sarmalını kaldır, içeriği koru
  metin = metin.replace(/^\s*```[a-z]*\s*\n?/gim, "");
  metin = metin.replace(/\n?\s*```\s*$/gim, "");
  metin = metin.replace(/```/g, "");

  // Kalın/italik: **metin** / __metin__ / *metin* / _metin_ → metin
  metin = metin.replace(/\*\*\*(\S(?:[\s\S]*?\S)?)\*\*\*/g, "$1");
  metin = metin.replace(/\*\*(\S(?:[\s\S]*?\S)?)\*\*/g, "$1");
  metin = metin.replace(/(?<![\w*])\*(\S(?:[^*\n]*?\S)?)\*(?![\w*])/g, "$1");
  metin = metin.replace(/___(\S(?:[\s\S]*?\S)?)___/g, "$1");
  metin = metin.replace(/__(\S(?:[\s\S]*?\S)?)__/g, "$1");
  metin = metin.replace(/(?<![\w_])_(\S(?:[^_\n]*?\S)?)_(?![\w_])/g, "$1");

  // Satır içi kod: `metin` → metin
  metin = metin.replace(/`([^`\n]+)`/g, "$1");

  // Markdown bağlantısı: [ad](url) → ad
  metin = metin.replace(/\[([^\]\n]+)\]\((?:[^)\n]+)\)/g, "$1");

  // Yatay çizgi: "---", "***", "___" tek başına satırda
  metin = metin.replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm, "");

  // Tablo satırları: ayraç satırı atılır, veri satırları " · " ile düz metne iner
  metin = metin
    .split("\n")
    .map((s) => {
      if (tabloAyraciMi(s)) return "";
      if (tabloSatiriMi(s)) return tabloSatiriDuzMetin(s);
      return satirTemizle(s);
    })
    .join("\n");

  // Satır sonunda kalan yalnız yıldızlar
  metin = metin.replace(/[ \t]*\*+[ \t]*$/gm, "");

  // Fazla boş satır + satır sonu boşlukları
  metin = metin
    .split("\n")
    .map((s) => s.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return metin;
}

/** Metinde markdown sembolü kaldı mı — test ve doğrulama için. */
export function aiSembolKalintisi(metin: string): string[] {
  const bulgular: string[] = [];
  if (/^\s{0,3}#{1,6}\s/m.test(metin)) bulgular.push("başlık işareti (#)");
  if (/\*\*[^*\n]+\*\*/.test(metin)) bulgular.push("kalın (**)");
  if (/(?<![\w*])\*(?![\s*])[^*\n]+\*(?![\w*])/.test(metin)) bulgular.push("italik (*)");
  if (/^\s*[-*+]\s+/m.test(metin)) bulgular.push("liste işareti (- veya *)");
  if (/```/.test(metin)) bulgular.push("kod çiti (```)");
  if (/^\s{0,3}>\s/m.test(metin)) bulgular.push("alıntı (>)");
  if (/^\s*\|.*\|\s*$/m.test(metin)) bulgular.push("tablo (|)");
  if (/^\s*-{3,}\s*$/m.test(metin)) bulgular.push("yatay çizgi (---)");
  return bulgular;
}
