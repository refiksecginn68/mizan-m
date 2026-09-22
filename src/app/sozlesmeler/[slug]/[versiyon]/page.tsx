import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import { getLegalDocVersion } from "@/lib/legal/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; versiyon: string }>;
}): Promise<Metadata> {
  const { slug, versiyon } = await params;
  const doc = getLegalDocVersion(slug, versiyon);
  if (!doc) return {};
  return { title: `${doc.frontmatter.baslik} (${versiyon}) — Mizanım` };
}

export default async function SozlesmeVersiyonPage({
  params,
}: {
  params: Promise<{ slug: string; versiyon: string }>;
}) {
  const { slug, versiyon } = await params;
  const doc = getLegalDocVersion(slug, versiyon);
  if (!doc) notFound();

  return (
    <article className="max-w-3xl mx-auto px-5 py-16">
      <div className="mb-6 rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-3">
        <p className="font-inter text-sm text-cream/80">
          Bu, <strong className="text-cream">{doc.frontmatter.versiyon}</strong> (arşivlenmiş) versiyondur.{" "}
          <Link href={`/sozlesmeler/${slug}`} className="underline text-gold-300 hover:text-gold-100">
            Güncel versiyonu görüntüle
          </Link>
        </p>
      </div>
      <header className="mb-8">
        <p className="font-inter text-xs uppercase tracking-[0.2em] text-gold-500 mb-2">
          {doc.frontmatter.versiyon} · Yürürlük: {doc.frontmatter.yururlukTarihi}
        </p>
        <h1 className="font-heading text-3xl font-bold text-cream">{doc.frontmatter.baslik}</h1>
      </header>
      <div className="font-inter text-[15px] text-cream/75 leading-[1.8] space-y-4 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-cream [&_h2]:mt-10 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_table]:w-full [&_table]:text-sm [&_th]:text-left [&_th]:border-b [&_th]:border-navy-700 [&_th]:py-2 [&_td]:border-b [&_td]:border-navy-800 [&_td]:py-2 [&_strong]:text-cream [&_strong]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-gold-500 [&_blockquote]:pl-4 [&_blockquote]:text-cream/85">
        <ReactMarkdown>{doc.body}</ReactMarkdown>
      </div>
    </article>
  );
}
