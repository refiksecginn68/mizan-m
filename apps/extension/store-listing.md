# Chrome Web Store — Mağaza Kaydı (Mizanım UYAP Aktarım v1.0.0)

## Kısa açıklama (132 karakter sınırı)
UYAP Avukat Portal'daki dosyalarınızı tek tıkla Mizanım hesabınıza aktarın. Otomatik giriş yok; yalnızca açık oturumunuz okunur.

## Uzun açıklama
Mizanım UYAP Aktarım, avukatların UYAP Avukat Portal'da **kendi e-imzalarıyla açtıkları oturumda**
görünen dosya bilgilerini (esas numarası, mahkeme, dosya türü, taraflar, durum) tek tıkla
Mizanım hukuk platformundaki dava listelerine aktarmalarını sağlar.

**Nasıl çalışır?**
1. Mizanım'da Büro → UYAP sayfasından bir Bağlantı Kodu oluşturun
2. Kodu eklentiye yapıştırıp "Bağlan" deyin
3. UYAP Avukat Portal'a e-imzanızla girin ve dosya listenizi açın
4. Eklenti simgesindeki rozet bulunan dosya sayısını gösterir
5. "Mizanım'a Aktar" ile seçtiğiniz sayfadaki dosyalar Mizanım'daki davalarınıza işlenir
   (aynı esas numarası varsa güncellenir, yoksa yeni dava kaydı açılır)

**Güvenlik ve gizlilik**
- Eklenti UYAP'a otomatik giriş YAPMAZ, e-imza işlemi YAPMAZ, şifre saklamaz
- Arka planda veri çekmez; yalnızca sizin ekranınızda görünen sayfayı, siz istediğinizde okur
- Veriler yalnızca sizin Mizanım hesabınıza, şifreli bağlantı (HTTPS) üzerinden gönderilir
- Bağlantı kodu 90 gün geçerlidir ve yalnızca sizin hesabınıza aktarım yapabilir

## Kategori
Verimlilik (Productivity) / İş Araçları

## Dil
Türkçe

## İzin gerekçeleri (Web Store inceleme formu için)
| İzin | Gerekçe |
|---|---|
| `storage` | Kullanıcının Mizanım bağlantı kodunu tarayıcıda yerel olarak saklamak için. Başka hiçbir veri kalıcı saklanmaz. |
| `activeTab` | "Sayfayı Tara" düğmesine basıldığında yalnızca etkin sekmedeki dosya listesini okumak için. |
| `https://*.uyap.gov.tr/*` (host) | UYAP Avukat Portal sayfalarındaki dosya tablolarını, kullanıcı talebiyle DOM'dan okumak için. |
| `https://xn--mizanm-t9a.com/*` (host) | Okunan dosya bilgilerini kullanıcının kendi Mizanım hesabına (mizanım.com) iletmek için. |

## Tek amaç (single purpose) beyanı
Eklentinin tek amacı, avukatın UYAP Avukat Portal oturumunda görüntülediği dosya
bilgilerini, avukatın açık onayıyla Mizanım hesabındaki dava listesine kopyalamaktır.

## Ekran görüntüsü senaryoları (1280×800, 3-5 adet)
1. **Popup — bağlantı ekranı:** Eklenti popup'ı açık, "Bağlantı Kodu" alanı ve "Bağlan" düğmesi görünür (UYAP dışı nötr sekmede).
2. **Mizanım — kod üretme:** Büro → UYAP sayfasındaki "Chrome Eklentisi Bağlantısı" kartı, "Bağlantı Kodu Oluştur" düğmesi.
3. **UYAP — dosya listesi + rozet:** UYAP dosya sorgulama ekranı açıkken eklenti simgesinde dosya sayısı rozeti (UYAP verileri maskelenmiş/örnek dosyalarla).
4. **Popup — bulunan dosyalar:** "Bu sayfada bulunan dosyalar: N" listesi ve "Mizanım'a Aktar" düğmesi.
5. **Mizanım — aktarım sonucu:** Davalar sayfasında UYAP'tan aktarılan dava kayıtları.

> Not: Ekran görüntülerinde gerçek vatandaş verisi görünmemeli — test/anonim dosyalar kullanın.

## Sürüm notu (v1.0.0)
İlk yayın: UYAP dosya listesi ve dosya detayından okuma, bağlantı kodu ile güvenli eşleştirme, toplu aktarım (50 dosya/istek), rozet göstergesi.
