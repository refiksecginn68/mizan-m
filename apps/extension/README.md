# Mizanım UYAP Aktarım — Chrome Eklentisi

UYAP Avukat Portal'da **kendi e-imzanızla açtığınız oturumda** görünen dosya bilgilerini
DOM'dan okur ve onayınızla Mizanım hesabınıza aktarır.

**Yasal sınır:** Eklenti UYAP'a otomatik giriş YAPMAZ, e-imza işlemi YAPMAZ, arka planda
veri çekmez. Yalnızca sizin açık oturumunuzda ekranda görünen veriyi okur.

## Kurulum (geliştirici modu — Web Store yayını öncesi)

1. Chrome'da `chrome://extensions` adresini açın
2. Sağ üstten **Geliştirici modu**'nu açın
3. **Paketlenmemiş öğe yükle** → bu klasörü (`apps/extension`) seçin

## Kullanım

1. Mizanım'da **Büro → UYAP** sayfasından **Bağlantı Kodu Oluştur** deyin, kodu kopyalayın
2. Eklenti simgesine tıklayın, kodu yapıştırıp **Bağlan** deyin
3. UYAP Avukat Portal'a e-imzanızla girin, dosya sorgulama listenizi açın
4. Eklenti simgesi bulunan dosya sayısını rozette gösterir
5. **Mizanım'a Aktar** ile seçili sayfadaki dosyalar Mizanım'daki davalarınıza işlenir
   (aynı esas no varsa güncellenir, yoksa yeni dava açılır)

## Mimari

- `content.js` — UYAP sayfasındaki tablo/detay DOM'unu okur (esas no, mahkeme, taraflar, durum)
- `background.js` — veriyi `Authorization: Bearer <token>` ile `POST /api/extension/aktar`'a gönderir
  (MV3 service worker `host_permissions` sayesinde CORS'a takılmaz)
- `popup.html/js` — bağlantı kodu girişi, sayfa tarama, aktarım ve durum
- Token: Mizanım tarafında `INTERNAL_API_SECRET` ile imzalı stateless HMAC (90 gün), DB kaydı gerektirmez

## Notlar

- Vanilla MV3 (build adımı yok) — Plasmo yerine bilinçli tercih: unpacked test için anında
  yüklenebilir, ana web build'inden tamamen bağımsız. Web Store yayını öncesi istenirse
  Plasmo/React'e taşınabilir.
- UYAP DOM'u sürüm güncellemelerinde değişebilir; `content.js` içindeki seçiciler
  genel tablo/etiket desenleriyle yazıldı, gerçek portal üzerinde test edilip
  gerekirse daraltılmalıdır.
