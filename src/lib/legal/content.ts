import fs from "node:fs";
import path from "node:path";

export interface LegalFrontmatter {
  slug: string;
  baslik: string;
  versiyon: string;
  yururlukTarihi: string;
  hedefKitle: "avukat" | "vatandas" | "tumu" | "ic";
  zorunluOnay: boolean;
  yayinlanmayacak?: boolean;
}

export interface LegalDoc {
  frontmatter: LegalFrontmatter;
  body: string;
}

const LEGAL_DIR = path.join(process.cwd(), "content", "legal");

function parseFrontmatter(raw: string): LegalDoc {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("Geçersiz frontmatter formatı");
  const [, fmRaw, body] = match;
  const fm: Record<string, string> = {};
  for (const line of fmRaw.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    fm[key] = value;
  }
  return {
    frontmatter: {
      slug: fm.slug,
      baslik: fm.baslik,
      versiyon: fm.versiyon,
      yururlukTarihi: fm.yururlukTarihi,
      hedefKitle: fm.hedefKitle as LegalFrontmatter["hedefKitle"],
      zorunluOnay: fm.zorunluOnay === "true",
      yayinlanmayacak: fm.yayinlanmayacak === "true",
    },
    body: body.trim(),
  };
}

/** İlgili slug'ın tüm dosyalarını (versiyonları) bulur — dosya adı deseni: <slug>.v<N>.md */
function findFilesForSlug(slug: string): string[] {
  const files = fs.readdirSync(LEGAL_DIR).filter((f) => f.startsWith(`${slug}.v`) && f.endsWith(".md"));
  return files.map((f) => path.join(LEGAL_DIR, f));
}

function versionNumber(v: string): number {
  const n = parseInt(v.replace(/[^\d]/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
}

/** Bir slug için en güncel (yayınlanmış) versiyonu döndürür. */
export function getLatestLegalDoc(slug: string): LegalDoc | null {
  const filePaths = findFilesForSlug(slug);
  if (filePaths.length === 0) return null;
  const docs = filePaths.map((p) => parseFrontmatter(fs.readFileSync(p, "utf-8")));
  const yayinlanan = docs.filter((d) => !d.frontmatter.yayinlanmayacak);
  if (yayinlanan.length === 0) return null;
  yayinlanan.sort((a, b) => versionNumber(b.frontmatter.versiyon) - versionNumber(a.frontmatter.versiyon));
  return yayinlanan[0];
}

/** Bir slug'ın belirli bir versiyonunu döndürür (eski versiyonlara erişim için). */
export function getLegalDocVersion(slug: string, versiyon: string): LegalDoc | null {
  const filePath = path.join(LEGAL_DIR, `${slug}.${versiyon}.md`);
  if (!fs.existsSync(filePath)) return null;
  return parseFrontmatter(fs.readFileSync(filePath, "utf-8"));
}

/** Bir slug'ın mevcut tüm versiyon numaralarını (yeniden eskiye) döndürür. */
export function getLegalDocVersions(slug: string): string[] {
  return findFilesForSlug(slug)
    .map((p) => parseFrontmatter(fs.readFileSync(p, "utf-8")).frontmatter.versiyon)
    .sort((a, b) => versionNumber(b) - versionNumber(a));
}

/** İçindekiler listesi — sözleşmeler index sayfası için. */
export function listLegalDocs(): LegalFrontmatter[] {
  const files = fs.readdirSync(LEGAL_DIR).filter((f) => f.endsWith(".md"));
  const slugs = new Set(files.map((f) => f.split(".v")[0]));
  return Array.from(slugs)
    .map((slug) => getLatestLegalDoc(slug)?.frontmatter)
    .filter((fm): fm is LegalFrontmatter => !!fm);
}
