---
slug: gizlilik-politikasi
baslik: Gizlilik Politikası
versiyon: v1
yururlukTarihi: 2026-09-22
hedefKitle: tumu
zorunluOnay: true
---

# Gizlilik Politikası

**Versiyon:** v1 · **Yürürlük tarihi:** 22.09.2026 · **Son güncelleme:** 22.09.2026

Bu politika, mizanim.com, /buro ve /panel panelleri ile Mizanım tarayıcı eklentisinin
işlediği verileri, amaçlarını, paylaşım koşullarını ve saklama sürelerini açıklar. Bu metin,
KVKK Aydınlatma Metinleri (avukat/vatandaş) ile çelişmeyecek şekilde hazırlanmıştır; hukuki
sebep ve alıcı grubu detayları için ilgili aydınlatma metnine bakınız.

## 1. Hangi Veriler İşlenir

| Kategori | Örnekler | Kaynak |
|---|---|---|
| Kimlik/iletişim | ad-soyad, e-posta, telefon, baro sicil no | Kullanıcının kendisi |
| Hesap/işlem | abonelik, kredi bakiyesi, ödeme referansı | Sistem |
| Hizmet içeriği | dosya, evrak, dilekçe, ses/görüntü kaydı, sohbet mesajı | Kullanıcı yüklemesi / UYAP-UETS aktarımı |
| Üçüncü kişi verisi | müvekkil, karşı taraf, tanık, bilirkişi ad-soyad, TCKN, dosya no | UYAP'tan çekilen dosya içeriği |
| Özel nitelikli veri | ceza dosyası, adli sicil, adli/sağlık raporu içeriği | UYAP evrakı / kullanıcı yüklemesi |
| Teknik veri | IP, tarayıcı bilgisi, oturum/güvenlik logu, çerezler | Otomatik toplama |

## 2. Amaç

Hizmetin sunulması ve geliştirilmesi, hesap güvenliği, ödeme işlemleri, AI destekli analiz/
dilekçe üretimi, yasal yükümlülüklerin yerine getirilmesi, müşteri desteği. Ayrıntılı hukuki
sebep eşlemesi için KVKK Aydınlatma Metni madde 3'e bakınız.

## 3. Kimlerle Paylaşılır

- **Alt işleyenler** (barındırma, veritabanı, AI analiz sağlayıcıları) — bkz. Alt İşleyen
  Listesi. Bu sağlayıcılara giden metin tabanlı içerik, mümkün olduğu ölçüde **maskeleme
  katmanından** geçirilerek kimliği belirleyici bilgiler çıkarılmış hâlde iletilir
  (bkz. madde 5 ve Yurt Dışına Aktarım Bildirimi).
- **Ödeme kuruluşu** (iyzico) — yalnızca ödeme işlemi için, kart bilgisi Mizanım'da saklanmaz.
- **Yetkili kamu kurumları** — yasal talep hâlinde, talebin hukuki dayanağı doğrulanarak.
- Kullanıcının hizmet içeriği (dava dosyası, evrak) **hiçbir şekilde pazarlama amacıyla
  üçüncü kişilerle paylaşılmaz veya satılmaz.**

## 4. Yurt Dışına Aktarım

Alt işleyenlerin bir kısmı yurt dışında konumludur. Bu aktarım KVKK m.9 kapsamında
değerlendirilir; ayrıntı ve dayanak için **Yurt Dışına Aktarım Bildirimi** belgesine bakınız.

## 5. Maskeleme (Veri Azaltma) Uygulaması

Metin tabanlı AI analizlerinde (Anthropic, Cohere), gönderilmeden önce ad-soyad, TCKN, VKN,
IBAN, telefon, e-posta, adres, dosya/esas numarası gibi doğrudan/dolaylı kimlik belirleyici
alanlar tespit edilip takma değerle değiştirilir; AI'dan dönen cevapta gerçek değerlerle
geri doldurulur. Ses/görüntü/video analizinde (fal.ai) ham medya maskelenemez; bu durum
kullanıcıya ayrıca ve açıkça bildirilir, ayrı onay alınır (bkz. Açık Rıza Metni madde 3).

## 6. Saklama Süreleri

Ayrıntılı tablo için **Saklama ve İmha Politikası** belgesine bakınız. Özet:

- Kullanıcı içeriği: hesap silinince derhal imha, yedeklerden [DOĞRULANACAK: Supabase yedek
  saklama süresi] içinde temizlenir.
- Fatura/ödeme kaydı: 5 yıl (VUK). Trafik/log kaydı: 6 ay – 2 yıl (5651 sayılı Kanun).
- Onay/rıza kayıtları: 10 yıl (TBK genel zamanaşımı, ispat amacıyla).

## 7. Güvenlik Tedbirleri

Aktarımda ve istirahatte şifreleme (TLS + veritabanı düzeyinde şifreleme), erişim yetkisi
asgari ve isimli (özellikle özel nitelikli veri için, bkz. Özel Nitelikli Veri Politikası),
erişim logu, düzenli yedekleme, personel gizlilik taahhüdü.

## 8. Çerezler

Bkz. Çerez Politikası. Zorunlu olmayan çerezler yalnızca rıza sonrası yüklenir.

## 9. Haklarınız

KVKK m.11 kapsamındaki haklarınız (bilgi talep etme, düzeltme, silme, itiraz vb.) için
**İlgili Kişi Başvuru Formu**nu kullanabilirsiniz. Ayrıntı için KVKK Aydınlatma Metni'ne
bakınız.

## 10. İletişim

{{EPOSTA}} · {{TELEFON}} · {{KEP}} · Veri Sorumlusu Temsilcisi: {{VERI_SORUMLUSU_TEMSILCISI}}
