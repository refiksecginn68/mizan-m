import { Scale, User } from "lucide-react";
import SourceChip from "./SourceChip";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
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
            <p className="font-body text-sm text-white whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="space-y-1">
              <MarkdownRenderer content={content} />
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
