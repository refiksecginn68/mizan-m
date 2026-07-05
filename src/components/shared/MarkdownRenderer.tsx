"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
  className?: string;
  /* Koyu zemin üzerinde açık renk metin için */
  invert?: boolean;
}

export default function MarkdownRenderer({ content, className = "", invert = false }: Props) {
  const t = invert
    ? {
        heading: "text-white",
        subheading: "text-white/90",
        body: "text-white/90",
        strong: "text-white",
        em: "text-white/70",
        code: "bg-white/10 text-white",
        hr: "border-white/15",
        th: "bg-white/10 text-white border-white/15",
        td: "text-white/85 border-white/15",
        table: "border-white/15",
        blockquote: "border-[#c9a84c]/50 text-white/70",
      }
    : {
        heading: "text-[#0f1729]",
        subheading: "text-[#1a2744]",
        body: "text-gray-800",
        strong: "text-[#0f1729]",
        em: "text-gray-700",
        code: "bg-gray-100 text-[#0f1729]",
        hr: "border-gray-200",
        th: "bg-gray-50 text-[#0f1729] border-gray-200",
        td: "text-gray-700 border-gray-200",
        table: "border-gray-200",
        blockquote: "border-[#c9a84c]/50 text-gray-600",
      };

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className={`font-heading text-base font-bold mt-4 mb-2 ${t.heading}`}>{children}</h1>,
          h2: ({ children }) => <h2 className={`font-heading text-sm font-bold mt-3 mb-1.5 ${t.heading}`}>{children}</h2>,
          h3: ({ children }) => <h3 className={`font-heading text-sm font-semibold mt-2 mb-1 ${t.subheading}`}>{children}</h3>,
          p: ({ children }) => <p className={`text-sm leading-relaxed mb-2 ${t.body}`}>{children}</p>,
          strong: ({ children }) => <strong className={`font-semibold ${t.strong}`}>{children}</strong>,
          em: ({ children }) => <em className={`italic ${t.em}`}>{children}</em>,
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-2">{children}</ol>,
          li: ({ children }) => <li className={`text-sm leading-relaxed ${t.body}`}>{children}</li>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#c9a84c] underline hover:no-underline">{children}</a>
          ),
          blockquote: ({ children }) => (
            <blockquote className={`border-l-4 pl-4 italic my-2 ${t.blockquote}`}>{children}</blockquote>
          ),
          code: ({ children }) => (
            <code className={`text-xs px-1 py-0.5 rounded font-mono ${t.code}`}>{children}</code>
          ),
          hr: () => <hr className={`my-3 ${t.hr}`} />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className={`w-full text-xs border-collapse border ${t.table}`}>{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className={`px-3 py-2 text-left font-semibold border ${t.th}`}>{children}</th>
          ),
          td: ({ children }) => (
            <td className={`px-3 py-2 border ${t.td}`}>{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
