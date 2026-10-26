"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface SurfaceSatiri {
  surface: string;
  cost_try: number;
  cagri: number;
  input_tokens: number;
  output_tokens: number;
}

interface ModelSatiri {
  model: string;
  provider: string;
  cost_try: number;
  cagri: number;
}

interface Maliyet {
  toplam_try: number;
  toplam_usd: number;
  toplam_cagri: number;
  surface_dagilim: SurfaceSatiri[];
  model_dagilim: ModelSatiri[];
}

const SURFACE_ETIKET: Record<string, string> = {
  chat: "Vatandaş Sohbet",
  mizanai: "MizanAI (Büro)",
  dilekce: "Dilekçe Üretimi",
  dilekce_sorular: "Dilekçe Ön Görüşme",
  medya: "Medya Analizi",
  transcribe: "Ses Transkripti",
  embed: "Embedding",
  rerank: "Rerank",
};

const CONFIG: ChartConfig = {
  cost_try: { label: "Maliyet (₺)", color: "#1a2744" },
};

function try_(n: number): string {
  return `₺${Number(n).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
}

export default function ApiMaliyetClient({ veri }: { veri: Maliyet }) {
  const chartData = veri.surface_dagilim.map((s) => ({
    surface: SURFACE_ETIKET[s.surface] ?? s.surface,
    cost_try: Number(s.cost_try.toFixed(2)),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="font-body text-xs font-semibold text-muted-foreground mb-2">Toplam Maliyet (₺)</p>
            <p className="font-heading text-2xl font-bold text-primary">{try_(veri.toplam_try)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="font-body text-xs font-semibold text-muted-foreground mb-2">Toplam Maliyet ($)</p>
            <p className="font-heading text-2xl font-bold text-primary">${veri.toplam_usd.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="font-body text-xs font-semibold text-muted-foreground mb-2">Toplam AI Çağrısı</p>
            <p className="font-heading text-2xl font-bold text-primary">{veri.toplam_cagri.toLocaleString("tr-TR")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Özellik Bazında Maliyet Dağılımı</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={CONFIG} className="aspect-auto h-[300px] w-full">
            <BarChart data={chartData} layout="vertical" margin={{ left: 16, right: 24 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v: number) => `₺${v}`} />
              <YAxis type="category" dataKey="surface" tickLine={false} axisLine={false} width={140} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="cost_try" fill="var(--color-cost_try)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Model Bazında Döküm</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Sağlayıcı</TableHead>
                <TableHead>Çağrı</TableHead>
                <TableHead>Maliyet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {veri.model_dagilim.map((m) => (
                <TableRow key={`${m.provider}-${m.model}`}>
                  <TableCell className="font-mono text-xs">{m.model}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{m.provider}</Badge>
                  </TableCell>
                  <TableCell>{m.cagri.toLocaleString("tr-TR")}</TableCell>
                  <TableCell className="font-semibold">{try_(m.cost_try)}</TableCell>
                </TableRow>
              ))}
              {veri.model_dagilim.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Henüz AI çağrısı loglanmadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
