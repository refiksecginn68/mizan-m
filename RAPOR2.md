# RAPOR2 — Deploy Öncesi Düzeltmeler

Tarih: 2026-07-11 · Referans: RAPOR.md · Testler: localhost:3000 dev + gerçek Supabase + gerçek Resend

## Yapılanlar

1. 🔴 **Onay/red GET → render-only, mutasyon POST'a taşındı.** GET artık yalnız talep özetli onay sayfası gösterir (kullanıcı, paket, tutar, kota, referans + ONAYLA/Reddet `<form method="POST">` butonları). Kredi yükleme/status/transaction/mail yalnız POST'ta. Ortak token doğrulama `validatePendingRequest` (`src/lib/odeme.ts`) — tek kullanımlık + TTL davranışı korundu. Maildeki linkler GET sayfasına gider (Safe Links güvenle tarayabilir); buton metinleri "Onay Sayfasını Aç" / "Red Sayfasını Aç" yapıldı.
2. 🟠 **Eski credit_balance devri.** Sayım: **1 kullanıcı, toplam 1000 kredi** (vatandas@mizanim.test). Migration `014_credit_balance_devir.sql` yazıldı ve uygulandı.
3. 🟠 **Env düzeltmeleri.** Hesap adı Türkçe karakterli yapıldı; `APPROVAL_TOKEN_TTL_DAYS` artık env'den okunuyor; `.env.example` ve `.env.local` beş değişkeni de içeriyor.
4. 🟡 **Mükerrer talep engeli.** Aynı kullanıcı+paket için pending talep varsa yeni talep ve yeni admin maili oluşturulmuyor; mevcut referans `existing:true` ile dönüyor, UI "Zaten bekleyen bir talebiniz var: MZN-XXXXX" gösteriyor.
5. 🟡 **/kredi → /kredi-yukle** kalıcı yönlendirme (next.config.mjs redirects, 308). iyzico kodu silinmedi.

## Test Sonuçları

| # | Test | Durum | Kanıt |
|---|------|-------|-------|
| 1 | Maildeki linke GET → değişiklik yok + özet sayfası | ✅ | GET 200, sayfada kullanıcı/paket/1.990₺/MZN-F2T69/ONAYLA hepsi var; status `pending` kaldı, kota `{count:0, add:0}` aynı |
| 2 | Aynı token'la GET x10 (Safe Links simülasyonu) | ✅ | 10 GET sonrası status hâlâ `pending`, kota değişmedi — eski açık kanıtlı kapandı |
| 3 | Sayfadaki butondan POST → onay | ✅ | POST 200; status `approved`; `additional_queries: 0 → 750`; transaction `{amount:750, type:"purchase"}`; kullanıcı maili Resend id: `09d60eb2-068a-4986-8f71-38cdd1f73463` |
| 4 | Aynı token'la POST tekrar | ✅ | HTTP 400 (tek kullanımlık) |
| 5 | Geçersiz / süresi dolmuş token | ✅ | Geçersiz: GET 400 + POST 400. Süresi dolmuş (created_at −8 gün): GET 400 "Süresi Dolmuş" sayfası, POST 400, status `pending` kaldı, kota değişmedi |
| 6 | Reddet akışı | ✅ | GET reddet sonrası status `pending` (değişiklik yok); POST reddet 200 → `rejected`, kota değişmedi |
| 7 | Pro talebi admin maili (ayrı Resend id) | ✅ | MZN-F2T69 admin maili Resend id: `e4f827bb-a04f-49e3-8926-74cd76d89b52` |
| 8 | Mükerrer talep: aynı pakete 3 kez | ✅ | 3 yanıt: `MZN-F2T69/YENİ · MZN-F2T69/MEVCUT · MZN-F2T69/MEVCUT`; DB'de 1 pending talep; server.log'da bu referans için tek adminEmailId (tek mail) |
| 9 | credit_balance devri | ✅ | Sayım: 1 kullanıcı / 1000 kredi. Devir: `{credit_balance:1000, additional_queries:0}` → `{0, 1000}`. Migration 2. kez çalıştırıldı → değerler aynı kaldı (idempotent), devir transaction'ı 1 adet (`type:bonus, amount:1000, 'eski bakiye devri'`) |
| 10 | /kredi → /kredi-yukle | ✅ | HTTP 308, `Location: /kredi-yukle` |
| 11 | Regresyon: kota/arama/402 | ✅ | Chat 200 → kota 750→749; emsal arama 200 → kota aynı; kota 0 kullanıcı → 402 + `cta:/kredi-yukle` |
| 12 | type-check + build | ✅ | `tsc --noEmit` temiz; build başarılı (112/112 sayfa; lokalde `NODE_OPTIONS=--max-old-space-size=6144` gerekiyor — RAPOR.md Not-6) |

Test kullanıcıları (test-fix-*@mizanim.test) sonda silindi (auth admin DELETE, cascade).

## VARSAYIMLAR

- **Onay sayfası CSRF:** Ek CSRF token'ı eklenmedi — approval_token zaten 64 hex karakterlik, tek kullanımlık ve tahmin edilemez; form dışından POST atabilmek için token'ı bilmek gerekir (görev tanımındaki değerlendirmeyle uyumlu).
- **GET onayla ve GET reddet aynı sayfayı gösterir** (özet + ONAYLA + Reddet birlikte) — admin iki linkten hangisine tıklarsa tıklasın her iki işlemi de sayfadan seçebilir.
- **Devirde transaction tipi `bonus`:** `credit_transactions.type` CHECK kısıtı (`spend|purchase|bonus|refund`) `devir` değerine izin vermiyor; açıklama alanı spec'teki gibi `'eski bakiye devri'`.
- **Devredilen tek hesap bir test hesabıydı** (vatandas@mizanim.test, 1000 kredi) — gerçek kullanıcı verisi yok, yine de spec gereği migration yazıldı ve uygulandı (ileride prod'da tekrar çalıştırılabilir, idempotent).
- **/kredi yönlendirmesi 308 permanent** — iyzico callback'i `/kredi?success=1`'e döner; iyzico şu an devre dışı olduğundan sorun yaratmaz, iyzico açılınca callback hedefi güncellenmelidir.

## VERCEL'E ELLE EKLENECEK ENV

Aşağıdakileri Vercel panelinde (Production + Preview) tanımla:

| Değişken | Değer |
|----------|-------|
| `NEXT_PUBLIC_MIZANIM_IBAN` | `TR850015700000000102779497` |
| `NEXT_PUBLIC_MIZANIM_HESAP_ADI` | `Refik Seçgin` |
| `MIZANIM_ADMIN_EMAIL` | `refiksecginn@hotmail.com` |
| `CRON_SECRET` | `812da70b54a0c0b146298629e284a90a36ec90bcfd9b1419` |
| `APPROVAL_TOKEN_TTL_DAYS` | `7` |

⚠️ **CRON_SECRET eklenmezse** Vercel cron'u `/api/cron/odeme-hatirlatma`'ya yetkisiz istek atar, endpoint 401 döner ve aylık hatırlatmalar **sessizce hiç çalışmaz** — deploy sonrası cron loglarından ilk çalıştırmayı kontrol et.

## Değişen Dosyalar

- `src/app/api/odeme/onayla/route.ts`, `src/app/api/odeme/reddet/route.ts` — GET render-only + POST mutasyon
- `src/lib/odeme.ts` — validatePendingRequest, readTokenFromPost, TTL env'den
- `src/lib/odeme-sayfa.ts` — odemeOnayFormSayfasi (POST formlu onay sayfası)
- `src/lib/email/odeme.ts` — buton metinleri yeni akışa göre
- `src/app/api/odeme/talep/route.ts` — mükerrer pending engeli
- `src/app/kredi-yukle/KrediYukleClient.tsx` — "zaten bekleyen talep" banner'ı
- `next.config.mjs` — /kredi → /kredi-yukle (308)
- `supabase/migrations/014_credit_balance_devir.sql` — uygulandı (idempotent, DOWN yorumda)
- `.env.example`, `.env.local` — hesap adı Türkçe, APPROVAL_TOKEN_TTL_DAYS
- `scripts/e2e-deploy-fix-test.js` — bu raporun test script'i
