# Mizanım

Türkiye'ye özel çift taraflı hukuk platformu.

## Stack
- Next.js 14.2.35 (App Router)
- React 18
- TypeScript 5 (strict mode)
- Tailwind CSS v3 (tailwindcss ^3.4.1)
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
- Tailwind v3 syntax kullan

## Henüz Kurulmadı
- Veritabanı (Supabase/PostgreSQL planlanıyor)
- Auth sistemi
- AI entegrasyonu
