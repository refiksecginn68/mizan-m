"use client";

import ReactMarkdown from "react-markdown";

interface Props {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = "" }: Props) {
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="font-heading text-base font-bold text-[#0f1729] mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="font-heading text-sm font-bold text-[#0f1729] mt-3 mb-1.5">{children}</h2>,
          h3: ({ children }) => <h3 className="font-heading text-sm font-semibold text-[#1a2744] mt-2 mb-1">{children}</h3>,
          p: ({ children }) => <p className="text-sm text-gray-800 leading-relaxed mb-2">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-[#0f1729]">{children}</strong>,
          em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-2">{children}</ol>,
          li: ({ children }) => <li className="text-sm text-gray-800 leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#c9a84c]/50 pl-4 italic text-gray-600 my-2">{children}</blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-gray-100 text-[#0f1729] text-xs px-1 py-0.5 rounded font-mono">{children}</code>
          ),
          hr: () => <hr className="border-gray-200 my-3" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="w-full text-xs border-collapse border border-gray-200">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-gray-50 px-3 py-2 text-left font-semibold text-[#0f1729] border border-gray-200">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-gray-700 border border-gray-200">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
