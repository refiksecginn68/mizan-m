import type { TurAdimi } from "@/components/buro/OnboardingTour";

// Avukat panelindeki 9 üst sayfanın bir kerelik tanıtım turu adımları.
// Seçiciler ilgili sayfadaki data-tour="..." attribute'larına karşılık gelir.
export const TUR_ADIMLARI: Record<string, TurAdimi[]> = {
  panel: [
    { secici: '[data-tour="panel-takvim"]', baslik: "Takvim ve Görevler", metin: "Duruşma, toplantı ve görevlerinizi burada görür, hızlıca not ekleyebilirsiniz." },
    { secici: '[data-tour="panel-hizli-erisim"]', baslik: "Hızlı Erişim", metin: "En sık kullandığınız sayfaları buraya sabitleyin." },
    { secici: '[data-tour="panel-bildirimler"]', baslik: "Bildirimler", metin: "Süre uyarıları ve sistem bildirimleri burada toplanır." },
    { secici: '[data-tour="panel-kota"]', baslik: "Yapay Zeka Kotası", metin: "Aylık MizanAI kullanım hakkınızı buradan takip edin." },
  ],
  "dosya-yonetimi": [
    { secici: '[data-tour="dosya-sekmeler"]', baslik: "Müvekkiller ve Finans", metin: "Müvekkil listesi ve finansal işlemler bu sekmelerde." },
    { secici: '[data-tour="dosya-yeni"]', baslik: "Yeni Dosya", metin: "Yeni bir dava dosyası eklemek için buraya tıklayın." },
    { secici: '[data-tour="dosya-liste"]', baslik: "Dosya Listesi", metin: "Tüm davalarınızı burada görür, filtreleyebilirsiniz." },
  ],
  "uyap-tebligat": [
    { secici: '[data-tour="uyap-eklenti"]', baslik: "UYAP Eklentisi", metin: "Chrome eklentisiyle UYAP dosyalarınızı tek tıkla aktarın." },
    { secici: '[data-tour="uyap-sekmeler"]', baslik: "UYAP ve E-Tebligat", metin: "Dosya senkronu ve e-tebligatlar arasında buradan geçiş yapın." },
  ],
  "medya-delil": [
    { secici: '[data-tour="medya-yukle"]', baslik: "Analiz Türü Seçin", metin: "Ses, görüntü, video veya belge türünü seçip yükleyin; sonuç aynı sayfada görünür." },
  ],
  arastirma: [
    { secici: '[data-tour="arastirma-sekmeler"]', baslik: "Emsal ve Mevzuat", metin: "İki arama türü arasında buradan geçiş yapabilirsiniz." },
    { secici: '[data-tour="arastirma-arama"]', baslik: "Emsal ve Mevzuat Arama", metin: "Anahtar kelime veya madde numarasıyla emsal karar ve mevzuat arayın." },
  ],
  mizanai: [
    { secici: '[data-tour="mizanai-gecmis"]', baslik: "Sohbet Geçmişi", metin: "Önceki sohbetlerinize buradan tekrar ulaşabilirsiniz." },
    { secici: '[data-tour="mizanai-mesaj"]', baslik: "MizanAI'ya Sorun", metin: "Hukuki sorularınızı buradan yazarak yanıt alın." },
  ],
  dilekce: [
    { secici: '[data-tour="dilekce-tur"]', baslik: "Dilekçe Türü Seçin", metin: "Hazırlamak istediğiniz dilekçe türünü seçerek başlayın." },
    { secici: '[data-tour="dilekce-uret"]', baslik: "Taslak Üretin", metin: "Bilgileri girip taslağı oluşturun, sonra düzenleyin." },
  ],
  hesaplama: [
    { secici: '[data-tour="hesaplama-sekme"]', baslik: "Hesaplama veya Dönüştürücü", metin: "Hesaplamalar ile belge dönüştürücü arasında buradan geçiş yapın." },
    { secici: '[data-tour="hesaplama-alt-sekme"]', baslik: "Hesaplama Türleri", metin: "İcra, faiz, harç, işçilik gibi hesaplama türleri arasında geçiş yapın." },
  ],
  ayarlar: [
    { secici: '[data-tour="ayarlar-sekmeler"]', baslik: "Ayarlar", metin: "Profil, ödemeler ve bildirim tercihlerinizi bu sekmelerden yönetin. Tanıtım turlarını yeniden başlatma seçeneği \"Ayarlar\" sekmesinin altındadır." },
  ],
};
