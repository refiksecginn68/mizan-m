// Örnek dilekçe şablonları — TAMAMEN ÖZGÜN içerik.
// Standart Türk hukuk usulü yapısı + [KÖŞELİ PARANTEZ] yer tutucular.
// Hiçbir ticari platformdan (Lexpera vb.) metin alınmamıştır; telif riski yoktur.

export interface DilekceSablonu {
  id: string;
  kategori: string;
  baslik: string;
  aciklama: string;
  icerik: string;
}

export const SABLON_KATEGORILERI = [
  "Dava Dilekçesi",
  "Cevap Dilekçesi",
  "İstinaf",
  "Temyiz",
  "İcra / İtiraz",
  "İhtarname",
  "İş Hukuku",
  "Aile Hukuku",
  "Ceza / Şikâyet",
  "İdari",
  "Sözleşme",
  "Başvuru / Talep",
] as const;

const IMZA_BLOGU = `[TARİH]

Davacı Vekili
Av. [AD SOYAD]
(e-imzalıdır)`;

export const DILEKCE_SABLONLARI: DilekceSablonu[] = [
  {
    id: "dava-alacak",
    kategori: "Dava Dilekçesi",
    baslik: "Alacak Davası Dilekçesi",
    aciklama: "Sözleşmeden doğan alacağın tahsili için genel dava dilekçesi iskeleti.",
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
    kategori: "Cevap Dilekçesi",
    baslik: "Davaya Cevap Dilekçesi",
    aciklama: "Usul itirazları + esasa ilişkin savunma düzenine sahip cevap iskeleti.",
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
    id: "istinaf-basvuru",
    kategori: "İstinaf",
    baslik: "İstinaf Başvuru Dilekçesi (Hukuk)",
    aciklama: "İlk derece kararına karşı BAM'a istinaf başvurusu iskeleti.",
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
    id: "temyiz-basvuru",
    kategori: "Temyiz",
    baslik: "Temyiz Dilekçesi (Yargıtay)",
    aciklama: "BAM kararına karşı Yargıtay'a temyiz başvurusu iskeleti.",
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
  {
    id: "icra-itiraz",
    kategori: "İcra / İtiraz",
    baslik: "İcra Takibine İtiraz Dilekçesi",
    aciklama: "İlamsız icra takibinde borca ve ferilerine itiraz iskeleti (İİK m. 62).",
    icerik: `[İL] ( ). İCRA DAİRESİ MÜDÜRLÜĞÜ'NE

DOSYA NO          : [TAKİP NO]
İTİRAZ EDEN
(BORÇLU)          : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
VEKİLİ            : Av. [AD SOYAD]
ALACAKLI          : [AD SOYAD / UNVAN]
KONU              : Ödeme emrine süresinde İTİRAZLARIMIZDIR.

İTİRAZLARIMIZ:
1- BORCA İTİRAZ: Müvekkilin alacaklıya [TUTAR] TL borcu bulunmamaktadır; [BORCUN DOĞMADIĞI/ÖDENDİĞİ AÇIKLAMASI].
2- FAİZE VE FERİLERE İTİRAZ: Talep edilen faiz oranı ve işlemiş faiz tutarı hukuka aykırıdır.
3- [VARSA: İMZAYA İTİRAZ — takibe dayanak belgedeki imza müvekkile ait değildir.]
4- Yetkiye itiraz ediyoruz; yetkili icra dairesi [YER] icra daireleridir.

SONUÇ VE İSTEM    : Ödeme emrine, borca, faize ve tüm ferilere itiraz ettiğimizin kabulü ile TAKİBİN DURDURULMASINA karar verilmesini saygıyla arz ve talep ederiz.

[TARİH]

Borçlu Vekili
Av. [AD SOYAD]
(e-imzalıdır)`,
  },
  {
    id: "ihtarname",
    kategori: "İhtarname",
    baslik: "Noter İhtarnamesi (Ödeme İhtarı)",
    aciklama: "Alacağın ödenmesi için temerrüde düşürme amaçlı ihtarname iskeleti.",
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
    id: "ise-iade",
    kategori: "İş Hukuku",
    baslik: "İşe İade Davası Dilekçesi",
    aciklama: "Geçersiz fesih nedeniyle işe iade istemi (arabuluculuk sonrası) iskeleti.",
    icerik: `[İL] ( ). İŞ MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
VEKİLİ            : Av. [AD SOYAD]
DAVALI            : [İŞVEREN UNVANI]
KONU              : Feshin geçersizliğinin tespiti ile işe iade istemidir.

AÇIKLAMALAR:
1- Müvekkil, davalı işyerinde [İŞE GİRİŞ TARİHİ] tarihinden fesih tarihine kadar [GÖREV] olarak kesintisiz çalışmıştır.
2- İş sözleşmesi [FESİH TARİHİ] tarihinde, [FESİH GEREKÇESİ] gerekçesiyle feshedilmiştir; ancak bu gerekçe geçerli neden niteliği taşımamaktadır (İş K. m. 18).
3- Fesih yazılı fesih bildirimi/savunma alma gibi usul şartlarına da aykırıdır (İş K. m. 19).
4- İşyerinde 30'dan fazla işçi çalışmakta olup müvekkilin kıdemi 6 ayı aşmaktadır; iş güvencesi kapsamındadır.
5- [TARİH] tarihinde arabuluculuk süreci anlaşmama ile sonuçlanmıştır. (EK-1: Son tutanak)

HUKUKİ NEDENLER   : İş K. m. 17-21, 7036 sayılı Kanun ve sair mevzuat.
HUKUKİ DELİLLER   : SGK kayıtları, işyeri özlük dosyası, fesih bildirimi, arabuluculuk son tutanağı, tanık, bilirkişi ve her türlü yasal delil.

SONUÇ VE İSTEM    : Davanın kabulü ile feshin GEÇERSİZLİĞİNİN TESPİTİNE ve müvekkilin İŞE İADESİNE; işe başlatılmama hâlinde [4-8] aylık ücret tutarında tazminat ile boşta geçen süreye ilişkin 4 aya kadar ücret ve diğer haklarının belirlenmesine; yargılama gideri ve vekâlet ücretinin davalıya yükletilmesine karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "anlasmali-bosanma",
    kategori: "Aile Hukuku",
    baslik: "Anlaşmalı Boşanma Dava Dilekçesi",
    aciklama: "TMK m. 166/3 uyarınca protokole dayalı anlaşmalı boşanma iskeleti.",
    icerik: `[İL] ( ). AİLE MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
VEKİLİ            : Av. [AD SOYAD]
DAVALI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
KONU              : Anlaşmalı boşanma istemidir (TMK m. 166/3).

AÇIKLAMALAR:
1- Taraflar [EVLİLİK TARİHİ] tarihinde evlenmiş olup evlilik 1 yıldan uzun sürmüştür. Bu evlilikten [VARSA ÇOCUK BİLGİSİ / müşterek çocukları yoktur].
2- Evlilik birliği taraflar bakımından temelinden sarsılmış olup taraflar boşanma ve tüm sonuçları üzerinde özgür iradeleriyle anlaşmışlardır.
3- Boşanmanın mali sonuçları, [VARSA: velayet ve kişisel ilişki,] nafaka ve eşya paylaşımı ekli protokolde düzenlenmiştir. (EK-1: Protokol)
4- Taraflar duruşmada hazır bulunarak iradelerini bizzat açıklayacaklardır.

HUKUKİ NEDENLER   : TMK m. 166/3 ve sair mevzuat.
SONUÇ VE İSTEM    : Davanın kabulü ile tarafların ekli protokol çerçevesinde BOŞANMALARINA ve protokolün karara aynen geçirilmesine karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "suc-duyurusu",
    kategori: "Ceza / Şikâyet",
    baslik: "Suç Duyurusu / Şikâyet Dilekçesi",
    aciklama: "Cumhuriyet Başsavcılığına şikâyet ve soruşturma istemi iskeleti.",
    icerik: `[İL] CUMHURİYET BAŞSAVCILIĞI'NA

MÜŞTEKİ           : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
VEKİLİ            : Av. [AD SOYAD]
ŞÜPHELİ           : [AD SOYAD / KİMLİĞİ TESPİT EDİLEMEDİ]
SUÇ               : [SUÇ ADI — ör. dolandırıcılık (TCK m. 157), tehdit (TCK m. 106)]
SUÇ TARİHİ / YERİ : [TARİH] / [YER]
KONU              : Şüpheli hakkında soruşturma başlatılarak kamu davası açılması istemidir.

AÇIKLAMALAR:
1- [OLAYIN KRONOLOJİK ANLATIMI — kim, ne zaman, nerede, nasıl].
2- [DELİLLERE BAĞLAMA — mesaj kayıtları, dekont, tanık vb.] (EK-1, EK-2)
3- Anlatılan eylem [TCK MADDE] kapsamında suç teşkil etmektedir. Müvekkil şikâyetçidir.

HUKUKİ DELİLLER   : [BELGELER], tanık beyanları, HTS/kamera kayıtları, bilirkişi ve her türlü yasal delil.

SONUÇ VE İSTEM    : Şüpheli hakkında soruşturma yürütülerek eylemine uyan [TCK MADDE] uyarınca cezalandırılması için hakkında KAMU DAVASI AÇILMASINA karar verilmesini saygıyla arz ve talep ederiz.

[TARİH]
Müşteki Vekili
Av. [AD SOYAD]
(e-imzalıdır)`,
  },
  {
    id: "iptal-davasi",
    kategori: "İdari",
    baslik: "İdari İşlemin İptali Dava Dilekçesi",
    aciklama: "İYUK m. 2 kapsamında iptal davası + yürütmenin durdurulması istemi.",
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
    id: "hizmet-sozlesmesi",
    kategori: "Sözleşme",
    baslik: "Hizmet / Vekâlet Sözleşmesi Taslağı",
    aciklama: "İki taraflı hizmet ilişkisi için sade sözleşme iskeleti.",
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
    id: "genel-basvuru",
    kategori: "Başvuru / Talep",
    baslik: "Kuruma Genel Başvuru / Talep Dilekçesi",
    aciklama: "Resmî kurumlara bilgi/belge/işlem talebi için genel dilekçe iskeleti.",
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
    id: "kidem-ihbar-alacak",
    kategori: "İş Hukuku",
    baslik: "Kıdem ve İhbar Tazminatı Dava Dilekçesi",
    aciklama: "İşçilik alacakları (kıdem, ihbar, fazla mesai) belirsiz alacak iskeleti.",
    icerik: `[İL] ( ). İŞ MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
VEKİLİ            : Av. [AD SOYAD]
DAVALI            : [İŞVEREN UNVANI]
KONU              : Belirsiz alacak davası — kıdem ve ihbar tazminatı ile işçilik alacaklarının tahsili istemidir. (HMK m. 107)

AÇIKLAMALAR:
1- Müvekkil, davalı işyerinde [GİRİŞ TARİHİ]–[ÇIKIŞ TARİHİ] arasında [GÖREV] olarak, son brüt [ÜCRET] TL ücretle çalışmıştır.
2- İş sözleşmesi işverence [FESİH ŞEKLİ — haklı neden olmaksızın] feshedilmiştir; kıdem ve ihbar tazminatı ödenmemiştir.
3- Müvekkil haftada ortalama [SAAT] saat fazla çalışma yapmış, ulusal bayram ve genel tatillerde çalıştırılmış, karşılığı ödenmemiştir.
4- [TARİH] tarihli arabuluculuk görüşmesi anlaşmama ile sonuçlanmıştır. (EK-1)

HUKUKİ NEDENLER   : İş K. m. 17, 32, 41, 46, 47, 57; 1475 s. K. m. 14; HMK m. 107 ve sair mevzuat.
HUKUKİ DELİLLER   : SGK kayıtları, işyeri özlük dosyası, ücret bordroları, puantaj, tanık, bilirkişi ve her türlü yasal delil.

SONUÇ VE İSTEM    : Fazlaya ilişkin haklarımız saklı kalmak kaydıyla şimdilik;
1- [TUTAR] TL kıdem tazminatının fesih tarihinden itibaren en yüksek banka mevduat faiziyle,
2- [TUTAR] TL ihbar tazminatı ile [TUTAR] TL fazla çalışma ve [TUTAR] TL UBGT alacağının dava/temerrüt tarihinden itibaren en yüksek banka mevduat faiziyle
davalıdan tahsiline; yargılama gideri ve vekâlet ücretinin davalıya yükletilmesine karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
];
