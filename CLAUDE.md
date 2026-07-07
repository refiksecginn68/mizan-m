# Mizanım

Türkiye'ye özel çift taraflı hukuk platformu.

## Stack
- Next.js 14.2.35 (App Router)
- React 18
- TypeScript 5 (strict mode)
- Tailwind CSS v3 (tailwindcss ^3.4.1)
- Supabase (auth + PostgreSQL)
- Anthropic Claude API (AI)
- Path alias: @/* → src/*

## Proje Yapısı
```
src/app/          → sayfalar (App Router)
src/components/   → UI bileşenleri
src/lib/          → yardımcı fonksiyonlar
src/types/        → TypeScript tipleri
public/           → statik dosyalar (logo.png, icons/, manifest.json)
```

## Taraflar
- **Avukat (/buro/*):** CRM, dava yönetimi, UYAP/UETS entegrasyonu, AI asistan
- **Vatandaş (/panel/*):** Soru-cevap, belge analizi, emsal arama

## Mevcut Entegrasyonlar
- Supabase auth (Server Actions ile cookie yönetimi)
- Anthropic Claude API (streaming, SSE)
- OpenRouter (alternatif modeller)
- Google Calendar (OAuth2)
- iyzico (ödeme - sandbox)
- Resend (e-posta)

## Kurallar
- Türkçe yorum satırları
- Her component tek sorumluluk
- API route'ları src/app/api/ altında
- Server Component default, gerektiğinde "use client"
- Tailwind v3 syntax kullan

## Çalışma Modu
- Onay bekleme, otomatik devam et
- Dış bağlantı (API key, external service kurulumu) gerekince DUR ve sor
- Build temiz kalmalı: npm run type-check && npm run build

@.claude/goat-fable/core/CLAUDE-CORE.md
