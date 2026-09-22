---
slug: saklama-imha-politikasi
baslik: Saklama ve İmha Politikası
versiyon: v1
yururlukTarihi: 2026-09-22
hedefKitle: tumu
zorunluOnay: false
---

# Saklama ve İmha Politikası

**Versiyon:** v1 · **Yürürlük tarihi:** 22.09.2026 · **Son güncelleme:** 22.09.2026

Bu politika, 6698 sayılı KVKK ve Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim
Hâle Getirilmesi Hakkında Yönetmelik uyarınca hazırlanmıştır. Buradaki süreler, Gizlilik
Politikası ve KVKK Aydınlatma Metinleri ile aynıdır; çelişki hâlinde bu belge esas alınır.

## 1. Saklama Süreleri Tablosu

| Veri kategorisi | Saklama süresi | Kanuni dayanak |
|---|---|---|
| Kullanıcı içeriği (dava dosyası, evrak, delil, transkript, AI analiz çıktısı, medya) | Hesap aktifken süresiz; hesap silme talebinde **derhal** imha, yedeklerden [DOĞRULANACAK: Supabase yedek saklama süresi] içinde temizlenir | Sözleşmenin ifası, KVKK m.7 |
| Fatura ve ödeme kayıtları | 5 yıl | VUK m.219, m.253 |
| Ticari defter ve sözleşme kayıtları | 10 yıl | TTK m.82 |
| Erişim/trafik logu | 6 ay – 2 yıl arası [DOĞRULANACAK: yürürlükteki yönetmelik süresi] | 5651 sayılı Kanun m.6/1-b |
| Sözleşme onay/rıza kayıtları (versiyon, zaman, IP, UA) | 10 yıl | TBK m.146 (genel zamanaşımı, ispat amacı) |
| İlgili kişi başvuru kayıtları | En az 3 yıl [DOĞRULANACAK] | Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ |
| Ticari elektronik ileti onay/red kayıtları | İYS'de tutulduğu sürece | 6563 sayılı Kanun |

## 2. "Derhal İmha" Ne Anlama Gelir

Hesap silme talebi onaylandığında:

1. Kullanıcı içeriği (dosya, taraf, safahat, evrak, delil, transkript, analiz, medya)
   üretim veritabanından **derhal** silinir.
2. Otomatik yedeklerden (günlük/haftalık yedekleme rotasyonu) tamamen temizlenme süresi
   [DOĞRULANACAK: Supabase yedekleme rotasyon politikası — gerçek süre teyit edilip bu
   belgeye ve kullanıcıya yapılacak bildirime yazılacaktır]. Bu süre boyunca yedekteki
   veri yalnızca felaket kurtarma amacıyla erişilebilir durumda tutulur, aktif olarak
   işlenmez.
3. Kanuni saklama yükümlülüğü bulunan kayıtlar (fatura/ödeme, log, onay kaydı) yukarıdaki
   tablodaki süreler kadar, **mümkün olduğunca kullanıcı kimliğinden ilişkisizleştirilmiş
   veya sınırlı erişimli** şekilde saklanmaya devam eder.

## 3. Periyodik İmha

Saklama süresi dolan veriler için **yılda en az 2 kez (6 ayı geçmeyen aralıklarla)**
otomatik periyodik imha işlemi çalıştırılır (bkz. Bölüm 2 — Teknik Uygulama madde 7).
Her çalıştırmada: hangi kategoriden kaç kayıt imha edildiği loglanır.

## 4. İmha Yöntemleri

| Veri | Yöntem |
|---|---|
| Veritabanı kayıtları (yapılandırılmış) | Kalıcı silme (DELETE) |
| Dosya depolama (storage) | Kalıcı silme + üzerine yazma |
| İstatistiksel/analitik amaçlı tutulması gereken veri | Anonim hâle getirme (geri döndürülemez şekilde kimlikten arındırma) |
| Log kayıtları (süre dolduğunda) | Kalıcı silme |

## 5. Sorumluluk

İmha süreçlerinin işletilmesinden [DOĞRULANACAK: şirket kuruluşu sonrası atanacak Veri
Sorumlusu Temsilcisi / teknik sorumlu] sorumludur.
