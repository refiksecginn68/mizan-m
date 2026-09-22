---
slug: cerez-politikasi
baslik: Çerez Politikası ve Rıza Banner Metinleri
versiyon: v1
yururlukTarihi: 2026-09-22
hedefKitle: tumu
zorunluOnay: false
---

# Çerez Politikası

**Versiyon:** v1 · **Yürürlük tarihi:** 22.09.2026 · **Son güncelleme:** 22.09.2026

## 1. Çerez Tablosu

| Çerez adı | Tür | Amaç | Süre | Taraf |
|---|---|---|---|---|
| `sb-access-token` / `sb-refresh-token` | Zorunlu | Oturum/kimlik doğrulama | Oturum + [DOĞRULANACAK: refresh süresi] | 1. taraf (Supabase Auth) |
| `mizanim_cerez_riza` | Zorunlu | Çerez rıza tercihinin hatırlanması | 1 yıl | 1. taraf |
| [DOĞRULANACAK: analitik çerez adı] | Analitik | Kullanım istatistiği | [DOĞRULANACAK] | 3. taraf [DOĞRULANACAK: sağlayıcı] |
| [DOĞRULANACAK: işlevsel çerez adı] | İşlevsel | Tema/dil tercihi | [DOĞRULANACAK] | 1. taraf |

> **Not:** Analitik/işlevsel çerez envanteri, `src/components/shared/CookieBanner.tsx`
> ve ilgili script yüklemeleri kod düzeyinde incelenip kesinleştirilmeden bu tablo
> tam sayılmaz — [DOĞRULANACAK] alanları Bölüm 2 uygulaması sırasında doldurulacaktır.

## 2. Rıza Öncesi Yükleme Yasağı

Zorunlu olmayan (analitik, işlevsel, pazarlama) çerez ve bunlara bağlı script'ler,
**kullanıcı rıza vermeden yüklenmez.** Bu, Bölüm 2 madde 4'te teknik olarak
doğrulanacaktır (rıza verilmeden sayfa yüklendiğinde ağ isteklerinde analitik çağrısı
bulunmaması).

## 3. Banner Metinleri

**Ana banner metni:**
> "Mizanım'ı kullanırken zorunlu çerezleri kullanırız. Deneyiminizi iyileştirmek için
> isteğe bağlı çerezlere de izin verebilirsiniz. Tercihlerinizi dilediğiniz zaman
> Ayarlar'dan değiştirebilirsiniz."

**Butonlar (görsel ağırlıkça eşit):**
- `[Reddet]` — yalnızca zorunlu çerezlerle devam edilir.
- `[Kabul Et]` — tüm çerezlere izin verilir.
- `[Ayarlar]` — kategori bazlı seçim ekranı açılır (zorunlu/işlevsel/analitik ayrı ayrı
  açılıp kapatılabilir; zorunlu çerezler her zaman açık ve devre dışı bırakılamaz olarak
  gösterilir).

## 4. Rıza Kaydının Saklanması ve Geri Alınması

Çerez tercihi, `mizanim_cerez_riza` çerezinde ve (giriş yapmış kullanıcılar için)
hesap ayarlarında saklanır; Ayarlar > Gizlilik bölümünden her zaman değiştirilebilir.

## 5. İlgili Metinler

Bu politika, Gizlilik Politikası madde 8 ile birlikte okunmalıdır.
