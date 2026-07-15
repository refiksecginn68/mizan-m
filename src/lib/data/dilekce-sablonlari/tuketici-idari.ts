// Tüketici hukuku ve idari yargı dilekçe şablonları.
//
// TELİF: Tüm metinler sıfırdan özgün yazılmıştır; hiçbir ticari/telifli platformdan
// alıntı yapılmamıştır. Dilekçe yapısı (makam/taraflar/açıklamalar/sonuç-istem) usul
// kuralı olup serbesttir.

import { type DilekceSablonu, IMZA_BLOGU } from "./tipler";

export const TUKETICI_IDARI_SABLONLARI: DilekceSablonu[] = [
  {
    id: "tuketici-hakem-basvuru",
    kategori: "Tüketici",
    baslik: "Tüketici Hakem Heyetine Başvuru Dilekçesi",
    aciklama:
      "Parasal sınır altındaki tüketici uyuşmazlıklarında hakem heyetine zorunlu başvuru iskeleti (6502 s. K. m. 68).",
    davaTuru: "Tüketici uyuşmazlığı",
    dilekceTipi: "Başvuru dilekçesi",
    yetkiliMahkeme: "Tüketici Hakem Heyeti",
    kaynak: "ozgun",
    icerik: `[İL] / [İLÇE] TÜKETİCİ HAKEM HEYETİ BAŞKANLIĞI'NA

BAŞVURAN
(TÜKETİCİ)        : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
TELEFON / E-POSTA : [TELEFON] / [E-POSTA]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
KARŞI TARAF
(SATICI/SAĞLAYICI): [UNVAN]
                    [ADRES]
UYUŞMAZLIK BEDELİ : [TUTAR] TL
KONU              : [MAL/HİZMET] alımından doğan [TUTAR] TL'nin iadesi ile uyuşmazlığın çözümü istemidir.

AÇIKLAMALAR:
1- Müvekkil, karşı taraftan [TARİH] tarihinde [MAL/HİZMETİN TANIMI] satın almış; bedeli olan [TUTAR] TL'yi [ÖDEME ŞEKLİ] yoluyla eksiksiz ödemiştir. (EK-1: Fatura/fiş)
2- Müvekkil, 6502 sayılı Kanun anlamında tüketici; karşı taraf ise ticari veya mesleki faaliyeti kapsamında hareket eden satıcı/sağlayıcı sıfatını taşımaktadır.
3- [OLAYIN ANLATIMI — ayıbın/aykırılığın ne zaman ve nasıl ortaya çıktığı, hangi edimin eksik veya hiç ifa edilmediği].
4- Müvekkil [TARİH] tarihinde karşı tarafa başvurarak talebini iletmiş; başvuru [REDDEDİLMİŞ / cevapsız bırakılmış / sonuçsuz kalmıştır]. (EK-2: Başvuru ve yazışmalar)
5- Uyuşmazlık bedeli, ilgili yıl için belirlenen [GÜNCEL PARASAL SINIR] tutarındaki başvuru sınırının altında kaldığından, 6502 sayılı Kanun'un 68. maddesi uyarınca heyetinize başvuru zorunludur ve işbu başvuru bu kapsamda yapılmaktadır.
6- Başvuru, müvekkilin yerleşim yeri ile tüketici işleminin yapıldığı yer bakımından heyetinizin yetki alanındadır.

HUKUKİ NEDENLER   : 6502 sayılı Tüketicinin Korunması Hakkında Kanun m. 8, 11, 68, 6098 sayılı TBK ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : Fatura/fiş, [SÖZLEŞME], garanti belgesi, servis formları, taraflar arasındaki yazışmalar, banka kayıtları, bilirkişi incelemesi, tanık ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle başvurumuzun KABULÜ ile; [TUTAR] TL'nin [ÖDEME TARİHİ] tarihinden itibaren işleyecek yasal faiziyle birlikte karşı taraftan alınarak müvekkile İADESİNE [/ AYIPLI MALIN AYIPSIZ MİSLİ İLE DEĞİŞİMİNE / ÜCRETSİZ ONARIMINA] karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}

EKLER:
1- Fatura / satış belgesi
2- Karşı tarafa yapılan başvuru ve yazışmalar
3- Vekâletname sureti`,
  },
  {
    id: "tuketici-mahkeme-dava",
    kategori: "Tüketici",
    baslik: "Tüketici Mahkemesinde Dava Dilekçesi",
    aciklama:
      "Parasal sınır üstündeki tüketici uyuşmazlıklarında arabuluculuk sonrası dava dilekçesi iskeleti.",
    davaTuru: "Tüketici uyuşmazlığından doğan alacak",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Tüketici Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). TÜKETİCİ MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

(Tüketici mahkemesi bulunmayan yerlerde dilekçe, tüketici mahkemesi sıfatıyla ASLİYE HUKUK MAHKEMESİ'ne hitaben düzenlenir.)

DAVACI
(TÜKETİCİ)        : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI
(SATICI/SAĞLAYICI): [UNVAN]
                    [ADRES]
DAVA DEĞERİ       : [TUTAR] TL
KONU              : [TÜKETİCİ İŞLEMİ] kaynaklı [TUTAR] TL alacağın faiziyle tahsili istemidir.

AÇIKLAMALAR:
1- Müvekkil ile davalı arasında [TARİH] tarihinde [MAL/HİZMETİN TANIMI] konulu tüketici işlemi kurulmuş; müvekkil [TUTAR] TL bedeli tam ve zamanında ödemiştir. (EK-1)
2- Müvekkil, edimi ticari veya mesleki olmayan amaçlarla edinen tüketici; davalı ise ticari faaliyeti kapsamında hareket eden satıcı/sağlayıcı konumundadır. Bu nedenle uyuşmazlık 6502 sayılı Kanun kapsamında olup görevli mahkeme tüketici mahkemesidir.
3- [OLAYIN KRONOLOJİK ANLATIMI — aykırılığın ortaya çıkışı, davalıya bildirim, davalının tutumu].
4- Davalı, [YÜKÜMLÜLÜK] yükümlülüğünü hiç veya gereği gibi yerine getirmemiş; müvekkilin [TARİH] tarihli başvurusu sonuçsuz kalmıştır. (EK-2)
5- Uyuşmazlık bedeli, ilgili yıl için belirlenen [GÜNCEL PARASAL SINIR] tutarındaki tüketici hakem heyeti başvuru sınırının üzerinde olduğundan, uyuşmazlığın çözüm mercii tüketici mahkemesidir.
6- 6502 sayılı Kanun'un 73/A maddesi uyarınca tüketici mahkemelerinde görülen uyuşmazlıklarda arabulucuya başvurulmuş olması dava şartıdır. Müvekkil bu zorunluluğu yerine getirmiş; [TARİH] tarihli görüşme ANLAŞMAMA ile sonuçlanmıştır. (EK-3: Arabuluculuk son tutanağı)
7- 6502 sayılı Kanun'un 73. maddesi uyarınca davanın, müvekkilin yerleşim yeri mahkemesinde açılmasında yetki bakımından isabetsizlik bulunmamaktadır.
8- Anılan Kanun'un 73/2. maddesi gereğince tüketicilerin açtığı davalar Harçlar Kanunu'nda düzenlenen harçlardan MUAFTIR; bu nedenle harç yatırılmamıştır.

HUKUKİ NEDENLER   : 6502 sayılı Kanun m. 8, 11, 73, 73/A, 6098 sayılı TBK m. 112 vd., 6100 sayılı HMK ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : Sözleşme, fatura, ödeme belgeleri, garanti belgesi, taraf yazışmaları, arabuluculuk son tutanağı, bilirkişi incelemesi, tanık, keşif, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Fazlaya ilişkin haklarımız saklı kalmak kaydıyla, davanın KABULÜ ile;
1- [TUTAR] TL alacağın [FAİZ BAŞLANGIÇ TARİHİ] tarihinden itibaren işleyecek [FAİZ TÜRÜ] faiziyle birlikte davalıdan tahsiline,
2- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}

EKLER:
1- Sözleşme ve fatura
2- Taraflar arasındaki yazışmalar
3- Arabuluculuk son tutanağı
4- Vekâletname sureti`,
  },
  {
    id: "ayipli-mal-iade",
    kategori: "Tüketici",
    baslik: "Ayıplı Mal — Bedel İadesi (Seçimlik Hak) Dilekçesi",
    aciklama:
      "Ayıplı maldan doğan seçimlik hakların kullanılarak sözleşmeden dönme ve bedel iadesi istemi (6502 s. K. m. 11).",
    davaTuru: "Ayıplı mal — bedel iadesi",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Tüketici Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). TÜKETİCİ MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

(Tüketici mahkemesi bulunmayan yerlerde dilekçe, tüketici mahkemesi sıfatıyla ASLİYE HUKUK MAHKEMESİ'ne hitaben düzenlenir. Uyuşmazlık bedeli ilgili yıl için belirlenen [GÜNCEL PARASAL SINIR] tutarının altında ise, 6502 sayılı Kanun'un 68. maddesi uyarınca öncelikle TÜKETİCİ HAKEM HEYETİNE başvurulması zorunludur.)

DAVACI
(TÜKETİCİ)        : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI            : [SATICI UNVANI]
                    [ADRES]
DAVA DEĞERİ       : [TUTAR] TL
KONU              : Ayıplı mal nedeniyle sözleşmeden dönülerek [TUTAR] TL satış bedelinin faiziyle iadesi istemidir.

AÇIKLAMALAR:
1- Müvekkil, davalıdan [TARİH] tarihinde [MALIN CİNSİ, MARKA/MODEL, SERİ NO] vasıflı malı [TUTAR] TL bedelle satın almıştır. (EK-1: Fatura)
2- Mal, teslimden itibaren [SÜRE] içinde [AYIBIN SOMUT TANIMI — ör. çalışmama, tekrarlayan arıza, vaat edilen niteliği taşımama] şeklinde ayıplı çıkmıştır. Söz konusu ayıp, malın sözleşmede kararlaştırılan veya tüketicinin ondan haklı olarak beklediği nitelikleri taşımamasına yol açmaktadır (6502 s. K. m. 8).
3- Ayıp, malın kullanımından veya müvekkilin kusurundan kaynaklanmamaktadır. [VARSA: Mal, [TARİH] tarihinde yetkili servise teslim edilmiş; arıza tekrarlamıştır.] (EK-2: Servis formları)
4- Müvekkil, [TARİH] tarihinde davalıya başvurarak ayıbı bildirmiş ve talebini iletmiş; ancak başvurusu [REDDEDİLMİŞ / karşılıksız bırakılmıştır]. (EK-3)
5- 6502 sayılı Kanun'un 11. maddesi tüketiciye; satılanı geri vererek sözleşmeden dönme, ayıp oranında bedel indirimi isteme, ücretsiz onarım isteme ve ayıpsız misli ile değişim isteme seçimlik haklarını tanımaktadır. Müvekkil, bu haklarından SÖZLEŞMEDEN DÖNME ve satış bedelinin iadesi hakkını kullanmaktadır.
6- Aynı Kanun'un 12. maddesi uyarınca ayıp daha ağır kusur veya hile ile gizlenmiş olmadıkça malın tüketiciye tesliminden itibaren iki yıllık zamanaşımı süresi işlemekte olup, işbu dava süresinde açılmıştır.
7- [VARSA: Uyuşmazlık 73/A maddesi kapsamındaki dava şartı arabuluculuk sürecine tabi olup, [TARİH] tarihli görüşme anlaşmama ile sonuçlanmıştır. (EK-4)]
8- Kanun'un 73/2. maddesi gereğince tüketicilerin açtığı davalar harçtan muaftır.

HUKUKİ NEDENLER   : 6502 sayılı Kanun m. 8, 9, 11, 12, 73, 73/A, 6098 sayılı TBK, 6100 sayılı HMK ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : Fatura, garanti belgesi, kullanım kılavuzu, yetkili servis kayıtları, taraf yazışmaları, malın bilirkişi marifetiyle incelenmesi, keşif, tanık, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Fazlaya ilişkin haklarımız saklı kalmak kaydıyla, davanın KABULÜ ile;
1- Müvekkilin ayıplı mal nedeniyle sözleşmeden dönme hakkını kullandığının tespiti ile [TUTAR] TL satış bedelinin [ÖDEME TARİHİ] tarihinden itibaren işleyecek [FAİZ TÜRÜ] faiziyle birlikte davalıdan tahsiline,
2- [VARSA: Ayıplı mal nedeniyle uğranılan [TUTAR] TL zararın davalıdan tahsiline,]
3- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}

EKLER:
1- Fatura ve garanti belgesi
2- Yetkili servis kayıtları
3- Davalıya yapılan başvuru ve yazışmalar
4- Vekâletname sureti`,
  },
  {
    id: "iptal-davasi",
    kategori: "İdari",
    baslik: "İdari İşlemin İptali Dava Dilekçesi",
    aciklama: "İYUK m. 2 kapsamında iptal davası + yürütmenin durdurulması istemi.",
    davaTuru: "İdari işlemin iptali",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "İdare Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). İDARE MAHKEMESİ BAŞKANLIĞI'NA

— Yürütmenin Durdurulması İstemlidir —

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
VEKİLİ            : Av. [AD SOYAD]
DAVALI            : [İDARE — ör. ... Belediye Başkanlığı / ... Valiliği]
DAVA KONUSU İŞLEM : [TARİH] tarih ve [SAYI] sayılı [İŞLEMİN KONUSU] işlemi
TEBLİĞ TARİHİ     : [TARİH]
KONU              : Hukuka aykırı işlemin öncelikle yürütmesinin durdurulması ve İPTALİ istemidir.

AÇIKLAMALAR:
1- Müvekkil hakkında tesis edilen dava konusu işlemle [İŞLEMİN SONUCU] öngörülmüştür.
2- İşlem; YETKİ yönünden [AÇIKLAMA], ŞEKİL yönünden [AÇIKLAMA], SEBEP yönünden [AÇIKLAMA], KONU ve MAKSAT yönlerinden [AÇIKLAMA] hukuka aykırıdır.
3- İşlemin uygulanması hâlinde telafisi güç ve imkânsız zararlar doğacaktır; yürütmenin durdurulması koşulları (İYUK m. 27) mevcuttur.

HUKUKİ NEDENLER   : Anayasa m. 125, İYUK m. 2, 27 ve sair mevzuat.
SONUÇ VE İSTEM    : Öncelikle dava konusu işlemin YÜRÜTMESİNİN DURDURULMASINA, yargılama sonunda İPTALİNE, yargılama gideri ve vekâlet ücretinin davalı idareye yükletilmesine karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "tam-yargi-davasi",
    kategori: "İdari",
    baslik: "Tam Yargı Davası Dilekçesi",
    aciklama:
      "İdarenin hizmet kusurundan doğan maddi ve manevi zararın tazmini istemli tam yargı davası iskeleti (İYUK m. 2, 12, 13).",
    davaTuru: "İdarenin sorumluluğundan doğan tazminat",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "İdare Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). İDARE MAHKEMESİ BAŞKANLIĞI'NA

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI İDARE      : [İDARE — ör. ... Belediye Başkanlığı / ... Bakanlığı / ... Valiliği]
                    [ADRES]
DAVA KONUSU
EYLEM / İŞLEM     : [TARİH] tarihli [İDARİ EYLEMİN/İŞLEMİN TANIMI]
ÖN BAŞVURU        : [TARİH] tarihli başvuru — [RET TARİHİ VE SAYISI / cevap verilmeyerek zımnen reddedilmiştir]
DAVA DEĞERİ       : [TUTAR] TL ([MADDİ TUTAR] TL maddi, [MANEVİ TUTAR] TL manevi tazminat)
KONU              : İdarenin hizmet kusurundan doğan zararın tazmini istemidir.

AÇIKLAMALAR:
1- [OLAYIN KRONOLOJİK ANLATIMI — idari eylemin/işlemin ne zaman, nerede, nasıl gerçekleştiği; müvekkilin bundan nasıl etkilendiği]. (EK-1)
2- HİZMET KUSURU: Davalı idare, yürütmekle yükümlü olduğu [KAMU HİZMETİ] hizmetini [HİÇ İŞLETMEMİŞ / geç işletmiş / kötü işletmiştir]. [SOMUT AÇIKLAMA — hangi denetim, bakım, önlem veya bildirim yükümlülüğü yerine getirilmemiştir]. Bu durum idarenin hizmet kusurunu oluşturmaktadır.
3- NEDENSELLİK BAĞI: Müvekkilin uğradığı zarar ile davalı idarenin eylemi arasında doğrudan illiyet bağı bulunmaktadır; zarar, müvekkilin veya üçüncü kişinin kusurundan ya da mücbir sebepten kaynaklanmamıştır.
4- MADDİ ZARAR: [ZARAR KALEMLERİNİN DÖKÜMÜ — ör. tedavi ve yol giderleri, iş gücü kaybı, eşya/araç hasarı, kazanç kaybı] olmak üzere toplam [MADDİ TUTAR] TL maddi zarar doğmuştur. (EK-2: Belgeler)
5- MANEVİ ZARAR: Olay nedeniyle müvekkil ağır elem ve üzüntü yaşamış olup, [MANEVİ TUTAR] TL manevi tazminat koşulları oluşmuştur.
6- ÖN BAŞVURU (İYUK m. 13): İdari eylemden doğan zararın tazmini için davalı idareye [TARİH] tarihinde yazılı olarak başvurulmuş; başvuru [TARİH] tarih ve [SAYI] sayılı işlemle reddedilmiş / yasal süre içinde cevap verilmeyerek zımnen reddedilmiştir. Zorunlu ön başvuru koşulu bu suretle yerine getirilmiştir. (EK-3)
7- SÜRE: İYUK'un 7. maddesi uyarınca dava açma süresi idare mahkemelerinde altmış gündür. Ön başvurunun [açıkça/zımnen] reddi tarihinden itibaren bu süre işlemeye başlamış olup, işbu dava süresinde açılmıştır.
8- Anayasa'nın 125. maddesinin son fıkrası gereğince idare, kendi eylem ve işlemlerinden doğan zararı ödemekle yükümlüdür.

HUKUKİ NEDENLER   : Anayasa m. 125, 2577 sayılı İYUK m. 2, 3, 7, 12, 13 ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : Davalı idarenin konuya ilişkin tüm işlem dosyası, ön başvuru ve cevabı, [OLAY TUTANAĞI / kaza tespit tutanağı], sağlık kurulu raporu, fatura ve ödeme belgeleri, keşif, bilirkişi incelemesi, tanık ve her türlü yasal delil.

SONUÇ VE İSTEM    : Fazlaya ilişkin haklarımız saklı kalmak kaydıyla, davanın KABULÜ ile;
1- [MADDİ TUTAR] TL maddi ve [MANEVİ TUTAR] TL manevi tazminatın [FAİZ BAŞLANGIÇ TARİHİ] tarihinden itibaren işleyecek yasal faiziyle birlikte davalı idareden alınarak müvekkile ödenmesine,
2- Yargılama giderleri ile vekâlet ücretinin davalı idareye yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}

EKLER:
1- Olaya ilişkin tutanak ve belgeler
2- Zararı gösteren fatura, rapor ve ödeme belgeleri
3- İdareye yapılan ön başvuru ve idarenin cevabı
4- Vekâletname sureti`,
  },
  {
    id: "idari-basvuru-itiraz",
    kategori: "İdari",
    baslik: "İdareye Başvuru / İtiraz Dilekçesi (İYUK m. 11)",
    aciklama:
      "İdari işleme karşı dava açma süresi içinde üst makama başvuru yoluyla itiraz ve işlemin geri alınması istemi.",
    davaTuru: "İdari işleme itiraz",
    dilekceTipi: "Başvuru / itiraz dilekçesi",
    yetkiliMahkeme: "İdare (üst makam / işlemi tesis eden makam)",
    kaynak: "ozgun",
    icerik: `[ÜST MAKAM — ör. ... Valiliği / ... Bakanlığı]'NA
Gönderilmek Üzere
[İŞLEMİ TESİS EDEN MAKAM — ör. ... Müdürlüğü]'NE

BAŞVURAN          : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
İTİRAZ KONUSU
İŞLEM             : [TARİH] tarih ve [SAYI] sayılı [İŞLEMİN KONUSU] işlemi
TEBLİĞ TARİHİ     : [TARİH]
KONU              : 2577 sayılı İYUK'un 11. maddesi uyarınca işlemin KALDIRILMASI, geri alınması veya değiştirilmesi istemidir.

AÇIKLAMALAR:
1- Müvekkil hakkında [TARİH] tarih ve [SAYI] sayılı işlem tesis edilmiş ve söz konusu işlem [TEBLİĞ TARİHİ] tarihinde müvekkile tebliğ edilmiştir. (EK-1)
2- İşlemle [İŞLEMİN SONUCU — ör. talebin reddi, ceza uygulanması, hakkın sınırlandırılması] öngörülmüştür.
3- İşlem YETKİ yönünden hukuka aykırıdır: [AÇIKLAMA — işlemi tesis eden makamın yetkisiz olduğu, yetki devrinin bulunmadığı vb.].
4- İşlem ŞEKİL yönünden hukuka aykırıdır: [AÇIKLAMA — savunma alınmaması, gerekçe gösterilmemesi, usule ilişkin zorunlu aşamaların atlanması vb.].
5- İşlem SEBEP yönünden hukuka aykırıdır: [AÇIKLAMA — dayanak olarak gösterilen maddi olgunun gerçekleşmediği veya yanlış değerlendirildiği]. (EK-2)
6- İşlem KONU ve MAKSAT yönlerinden hukuka aykırıdır: [AÇIKLAMA — ölçülülük ilkesine aykırılık, kamu yararı dışında bir amaç güdülmesi].
7- İşbu başvuru, 2577 sayılı Kanun'un 11. maddesi uyarınca dava açma süresi içinde yapılmakta olup, başvurunun idari dava açma süresini durduracağı; başvuruya altmış gün içinde cevap verilmemesi hâlinde isteğin reddedilmiş sayılacağı ve işlemeye başlayan sürenin idari dava açma süresinin kalan kısmı olacağı bilinmektedir. Müvekkilin dava açma hakkı saklıdır.

HUKUKİ NEDENLER   : Anayasa m. 40, 125, 2577 sayılı İYUK m. 7, 11, 3071 sayılı Dilekçe Hakkının Kullanılmasına Dair Kanun ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : İşleme ilişkin idari dosyanın tamamı, tebliğ belgesi, [DESTEKLEYİCİ BELGELER] ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle; [TARİH] tarih ve [SAYI] sayılı hukuka aykırı işlemin KALDIRILMASINI, geri alınmasını veya [TALEP EDİLEN YÖNDE] değiştirilmesini; başvurumuz hakkında verilecek kararın tarafımıza yazılı olarak bildirilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}

EKLER:
1- İtiraz konusu işlemin sureti ve tebliğ belgesi
2- [DESTEKLEYİCİ BELGELER]
3- Vekâletname sureti`,
  },
];
