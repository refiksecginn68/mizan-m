"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TrendNokta {
  gun: string;
  sorgu_sayisi: number;
  maliyet_try: number;
}

interface KotaSatiri {
  paket: string;
  uye_sayisi: number;
  toplam_kota: number;
  kullanilan: number;
}

const CONFIG: ChartConfig = {
  sorgu_sayisi: { label: "Sorgu Sayısı", color: "#1a2744" },
};

const PAKET_ETIKET: Record<string, string> = {
  max: "Max",
  pro: "Pro",
  diger: "Diğer",
  paketsiz: "Paketsiz",
};

export default function KullanimClient({ trend, kota }: { trend: TrendNokta[]; kota: KotaSatiri[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Son 30 Gün — Sorgu Trendi</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={CONFIG} className="aspect-auto h-[280px] w-full">
            <LineChart data={trend} margin={{ left: 0, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="gun"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={(v: string) => new Date(v).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })}
              />
              <YAxis tickLine={false} axisLine={false} width={32} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(v) => new Date(v as string).toLocaleDateString("tr-TR", { day: "2-digit", month: "long" })}
                  />
                }
              />
              <Line dataKey="sorgu_sayisi" type="monotone" stroke="var(--color-sorgu_sayisi)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Paket Bazında Kota Doluluk</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paket</TableHead>
                <TableHead>Üye Sayısı</TableHead>
                <TableHead>Toplam Kota</TableHead>
                <TableHead>Kullanılan</TableHead>
                <TableHead>Doluluk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kota.map((k) => {
                const yuzde = k.toplam_kota > 0 ? Math.round((k.kullanilan / k.toplam_kota) * 100) : 0;
                return (
                  <TableRow key={k.paket}>
                    <TableCell className="font-semibold">{PAKET_ETIKET[k.paket] ?? k.paket}</TableCell>
                    <TableCell>{k.uye_sayisi.toLocaleString("tr-TR")}</TableCell>
                    <TableCell>{k.toplam_kota.toLocaleString("tr-TR")}</TableCell>
                    <TableCell>{k.kullanilan.toLocaleString("tr-TR")}</TableCell>
                    <TableCell>
                      <Badge variant={yuzde >= 90 ? "destructive" : yuzde >= 70 ? "default" : "secondary"}>
                        %{yuzde}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {kota.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Veri bulunamadı
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