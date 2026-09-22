---
slug: veri-ihlali-mudahale-proseduru
baslik: Veri İhlali Müdahale Prosedürü
versiyon: v1
yururlukTarihi: 2026-09-22
hedefKitle: tumu
zorunluOnay: false
---

# Veri İhlali Müdahale Prosedürü

**Versiyon:** v1 · **Yürürlük tarihi:** 22.09.2026 · **Son güncelleme:** 22.09.2026

Bu prosedür, KVKK m.12/5 ve Kişisel Veri İhlali Bildirim Usul ve Esasları Tebliği
uyarınca, Mizanım sistemlerinde meydana gelebilecek kişisel veri ihlallerine müdahaleyi
düzenler.

## 1. Tespit

Şüpheli erişim, yetkisiz veri sızıntısı veya sistem güvenliği ihlali; izleme/uyarı
mekanizmaları (bkz. Bölüm 2 madde 9), personel bildirimi veya alt işleyen bildirimi
yoluyla tespit edilebilir.

## 2. Değerlendirme

İhlal şüphesi, [DOĞRULANACAK: şirket kuruluşu sonrası atanacak sorumlu — Veri Sorumlusu
Temsilcisi] tarafından en geç **24 saat** içinde değerlendirilir: etkilenen veri
kategorisi, ilgili kişi sayısı, risk seviyesi (özellikle özel nitelikli veri içerip
içermediği) tespit edilir.

## 3. Kurul'a Bildirim

İhlalin **öğrenildiği tarihten itibaren en geç 72 saat içinde**, Kişisel Verileri Koruma
Kurulu'na Kurul'un belirlediği format üzerinden bildirim yapılır. 72 saat içinde tüm
bilgiler netleşmemişse, mevcut bilgilerle bildirim yapılır ve ek bilgiler takiben iletilir.

## 4. İlgili Kişiye Bildirim

İhlalin ilgili kişiler üzerinde olumsuz etki doğurma ihtimali varsa, **makul olan en kısa
sürede**, Kurul'un uygun göreceği yöntemle (e-posta, panel bildirimi vb.) ilgili kişilere
bildirim yapılır. Bildirimde: ihlalin niteliği, olası sonuçları, alınan/alınacak tedbirler
ve iletişim noktası yer alır.

## 5. Kayıt Tutma

Her ihlal (Kurul'a bildirilsin ya da bildirilmesin) iç kayda alınır: tespit tarihi,
etkilenen veri/kişi sayısı, kök neden, alınan aksiyon, kapanış tarihi. Bu kayıtlar
denetim amacıyla saklanır.

## 6. Düzeltici Aksiyon

Kök neden tespit edilip giderilir (ör. erişim yetkisi daraltma, güvenlik yaması,
kimlik doğrulama sıkılaştırma); benzer ihlallerin tekrarını önlemeye yönelik önlem
raporda belgelenir.

## 7. İhlal Bildirim Formunun İçeriği

- İhlalin gerçekleştiği tarih ve öğrenilme tarihi,
- Etkilenen veri kategorileri ve yaklaşık ilgili kişi/kayıt sayısı,
- İhlalin olası sonuçları,
- Alınan ve alınması planlanan tedbirler,
- Sorumlu kişinin iletişim bilgileri: {{VERI_SORUMLUSU_TEMSILCISI}}, {{EPOSTA}}.

## 8. Alt İşleyen Kaynaklı İhlaller

Bir alt işleyende (Supabase, Vercel, Anthropic, Cohere, fal.ai) meydana gelen ve Mizanım
kullanıcı verisini etkileyen ihlaller, DPA madde 9 uyarınca Mizanım'a en geç 48 saat
içinde bildirilir; bu bildirim üzerine yukarıdaki 72 saatlik Kurul bildirim süreci işletilir.
