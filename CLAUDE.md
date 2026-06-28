# Mizanım

Türkiye'ye özel çift taraflı hukuk platformu.

## Stack
- Next.js 16.2.9 (App Router) — breaking changes var, node_modules/next/dist/docs/ kontrol et
- React 19
- TypeScript 5 (strict mode)
- Tailwind CSS v4
- Path alias: @/* → src/*

## Proje Yapısı
```
src/app/          → sayfalar (App Router)
src/components/   → UI bileşenleri
src/lib/          → yardımcı fonksiyonlar
src/types/        → TypeScript tipleri
```

## Taraflar
- **Avukat:** CRM, dava yönetimi, UYAP/UETS entegrasyonu, AI asistan
- **Vatandaş:** Soru-cevap, belge analizi, emsal arama

## Kurallar
- Türkçe yorum satırları
- Her component tek sorumluluk
- API route'ları src/app/api/ altında
- Server Component default, gerektiğinde "use client"
- Tailwind v4 syntax kullan (v3 değil)

## Henüz Kurulmadı
- Veritabanı (Supabase/PostgreSQL planlanıyor)
- Auth sistemi
- AI entegrasyonu
