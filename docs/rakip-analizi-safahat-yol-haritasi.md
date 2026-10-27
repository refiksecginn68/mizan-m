# safahat.ai Rakip Analizi — Boşluk Matrisi ve Yol Haritası

**Tarih:** 2026-10-26
**Kapsam:** safahat.ai'nin public (WordPress pazarlama) sitesinden çıkarılan özellik/altyapı iddiaları ile Mizanım'ın mevcut kod tabanının karşılaştırılması. safahat'a gerçek erişim (demo/eklenti dosyası) yoktu — analiz tamamen public kaynaklar + kendi kod taramamıza dayanıyor.

## Metodoloji ve kısıtlar

- safahat.ai public sitesi WordPress/Elementor pazarlama sitesidir (REA ile teknik tarama yapıldı: wp-content, nexsas tema, Elementor 4.2.4, Contact Form 7; dinamik trafiğin tamamı GA4/Clarity/GTM'e gidiyor, kendi API'sine tek bir çağrı yok). Gerçek ürün (web app + muhtemelen tarayıcı eklentisi) demo/satış duvarının arkasında — teknik mekanizma (UYAP'a nasıl bağlanıyor, hangi LLM, gerçek performans) public olarak doğrulanamaz.
- Bu nedenle safahat tarafındaki her madde kaynak sayfasıyla birlikte **[ÖZELLİK İDDİASI]** (net iş akışı tanımı var) veya **[PAZARLAMA LAFI]** (rakamsal/mekanizma kanıtı yok) olarak etiketlendi.
- Mizanım tarafı doğrudan kod taramasından; her madde dosya yoluyla destekli.

---

## 1) Örtüşen alanlar (safahat iddia ediyor, Mizanım'da zaten var)

| safahat iddiası | Mizanım karşılığı |
|---|---|
| UYAP dosya/safahat/evrak senkronu | `apps/extension/content.js` (DOM scraping + "A1 Derin Tarama Motoru") + `src/app/api/extension/aktar/route.ts` |
| UETS 7/24 tebligat + 5 gün kuralı | `apps/extension/uets-content.js` + `src/app/api/buro/tebligat/*`, `api/cron/tebligat-hatirlatma` (commit `3565bd8`) |
| Dilekçe hazırlama (AI) | `buro/dilekce` — soru-cevap + RAG + PDF/Word/**UDF** export |
| Doküman özetleme | `buro/medya/analyze` — Claude vision, kırmızı/sarı/mavi kategori analizi |
| Kurumsal Hafıza (AI asistan) | `buro/mizanai` — tool-use + RAG + canlı CRM verisi |
| Emsal/içtihat arama | `buro/emsal` + Python Bedesten proxy servisi (gerçek resmi API) |

**Sonuç:** safahat'ın 6 ana pazarlanan özelliğinden 5'i Mizanım'da zaten var, çoğu zaman daha derin. Bu alanda yeni geliştirme gerekmiyor, konsolidasyon/pazarlama dili güncellemesi yeterli.

## 2) Gerçek boşluklar (safahat iddia ediyor, Mizanım'da yok)

| Eksik | Kaynak (safahat) | Mizanım durumu | Öncelik |
|---|---|---|---|
| İcra/tahsilat otomasyonu (89/1 ihbarname, maaş haczi cevabı, otomatik haciz talebi) | /ozelliklerimiz/, ana sayfa ("%78 tahsilat oranı" — [PAZARLAMA LAFI]) | `buro/finans`'ta sadece takip var, otomatik evrak üretimi yok | **Yüksek** |
| On-premise kurulum seçeneği | /demo-talep-et/, /nasil-calisir/ | Saf bulut/SaaS (Supabase), on-premise mimarisi yok | Düşük/orta — talep doğrulanmadan yatırım yapılmamalı |
| Müvekkil entity resolution (aynı kişinin farklı yazımlarını birleştirme) | /nasil-calisir/ adım 4 | `buro/muvekkiller` CRM'de dedup/normalizasyon yok | Orta |
| THH'ye özel toplu otomasyon | /ozelliklerimiz/ | Genel dilekçe akışı var, THH'ye özel toplu işlem yok | Orta |
| KEP entegrasyonu | /entegrasyonlar/ | Kodda hiç iz yok | Orta (THH ile birlikte) |

## 3) Mizanım'ın safahat'a göre avantajları (pazarlamada kullanılmalı)

- UDF export (UYAP resmi format) — safahat hiç bahsetmiyor.
- Manuel IBAN havale + admin onay akışı — Türkiye pazarına özel pragmatik ödeme yolu.
- TCMB döviz kuru + hukuki hesaplama araçları (`buro/hesaplama`).
- Ses/video/ekran görüntüsü delil analizi (Whisper + Claude vision) — safahat'ın "doküman özeti"nden daha geniş.
- Tool-use yapan AI asistan (gerçek fonksiyon çağırma: takvim, dilekçe başlatma, dava detayı).

## 4) Rakipten bağımsız, kendi içindeki riskler (satıştan önce kritik)

1. **`api/vatandas/uyap/sorgula`, `api/buro/uyap/sorgula`, `api/buro/muvekkil/vekalet`** — hâlâ tamamen sahte veri döndürüyor (`demoData`, `buildDemoData`, `mockBelgeler`). Kod yorumu: *"sertifika yüklendiğinde aktive edilecek"*. Vatandaş tarafında kullanıcıya sahte UYAP verisi gösterme riski.
2. **`api/mevzuat/search`, `api/haberler`** — harici kaynağa erişilemezse kullanıcı fark etmeden demo içerik görüyor (sessiz fallback).
3. **OpenRouter/GLM entegrasyonu** — tanımlı, hiç kullanılmıyor, ölü kod.
4. **Tauri masaüstü** — iskelet seviyesinde, `identifier: "com.tauri.dev"` prod'a hazır değil.
5. **Eklenti DOM seçicileri** — UYAP arayüz güncellemesinde kırılma riski kabul edilmiş, izleme/alarm mekanizması yok.

---

## Önerilen Fazlar

### Faz 0 — Sahte veriyi temizle / şeffaflaştır
En yüksek risk, en düşük efor. Vatandaş/avukat UYAP sorgula uçlarındaki demo veriyi UI'da açıkça işaretle veya eklenti tabanlı gerçek veriyle değiştir. Mevzuat/haberler fallback'lerinde aynı şeffaflık. **Satış öncesi mutlaka kapatılmalı** — gerçek müşteri sahte UYAP verisiyle karşılaşmamalı.

### Faz 1 — İcra/Tahsilat Otomasyon Modülü
safahat'ın en somut ve iddialı farkı. `buro/finans` üzerine inşa: otomatik 89/1 ihbarname üretimi, maaş haczi cevap şablonu, haciz talebi taslağı. Mevcut dilekçe/UDF export altyapısı (`api/buro/dilekce/export-udf`, `src/lib/services/belge-uret.ts`) yeniden kullanılabilir.

### Faz 2 — THH toplu otomasyon + KEP entegrasyonu
THH'ye özel toplu dosya işleme + KEP ile gönderim. Mevcut dilekçe-RAG altyapısı THH cevap dilekçesi şablonuna genişletilebilir.

### Faz 3 — Müvekkil entity resolution
`buro/muvekkiller` CRM'e isim/unvan normalizasyon + dedup katmanı.

### Faz 4 (talep doğrulanırsa) — On-premise dağıtım seçeneği
Büyük mühendislik yatırımı gerektirir. Önce 1-2 kurumsal müşteri talebiyle doğrulanmadan başlanmamalı.

---

## Durum

Analiz tamamlandı, fazlar onaylandı. **Proje burada durduruldu** — fazlara geçiş, Mizanım'ın satışa çıkmadan önceki büyük güncelleme çalışmasıyla birlikte ayrı bir oturumda ele alınacak.
