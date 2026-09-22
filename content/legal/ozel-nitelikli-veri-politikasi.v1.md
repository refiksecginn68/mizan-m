---
slug: ozel-nitelikli-veri-politikasi
baslik: Özel Nitelikli Kişisel Veri Politikası
versiyon: v1
yururlukTarihi: 2026-09-22
hedefKitle: avukat
zorunluOnay: false
---

# Özel Nitelikli Kişisel Veri Politikası

**Versiyon:** v1 · **Yürürlük tarihi:** 22.09.2026 · **Son güncelleme:** 22.09.2026

## 1. Kapsam

Bu politika, Mizanım'ın avukat kullanıcılar tarafından UYAP'tan aktarılan veya
Platforma yüklenen **ceza dosyaları, adli sicil kayıtları ve adli/sağlık raporları**
gibi KVKK m.6 kapsamındaki özel nitelikli kişisel verilere ilişkin aldığı tedbirleri
açıklar. Dayanak: Kişisel Verileri Koruma Kurulu'nun **31.01.2018 tarihli ve 2018/10
sayılı** "Özel Nitelikli Kişisel Verilerin İşlenmesinde Veri Sorumlularınca Alınması
Gereken Yeterli Önlemler" kararı [DOĞRULANACAK: karar tarih/sayısı ikinci kez teyit
edilmeli].

## 2. Erişim Yetkisi

Özel nitelikli veri içeren kayıtlara erişim, **isimlendirilmiş ve görev tanımı ile
sınırlı** personelle kısıtlıdır. Rol bazlı erişim kontrolü uygulanır; yetkisiz personel
bu verilere erişemez.

## 3. Erişim Logu ve Personel Taahhüdü

Özel nitelikli veriye her erişim loglanır (kim, ne zaman, hangi kayıt). Erişim yetkisi
olan personel, gizlilik taahhütnamesi imzalar ve KVKK farkındalık eğitiminden geçer.

## 4. Şifreleme

Aktarım sırasında (TLS 1.2+) ve istirahat hâlinde (veritabanı düzeyinde şifreleme)
şifreleme uygulanır. [DOĞRULANACAK: Supabase'in istirahat şifreleme (encryption at rest)
uygulaması ve anahtar yönetimi teyit edilmeli.]

## 5. Fiziksel/Teknik Tedbirler

Bulut altyapı sağlayıcılarının (Supabase, Vercel) endüstri standardı fiziksel güvenlik
sertifikaları esas alınır [DOĞRULANACAK: sağlayıcı sertifikaları — ISO 27001 vb.].
Uygulama katmanında güvenlik duvarı, saldırı tespiti ve düzenli güvenlik güncellemeleri
uygulanır.

## 6. Yapay Zekâ Analizinde Varsayılan Kapalı Onay

> ⚠ **Ceza dosyası, adli sicil kaydı veya adli/sağlık raporu olarak işaretli evraklarda
> yapay zekâ analizi (özetleme, risk tespiti, dilekçe girdisi) VARSAYILAN OLARAK
> KAPALIDIR.** Kullanıcı, her bir evrak veya dosya için ayrı ayrı, açık rıza vererek
> bu analizi etkinleştirmedikçe AI işlemi tetiklenmez (bkz. Açık Rıza Metni madde 1).

## 7. İmha

Özel nitelikli veriler, genel Saklama ve İmha Politikası'ndaki kullanıcı içeriği
kurallarına tabidir: hesap silme talebinde derhal imha edilir. Ayrıca, dosya/dava
kapatıldıktan sonra kullanıcı tarafından manuel silme talep edilebilir.

## 8. Ceza Mahkûmiyeti ve Sağlık Verisi İçin Ek Tedbirler

- Ceza mahkûmiyeti/güvenlik tedbiri verileri yalnızca ilgili dava dosyasıyla
  ilişkilendirilmiş şekilde tutulur; ayrı bir "sicil profili" oluşturulmaz.
- Sağlık/adli rapor verileri, AI analizine gönderilmeden önce maskeleme katmanından
  geçirilir (metin tabanlı ise); ham hâliyle üçüncü sağlayıcıya iletilmez.

## 9. İlgili Diğer Metinler

Veri İşleme Sözleşmesi (DPA) madde 6, Saklama ve İmha Politikası, Açık Rıza Metni
madde 1, Maskeleme Katmanı (Bölüm 3) ile birlikte okunmalıdır.
