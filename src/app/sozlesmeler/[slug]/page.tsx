import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import { getLatestLegalDoc, getLegalDocVersions } from "@/lib/legal/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = getLatestLegalDoc(slug);
  if (!doc) return {};
  return { title: `${doc.frontmatter.baslik} — Mizanım` };
}

export default async function SozlesmeSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getLatestLegalDoc(slug);
  if (!doc) notFound();

  const versiyonlar = getLegalDocVersions(slug);

  return (
    <article className="max-w-3xl mx-auto px-5 py-16">
      <header className="mb-8">
        <p className="font-inter text-xs uppercase tracking-[0.2em] text-gold-500 mb-2">
          {doc.frontmatter.versiyon} · Yürürlük: {doc.frontmatter.yururlukTarihi}
        </p>
        <h1 className="font-heading text-3xl font-bold text-cream">{doc.frontmatter.baslik}</h1>
        {versiyonlar.length > 1 && (
          <p className="font-inter text-xs text-cream/50 mt-3">
            Önceki versiyonlar:{" "}
            {versiyonlar
              .filter((v) => v !== doc.frontmatter.versiyon)
              .map((v, i) => (
                <span key={v}>
                  {i > 0 && ", "}
                  <Link href={`/sozlesmeler/${slug}/${v}`} className="underline hover:text-gold-300">
                    {v}
                  </Link>
                </span>
              ))}
          </p>
        )}
      </header>
      <div className="font-inter text-[15px] text-cream/75 leading-[1.8] space-y-4 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-cream [&_h2]:mt-10 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_table]:w-full [&_table]:text-sm [&_th]:text-left [&_th]:border-b [&_th]:border-navy-700 [&_th]:py-2 [&_td]:border-b [&_td]:border-navy-800 [&_td]:py-2 [&_strong]:text-cream [&_strong]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-gold-500 [&_blockquote]:pl-4 [&_blockquote]:text-cream/85">
        <ReactMarkdown>{doc.body}</ReactMarkdown>
      </div>
    </article>
  );
}
