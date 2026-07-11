# RAPOR — Kredi/Ödeme Sistemi + Fiyatlandırma (Gece Görevi)

Tarih: 2026-07-11 · Branch: main · Testler: localhost:3000 dev sunucusu + gerçek Supabase + gerçek Resend

## Kabul Kriterleri

| # | Kriter | Durum | Kanıt |
|---|--------|-------|-------|
| 1 | Test kullanıcı → Pro seç → pending payment_request + referans kodu | ✅ | `POST /api/odeme/talep` → HTTP 200, `referenceCode: MZN-NEGCA`, DB satırı: `{package_code:"pro", amount_try:1990, status:"pending"}` |
| 2 | Admin maili gönderildi (Resend id) + geçerli ONAYLA linki | ✅ | `adminNotified:true`; örnek Resend id: `28619fb5-0b75-462b-b51e-9252fd8759be` (kontör talebi); ONAYLA linki K3'te çalıştırıldı ve işledi |
| 3 | ONAYLA → approved, +750 additional_queries, transaction, kullanıcı maili | ✅ | HTTP 200; `additional_queries: 0 → 750`; transaction: `{amount:750, type:"purchase", payment_request_id:"b42f09b4-..."}`; token tekrar kullanımı → HTTP 400 (tek kullanımlık) |
| 4 | AI sohbet → kota 1 düştü; ham arama → kota değişmedi | ✅ | `/api/chat` 200 → `additional_queries: 750 → 749`; `/api/emsal/search` 200 → kota değişmedi (`kotaDegisti:false`) |
| 5 | Kota 0 → AI 402 + CTA; ham arama 200 | ✅ | Chat HTTP 402, gövde: `{code:"quota_exhausted", cta:{href:"/kredi-yukle"}}`; ham arama HTTP 200 |
| 6 | Max onayı → uyap_uets_active=true; Pro'da false | ✅ | Pro onayı sonrası `uyap_uets_active:false`; Max onayı (MZN-T3LRV) sonrası `true`. Eklenti token: Max aktif → 200+token; flag=false → 403 `max_required` |
| 7 | Reminder cron → mail gitti + next_reminder_at +30 gün | ✅ | Vade düne çekildi → cron HTTP 200, `emailId: faf01ddc-658a-46e2-bdd7-6c1bc9959385`, yeni talep `MZN-VY6KB`; vade `2026-07-10 → 2026-08-09` (+30 gün); yetkisiz istek → 401 |
| 8 | Deneme hesabı additional_queries=100000 | ✅ | `{email:"refiksecginn@gmail.com", additional_queries:100000, uyap_uets_active:true}` + `credit_transactions` bonus kaydı (id: 499c750e-...) |
| 9 | /fiyatlandirma 200, 4 kart doğru fiyat/kota, Büro=iletişim, kontör görünür | ✅ | HTTP 200; içerikte: 299₺, 1.990₺, 3.990₺, "Fiyat Alınız", "İletişime Geçin", "100 Sorgu Kontör" 300₺, "500 Sorgu Kontör" 1.300₺, havale/EFT notu |
| 10 | RLS: yabancı payment_request/approval_token sızmıyor | ✅ | B kullanıcısı `payment_requests` sorgusunda 0 satır gördü; `select=approval_token` → HTTP 403 (kolon bazlı GRANT); `credit_transactions`'ta yalnız kendi satırları |

Ek doğrulamalar:
- `/api/odeme/reddet` → HTTP 200, DB `status:"rejected"` + kullanıcıya bilgi maili.
- `/kredi-yukle` → HTTP 200 (paketler + kontör + "Havale ile Öde" görünür).
- `/buro/ayarlar/uyap` → Max aktifken kurulum adımları; flag kapalıyken "Max Paketine Geç" kilit ekranı.
- `npm run type-check` temiz; `npm run build` başarılı (bkz. NOTLAR-6).
- Test kullanıcıları ve test verileri temizlendi (auth admin DELETE, cascade).

## NOTLAR (varsayımlar + temkinli kararlar)

1. **Migration adı 013:** Görevde `011_credit_system.sql` deniyordu ama `011_hybrid_search.sql` ve `012_incremental_embeddings.sql` zaten mevcuttu; çakışmamak için `013_credit_system.sql` kullanıldı. Migration DB'ye uygulandı ve dosya sonunda DOWN (geri alma) adımları yorum olarak mevcut.
2. **credit_transactions yeniden yaratılmadı:** Tablo migration 001'den beri var ve `spend_credits/add_credits` ona yazıyor. Şemadaki `delta_queries/reason` yerine mevcut `amount/description` kolonları kullanıldı; yalnızca `payment_request_id` kolonu eklendi.
3. **spend_queries davranış değişikliği:** Eski fonksiyon kontörü kalıcı düşmüyordu (ay dönümünde sayaç sıfırlanınca harcanmış kontör geri geliyordu) ve sadece avukatta çalışıyordu. Yeni sürüm: önce aylık kota, bitince `additional_queries` kalıcı düşer; vatandaş da kapsandı; her harcama `credit_transactions`'a `-1` yazar. `refund_queries` eklendi (başarısız AI çağrısı iade).
4. **Vatandaş kredi sistemi değişimi:** `/api/chat` ve `/api/generate/dilekce` artık `spend_credits` (1-10 değişken kredi) yerine ortak 1-kota guard kullanıyor ("hepsi 1" kuralı). Eski `credit_balance` bakiyeleri dokunulmadan duruyor ama artık AI çağrılarında **kullanılmıyor** — mevcut vatandaş kullanıcıların kotası 0 olduğundan paket alana kadar AI 402 alır. Bilinçli spec kararı; gerekirse eski bakiye kotaya çevrilebilir.
5. **Deneme hesabı:** Görevde `refiksecginn@hotmail.com` yazıyordu ama bu adresle kayıtlı profil YOK. Krediler, kullanıcının "deneme hesabım" dediği `refiksecginn@gmail.com` (avukat profili) hesabına tanımlandı. Hotmail adresi yalnız admin bildirim adresi olarak kullanılıyor (`MIZANIM_ADMIN_EMAIL`).
6. **Build bellek:** `npm run build` varsayılan heap ile OOM verdi (bu görevden bağımsız, proje büyüklüğü); `NODE_OPTIONS=--max-old-space-size=6144` ile temiz geçti. Vercel'de sorun beklenmez; lokalde gerekirse package.json build script'ine eklenebilir.
7. **CRON_SECRET boştu:** `.env.local`'e rastgele 48 karakterlik değer üretildi. **Vercel production env'e de eklenmeli** (Vercel cron istekleri `Authorization: Bearer $CRON_SECRET` ile gelir). Cron `vercel.json`'a eklendi: her gün 06:00 UTC.
8. **Hesap adı varsayımı:** `NEXT_PUBLIC_MIZANIM_HESAP_ADI="Refik Secgin"` yazıldı (profildeki isimden). Banka hesabındaki resmi ad farklıysa `.env.local` + Vercel env'de düzeltin. IBAN görevdeki gibi: `TR850015700000000102779497`.
9. **Cron'da admin maili:** Aylık hatırlatmada kullanıcıya mail + yeni pending talep oluşturuluyor; admin de aynı anda ONAYLA linkli mail alıyor (para hesaba düşünce tek tık onay için). Kullanıcı başına ayda 1 admin maili demek — spam olursa cron'daki `sendAdminPaymentRequestEmail` çağrısı kaldırılabilir.
10. **Onay token süresi:** 7 gün (`APPROVAL_TOKEN_TTL_DAYS`). Süresi dolan link hata sayfası gösterir, talep pending kalır.
11. **Eski paketler silinmedi:** `code IS NULL` olan eski paketler (`Başlangıç`, `Popüler`, `100 Sorgu Ek Paketi` ₺250, `Pro` ₺379) `is_active=false` yapıldı — /kredi ve /kredi-yukle listelerinde görünmezler, veri duruyor.
12. **/kredi sayfası (eski iyzico akışı) dokunulmadı:** Vatandaş tarafında artık aktif 'credit' paketi kalmadığı için paket listesi boş görünür; yeni akış `/kredi-yukle`. 402 CTA'ları `/kredi-yukle`'ye yönlendiriyor. İleride /kredi → /kredi-yukle yönlendirmesi düşünülebilir (kapsam dışı bırakıldı).
13. **Fiyatlandırmada aylık/yıllık toggle kaldırıldı:** Spec yalnız aylık havale fiyatı tanımlıyor; uydurma yıllık indirim fiyatı göstermemek için kaldırıldı. "En Popüler" rozeti spec'e uygun olarak Max'ten Pro'ya taşındı.
14. **Reminder mail adresi:** Test kullanıcı adresleri `.test` uzantılı olduğundan Resend id döndü ama gerçek teslimat yok (beklenen). Gerçek kullanıcılarda sorun yok.

## Değişen Dosyalar

**Yeni:**
- `supabase/migrations/013_credit_system.sql` — paket kolonları+seed, payment_requests, payment_reminders, RLS + kolon bazlı GRANT, spend_queries v2, refund_queries, profiles.uyap_uets_active
- `src/lib/quota.ts` — checkAndConsumeQuota / refundQuota / QUOTA_EXHAUSTED_BODY
- `src/lib/odeme.ts` — referans kodu (MZN-XXXXX) + approval_token üretimi, createPaymentRequest
- `src/lib/odeme-sayfa.ts` — onay/red sonuç HTML sayfaları
- `src/lib/email/odeme.ts` — Resend şablonları (admin talep, onay, red, hatırlatma)
- `src/app/api/odeme/talep/route.ts`, `src/app/api/odeme/onayla/route.ts`, `src/app/api/odeme/reddet/route.ts`, `src/app/api/odeme/hatirlatma-iptal/route.ts`
- `src/app/api/cron/odeme-hatirlatma/route.ts`
- `src/app/kredi-yukle/page.tsx` + `KrediYukleClient.tsx`
- `src/app/buro/ayarlar/uyap/page.tsx`
- `scripts/e2e-odeme-test.js` — uçtan uca test script'i (tekrar çalıştırılabilir)

**Güncellenen:**
- `src/app/api/chat/route.ts`, `src/app/api/generate/dilekce/route.ts`, `src/app/api/buro/dilekce/generate/route.ts`, `src/app/api/buro/medya/analyze/route.ts`, `src/app/api/buro/mizanai/route.ts` — ortak kota guard + başarısızlıkta iade
- `src/app/api/extension/token/route.ts` — uyap_uets_active (Max) kapısı
- `src/app/fiyatlandirma/page.tsx` — yeni fiyatlar/kotalar, kontör bölümü, havale notu
- `vercel.json` — günlük cron
- `.env.example`, `.env.local` — IBAN, hesap adı, admin e-posta, CRON_SECRET

**DB (kod dışı):**
- Migration 013 uygulandı; deneme hesabına 100000 kota + uyap_uets_active=true + bonus transaction.
