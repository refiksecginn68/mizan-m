// Tazminat kategorisi dilekçe şablonları — TAMAMEN ÖZGÜN içerik.
// Standart Türk hukuk usulü yapısı + [KÖŞELİ PARANTEZ] yer tutucular.
// Hiçbir ticari/telifli platformdan (Corpus, Lexpera vb.) metin alınmamıştır.

import { type DilekceSablonu, IMZA_BLOGU } from "./tipler";

export const TAZMINAT_SABLONLARI: DilekceSablonu[] = [
  {
    id: "maddi-manevi-tazminat",
    kategori: "Tazminat",
    baslik: "Maddi ve Manevi Tazminat Dava Dilekçesi (Haksız Fiil)",
    aciklama:
      "Haksız fiilden doğan maddi ve manevi zararın tazmini için belirsiz alacak niteliğinde dava dilekçesi iskeleti.",
    davaTuru: "Haksız fiilden doğan maddi ve manevi tazminat",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Asliye Hukuk Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). ASLİYE HUKUK MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI            : [AD SOYAD / UNVAN]
                    [ADRES]
DAVA DEĞERİ       : [TUTAR] TL (Belirsiz alacak — HMK m. 107)
KONU              : [TARİH] tarihli haksız fiil nedeniyle uğranılan maddi ve manevi zararın faiziyle tazmini istemidir.

AÇIKLAMALAR:
1- Müvekkil ile davalı arasında [TARAFLAR ARASINDAKİ İLİŞKİ / ilişki bulunmamaktadır] şeklinde bir bağ mevcuttur.
2- [OLAY TARİHİ] tarihinde [OLAY YERİ] adresinde, davalının [EYLEMİN SOMUT ANLATIMI — ne yaptı, nasıl yaptı] şeklindeki eylemi sonucunda müvekkil zarara uğramıştır. (EK-1: [OLAYA İLİŞKİN BELGE/TUTANAK])
3- Davalının eylemi hukuka aykırıdır; zira [HUKUKA AYKIRILIK GEREKÇESİ — ihlal edilen norm veya genel davranış kuralı]. Eylem ile doğan zarar arasında uygun illiyet bağı bulunmakta olup davalı [KUSUR DERECESİ — kast/ağır ihmal/ihmal] ile kusurludur.
4- MADDİ ZARAR: Müvekkil olay nedeniyle [ZARAR KALEMLERİ — ör. tedavi gideri, iş göremezlik kaybı, eşyada meydana gelen hasar, kazanç kaybı] kalemlerinden oluşan zarara uğramıştır. Zararın tam miktarı [BELİRSİZLİK NEDENİ — bilirkişi incelemesi/tedavi süreci tamamlanmadığı için] hâlihazırda tarafımızca belirlenememektedir; bu nedenle işbu dava belirsiz alacak davası olarak açılmıştır (HMK m. 107). (EK-2: [FATURA/GİDER BELGELERİ])
5- MANEVİ ZARAR: Olay nedeniyle müvekkil [MANEVİ ZARARIN SOMUT ANLATIMI — elem, üzüntü, itibar kaybı, yaşam kalitesinde azalma] yaşamıştır. Tarafların ekonomik ve sosyal durumları, olayın gelişim biçimi ve davalının kusurunun ağırlığı birlikte değerlendirildiğinde, talep edilen manevi tazminat tutarı zenginleşme aracı olmayıp hakkaniyete uygundur (TBK m. 56).
6- Davalı [TARİH] tarihli ihtarnameye rağmen zararı karşılamamış ve temerrüde düşmüştür. (EK-3: [İHTARNAME])

HUKUKİ NEDENLER   : 6098 sayılı TBK m. 49 vd., m. 50, 51, 52, 56, 72; 6100 sayılı HMK m. 16, 107 ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : [OLAY TUTANAĞI], fatura ve gider belgeleri, hastane/tedavi kayıtları, ihtarname, tanık beyanları, bilirkişi incelemesi, keşif, isticvap, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle, fazlaya ilişkin her türlü talep ve dava hakkımız saklı kalmak kaydıyla davanın KABULÜ ile;
1- Belirsiz alacak davası niteliğindeki işbu dava kapsamında şimdilik [TUTAR] TL maddi tazminatın haksız fiil tarihi olan [OLAY TARİHİ] tarihinden itibaren işleyecek yasal faiziyle birlikte davalıdan tahsiline,
2- [TUTAR] TL manevi tazminatın haksız fiil tarihinden itibaren işleyecek yasal faiziyle birlikte davalıdan tahsiline,
3- Yargılama sırasında alınacak bilirkişi raporu doğrultusunda maddi tazminat talebimizi harcını tamamlayarak artırma hakkımızın saklı tutulmasına,
4- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "trafik-kazasi-tazminat",
    kategori: "Tazminat",
    baslik: "Trafik Kazası Nedeniyle Maddi ve Manevi Tazminat Dava Dilekçesi",
    aciklama:
      "Trafik kazası kaynaklı bedensel zarar tazminatı; sigorta şirketi husumetli olduğundan asliye ticaret mahkemesinde açılır, KTK m. 97 başvurusu ve TTK m. 5/A arabuluculuk dava şartıdır.",
    davaTuru: "Trafik kazasından doğan maddi ve manevi tazminat",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Asliye Ticaret Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). ASLİYE TİCARET MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALILAR         : 1- [SİGORTA ŞİRKETİ UNVANI] (Zorunlu Mali Sorumluluk Sigortacısı — Poliçe No: [POLİÇE NO])
                       [ADRES]
                    2- [İŞLETEN AD SOYAD / UNVAN] (Araç işleteni)
                       [ADRES]
                    3- [SÜRÜCÜ AD SOYAD]
                       [ADRES]
DAVA DEĞERİ       : [TUTAR] TL (Belirsiz alacak — HMK m. 107)
KONU              : [KAZA TARİHİ] tarihli trafik kazası nedeniyle uğranılan maddi ve manevi zararın faiziyle tazmini istemidir.

AÇIKLAMALAR:
1- [KAZA TARİHİ] tarihinde [KAZA YERİ] adresinde, davalı [SÜRÜCÜ AD SOYAD] sevk ve idaresindeki [PLAKA] plakalı aracın [KUSURLU DAVRANIŞ — ör. kırmızı ışık ihlali, hatalı sollama, hız kuralına aykırılık] şeklindeki eylemi sonucunda müvekkilin [YAYA OLARAK / [PLAKA] plakalı araç sürücüsü olarak] karıştığı trafik kazası meydana gelmiştir. (EK-1: Kaza tespit tutanağı)
2- Kaza tespit tutanağı ve dosya kapsamına göre kazanın oluşumunda kusur tamamen davalı sürücüdedir; müvekkilin kusuru bulunmamaktadır. Kusur oranlarının tespiti için bilirkişi incelemesi talep olunur.
3- Davalı [SİGORTA ŞİRKETİ UNVANI], kazaya karışan [PLAKA] plakalı aracın kaza tarihinde geçerli [POLİÇE NO] numaralı Karayolları Motorlu Araçlar Zorunlu Mali Sorumluluk Sigortası poliçesinin sigortacısı olup, poliçe teminat limitleri dâhilinde zarardan sorumludur. Davalı [İŞLETEN AD SOYAD / UNVAN] aracın işleteni sıfatıyla, davalı [SÜRÜCÜ AD SOYAD] ise sürücü sıfatıyla müteselsilen sorumludur (2918 sayılı KTK m. 85).
4- DAVA ŞARTI — SİGORTACIYA BAŞVURU: Sigorta şirketine karşı dava açılabilmesi için sigortacıya başvuru zorunludur (2918 sayılı KTK m. 97). Müvekkil [BAŞVURU TARİHİ] tarihinde davalı sigorta şirketine gerekli belgelerle başvurmuş; [BAŞVURU SONUCU — başvuru reddedilmiş / kanuni süre içinde yazılı cevap verilmemiş / teklif edilen tutar zararı karşılamadığından kabul edilmemiştir]. Bu itibarla dava şartı gerçekleşmiştir. (EK-2: Başvuru dilekçesi ve tebliğ belgesi) [NOT: Sigortacıya karşı talep, dilerse Sigortacılık Kanunu kapsamında Sigorta Tahkim Komisyonu'na da götürülebilir; müvekkil dava yolunu tercih etmiştir.]
5- DAVA ŞARTI — ARABULUCULUK: İşbu dava ticari dava niteliğinde olup, konusu bir miktar paranın ödenmesi olan alacak ve tazminat talepleri bakımından arabulucuya başvurulmuş olması dava şartıdır (6102 sayılı TTK m. 5/A). [TARİH] tarihli arabuluculuk süreci anlaşmama ile sonuçlanmıştır. (EK-3: Arabuluculuk son tutanağı)
6- MADDİ ZARAR: Müvekkil kaza nedeniyle [YARALANMANIN NİTELİĞİ] şeklinde yaralanmış, [HASTANE ADI]'nda [SÜRE] süreyle tedavi görmüştür. Müvekkilin zararı; [ZARAR KALEMLERİ — tedavi ve yol giderleri, geçici iş göremezlik nedeniyle kazanç kaybı, sürekli maluliyet nedeniyle çalışma gücü kaybı, bakıcı gideri, araç hasarı ve değer kaybı] kalemlerinden oluşmaktadır. Sürekli maluliyet oranı henüz tespit edilmediğinden ve zarar ancak aktüer bilirkişi raporu ile hesaplanabileceğinden, işbu dava belirsiz alacak davası olarak açılmıştır (HMK m. 107). (EK-4: Tedavi evrakı ve gider belgeleri)
7- MANEVİ ZARAR: Müvekkil kaza ve sonrasındaki tedavi süreci nedeniyle [MANEVİ ZARARIN SOMUT ANLATIMI — ağır acı, uzun süreli iş ve yaşam düzeninden kopma, kalıcı iz/maluliyet kaygısı] yaşamıştır. Talep edilen manevi tazminat, olayın ağırlığı ile tarafların ekonomik ve sosyal durumlarına uygundur (TBK m. 56). [NOT: Manevi tazminat, zorunlu mali sorumluluk sigortası teminatı kapsamında olmadığından yalnızca işleten ve sürücü yönünden talep edilmektedir.]

HUKUKİ NEDENLER   : 2918 sayılı KTK m. 85, 91, 97; 6098 sayılı TBK m. 49 vd., m. 51, 54, 56; 6102 sayılı TTK m. 4, 5/A; 6100 sayılı HMK m. 107 ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : Kaza tespit tutanağı, olay yeri fotoğrafları, trafik ve alkol muayene raporları, ceza soruşturma/kovuşturma dosyası ([SORUŞTURMA NO]), sigorta poliçesi ve hasar dosyası, sigortacıya başvuru evrakı, arabuluculuk son tutanağı, hastane kayıtları ve epikriz, SGK kayıtları, ATK/hastane maluliyet raporu, kusur bilirkişisi ve aktüer bilirkişi incelemesi, tanık beyanları, keşif, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle, fazlaya ilişkin her türlü talep ve dava hakkımız saklı kalmak kaydıyla davanın KABULÜ ile;
1- Belirsiz alacak davası niteliğindeki işbu dava kapsamında şimdilik [TUTAR] TL maddi tazminatın; davalı sigorta şirketi yönünden poliçe limiti dâhilinde ve [SİGORTACIYA BAŞVURU TARİHİ] tarihinden itibaren, diğer davalılar yönünden kaza tarihi olan [KAZA TARİHİ] tarihinden itibaren işleyecek yasal faiziyle birlikte davalılardan müteselsilen tahsiline,
2- [TUTAR] TL manevi tazminatın kaza tarihinden itibaren işleyecek yasal faiziyle birlikte davalılar [İŞLETEN] ve [SÜRÜCÜ]'den müteselsilen tahsiline,
3- Alınacak maluliyet ve aktüer bilirkişi raporları doğrultusunda maddi tazminat talebimizi harcını tamamlayarak artırma hakkımızın saklı tutulmasına,
4- Yargılama giderleri ile vekâlet ücretinin davalılara yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "destekten-yoksun-kalma",
    kategori: "Tazminat",
    baslik: "Destekten Yoksun Kalma Tazminatı Dava Dilekçesi",
    aciklama:
      "Ölümlü trafik kazası sonrası desteğin yitirilmesi nedeniyle destekten yoksun kalma tazminatı ve yakınların manevi tazminatı istemli dava dilekçesi iskeleti.",
    davaTuru: "Destekten yoksun kalma tazminatı ve manevi tazminat",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Asliye Ticaret Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). ASLİYE TİCARET MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DAVACILAR         : 1- [AD SOYAD] (T.C.: [T.C. KİMLİK NO]) — Müteveffanın [YAKINLIK — eşi]
                    2- [AD SOYAD] (T.C.: [T.C. KİMLİK NO]) — Müteveffanın [YAKINLIK — çocuğu]
                    3- [AD SOYAD] (T.C.: [T.C. KİMLİK NO]) — Müteveffanın [YAKINLIK — annesi/babası]
                       [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALILAR         : 1- [SİGORTA ŞİRKETİ UNVANI] (ZMSS sigortacısı — Poliçe No: [POLİÇE NO])
                       [ADRES]
                    2- [İŞLETEN AD SOYAD / UNVAN] (Araç işleteni)
                    3- [SÜRÜCÜ AD SOYAD]
                       [ADRES]
DAVA DEĞERİ       : [TUTAR] TL (Belirsiz alacak — HMK m. 107)
KONU              : [KAZA TARİHİ] tarihli ölümlü trafik kazası nedeniyle destekten yoksun kalma tazminatı ile manevi tazminatın faiziyle tahsili istemidir.

AÇIKLAMALAR:
1- Müvekkillerin murisi [MÜTEVEFFA AD SOYAD] (T.C.: [T.C. KİMLİK NO]), [KAZA TARİHİ] tarihinde [KAZA YERİ] adresinde meydana gelen trafik kazasında hayatını kaybetmiştir. (EK-1: Kaza tespit tutanağı, EK-2: Ölüm belgesi ve otopsi raporu)
2- Kaza; davalı [SÜRÜCÜ AD SOYAD] sevk ve idaresindeki [PLAKA] plakalı aracın [KUSURLU DAVRANIŞIN SOMUT ANLATIMI] şeklindeki eylemi sonucu meydana gelmiş olup, kusur tamamen davalı sürücüdedir. Kusur durumunun tespiti için bilirkişi incelemesi talep olunur. [VARSA: Olay nedeniyle [İL] Cumhuriyet Başsavcılığı'nın [SORUŞTURMA NO] sayılı dosyası üzerinden soruşturma yürütülmüştür.]
3- Davalı [SİGORTA ŞİRKETİ UNVANI], kazaya karışan aracın kaza tarihinde geçerli [POLİÇE NO] numaralı Zorunlu Mali Sorumluluk Sigortası poliçesinin sigortacısı olup poliçe limitleri dâhilinde; davalı işleten ve sürücü ise 2918 sayılı KTK m. 85 uyarınca müteselsilen sorumludur.
4- DAVA ŞARTI — SİGORTACIYA BAŞVURU: Müvekkiller [BAŞVURU TARİHİ] tarihinde davalı sigorta şirketine gerekli belgelerle başvurmuş, [BAŞVURU SONUCU — talep reddedilmiş / kanuni süre içinde cevap verilmemiştir]. 2918 sayılı KTK m. 97 uyarınca dava şartı gerçekleşmiştir. (EK-3: Başvuru evrakı)
5- DAVA ŞARTI — ARABULUCULUK: Ticari dava niteliğindeki işbu tazminat talebi bakımından 6102 sayılı TTK m. 5/A uyarınca arabulucuya başvurulmuş, [TARİH] tarihli süreç anlaşmama ile sonuçlanmıştır. (EK-4: Arabuluculuk son tutanağı)
6- DESTEK İLİŞKİSİ: Müteveffa [MÜTEVEFFA AD SOYAD] ölüm tarihinde [YAŞ] yaşında olup [MESLEK] olarak çalışmakta ve aylık [GELİR] TL gelir elde etmekteydi. (EK-5: SGK hizmet dökümü ve ücret belgeleri) Müteveffa, hayatta olduğu sürece davacı eşi ve çocuklarına düzenli ve fiilî destek sağlamakta; [VARSA: ileri yaşı ve gelir durumu nedeniyle davacı anne ve babasına da destek olmaktaydı]. Müteveffanın ölümüyle müvekkiller bu desteği yitirmiştir (TBK m. 53/3).
7- Destekten yoksun kalma tazminatı; müteveffanın bakiye ömrü, muhtemel kazançları, davacıların destek süreleri ve destek payları esas alınarak aktüer bilirkişi tarafından hesaplanacaktır. Zarar bu rapor alınmadan belirlenemeyeceğinden, işbu dava belirsiz alacak davası olarak açılmıştır (HMK m. 107).
8- Ayrıca müteveffanın defin ve cenaze giderleri için [TUTAR] TL harcama yapılmıştır (TBK m. 53/1). [VARSA: Ölüm hemen gerçekleşmediğinden tedavi giderleri de talep edilmektedir (TBK m. 53/2).] (EK-6: Gider belgeleri)
9- MANEVİ ZARAR: Müvekkiller, [YAKINLIK DERECESİ] oldukları müteveffanın ani ve haksız ölümü nedeniyle onarılması mümkün olmayan derin acı ve elem duymuş, aile bütünlükleri geri dönülmez biçimde zedelenmiştir. Ölenin yakınlarının manevi tazminat talep hakkı bulunmaktadır (TBK m. 56/2). Talep edilen tutarlar, olayın ağırlığı ve tarafların ekonomik ve sosyal durumları ile bağdaşmaktadır. [NOT: Manevi tazminat ZMSS teminatı kapsamında olmadığından yalnızca işleten ve sürücü yönünden talep edilmektedir.]

HUKUKİ NEDENLER   : 6098 sayılı TBK m. 49 vd., m. 53, 55, 56; 2918 sayılı KTK m. 85, 91, 97; 6102 sayılı TTK m. 4, 5/A; 6100 sayılı HMK m. 107 ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : Kaza tespit tutanağı, ölüm belgesi, otopsi raporu, nüfus kayıt örneği ve veraset ilamı, ceza soruşturma dosyası ([SORUŞTURMA NO]), sigorta poliçesi ve hasar dosyası, sigortacıya başvuru evrakı, arabuluculuk son tutanağı, müteveffanın SGK kayıtları ve gelir belgeleri, cenaze ve defin gider belgeleri, kusur bilirkişisi ve aktüer bilirkişi raporu, tanık beyanları, keşif, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle, fazlaya ilişkin her türlü talep ve dava hakkımız saklı kalmak kaydıyla davanın KABULÜ ile;
1- Belirsiz alacak davası niteliğindeki işbu dava kapsamında şimdilik davacı [AD SOYAD] için [TUTAR] TL, davacı [AD SOYAD] için [TUTAR] TL, davacı [AD SOYAD] için [TUTAR] TL olmak üzere toplam [TUTAR] TL destekten yoksun kalma tazminatının; davalı sigorta şirketi yönünden poliçe limiti dâhilinde ve başvuru tarihinden, diğer davalılar yönünden kaza tarihi olan [KAZA TARİHİ] tarihinden itibaren işleyecek yasal faiziyle birlikte davalılardan müteselsilen tahsiline,
2- [TUTAR] TL cenaze ve defin gideri ile [VARSA TUTAR] TL tedavi giderinin kaza tarihinden itibaren işleyecek yasal faiziyle davalılardan müteselsilen tahsiline,
3- Her bir davacı için ayrı ayrı [TUTAR] TL manevi tazminatın kaza tarihinden itibaren işleyecek yasal faiziyle birlikte davalılar [İŞLETEN] ve [SÜRÜCÜ]'den müteselsilen tahsiline,
4- Alınacak aktüer bilirkişi raporu doğrultusunda destekten yoksun kalma tazminatı talebimizi harcını tamamlayarak artırma hakkımızın saklı tutulmasına,
5- Yargılama giderleri ile vekâlet ücretinin davalılara yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "malpraktis-tazminat",
    kategori: "Tazminat",
    baslik: "Hatalı Tıbbi Uygulama (Malpraktis) Tazminat Dava Dilekçesi",
    aciklama:
      "Özel hastane ve hekim husumetli malpraktis tazminat davası iskeleti. NOT: Kamu hastanesinde çalışan hekimlerin tıbbi uygulama hatalarından doğan zararlar için husumet ilgili idareye yöneltilir ve dava idari yargıda (tam yargı davası) görülür; işbu şablon özel hastane/serbest çalışan hekim husumetine göre kurgulanmıştır.",
    davaTuru: "Tıbbi uygulama hatası nedeniyle maddi ve manevi tazminat",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Asliye Hukuk Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). ASLİYE HUKUK MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALILAR         : 1- [ÖZEL HASTANE UNVANI]
                       [ADRES]
                    2- [HEKİM AD SOYAD] ([BRANŞ] Uzmanı)
                       [ADRES]
DAVA DEĞERİ       : [TUTAR] TL (Belirsiz alacak — HMK m. 107)
KONU              : [MÜDAHALE TARİHİ] tarihli hatalı tıbbi uygulama nedeniyle uğranılan maddi ve manevi zararın faiziyle tazmini istemidir.

AÇIKLAMALAR:
1- Müvekkil, [BAŞVURU TARİHİ] tarihinde [ŞİKÂYET — hastanın başvuru nedeni] şikâyetiyle davalı [ÖZEL HASTANE UNVANI]'na başvurmuş; davalı hekim [HEKİM AD SOYAD] tarafından muayene edilerek [TEŞHİS] teşhisi konulmuş ve [ÖNERİLEN TEDAVİ/AMELİYAT] uygulanmasına karar verilmiştir. (EK-1: Hasta dosyası ve tetkik sonuçları)
2- Müvekkil ile davalı hastane arasında hasta kabulü ile birlikte, hastanın tedavisini üstlenmeye yönelik hizmet ilişkisi kurulmuştur. Davalılar, tıbbi müdahaleyi tıp biliminin güncel verilerine ve gerekli özene uygun biçimde yürütmekle yükümlüdür. Hekimin yükümlülüğü sonucun elde edilmesi değil, ancak müdahalenin özenle ifasıdır; işbu davada ihlal edilen tam da bu özen yükümlülüğüdür.
3- [MÜDAHALE TARİHİ] tarihinde gerçekleştirilen [MÜDAHALENİN ADI] sırasında/sonrasında [HATANIN SOMUT ANLATIMI — ör. yanlış bölgeye müdahale, gerekli tetkiklerin yapılmaması, komplikasyonun geç fark edilmesi, enfeksiyon kontrolünün sağlanmaması, hatalı ilaç/doz uygulaması] gerçekleşmiştir.
4- Bu uygulama sonucunda müvekkilde [ZARARIN SOMUT SONUCU — ör. kalıcı fonksiyon kaybı, ek ameliyat zorunluluğu, uzayan tedavi süreci] meydana gelmiştir. Ortaya çıkan sonuç, müdahalenin öngörülebilir ve kaçınılmaz bir komplikasyonu olmayıp, gerekli özenin gösterilmemesinden kaynaklanmaktadır. Söz konusu sonucun tıbbi uygulama hatasından kaynaklandığı hususunun tespiti için Adli Tıp Kurumu ve/veya üniversite hastanesinden [BRANŞ] uzmanlarının yer aldığı bilirkişi heyetinden rapor alınmasını talep ederiz.
5- AYDINLATILMIŞ ONAM: Müvekkile, müdahalenin niteliği, olası riskleri, alternatif tedavi yöntemleri ve bunların sonuçları hakkında anlayabileceği biçimde bilgi verilmemiş; [ONAM İHLALİNİN SOMUT ANLATIMI — ör. matbu ve boş bırakılan bir form müdahale öncesi imzalatılmış, riskler somut olarak açıklanmamıştır]. Geçerli bir aydınlatılmış onam bulunmadığından müdahale hukuka uygunluk kazanmamıştır.
6- MADDİ ZARAR: Müvekkil, hatalı uygulama nedeniyle [ZARAR KALEMLERİ — düzeltici ameliyat ve tedavi giderleri, ilaç ve yol giderleri, çalışamadığı dönemdeki kazanç kaybı, sürekli maluliyet nedeniyle çalışma gücü kaybı, bakıcı gideri] kalemlerinden oluşan zarara uğramıştır. Sürekli maluliyet oranı henüz belirlenmediğinden ve zarar ancak alınacak bilirkişi ve aktüer raporlarıyla hesaplanabileceğinden, işbu dava belirsiz alacak davası olarak açılmıştır (HMK m. 107). (EK-2: Gider belgeleri)
7- MANEVİ ZARAR: Müvekkil, sağlığına kavuşmak amacıyla başvurduğu davalılar nedeniyle daha ağır bir tabloyla karşılaşmış; [MANEVİ ZARARIN SOMUT ANLATIMI — uzun süreli acı, tedaviye ve hekimlere karşı güven kaybı, kalıcı iz/maluliyetin yaşam kalitesinde yarattığı azalma] yaşamıştır. Talep edilen manevi tazminat, olayın ağırlığı ile tarafların ekonomik ve sosyal durumlarına uygundur (TBK m. 56).
8- Davalı hastane, bünyesinde çalıştırdığı hekim ve sağlık personelinin eylemlerinden sorumludur; davalılar müvekkilin zararından müteselsilen sorumludur.

HUKUKİ NEDENLER   : 6098 sayılı TBK m. 49 vd., m. 51, 54, 56, 112 vd., m. 502 vd.; 4721 sayılı TMK m. 24; 1219 sayılı Kanun; Hasta Hakları Yönetmeliği; 6100 sayılı HMK m. 107 ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : Hastane hasta dosyasının tamamı (anamnez, tetkik ve görüntüleme kayıtları, ameliyat notu, anestezi formu, hemşire gözlem kayıtları, epikriz), aydınlatılmış onam formu, sonraki tedaviye ilişkin hastane kayıtları, gider belgeleri, SGK kayıtları, Adli Tıp Kurumu/üniversite hastanesi uzman bilirkişi heyeti raporu, aktüer bilirkişi incelemesi, [VARSA: Cumhuriyet Başsavcılığı soruşturma dosyası [SORUŞTURMA NO], İl Sağlık Müdürlüğü inceleme dosyası], tanık beyanları, isticvap, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle, fazlaya ilişkin her türlü talep ve dava hakkımız saklı kalmak kaydıyla davanın KABULÜ ile;
1- Belirsiz alacak davası niteliğindeki işbu dava kapsamında şimdilik [TUTAR] TL maddi tazminatın [MÜDAHALE TARİHİ] tarihinden itibaren işleyecek yasal faiziyle birlikte davalılardan müteselsilen tahsiline,
2- [TUTAR] TL manevi tazminatın [MÜDAHALE TARİHİ] tarihinden itibaren işleyecek yasal faiziyle birlikte davalılardan müteselsilen tahsiline,
3- Davalı hastaneden müvekkile ait hasta dosyasının tamamının okunaklı ve eksiksiz biçimde celbine,
4- Alınacak bilirkişi raporları doğrultusunda maddi tazminat talebimizi harcını tamamlayarak artırma hakkımızın saklı tutulmasına,
5- Yargılama giderleri ile vekâlet ücretinin davalılara yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "kisilik-haklari-tazminat",
    kategori: "Tazminat",
    baslik: "Kişilik Haklarına Saldırı Nedeniyle Manevi Tazminat Dava Dilekçesi",
    aciklama:
      "Şeref, itibar ve özel yaşamın gizliliğine yönelik saldırı nedeniyle manevi tazminat ile saldırının tespiti ve sonuçlarının ortadan kaldırılması istemli dava dilekçesi iskeleti.",
    davaTuru: "Kişilik haklarına saldırı nedeniyle manevi tazminat",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Asliye Hukuk Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). ASLİYE HUKUK MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI            : [AD SOYAD / UNVAN]
                    [ADRES]
DAVA DEĞERİ       : [TUTAR] TL
KONU              : Kişilik haklarına yönelik saldırının tespiti, sonuçlarının ortadan kaldırılması ve [TUTAR] TL manevi tazminatın faiziyle tahsili istemidir.

AÇIKLAMALAR:
1- Müvekkil [MESLEK/SIFAT] olup [YAŞ] yıldır [FAALİYET ALANI] alanında faaliyet göstermekte, çevresinde ve mesleğinde [İTİBARIN SOMUT ANLATIMI] şeklinde saygın bir konuma sahiptir.
2- Davalı, [TARİH] tarihinde [SALDIRININ GERÇEKLEŞTİĞİ MECRA — ör. [PLATFORM] adlı sosyal medya hesabı, [YAYIN ORGANI] internet sitesi, [ORTAM]'da yapılan konuşma] üzerinden müvekkile yönelik olarak [SALDIRININ SOMUT ANLATIMI — kullanılan ifadeler, paylaşılan görüntü/bilgi, isnat edilen olgu] eyleminde bulunmuştur. (EK-1: [EKRAN GÖRÜNTÜSÜ / YAYIN ÇIKTISI], EK-2: [VARSA TESPİT TUTANAĞI])
3- Söz konusu eylem müvekkilin [İHLAL EDİLEN DEĞER — şeref ve itibarı / özel yaşamının gizliliği / adı / resmi üzerindeki hakkı / mesleki saygınlığı] üzerinde hukuka aykırı bir saldırı oluşturmaktadır. Davalının eylemi; müvekkilin rızasına, üstün nitelikte özel veya kamusal yarara ya da kanunun verdiği bir yetkiye dayanmadığından hukuka aykırılığı ortadan kaldıran hiçbir sebep bulunmamaktadır (TMK m. 24/2).
4- Davalının eylemi ifade özgürlüğünün korumasından da yararlanamaz; zira [SINIRIN AŞILDIĞININ AÇIKLANMASI — isnat edilen olgular gerçek dışıdır ve gerçekliği araştırılmamıştır / kullanılan ifadeler açıklanan düşünceyle görünür bağlantısı bulunmayan aşağılayıcı nitelemelerdir / müvekkilin kamuya kapalı özel yaşamına ilişkin olup güncel bir kamu yararı bulunmamaktadır]. Kullanılan ifadeler eleştiri sınırlarını aşarak müvekkili küçük düşürmeye yöneliktir.
5- Eylemin [YAYILMA DERECESİ — ör. içeriğin ulaştığı kitle, paylaşım ve yorum sayısı, yayının süresi] dikkate alındığında saldırının etkisi geniş bir çevrede sonuç doğurmuş; müvekkil [SOMUT SONUÇLAR — çevresine karşı açıklama yapmak zorunda kalmış, mesleki ilişkileri zedelenmiş, ruh sağlığı olumsuz etkilenmiştir]. [VARSA: Saldırının etkisi hâlen devam etmekte olup içerik yayından kaldırılmamıştır.]
6- Müvekkil, [TARİH] tarihli ihtarname ile davalıdan içeriğin kaldırılmasını ve zararının karşılanmasını talep etmiş; davalı bu talebi karşılamamıştır. (EK-3: [İHTARNAME]) [VARSA: Aynı eylem nedeniyle [İL] Cumhuriyet Başsavcılığı'nın [SORUŞTURMA NO] sayılı dosyası üzerinden soruşturma yürütülmektedir.]
7- Müvekkilin uğradığı manevi zarar; saldırının niteliği ve ağırlığı, tarafların ekonomik ve sosyal durumları, davalının kusurunun derecesi ile birlikte değerlendirildiğinde talep edilen tutar hakkaniyete uygun olup zenginleşme aracı niteliğinde değildir (TBK m. 56). Ayrıca kişilik hakkı saldırıya uğrayan davacının, saldırının tespitini ve sonuçlarının ortadan kaldırılmasını isteme hakkı bulunmaktadır (TMK m. 25).

HUKUKİ NEDENLER   : 4721 sayılı TMK m. 23, 24, 25; 6098 sayılı TBK m. 49 vd., m. 56, 58; Anayasa m. 17, 20, 26; 6100 sayılı HMK ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : [EKRAN GÖRÜNTÜLERİ / YAYIN ÇIKTILARI], noter veya mahkeme aracılığıyla alınan tespit tutanağı, [VARSA: Cumhuriyet Başsavcılığı soruşturma dosyası [SORUŞTURMA NO]], davalıya ait hesap ve içeriklere ilişkin kayıtlar, ihtarname, müvekkilin mesleki ve ekonomik durumuna ilişkin belgeler, tanık beyanları, bilirkişi incelemesi, isticvap, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle, fazlaya ilişkin her türlü talep ve dava hakkımız saklı kalmak kaydıyla davanın KABULÜ ile;
1- Davalının [TARİH] tarihli eylemi ile müvekkilin kişilik haklarına hukuka aykırı olarak saldırdığının TESPİTİNE,
2- [TUTAR] TL manevi tazminatın saldırı tarihi olan [TARİH] tarihinden itibaren işleyecek yasal faiziyle birlikte davalıdan tahsiline,
3- Saldırının sonuçlarının ortadan kaldırılması bakımından [SOMUT TALEP — dava konusu içeriğin yayından kaldırılmasına ve erişimin engellenmesine] karar verilmesine,
4- Verilecek kararın masrafı davalıya ait olmak üzere [YAYIN ORGANI / MECRA]'da İLANINA,
5- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
];
