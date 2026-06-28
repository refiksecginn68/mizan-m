import { Scale, User } from "lucide-react";
import SourceChip from "./SourceChip";
import type { LegalSource } from "@/types";

interface Props {
  role: "user" | "assistant";
  content: string;
  sources?: LegalSource[];
  creditCost?: number;
  streaming?: boolean;
}

export default function MessageBubble({ role, content, sources, creditCost, streaming }: Props) {
  const isUser = role === "user";

  // Markdown benzeri basit format: **bold**, ### başlık
  function renderContent(text: string) {
    return text
      .split("\n")
      .map((line, i) => {
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="font-heading text-base font-bold text-primary mt-3 mb-1">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="font-heading text-lg font-bold text-primary mt-4 mb-2">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="font-body font-bold text-foreground mt-2">
              {line.slice(2, -2)}
            </p>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <li key={i} className="font-body text-sm ml-4 list-disc text-foreground">
              {formatInline(line.slice(2))}
            </li>
          );
        }
        if (/^\d+\. /.test(line)) {
          return (
            <li key={i} className="font-body text-sm ml-4 list-decimal text-foreground">
              {formatInline(line.replace(/^\d+\. /, ""))}
            </li>
          );
        }
        if (line.startsWith("⚠️")) {
          return (
            <p key={i} className="font-body text-xs text-muted-foreground mt-3 pt-2 border-t border-border italic">
              {line}
            </p>
          );
        }
        if (line === "") return <br key={i} />;
        return (
          <p key={i} className="font-body text-sm text-foreground leading-relaxed">
            {formatInline(line)}
          </p>
        );
      });
  }

  function formatInline(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      ) : (
        part
      )
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-accent/20" : "bg-primary"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-accent" />
        ) : (
          <Scale className="w-4 h-4 text-accent" />
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-primary text-white rounded-tr-sm"
              : "bg-card border border-border shadow-card rounded-tl-sm"
          }`}
        >
          {isUser ? (
            <p className="font-body text-sm text-white">{content}</p>
          ) : (
            <div className="space-y-1">
              {renderContent(content)}
              {streaming && (
                <span className="inline-block w-2 h-4 bg-accent animate-pulse rounded-sm ml-1" />
              )}
            </div>
          )}
        </div>

        {/* Sources */}
        {sources && sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {sources.map((s, i) => (
              <SourceChip key={i} source={s} />
            ))}
          </div>
        )}

        {/* Credit cost */}
        {creditCost !== undefined && creditCost > 0 && (
          <span className="font-body text-xs text-muted-foreground">
            {creditCost} kredi harcandı
          </span>
        )}
      </div>
    </div>
  );
}
