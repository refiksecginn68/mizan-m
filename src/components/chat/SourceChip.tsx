import { BookOpen, Gavel, Scale } from "lucide-react";
import type { LegalSource } from "@/types";

interface Props {
  source: LegalSource;
}

export default function SourceChip({ source }: Props) {
  const icons = { kanun: BookOpen, karar: Gavel, anayasa: Scale };
  const labels = { kanun: "Kanun", karar: "Emsal", anayasa: "Anayasa" };
  const colors = {
    kanun: "bg-primary/10 text-primary border-primary/20",
    karar: "bg-accent/10 text-accent-700 border-accent/20",
    anayasa: "bg-success/10 text-success border-success/20",
  };

  const Icon = icons[source.type] ?? BookOpen;

  return (
    <div
      className={`inline-flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-xs font-mono cursor-default
        ${colors[source.type] ?? colors.kanun}`}
      title={[source.title, source.article, source.case_number, source.date].filter(Boolean).join(" · ")}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span className="truncate max-w-[180px]">
        {labels[source.type]}{source.article ? ` m.${source.article}` : ""}
        {source.case_number ? ` ${source.case_number}` : ""}
        {source.date ? ` (${source.date})` : ""}
      </span>
    </div>
  );
}
