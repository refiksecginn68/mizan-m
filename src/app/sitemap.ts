import { MetadataRoute } from "next";

// Public sayfa haritası — robots kuralları public/robots.txt'te tutulur
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mizanim.com";
  const now = new Date();

  const entry = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly"
  ): MetadataRoute.Sitemap[number] => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    entry("", 1.0, "weekly"),
    entry("/ozellikler", 0.9, "weekly"),
    entry("/fiyatlandirma", 0.9, "weekly"),
    entry("/hakkimizda", 0.7),
    entry("/sss", 0.7),
    entry("/iletisim", 0.6),
    entry("/kvkk", 0.4, "yearly"),
    entry("/gizlilik", 0.4, "yearly"),
    entry("/kullanim-sartlari", 0.4, "yearly"),
    entry("/yasal-uyari", 0.4, "yearly"),
    entry("/giris", 0.3),
    entry("/kayit", 0.3),
  ];
}
