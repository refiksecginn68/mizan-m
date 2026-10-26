"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

interface Nokta {
  gun: string;
  sorgu_sayisi: number;
  maliyet_try: number;
}

const CONFIG: ChartConfig = {
  sorgu_sayisi: { label: "Sorgu", color: "#1a2744" },
};

export default function OzetTrendChart({ veri }: { veri: Nokta[] }) {
  return (
    <ChartContainer config={CONFIG} className="aspect-auto h-[180px] w-full">
      <AreaChart data={veri} margin={{ left: 0, right: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="gun"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={(v: string) => new Date(v).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(v) => new Date(v as string).toLocaleDateString("tr-TR", { day: "2-digit", month: "long" })}
            />
          }
        />
        <defs>
          <linearGradient id="sorguFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-sorgu_sayisi)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-sorgu_sayisi)" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <Area
          dataKey="sorgu_sayisi"
          type="monotone"
          stroke="var(--color-sorgu_sayisi)"
          fill="url(#sorguFill)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
