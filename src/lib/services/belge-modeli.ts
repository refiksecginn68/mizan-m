// Editör HTML'ini biçim-farkında ortak bir belge modeline çevirir.
// Word (docx), PDF (pdf-lib) ve UDF export'ları bu tek modeli okur — böylece
// üç formatta da aynı biçimlendirme üretilir.

import { parse, type HTMLElement, type Node } from "node-html-parser";

export interface Run {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;      // #rrggbb
  vurgu?: string;      // arka plan #rrggbb
  font?: string;       // "Times New Roman"
  punto?: number;      // pt
}

export type BlokTipi = "p" | "h1" | "h2" | "h3" | "madde" | "numara" | "alinti";

export interface Blok {
  tip: BlokTipi;
  runs: Run[];
  hiza?: "left" | "center" | "right" | "justify";
  girinti?: number;      // px
  satirAraligi?: number;
}

type Stil = Omit<Run, "text">;

const BLOK_ETIKET: Record<string, BlokTipi> = {
  p: "p", h1: "h1", h2: "h2", h3: "h3", blockquote: "alinti", div: "p",
};

function cssAyristir(style: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const parca of style.split(";")) {
    const i = parca.indexOf(":");
    if (i < 0) continue;
    out[parca.slice(0, i).trim().toLowerCase()] = parca.slice(i + 1).trim();
  }
  return out;
}

// rgb(a,b,c) veya #abc → #rrggbb
function renkNormalize(v: string): string | undefined {
  const s = v.trim().toLowerCase();
  if (s === "transparent" || s === "inherit" || !s) return undefined;
  const rgb = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) {
    return "#" + [rgb[1], rgb[2], rgb[3]]
      .map((n) => Number(n).toString(16).padStart(2, "0")).join("");
  }
  if (/^#[0-9a-f]{3}$/.test(s)) return "#" + s.slice(1).split("").map((c) => c + c).join("");
  if (/^#[0-9a-f]{6}$/.test(s)) return s;
  return undefined;
}

// font-family listesinden ilk gerçek adı al: "'Times New Roman', serif" → Times New Roman
function fontNormalize(v: string): string | undefined {
  const ilk = v.split(",")[0]?.trim().replace(/^['"]|['"]$/g, "");
  return ilk || undefined;
}

function puntoNormalize(v: string): number | undefined {
  const m = v.match(/^([\d.]+)\s*(px|pt)?$/);
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  if (!isFinite(n)) return undefined;
  // px → pt (CSS 96dpi): 1px = 0.75pt
  return m[2] === "pt" ? n : Math.round(n * 0.75 * 10) / 10;
}

function stilBirlestir(ust: Stil, el: HTMLElement): Stil {
  const s: Stil = { ...ust };
  const tag = el.rawTagName?.toLowerCase();
  if (tag === "strong" || tag === "b") s.bold = true;
  if (tag === "em" || tag === "i") s.italic = true;
  if (tag === "u") s.underline = true;
  if (tag === "s" || tag === "del" || tag === "strike") s.strike = true;
  if (tag === "h1" || tag === "h2" || tag === "h3") s.bold = true;

  const style = el.getAttribute("style");
  if (style) {
    const css = cssAyristir(style);
    if (css["font-weight"]) {
      const w = css["font-weight"];
      s.bold = w === "bold" || w === "bolder" || Number(w) >= 600;
    }
    if (css["font-style"] === "italic") s.italic = true;
    if (css["text-decoration"]?.includes("underline")) s.underline = true;
    if (css["text-decoration"]?.includes("line-through")) s.strike = true;
    if (css["color"]) s.color = renkNormalize(css["color"]) ?? s.color;
    if (css["background-color"]) s.vurgu = renkNormalize(css["background-color"]);
    if (css["font-family"]) s.font = fontNormalize(css["font-family"]) ?? s.font;
    if (css["font-size"]) s.punto = puntoNormalize(css["font-size"]) ?? s.punto;
  }
  return s;
}

function blokBicimi(el: HTMLElement): Pick<Blok, "hiza" | "girinti" | "satirAraligi"> {
  const out: Pick<Blok, "hiza" | "girinti" | "satirAraligi"> = {};
  const style = el.getAttribute("style");
  if (!style) return out;
  const css = cssAyristir(style);
  const h = css["text-align"];
  if (h === "left" || h === "center" || h === "right" || h === "justify") out.hiza = h;
  const ml = css["margin-left"];
  if (ml) {
    const n = parseInt(ml, 10);
    if (isFinite(n) && n > 0) out.girinti = n;
  }
  const lh = css["line-height"];
  if (lh) {
    const n = parseFloat(lh);
    if (isFinite(n) && n > 0) out.satirAraligi = n;
  }
  return out;
}

function runlariTopla(node: Node, stil: Stil, hedef: Run[]): void {
  // nodeType 3 = text
  if (node.nodeType === 3) {
    const t = node.rawText
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ");
    if (t) hedef.push({ ...stil, text: t });
    return;
  }
  const el = node as HTMLElement;
  const tag = el.rawTagName?.toLowerCase();
  if (tag === "br") {
    hedef.push({ ...stil, text: "\n" });
    return;
  }
  const yeni = stilBirlestir(stil, el);
  for (const c of el.childNodes) runlariTopla(c, yeni, hedef);
}

function runlariSadelestir(runs: Run[]): Run[] {
  const out: Run[] = [];
  for (const r of runs) {
    if (!r.text) continue;
    const son = out[out.length - 1];
    if (
      son && son.bold === r.bold && son.italic === r.italic &&
      son.underline === r.underline && son.strike === r.strike &&
      son.color === r.color && son.vurgu === r.vurgu &&
      son.font === r.font && son.punto === r.punto
    ) {
      son.text += r.text;
    } else {
      out.push({ ...r });
    }
  }
  return out;
}

function bloklariTopla(el: HTMLElement, stil: Stil, out: Blok[], listeTipi?: BlokTipi): void {
  for (const c of el.childNodes) {
    if (c.nodeType === 3) {
      // Blok dışı çıplak metin — kendi paragrafı olsun
      const runs: Run[] = [];
      runlariTopla(c, stil, runs);
      const temiz = runlariSadelestir(runs);
      if (temiz.some((r) => r.text.trim())) out.push({ tip: "p", runs: temiz });
      continue;
    }
    const ce = c as HTMLElement;
    const tag = ce.rawTagName?.toLowerCase() ?? "";

    if (tag === "ul" || tag === "ol") {
      bloklariTopla(ce, stilBirlestir(stil, ce), out, tag === "ul" ? "madde" : "numara");
      continue;
    }
    if (tag === "li") {
      const icStil = stilBirlestir(stil, ce);
      // <li><p>..</p></li> — TipTap listeleri paragraf sarar
      const paragraflar = ce.childNodes.filter(
        (n) => (n as HTMLElement).rawTagName?.toLowerCase() === "p"
      );
      if (paragraflar.length) {
        for (const p of paragraflar) {
          const runs: Run[] = [];
          runlariTopla(p, icStil, runs);
          out.push({
            tip: listeTipi ?? "madde",
            runs: runlariSadelestir(runs),
            ...blokBicimi(p as HTMLElement),
          });
        }
      } else {
        const runs: Run[] = [];
        runlariTopla(ce, icStil, runs);
        out.push({ tip: listeTipi ?? "madde", runs: runlariSadelestir(runs), ...blokBicimi(ce) });
      }
      continue;
    }

    if (tag in BLOK_ETIKET) {
      // <div> yalnızca blok çocuk içeriyorsa kap olarak davran
      if (tag === "div" && ce.childNodes.some((n) => {
        const t = (n as HTMLElement).rawTagName?.toLowerCase();
        return t && (t in BLOK_ETIKET || t === "ul" || t === "ol");
      })) {
        bloklariTopla(ce, stilBirlestir(stil, ce), out, listeTipi);
        continue;
      }
      const runs: Run[] = [];
      runlariTopla(ce, stilBirlestir(stil, ce), runs);
      out.push({ tip: BLOK_ETIKET[tag], runs: runlariSadelestir(runs), ...blokBicimi(ce) });
      continue;
    }

    if (tag === "hr") {
      out.push({ tip: "p", runs: [] });
      continue;
    }

    // Tanınmayan kap — içine in
    bloklariTopla(ce, stilBirlestir(stil, ce), out, listeTipi);
  }
}

/**
 * Editör HTML'ini bloklara çevirir. HTML değil düz metin verilirse
 * (eski kayıtlar, AI ham çıktısı) satırlar paragrafa dönüştürülür.
 */
export function htmlToBloklar(html: string): Blok[] {
  const htmlMi = /<(p|div|h[1-6]|ul|ol|li|br|strong|em|u|s|span|blockquote)\b/i.test(html);
  if (!htmlMi) return duzMetinBloklari(html);

  const kok = parse(html, { blockTextElements: { script: false, style: false } });
  const out: Blok[] = [];
  bloklariTopla(kok, {}, out);

  // <br> ile gelen satır sonlarını ayrı bloklara böl
  const bolunmus: Blok[] = [];
  for (const b of out) {
    if (!b.runs.some((r) => r.text.includes("\n"))) { bolunmus.push(b); continue; }
    let mevcut: Run[] = [];
    for (const r of b.runs) {
      const parcalar = r.text.split("\n");
      parcalar.forEach((p, i) => {
        if (i > 0) { bolunmus.push({ ...b, runs: runlariSadelestir(mevcut) }); mevcut = []; }
        if (p) mevcut.push({ ...r, text: p });
      });
    }
    bolunmus.push({ ...b, runs: runlariSadelestir(mevcut) });
  }
  return bolunmus;
}

export function duzMetinBloklari(metin: string): Blok[] {
  return metin.replace(/\r\n/g, "\n").split("\n").map((satir) => ({
    tip: "p" as const,
    runs: satir.trim() ? [{ text: satir }] : [],
  }));
}

/** Bloklardan düz metin — UDF gövdesi ve AI'a geri besleme için. */
export function bloklardanDuzMetin(bloklar: Blok[]): string {
  let sayac = 0;
  return bloklar
    .map((b) => {
      const t = b.runs.map((r) => r.text).join("");
      if (b.tip !== "numara") sayac = 0;
      if (!t.trim()) return "";
      if (b.tip === "madde") return `• ${t}`;
      if (b.tip === "numara") return `${++sayac}. ${t}`;
      return t;
    })
    .join("\n");
}
