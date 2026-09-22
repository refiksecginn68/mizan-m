---
slug: tarayici-eklentisi-gizlilik-bildirimi
baslik: Tarayıcı Eklentisi Gizlilik Bildirimi
versiyon: v1
yururlukTarihi: 2026-09-22
hedefKitle: avukat
zorunluOnay: false
---

# Mizanım UYAP + UETS Aktarım — Tarayıcı Eklentisi Gizlilik Bildirimi

**Versiyon:** v1 · **Yürürlük tarihi:** 22.09.2026 · **Son güncelleme:** 22.09.2026
(Chrome Web Store zorunlu gizlilik bildirimi — eklenti manifestindeki izinlerle
birebir uyumludur: `apps/extension/manifest.json`.)

## 1. Eklentinin Amacı

Mizanım tarayıcı eklentisi ("Eklenti"), **yalnızca sizin açtığınız** UYAP Avukat Portal
(`*.uyap.gov.tr`) ve UETS e-Tebligat (`*.etebligat.gov.tr`) oturumundan dosya, taraf,
duruşma, safahat ve evrak bilgisini okuyup Mizanım hesabınıza aktarır.

## 2. İstenen İzinler ve Nedeni

| İzin | Neden istenir |
|---|---|
| `storage` | Aktarım durumu ve ayarların yerel olarak saklanması |
| `activeTab` | Yalnızca o an aktif olan UYAP sekmesiyle etkileşim |
| `webNavigation` | UYAP sayfa geçişlerini izleyip doğru zamanda veri çekimini tetiklemek |
| `host_permissions` (`*.uyap.gov.tr`, `*.etebligat.gov.tr`, `mizanim.com` ve alt alan adları) | UYAP/UETS sayfalarından veri okumak ve Mizanım'a güvenli (HTTPS) aktarmak |

Eklenti, bu izinlerin dışında hiçbir siteye erişmez; genel tarayıcı geçmişinizi veya
UYAP/UETS dışındaki sitelerdeki etkinliğinizi izlemez.

## 3. Toplanan Veri ve Gönderildiği Yer

Eklenti; dosya listesi, taraf bilgileri, duruşma/süre bilgileri, safahat kayıtları ve
evrak listesi/içeriğini (bkz. UYAP Evrak İçerik Çekimi — taranmış evrak metni çekilmez)
okur ve **yalnızca sizin giriş yapmış Mizanım hesabınıza**, HTTPS üzerinden aktarır.
Bu veriler Mizanım sunucularında Gizlilik Politikası ve KVKK Aydınlatma Metni'nde
belirtilen kapsamda işlenir.

## 4. E-imza ve Şifre — Asla Okunmaz, Saklanmaz

> ⚠ **Eklenti, e-imza PIN'inizi, e-Devlet şifrenizi veya UYAP şifrenizi hiçbir şekilde
> okumaz, tutmaz veya iletmez.** Eklenti yalnızca sizin tarayıcınızda zaten açık olan,
> kendi kimlik doğrulamanızı tamamladığınız bir UYAP oturumunun **görüntülenen sayfa
> içeriğini** okur.

## 5. Kullanıcının Kendi Oturumu Dışında İşlem Yapılmaz

Eklenti otomatik giriş yapmaz, başka bir kullanıcı adına işlem başlatmaz ve yalnızca
aktif sekmede sizin görüntülediğiniz UYAP oturumu üzerinden çalışır.

## 6. UYAP Kullanım Şartlarına Uyum

> ⚠ Eklenti; UYAP/e-Devlet sistemini yavaşlatacak veya erişimi engelleyecek yoğunlukta
> otomatik istek göndermez, yalnızca kullanıcının kendi yetkili oturumunu kullanır ve
> başkasına ait e-imza veya kimlik bilgisiyle işlem yapmaz. Bu ilkelere aykırı bir
> kullanım tespit edilirse Kullanım Koşulları madde 4 uyarınca hesap askıya alınabilir.

## 7. Veri Silme

Eklentiyi kaldırdığınızda yerel depolamadaki (`storage`) ayar verileri tarayıcı
tarafından temizlenir. Mizanım hesabınıza aktarılmış veriler için Saklama ve İmha
Politikası geçerlidir.

## 8. İletişim

{{EPOSTA}} · {{KEP}}
