---
slug: abonelik-odeme-kosullari
baslik: Abonelik ve Ödeme Koşulları
versiyon: v1
yururlukTarihi: 2026-09-22
hedefKitle: tumu
zorunluOnay: false
---

# Abonelik ve Ödeme Koşulları

**Versiyon:** v1 · **Yürürlük tarihi:** 22.09.2026 · **Son güncelleme:** 22.09.2026

## 1. Paketler

Mizanım aşağıdaki abonelik planlarını sunar (güncel fiyatlar /fiyatlandirma sayfasında
gösterilir): **Başlangıç**, **Profesyonel**, **Büro** (aylık/yıllık ücretlendirme; yıllık
ödemede belirtilen oranda indirim uygulanır). Ayrıca abonelikten bağımsız, tek seferlik
**sorgu kontör paketleri** satılmaktadır.

## 2. Fiyat ve KDV

Sitede gösterilen fiyatlar Türk Lirası (₺) cinsindendir. [DOĞRULANACAK: gösterilen
fiyatların KDV dahil mi hariç mi olduğu, ödeme altyapısı kodunda (`iyzico/checkout`,
`lib/odeme.ts`) açıkça belirtilmemiştir; şirket kuruluşu ve fatura entegrasyonu
tamamlanınca netleştirilip bu maddeye ve fiyatlandırma sayfasına yazılacaktır.]

## 3. Yenileme

Abonelikler, iptal edilmediği sürece seçilen dönem sonunda (aylık/yıllık) **otomatik
olarak yenilenir** ve kayıtlı ödeme yöntemi üzerinden tahsilat yapılır. Yenilemeden
en az [DOĞRULANACAK: X gün] önce hatırlatma bildirimi gönderilir.

## 4. İptal

Kullanıcı, aboneliğini Ayarlar > Abonelik bölümünden dilediği zaman iptal edebilir.
İptal, cari dönem sonuna kadar hizmete erişimi etkilemez; bir sonraki dönem için
tahsilat yapılmaz.

## 5. İade

- Tacir/serbest meslek (avukat/büro) kullanıcılar için iade, Kullanım Koşulları (avukat)
  madde 9 ve işbu maddedeki koşullara tabidir; kural olarak kullanılmaya başlanmış
  dönem için iade yapılmaz, aksi Mizanım'ın takdirinde münferit olarak değerlendirilebilir.
- Tüketici sıfatındaki vatandaş kullanıcılar için cayma hakkı istisnası **Mesafeli Satış
  Sözleşmesi**'nde ayrıca düzenlenmiştir; bu belgedeki hükümler o düzenlemeyle çelişemez.

## 6. Kredi/Kota Sistemi

- Bazı işlemler (AI sorgu, dilekçe üretimi, belge analizi) abonelik planı dahilinde
  sınırlı/sınırsız kullanım veya ayrı **kredi (kontör)** tüketimi ile sunulur.
- Kullanılmayan kredi, aksi açıkça belirtilmedikçe **bir sonraki döneme devretmez** ve
  abonelik iptalinde/sona ermesinde iade edilmez [DOĞRULANACAK: kredi devretme/iade
  politikasının ürün kararı olarak netleştirilmesi gerekir].

## 7. Fiyat Değişikliği

Plan fiyatlarında yapılacak artış, mevcut abonelerin **cari dönem sonuna kadar** eski
fiyattan yararlanmasını etkilemez; yeni fiyat bir sonraki yenileme döneminde uygulanır
ve en az [DOĞRULANACAK: X gün] önceden bildirilir.

## 8. Ödeme Sağlayıcısı

Ödemeler **iyzico** altyapısı üzerinden, 3D Secure ile işlenir. Kart bilgileri
Mizanım sunucularında saklanmaz; iyzico'nun PCI-DSS uyumlu sistemlerinde işlenir.

## 9. Temerrüt

Ödemenin gerçekleşmemesi hâlinde hesap, ödeme tamamlanana kadar sınırlı erişime
alınabilir; kullanıcı içeriği bu süreçte silinmez.
