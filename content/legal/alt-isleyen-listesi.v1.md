---
slug: alt-isleyen-listesi
baslik: Alt İşleyen Listesi
versiyon: v1
yururlukTarihi: 2026-09-22
hedefKitle: tumu
zorunluOnay: false
---

# Alt İşleyen Listesi

**Versiyon:** v1 · **Yürürlük tarihi:** 22.09.2026 · **Son güncelleme:** 22.09.2026

Aşağıdaki tablo, Mizanım'ın hizmeti sunmak için kullandığı ve kişisel veri işleyen alt
işleyenleri (sub-processor) listeler. Tümü **yurt dışında** kabul edilmiştir; kesin veri
merkezi bölgesi doğrulanana kadar en muhafazakâr senaryo (yurt dışı aktarım) esas alınır.

| Sağlayıcı | Hizmet | İşlenen veri | Ülke/Bölge | Aktarım dayanağı |
|---|---|---|---|---|
| Supabase | Veritabanı, dosya depolama, kimlik doğrulama | Tüm hesap ve hizmet içeriği verisi | [DOĞRULANACAK: barındırma bölgesi — AB/ABD] | Standart sözleşme / [DOĞRULANACAK] |
| Vercel | Uygulama barındırma (hosting) | İşlem sırasında geçici olarak tüm istek verisi | [DOĞRULANACAK: barındırma bölgesi] | Standart sözleşme / [DOĞRULANACAK] |
| Anthropic (Claude API) | Metin tabanlı AI analiz, dilekçe üretimi, sohbet asistanı | Maskelenmiş metin içeriği (bkz. Gizlilik Politikası m.5) | ABD | Standart sözleşme / [DOĞRULANACAK] |
| Cohere | Gömme (embedding) ve semantik arama | Maskelenmiş metin parçaları | [DOĞRULANACAK: ABD/Kanada] | Standart sözleşme / [DOĞRULANACAK] |
| fal.ai | Ses/görüntü/video transkripsiyon ve analiz | Ham medya içeriği (maskelenemez, ayrı açık rıza ile — bkz. Açık Rıza Metni m.2) | [DOĞRULANACAK] | Açık rıza (medya için) + [DOĞRULANACAK: standart sözleşme] |
| iyzico | Ödeme işleme | Ad-soyad, tutar, işlem referansı (kart bilgisi Mizanım'a ulaşmaz) | Türkiye | Yurt içi — aktarım konusu değil |

## Notlar

1. **[DOĞRULANACAK]** işaretli hücreler, ilgili sağlayıcının güncel Veri İşleme Eki (DPA)
   ve barındırma bölgesi belgeleri incelenerek teyit edilmelidir. Şirket kuruluşu sonrası
   her sağlayıcı ile ayrı DPA imzalanması ve bu tablonun güncellenmesi gerekir.
2. Metin tabanlı sağlayıcılara (Anthropic, Cohere) giden içerik, maskeleme katmanından
   geçirildiği için doğrudan kimlik bilgisi içermez; bu husus Yurt Dışına Aktarım
   Bildirimi'nde ayrıca açıklanmıştır.
3. fal.ai'ye giden ham medya için maskeleme uygulanamadığından, bu sağlayıcı ile yapılacak
   aktarım için ayrı ve açık kullanıcı rızası zorunludur.
4. **Alt işleyen değişikliği:** yeni bir alt işleyen eklenmesi veya mevcudun değişmesi
   hâlinde Kullanıcılara en az 15 gün önceden bildirim yapılır ve itiraz hakkı tanınır
   (bkz. Veri İşleme Sözleşmesi madde 7).
