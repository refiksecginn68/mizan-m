"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Satir {
  ay: string;
  gelir_try: number;
  gider_try: number;
}

const CONFIG: ChartConfig = {
  gelir_try: { label: "Gelir", color: "#1a7f4e" },
  gider_try: { label: "Gider (API)", color: "#b3261e" },
};

function ayEtiket(v: string): string {
  const [yil, ay] = v.split("-");
  return new Date(Number(yil), Number(ay) - 1).toLocaleDateString("tr-TR", { month: "short", year: "2-digit" });
}

export default function GelirGiderClient({ veri }: { veri: Satir[] }) {
  const netToplam = veri.reduce((s, v) => s + (v.gelir_try - v.gider_try), 0);
  const gelirToplam = veri.reduce((s, v) => s + v.gelir_try, 0);
  const giderToplam = veri.reduce((s, v) => s + v.gider_try, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="font-body text-xs font-semibold text-muted-foreground mb-2">Dönem Geliri</p>
            <p className="font-heading text-2xl font-bold text-emerald-700">
              ₺{gelirToplam.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="font-body text-xs font-semibold text-muted-foreground mb-2">Dönem Gideri (API)</p>
            <p className="font-heading text-2xl font-bold text-red-700">
              ₺{giderToplam.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card className={netToplam < 0 ? "border-amber-300 bg-amber-50" : undefined}>
          <CardContent className="p-5">
            <p className="font-body text-xs font-semibold text-muted-foreground mb-2">Dönem Net</p>
            <p className="font-heading text-2xl font-bold text-primary">
              ₺{netToplam.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Aylık Gelir / Gider</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={CONFIG} className="aspect-auto h-[320px] w-full">
            <BarChart data={veri} margin={{ left: 0, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="ay" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={ayEtiket} />
              <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => `₺${(v / 1000).toFixed(0)}k`} />
              <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => ayEtiket(v as string)} />} />
              <Legend />
              <Bar dataKey="gelir_try" fill="var(--color-gelir_try)" radius={4} />
              <Bar dataKey="gider_try" fill="var(--color-gider_try)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
