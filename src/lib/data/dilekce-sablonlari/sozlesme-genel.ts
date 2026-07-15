// Sözleşme, başvuru/talep ve kanun yolu şablonları.
//
// TELİF: Tüm içerik sıfırdan özgün üretilmiştir. Hiçbir ticari/telifli platformdan
// (Corpus, Lexpera vb.) metin alınmamıştır. Dilekçe yapısı HMK usul kuralıdır ve serbesttir.

import { type DilekceSablonu, IMZA_BLOGU } from "./tipler";

export const SOZLESME_GENEL_SABLONLARI: DilekceSablonu[] = [
  {
    id: "dava-alacak",
    kategori: "Sözleşme",
    baslik: "Alacak Davası Dilekçesi",
    aciklama: "Sözleşmeden doğan alacağın tahsili için genel dava dilekçesi iskeleti.",
    davaTuru: "Sözleşmeden doğan alacak",
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
KONU              : [SÖZLEŞME/İLİŞKİ] kaynaklı [TUTAR] TL alacağın faiziyle tahsili istemidir.

AÇIKLAMALAR:
1- Müvekkil ile davalı arasında [TARİH] tarihinde [SÖZLEŞMENİN KONUSU] konulu sözleşme kurulmuştur. (EK-1)
2- Müvekkil sözleşmeden doğan edimlerini eksiksiz yerine getirmiş; [TESLİM/İFA AÇIKLAMASI].
3- Davalı, sözleşmede kararlaştırılan [TUTAR] TL bedeli [VADE TARİHİ] tarihinde ödemesi gerekirken ödememiştir.
4- [TARİH] tarihli ihtarnameye rağmen ödeme yapılmamıştır. (EK-2)

HUKUKİ NEDENLER   : TBK m. 112 vd., HMK ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : Sözleşme, ihtarname, ticari defter ve kayıtlar, tanık, bilirkişi incelemesi, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle davanın KABULÜ ile;
1- [TUTAR] TL alacağın [VADE TARİHİ] tarihinden itibaren işleyecek [FAİZ TÜRÜ] faiziyle birlikte davalıdan tahsiline,
2- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "cevap-dilekcesi",
    kategori: "Sözleşme",
    baslik: "Davaya Cevap Dilekçesi",
    aciklama: "Usul itirazları + esasa ilişkin savunma düzenine sahip cevap iskeleti.",
    davaTuru: "Genel hukuk uyuşmazlığı",
    dilekceTipi: "Cevap dilekçesi",
    yetkiliMahkeme: "Davanın görüldüğü mahkeme",
    kaynak: "ozgun",
    icerik: `[İL] ( ). [MAHKEME] MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DOSYA NO          : [ESAS NO]
CEVAP VEREN
(DAVALI)          : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
VEKİLİ            : Av. [AD SOYAD]
DAVACI            : [AD SOYAD]
KONU              : Dava dilekçesine karşı cevaplarımızın sunulmasıdır.

USULE İLİŞKİN İTİRAZLARIMIZ:
1- [VARSA: Yetki itirazı — davanın [YETKİLİ MAHKEME]'de görülmesi gerekir; çünkü ...]
2- [VARSA: Görev, derdestlik, zamanaşımı vb. itirazlar]

ESASA İLİŞKİN CEVAPLARIMIZ:
1- Davacının [İDDİA] yönündeki iddiası gerçeği yansıtmamaktadır; zira [SOMUT AÇIKLAMA].
2- [TARİH] tarihli [BELGE] incelendiğinde [SAVUNMAYI DESTEKLEYEN OLGU] açıkça görülecektir. (EK-1)
3- Müvekkilin herhangi bir kusuru bulunmamaktadır; [KUSURSUZLUK AÇIKLAMASI].

HUKUKİ NEDENLER   : HMK m. 126 vd., [İLGİLİ KANUN MADDELERİ] ve sair mevzuat.
HUKUKİ DELİLLER   : [BELGELER], tanık, bilirkişi, isticvap, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Açıklanan nedenlerle; usul itirazlarımızın kabulü ile davanın usulden, aksi halde esastan REDDİNE, yargılama gideri ve vekâlet ücretinin davacıya yükletilmesine karar verilmesini saygıyla arz ve talep ederiz.

[TARİH]

Davalı Vekili
Av. [AD SOYAD]
(e-imzalıdır)`,
  },
  {
    id: "hizmet-sozlesmesi",
    kategori: "Sözleşme",
    baslik: "Hizmet / Vekâlet Sözleşmesi Taslağı",
    aciklama: "İki taraflı hizmet ilişkisi için sade sözleşme iskeleti.",
    davaTuru: "Hizmet ilişkisi",
    dilekceTipi: "Sözleşme taslağı",
    yetkiliMahkeme: "Sözleşmede kararlaştırılan yer mahkemeleri",
    kaynak: "ozgun",
    icerik: `HİZMET SÖZLEŞMESİ

1. TARAFLAR
İşbu sözleşme; [AD SOYAD/UNVAN] ("İş Sahibi") ile [AD SOYAD/UNVAN] ("Hizmet Veren") arasında [TARİH] tarihinde aşağıdaki koşullarla akdedilmiştir.

2. KONU
Hizmet Veren, [HİZMETİN TANIMI] işini işbu sözleşme koşullarına uygun olarak yerine getirecektir.

3. SÜRE
Sözleşme [BAŞLANGIÇ TARİHİ] tarihinde yürürlüğe girer ve [BİTİŞ TARİHİ / iş tesliminde] sona erer.

4. BEDEL VE ÖDEME
Hizmet bedeli KDV dâhil [TUTAR] TL olup; [ÖDEME PLANI — ör. %50 peşin, %50 teslimde] şeklinde [IBAN] hesabına ödenir.

5. TARAFLARIN YÜKÜMLÜLÜKLERİ
5.1. Hizmet Veren işi özenle, süresinde ve fen/sanat kurallarına uygun ifa eder.
5.2. İş Sahibi, ifa için gerekli bilgi ve belgeleri zamanında sağlar.

6. GİZLİLİK
Taraflar, sözleşme kapsamında öğrendikleri ticari sır ve kişisel verileri süresiz gizli tutar; KVKK yükümlülüklerine uyar.

7. FESİH
Taraflardan biri, diğerinin sözleşmeye esaslı aykırılığı hâlinde yazılı bildirimle sözleşmeyi haklı nedenle feshedebilir. [CEZAİ ŞART — varsa].

8. UYUŞMAZLIK ÇÖZÜMÜ
İşbu sözleşmeden doğan uyuşmazlıklarda [İL] mahkemeleri ve icra daireleri yetkilidir.

İŞ SAHİBİ                              HİZMET VEREN
[AD SOYAD — İMZA]                      [AD SOYAD — İMZA]`,
  },
  {
    id: "sozlesme-fesih-ihtari",
    kategori: "Sözleşme",
    baslik: "Sözleşmenin Haklı Nedenle Feshi İhtarnamesi",
    aciklama: "Karşı tarafın sözleşmeye aykırılığı nedeniyle önel verip fesih bildiren noter ihtarnamesi iskeleti.",
    davaTuru: "Sözleşmeye aykırılık ve fesih",
    dilekceTipi: "İhtarname (noter)",
    yetkiliMahkeme: "Noterlik aracılığıyla keşide edilir; mahkeme hitabı yoktur",
    kaynak: "ozgun",
    icerik: `İHTARNAME

KEŞİDECİ          : [AD SOYAD / UNVAN] (T.C./VKN: [NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
MUHATAP           : [AD SOYAD / UNVAN]
                    [ADRES]
KONU              : [TARİH] tarihli [SÖZLEŞMENİN ADI] sözleşmesine aykırılığın giderilmesi, aksi hâlde sözleşmenin haklı nedenle feshedileceğinin ihtarıdır.

AÇIKLAMALAR:
1- Müvekkil ile tarafınız arasında [TARİH] tarihinde [SÖZLEŞMENİN KONUSU] konulu sözleşme kurulmuş; müvekkil sözleşmeden doğan edimlerini eksiksiz ve süresinde yerine getirmiştir.
2- Buna karşılık tarafınız, sözleşmenin [MADDE NO] maddesinde üstlendiği [EDİM — ör. teslim / ödeme / ifa] borcunu [VADE TARİHİ] tarihinde yerine getirmesi gerekirken bugüne dek yerine getirmemiştir.
3- Söz konusu aykırılık nedeniyle müvekkil [SOMUT ZARAR / İŞ AKIŞININ AKSAMASI] ile karşı karşıya kalmış olup sözleşmenin devamı müvekkilden dürüstlük kuralı gereği beklenemez hâle gelmiştir.
4- [VARSA: [TARİH] tarihli yazılı bildirimimize karşın aykırılık giderilmemiştir.]

SONUÇ:
İşbu ihtarnamenin tebliğinden itibaren [SÜRE — ör. 7] gün içinde sözleşmeye aykırılığın giderilerek [SOMUT EDİM] borcunun ifa edilmesini; bu süre içinde ifa gerçekleşmediği takdirde ayrıca bir bildirime gerek kalmaksızın [TARİH] tarihli sözleşmenin HAKLI NEDENLE FESHEDİLMİŞ SAYILACAĞINI; müvekkilin [OLUMLU/OLUMSUZ] zararı ile [VARSA CEZAİ ŞART] alacağı için aleyhinize icra takibi ve dava yoluna başvurulacağını, yargılama gideri ve vekâlet ücretinin tarafınıza yükletileceğini ihtar ederiz.

Müvekkilin sözleşmeden ve ilgili mevzuattan doğan sair tüm hak ve talepleri saklıdır.

SAYIN NOTER; üç nüshadan ibaret işbu ihtarnamenin bir nüshasının muhataba tebliğini, bir nüshasının dairenizde saklanmasını, tebliğ şerhli nüshanın tarafımıza iadesini talep ederiz.

[TARİH]
Keşideci Vekili
Av. [AD SOYAD]`,
  },
  {
    id: "ihtarname",
    kategori: "Başvuru / Talep",
    baslik: "Noter İhtarnamesi (Ödeme İhtarı)",
    aciklama: "Alacağın ödenmesi için temerrüde düşürme amaçlı ihtarname iskeleti.",
    davaTuru: "Alacağın ödenmesi ve temerrüt",
    dilekceTipi: "İhtarname (noter)",
    yetkiliMahkeme: "Noterlik aracılığıyla keşide edilir; mahkeme hitabı yoktur",
    kaynak: "ozgun",
    icerik: `İHTARNAME

İHTAR EDEN        : [AD SOYAD / UNVAN] (T.C./VKN: [NO])
VEKİLİ            : Av. [AD SOYAD]
MUHATAP           : [AD SOYAD / UNVAN]
                    [ADRES]
KONU              : [TUTAR] TL alacağın ödenmesi ihtarıdır.

SAYIN MUHATAP;
1- Tarafınızla müvekkil arasında [TARİH] tarihli [SÖZLEŞME/İLİŞKİ] mevcuttur.
2- Bu ilişkiden doğan [TUTAR] TL borcunuz [VADE] tarihinde muaccel olmuş, bugüne dek ödenmemiştir.
3- İşbu ihtarnamenin tebliğinden itibaren [SÜRE — ör. 7] gün içinde yukarıda belirtilen tutarı işlemiş faiziyle birlikte [IBAN/HESAP] hesabına ödemenizi; aksi hâlde aleyhinize icra takibi ve dava yoluna başvurulacağını, yargılama gideri ve vekâlet ücretinin tarafınıza yükletileceğini ihtar ederiz.

SAYIN NOTER; üç nüshadan ibaret işbu ihtarnamenin bir nüshasının muhataba tebliğini, bir nüshasının dairenizde saklanmasını, tebliğ şerhli nüshanın tarafımıza iadesini talep ederiz.

[TARİH]
İhtar Eden Vekili
Av. [AD SOYAD]`,
  },
  {
    id: "genel-basvuru",
    kategori: "Başvuru / Talep",
    baslik: "Kuruma Genel Başvuru / Talep Dilekçesi",
    aciklama: "Resmî kurumlara bilgi/belge/işlem talebi için genel dilekçe iskeleti.",
    davaTuru: "İdari başvuru / bilgi edinme",
    dilekceTipi: "Başvuru dilekçesi",
    yetkiliMahkeme: "İlgili kurum / birim",
    kaynak: "ozgun",
    icerik: `[KURUM ADI]'NA
[BİRİM — ör. ... Müdürlüğü]

BAŞVURAN          : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
ADRES             : [ADRES]
TELEFON / E-POSTA : [TELEFON] / [E-POSTA]
KONU              : [TALEP KONUSU] hakkında.

Sayın Yetkili;

[TALEBİN GEREKÇESİ — kısa ve açık anlatım: hangi işlem/belge, neden gerekli, dayanak].

3071 sayılı Dilekçe Hakkının Kullanılmasına Dair Kanun ve [VARSA 4982 sayılı Bilgi Edinme Hakkı Kanunu] kapsamında; [SOMUT TALEP — ör. ... belgesinin tarafıma verilmesini / ... işleminin yapılmasını] saygılarımla arz ederim.

[TARİH]
[AD SOYAD]
(İmza)

EKLER:
1- [EK BELGE]`,
  },
  {
    id: "delil-tespiti",
    kategori: "Başvuru / Talep",
    baslik: "Delil Tespiti Talebi Dilekçesi",
    aciklama: "HMK m. 400 vd. uyarınca delillerin kaybolmadan tespiti için talep iskeleti.",
    davaTuru: "Delil tespiti",
    dilekceTipi: "Talep dilekçesi",
    yetkiliMahkeme: "Sulh Hukuk Mahkemesi (HMK m. 401)",
    kaynak: "ozgun",
    icerik: `[İL] ( ). SULH HUKUK MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

TESPİT İSTEYEN    : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
KARŞI TARAF       : [AD SOYAD / UNVAN]
                    [ADRES]
KONU              : [TESPİTİ İSTENEN OLGU/DURUM] hususunda HMK m. 400 vd. uyarınca delil tespiti yapılması istemidir.

AÇIKLAMALAR:
1- Müvekkil ile karşı taraf arasında [TARİH] tarihli [SÖZLEŞME/İLİŞKİ] bulunmakta olup, uyuşmazlık [UYUŞMAZLIĞIN ÖZETİ] noktasında toplanmaktadır.
2- Tespiti istenen olgu, açılacak/görülmekte olan davada müvekkilin hakkını ispat bakımından belirleyicidir. Bu husus HMK m. 400/1 anlamında hukuki yararı doğurmaktadır.
3- [TESPİT KONUSU — ör. taşınmazdaki imalatın seviyesi ve ayıpları / makinenin mevcut durumu / işyerindeki mevcut hâl] hâlihazırda [SOMUT SEBEP — ör. imalatın kapatılacak olması, malın niteliğinin bozulacak olması, mevcut durumun ortadan kalkacak olması] nedeniyle kısa süre içinde değişecek veya tamamen ortadan kalkacaktır.
4- Bu itibarla delillerin şimdiden tespit edilmemesi hâlinde ileride bu delillere hiç veya güçlükle başvurulabilecek; gecikme müvekkil bakımından hakkın kaybına yol açacaktır. Gecikmesinde sakınca bulunan hâl mevcuttur.
5- [VARSA: Aynı konuda [MAHKEME] nezdinde [ESAS NO] sayılı dosya derdesttir. / Henüz dava açılmamıştır.]
6- Tespitin, mahallinde ve [BİLİRKİŞİ UZMANLIK ALANI] uzmanı bilirkişi marifetiyle yapılması gerekmektedir.

HUKUKİ NEDENLER   : HMK m. 400, 401, 402, 403 ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : [SÖZLEŞME], [FOTOĞRAFLAR], keşif, bilirkişi incelemesi, tanık ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle;
1- Gecikmesinde sakınca bulunması ve delillerin kaybolma tehlikesi nedeniyle talebimizin KABULÜNE,
2- [TESPİT KONUSU] hususunda [ADRES] adresinde mahallinde KEŞİF yapılmasına ve [BİLİRKİŞİ UZMANLIK ALANI] uzmanı bilirkişi marifetiyle DELİL TESPİTİNE,
3- [VARSA: Karşı tarafa haber verilmeksizin tespit yapılmasına (HMK m. 403),]
4- Tespit tutanağı ve bilirkişi raporunun taraflara tebliğine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "ihtiyati-tedbir",
    kategori: "Başvuru / Talep",
    baslik: "İhtiyati Tedbir Talebi Dilekçesi",
    aciklama: "HMK m. 389 vd. uyarınca dava konusu üzerinde ihtiyati tedbir kararı verilmesi istemi iskeleti.",
    davaTuru: "İhtiyati tedbir",
    dilekceTipi: "Talep dilekçesi",
    yetkiliMahkeme: "Esas hakkında görevli ve yetkili mahkeme (HMK m. 390)",
    kaynak: "ozgun",
    icerik: `[İL] ( ). [MAHKEME] MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

— İhtiyati Tedbir Talebimiz Hakkındadır —

TEDBİR İSTEYEN    : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
KARŞI TARAF       : [AD SOYAD / UNVAN]
                    [ADRES]
[VARSA] DOSYA NO  : [ESAS NO]
KONU              : [TEDBİR KONUSU — ör. taşınmazın devrinin önlenmesi / şirket pay defterine şerh / işlemin durdurulması] hususunda HMK m. 389 vd. uyarınca ihtiyati tedbir kararı verilmesi istemidir.

AÇIKLAMALAR:
1- Müvekkil ile karşı taraf arasında [UYUŞMAZLIĞIN KONUSU] uyuşmazlığı bulunmakta olup, [DAVA AÇILDI: [MAHKEME] nezdinde [ESAS NO] sayılı dosya derdesttir / DAVA AÇILMADI: dava açılması hazırlıkları sürdürülmektedir].
2- Müvekkilin dava konusu üzerindeki hakkı [DAYANAK BELGE/OLGU] ile ortaya konulmakta olup, bu haliyle talebimiz HMK m. 390/3 uyarınca YAKLAŞIK İSPAT ölçüsünde delillendirilmiştir. (EK-1, EK-2)
3- Mevcut durumda meydana gelebilecek bir değişme nedeniyle hakkın elde edilmesi önemli ölçüde zorlaşacak, tamamen imkânsız hâle gelecek yahut gecikme sebebiyle müvekkil bakımından ciddi bir zarar doğacaktır. Nitekim karşı taraf [SOMUT TEHLİKE — ör. taşınmazı üçüncü kişiye devretme girişiminde bulunmuş / malvarlığını elden çıkarmaktadır].
4- Talep edilen tedbir, uyuşmazlığın çözümü bakımından ölçülü olup karşı tarafa gereğinden fazla külfet yüklememektedir.
5- Talebimizin karşı tarafa tebliğ edilerek incelenmesi hâlinde tedbirin amacı tehlikeye düşeceğinden, HMK m. 390/2 uyarınca karşı taraf dinlenmeksizin karar verilmesi gerekmektedir.
6- HMK m. 392 uyarınca takdir edilecek teminatı yatırmaya hazırız. [VARSA: Müvekkil [ADLİ YARDIM / TEMİNATTAN MUAFİYET NEDENİ] nedeniyle teminattan muaf tutulmalıdır.]
7- [DAVA AÇILMAMIŞSA: HMK m. 397/1 uyarınca tedbir kararının uygulanmasını talep ettiğimiz tarihten itibaren iki hafta içinde esas hakkındaki davanın açılacağını beyan ederiz.]

HUKUKİ NEDENLER   : HMK m. 389, 390, 391, 392, 393, 397 ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : [SÖZLEŞME], [TAPU KAYDI], [TİCARET SİCİL KAYITLARI], bilirkişi incelemesi, keşif ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle;
1- Talebimizin, gecikmesinde sakınca bulunması nedeniyle karşı taraf dinlenmeksizin ve İVEDİLİKLE incelenerek KABULÜNE,
2- [TEDBİR KONUSU — somut tedbirin kapsamı] hususunda İHTİYATİ TEDBİR KARARI VERİLMESİNE,
3- Kararın ilgili [TAPU MÜDÜRLÜĞÜ / TİCARET SİCİL MÜDÜRLÜĞÜ / KURUM] nezdinde uygulanması için müzekkere yazılmasına,
4- Yargılama gideri ve vekâlet ücretinin karşı tarafa yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "istinaf-basvuru",
    kategori: "Kanun Yolu",
    baslik: "İstinaf Başvuru Dilekçesi (Hukuk)",
    aciklama: "İlk derece kararına karşı BAM'a istinaf başvurusu iskeleti.",
    davaTuru: "Genel hukuk uyuşmazlığı",
    dilekceTipi: "İstinaf dilekçesi",
    yetkiliMahkeme: "Bölge Adliye Mahkemesi Hukuk Dairesi",
    kaynak: "ozgun",
    icerik: `[BAM ADI] BÖLGE ADLİYE MAHKEMESİ İLGİLİ HUKUK DAİRESİ'NE
Gönderilmek Üzere
[İL] ( ). [MAHKEME] MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DOSYA NO          : [ESAS NO] E., [KARAR NO] K.
İSTİNAF EDEN
(DAVACI/DAVALI)   : [AD SOYAD]
VEKİLİ            : Av. [AD SOYAD]
KARŞI TARAF       : [AD SOYAD]
KARAR TARİHİ      : [TARİH] (Tebliğ: [TEBLİĞ TARİHİ])
KONU              : [TARİH] tarihli kararın istinaf incelemesi sonucu KALDIRILMASI istemidir.

İSTİNAF NEDENLERİ:
1- USUL YÖNÜNDEN: Mahkemece [USUL HATASI — ör. delillerin toplanmaması, tanıkların dinlenmemesi, gerekçesiz karar] yönünde hukuka aykırı davranılmıştır (HMK m. 353).
2- ESAS YÖNÜNDEN: [MADDİ HATA/HUKUKİ NİTELENDİRME HATASI]. Dosyadaki [DELİL] dikkate alınmaksızın hüküm kurulması isabetsizdir.
3- Yerleşik Yargıtay uygulaması ([DAİRE], [ESAS/KARAR NO]) da bu yöndedir.

SONUÇ VE İSTEM    : İstinaf başvurumuzun kabulü ile ilk derece mahkemesi kararının KALDIRILMASINA, davanın [KABULÜNE/REDDİNE] karar verilmesine, yargılama gideri ve vekâlet ücretinin karşı tarafa yükletilmesine karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "istinaf-cevap",
    kategori: "Kanun Yolu",
    baslik: "İstinaf Başvurusuna Cevap Dilekçesi",
    aciklama: "Karşı tarafın istinaf başvurusuna karşı iki hafta içinde sunulan cevap iskeleti (HMK m. 343).",
    davaTuru: "Genel hukuk uyuşmazlığı",
    dilekceTipi: "İstinafa cevap dilekçesi",
    yetkiliMahkeme: "Bölge Adliye Mahkemesi Hukuk Dairesi",
    kaynak: "ozgun",
    icerik: `[İL] BÖLGE ADLİYE MAHKEMESİ ( ). HUKUK DAİRESİ BAŞKANLIĞI'NA
Gönderilmek Üzere
[İL] ( ). [MAHKEME] MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DOSYA NO          : [ESAS NO] E., [KARAR NO] K.
İSTİNAF EDEN      : [AD SOYAD]
                    Vekili: Av. [AD SOYAD]
KARŞI TARAF
(CEVAP VEREN)     : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
TEBLİĞ TARİHİ     : [İSTİNAF DİLEKÇESİNİN TEBLİĞ TARİHİ]
KONU              : Karşı tarafın istinaf başvurusuna karşı cevaplarımızın sunulmasıdır.

Not: İşbu dilekçe, HMK m. 343 uyarınca istinaf dilekçesinin tebliğinden itibaren iki haftalık yasal süresi içinde, kararı veren ilk derece mahkemesi aracılığıyla sunulmaktadır.

USULE İLİŞKİN CEVAPLARIMIZ:
1- [VARSA: İstinaf başvurusu, kararın tebliğinden itibaren yasal iki haftalık süre geçtikten sonra yapılmıştır; başvurunun SÜRE YÖNÜNDEN REDDİ gerekir.]
2- [VARSA: İstinaf dilekçesinde başvuru sebepleri ve gerekçesi somut biçimde gösterilmemiştir.]
3- [VARSA: Karar, miktar/nitelik itibarıyla kesin olup istinaf yolu kapalıdır.]

ESASA İLİŞKİN CEVAPLARIMIZ:
1- İlk derece mahkemesi, taraf delillerini eksiksiz toplamış, [DELİL] üzerinde gerekli incelemeyi yaptırmış ve vardığı sonucu denetime elverişli biçimde gerekçelendirmiştir. Kararda usule aykırılık bulunmamaktadır.
2- İstinaf edenin [İSTİNAF SEBEBİ] yönündeki iddiası yerinde değildir; zira [SOMUT ÇÜRÜTME — dosyadaki hangi delil, hangi olgu].
3- İstinaf edenin dayandığı [BELGE/OLGU], ilk derece yargılamasında tartışılmış ve mahkemece gerekçeli kararın [BÖLÜM] kısmında değerlendirilerek karşılanmıştır.
4- [VARSA: İstinaf dilekçesinde ileri sürülen [VAKIA], ilk derece yargılamasında hiç ileri sürülmemiş yeni bir vakıa olup HMK m. 357 uyarınca istinaf incelemesinde dinlenemez.]
5- Karar, hukuka ve dosya kapsamına uygun olup kaldırılmasını gerektiren herhangi bir sebep bulunmamaktadır.

[VARSA] KATILMA YOLUYLA İSTİNAF TALEBİMİZ:
1- HMK m. 348 uyarınca, işbu cevap dilekçemizle birlikte KATILMA YOLUYLA İSTİNAF yoluna başvuruyoruz.
2- Karar, [KATILMA İSTİNAF SEBEBİ — ör. reddedilen kalem / eksik hükmedilen tutar] yönünden müvekkil aleyhine hukuka aykırıdır.

HUKUKİ NEDENLER   : HMK m. 341 vd., 343, 348, 353, 355, 357 ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : İlk derece mahkemesi dosyası ve içeriğindeki tüm deliller, [BELGELER], bilirkişi raporu ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle;
1- Karşı tarafın istinaf başvurusunun öncelikle USULDEN, aksi hâlde ESASTAN REDDİNE,
2- [TARİH] tarihli ilk derece mahkemesi kararının HMK m. 353/1-b-1 uyarınca ESASTAN REDDİ suretiyle onanmasına,
3- [VARSA: Katılma yoluyla istinaf talebimizin KABULÜNE,]
4- İstinaf aşamasına ilişkin yargılama gideri ve vekâlet ücretinin istinaf edene yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

[TARİH]

Cevap Veren Vekili
Av. [AD SOYAD]
(e-imzalıdır)`,
  },
  {
    id: "temyiz-basvuru",
    kategori: "Kanun Yolu",
    baslik: "Temyiz Dilekçesi (Yargıtay)",
    aciklama: "BAM kararına karşı Yargıtay'a temyiz başvurusu iskeleti.",
    davaTuru: "Genel hukuk uyuşmazlığı",
    dilekceTipi: "Temyiz dilekçesi",
    yetkiliMahkeme: "Yargıtay İlgili Hukuk Dairesi",
    kaynak: "ozgun",
    icerik: `YARGITAY İLGİLİ HUKUK DAİRESİ BAŞKANLIĞI'NA
Gönderilmek Üzere
[BAM ADI] BÖLGE ADLİYE MAHKEMESİ ( ). HUKUK DAİRESİ'NE

DOSYA NO          : [ESAS NO] E., [KARAR NO] K.
TEMYİZ EDEN       : [AD SOYAD]
VEKİLİ            : Av. [AD SOYAD]
KARŞI TARAF       : [AD SOYAD]
KONU              : [TARİH] tarihli istinaf kararının BOZULMASI istemidir.

TEMYİZ NEDENLERİ:
1- Bölge adliye mahkemesince [HUKUKA AYKIRILIK] suretiyle hukuk kuralı yanlış uygulanmıştır (HMK m. 371).
2- [DELİL DEĞERLENDİRME HATASI / GEREKÇE EKSİKLİĞİ] karara etkili olmuştur.
3- Karar, Yargıtay'ın yerleşik içtihatlarına ([DAİRE], [ESAS/KARAR NO]) aykırıdır.

SONUÇ VE İSTEM    : Temyiz başvurumuzun kabulü ile hukuka aykırı kararın BOZULMASINA, yargılama gideri ve vekâlet ücretinin karşı tarafa yükletilmesine karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
];
