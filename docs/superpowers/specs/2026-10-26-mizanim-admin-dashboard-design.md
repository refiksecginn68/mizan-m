# Mizanım Bağımsız Admin Dashboard — Tasarım Dökümanı

Tarih: 2026-10-26
Durum: Onaylandı (uygulamaya geçildi)

## Bağlam

Mizanım şu ana kadar üyelik/ödeme verisini salt okunur bir endpoint
(`/api/crm/uyelikler`) ve e-posta bildirimleriyle DravoxAI CRM'e
(`crm.dravoxai.com`) besliyordu. DravoxAI bir **şirket** CRM'i (kariyer ajan vb.
diğer ürünlerle ortak); Mizanım ise bağımsız bir **SaaS ürünü**. İki katmanın
verisi birbirine karışmasın diye karar: DravoxAI CRM bağlantısı **tamamen
sökülür**, Mizanım kendi `/admin` paneli içinde **tam kapsamlı, gerçek verili bir
dashboard**'a kavuşur. SaaS büyüdükçe üye/ödeme/kullanım/kota/gelir-gider/API
maliyeti tek yerden net görünür.

Kararlar (kullanıcı onayı):
- API maliyeti için **sorgu başı maliyet logu şimdi kurulur** (gerçek rakam).
- UI: **shadcn CLI + Recharts** (harici MCP yok).
- CRM sökümü: **kod+env kaldırılır, veri akışı durur, prod DB güvenli bırakılır**.
- Mevcut 3 sayfa (Özet/Üyeler/Ödemeler) **yerinde yeniden tasarlanır + genişletilir**.

## 1. CRM Sökümü

- Silinir: `src/app/api/crm/uyelikler/route.ts`, `src/lib/email/crm.ts`,
  `src/app/api/cron/crm-deneme-bitiyor/route.ts`.
- `sendCrm*` çağrıları temizlenir (iş mantığı korunur): `admin/odeme/onayla`,
  `odeme/onayla`, `payment/iyzico/callback`, `auth/register`.
- `.env.example`'dan `CRM_READONLY_TOKEN`, `CRM_NOTIFICATION_EMAIL`,
  `CRM_EMAIL_FROM` çıkar; Vercel'den `CRM_READONLY_TOKEN` silinir; cron tanımı
  (varsa `vercel.json`) temizlenir.
- Migration (041): CRM readonly erişimi/izinleri etkisizleştir. `crm_bildirim_log`
  tablosu DÜŞÜRÜLMEZ — geçmiş korunur, geri dönülebilir.

## 2. Veri Katmanı (migration 040)

- Yeni tablo `ai_usage_log`: `id, user_id (nullable), created_at, surface,
  provider, model, input_tokens, output_tokens, cost_usd, cost_try`.
- Yeni RPC'ler (`SECURITY DEFINER` + `_admin_dogrula()`):
  - `admin_gelir_gider(p_ay_sayisi int)` — aylık gelir (payment_requests.approved)
    vs gider (ai_usage_log.cost_try toplamı).
  - `admin_api_maliyet(p_gun_sayisi int)` — surface/model kırılımı + zaman serisi.
  - `admin_kullanim_trend(p_gun_sayisi int)` — günlük sorgu adedi.
  - `admin_kota_durum()` — paket bazında kota doluluk dağılımı.
  - `admin_ozet` genişletilir: gerçek gider + net.

## 3. AI Maliyet Enstrümantasyonu

- `src/lib/ai/usage-log.ts`: `logAiUsage({surface, provider, model, usage})`.
  Fiyat haritası (model → $/1M in/out) kod sabiti; `cost_usd` hesaplanır,
  `cost_try` sabit/az-değişen kurla çarpılır (`USD_TRY` env, fallback sabit).
  Service-role client ile yazar; fire-and-forget (ana akışı bozmaz/yavaşlatmaz).
- Enjekte edilen yollar: `chat`, `buro/dilekce/generate`, `buro/dilekce/sorular`,
  `emsal/search`, `buro/medya/analyze`, `speech/transcribe`, `ai/embed`.

## 4. Dashboard UI

- `/admin` yerinde yeniden tasarlanır. Sekmeler: Özet · Üyeler · Ödemeler ·
  Kullanım · Gelir-Gider · API Maliyeti.
- shadcn bileşenleri kurulur: `card, table, chart, badge, tabs, select`; `recharts`.
- Grafikler: gelir-gider (bar/line), API maliyeti (surface bazında stacked area),
  kullanım trend (line), kota doluluk (donut). `dataviz` ilkeleriyle tutarlı palet.
- Özet: KPI kartları (üye kırılımı, bu ay gelir/gider/net, bugünkü API maliyeti,
  onay bekleyen) + mini trendler.

## 5. Güvenlik

Yeni RPC'ler `_admin_dogrula()` ile korunur; içerik tablolarına grant verilmez.
Gizlilik duruşu korunur (dosya/sohbet/evrak içeriği admin'e açılmaz). Maliyet logu
yazımı service-role; okuma yalnızca admin RPC'si üzerinden.

## 6. Doğrulama

- `npm run type-check && npm run build` temiz.
- `/admin` admin kullanıcıyla açılır; her sekme gerçek veri gösterir.
- `/api/crm/uyelikler` kaldırılmış (404).
- Birkaç AI çağrısı sonrası `ai_usage_log` dolar ve API Maliyeti sekmesine yansır.

## Uygulama Sırası

1. CRM sökümü (kod + env + migration 041 revoke)
2. Migration 040 (ai_usage_log + RPC'ler + admin_ozet genişletme)
3. AI maliyet helper + ana yollara enjeksiyon
4. shadcn/recharts kurulum + dashboard UI (sekmeler + grafikler)
5. Doğrulama (type-check + build + canlı kontrol)
