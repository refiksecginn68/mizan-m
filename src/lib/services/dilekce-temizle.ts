// AI çıktısındaki markdown/gereksiz sembolleri temizler.
// Prompt'ta markdown yasak olsa da model zaman zaman sembol üretiyor; bu katman
// deterministik güvence sağlar. Dilekçe kağıda basılır — "**", "##", "- " gibi
// işaretler metinde aynen görünür ve belgeyi bozar.

// Hukuki metinde meşru kısa çizgi kullanımlarını koru: tarih (12-05-2024),
// madde aralığı (m. 5-7), birleşik sözcük (sosyo-ekonomik). Yalnızca satır
// başındaki liste işareti kaldırılır.

function satirTemizle(satir: string): string {
  let s = satir;

  // Başlık işaretleri: "## AÇIKLAMALAR" → "AÇIKLAMALAR"
  s = s.replace(/^\s{0,3}#{1,6}\s+/, "");

  // Alıntı işareti: "> metin" → "metin"
  s = s.replace(/^\s{0,3}>\s?/, "");

  // Liste işareti satır başında: "- madde", "* madde", "+ madde" → "madde"
  // (Numaralı liste "1." korunur — dilekçede AÇIKLAMALAR numaralıdır.)
  s = s.replace(/^(\s*)[-*+]\s+/, "$1");

  return s;
}

export function dilekceMetniTemizle(ham: string): string {
  if (!ham) return "";

  let metin = ham.replace(/\r\n/g, "\n");

  // Kod çiti: ```...``` sarmalını kaldır, içeriği koru
  metin = metin.replace(/^\s*```[a-z]*\s*\n?/gim, "");
  metin = metin.replace(/\n?\s*```\s*$/gim, "");

  // Kalın/italik: **metin** / __metin__ / *metin* / _metin_ → metin
  // Yıldız/alt çizgi bir sözcüğe bitişikse vurgudur; ortada tek başınaysa dokunma.
  metin = metin.replace(/\*\*\*(\S(?:[\s\S]*?\S)?)\*\*\*/g, "$1");
  metin = metin.replace(/\*\*(\S(?:[\s\S]*?\S)?)\*\*/g, "$1");
  metin = metin.replace(/(?<![\w*])\*(\S(?:[^*\n]*?\S)?)\*(?![\w*])/g, "$1");
  metin = metin.replace(/___(\S(?:[\s\S]*?\S)?)___/g, "$1");
  metin = metin.replace(/__(\S(?:[\s\S]*?\S)?)__/g, "$1");
  metin = metin.replace(/(?<![\w_])_(\S(?:[^_\n]*?\S)?)_(?![\w_])/g, "$1");

  // Satır içi kod: `metin` → metin
  metin = metin.replace(/`([^`\n]+)`/g, "$1");

  // Markdown bağlantısı: [ad](url) → ad  (yer tutucu [KÖŞELİ PARANTEZ] korunur)
  metin = metin.replace(/\[([^\]\n]+)\]\((?:[^)\n]+)\)/g, "$1");

  // Yatay çizgi: "---", "***", "___" tek başına satırda
  metin = metin.replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm, "");

  metin = metin.split("\n").map(satirTemizle).join("\n");

  // Kalan yalnız yıldız/diyez işaretleri
  metin = metin.replace(/[ \t]*\*+[ \t]*$/gm, "");

  // Fazla boş satırları sadeleştir + satır sonu boşluklarını kırp
  metin = metin
    .split("\n")
    .map((s) => s.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return metin;
}

/** Metinde markdown sembolü kaldı mı — test ve doğrulama için. */
export function markdownKalintisi(metin: string): string[] {
  const bulgular: string[] = [];
  if (/^\s{0,3}#{1,6}\s/m.test(metin)) bulgular.push("başlık işareti (#)");
  if (/\*\*[^*\n]+\*\*/.test(metin)) bulgular.push("kalın (**)");
  if (/(?<![\w*])\*(?![\s*])[^*\n]+\*(?![\w*])/.test(metin)) bulgular.push("italik (*)");
  if (/^\s*[-*+]\s+/m.test(metin)) bulgular.push("liste işareti (- veya *)");
  if (/```/.test(metin)) bulgular.push("kod çiti (```)");
  if (/^\s{0,3}>\s/m.test(metin)) bulgular.push("alıntı (>)");
  return bulgular;
}
