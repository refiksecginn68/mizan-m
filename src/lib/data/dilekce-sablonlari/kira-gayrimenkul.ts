// Kira ve Gayrimenkul kategorisi şablonları — TAMAMEN ÖZGÜN içerik.
//
// TELİF: Hiçbir ticari/telifli platformdan metin alınmamıştır. Dilekçenin yapısı
// HMK usul kuralıdır ve serbesttir; somut cümleler bu projede özgün üretilmiştir.
//
// GÖREV: Kira ilişkisinden doğan davalar ile ortaklığın giderilmesi sulh hukuk
// mahkemesinin görevindedir (HMK m. 4). Tapu iptali/tescil ve elatmanın önlenmesi
// asliye hukuk mahkemesinde görülür (HMK m. 2).
// YETKİ: Taşınmazın aynına ilişkin davalarda taşınmazın bulunduğu yer mahkemesi
// kesin yetkilidir (HMK m. 12).

import { type DilekceSablonu, IMZA_BLOGU } from "./tipler";

export const KIRA_GAYRIMENKUL_SABLONLARI: DilekceSablonu[] = [
  {
    id: "tahliye-taahhut",
    kategori: "Kira ve Gayrimenkul",
    baslik: "Tahliye Taahhüdüne Dayalı Tahliye Davası Dilekçesi",
    aciklama: "Kiracının yazılı tahliye taahhüdüne dayanarak kiralananın tahliyesi istemi (TBK m. 352/1).",
    davaTuru: "Tahliye taahhüdüne dayalı tahliye",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Sulh Hukuk Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). SULH HUKUK MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
TAŞINMAZ          : [İL]/[İLÇE], [MAHALLE], [ADA] ada [PARSEL] parsel
                    [BAĞIMSIZ BÖLÜM / KAPI NO]
DAVA DEĞERİ       : [TUTAR] TL (yıllık kira bedeli)
KONU              : Yazılı tahliye taahhüdüne dayalı olarak kiralananın TAHLİYESİ istemidir.

AÇIKLAMALAR:
1- Müvekkil, yukarıda künyesi yazılı taşınmazın malikidir. (EK-1: Tapu kaydı)
2- Taşınmaz, [SÖZLEŞME TARİHİ] başlangıç tarihli kira sözleşmesi ile aylık [TUTAR] TL bedelle davalıya konut/çatılı işyeri olarak kiralanmıştır. (EK-2: Kira sözleşmesi)
3- Davalı kiracı, kiralananın tesliminden sonra düzenlediği [TAAHHÜT TARİHİ] tarihli yazılı beyanı ile taşınmazı [TAHLİYE TARİHİ] tarihinde kayıtsız şartsız tahliye etmeyi taahhüt etmiştir. (EK-3: Tahliye taahhüdü)
4- Taahhüt, kiracının serbest iradesiyle ve kiralananın tesliminden sonra düzenlenmiş olup TBK m. 352/1 hükmünün aradığı geçerlilik koşullarını taşımaktadır.
5- Taahhüt edilen tarih gelmesine karşın davalı taşınmazı tahliye etmemiş, [TARİH] tarihli ihtarnameye de olumlu yanıt vermemiştir. (EK-4: İhtarname ve tebliğ şerhi)
6- Kira ilişkisinden kaynaklanan uyuşmazlıklarda dava şartı olan arabuluculuk sürecine başvurulmuş, [TARİH] tarihli görüşme anlaşmama ile sonuçlanmıştır. (EK-5: Arabuluculuk son tutanağı)
7- Bu nedenlerle işbu davanın açılması zorunluluğu doğmuştur.

HUKUKİ NEDENLER   : 6098 sayılı TBK m. 299 vd., m. 352/1; 6325 sayılı Kanun m. 18/B; 6100 sayılı HMK m. 4 ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : Tapu kaydı, kira sözleşmesi, tahliye taahhüdü, ihtarname ve tebliğ belgeleri, arabuluculuk son tutanağı, keşif, bilirkişi incelemesi, tanık, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle davanın KABULÜ ile;
1- Davalının yukarıda künyesi belirtilen taşınmazdan TAHLİYESİNE,
2- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "tahliye-temerrut",
    kategori: "Kira ve Gayrimenkul",
    baslik: "Temerrüt Nedeniyle Tahliye Davası Dilekçesi",
    aciklama: "Kira bedelinin ödenmemesi üzerine verilen süreye rağmen borcun ifa edilmemesi nedeniyle tahliye istemi (TBK m. 315).",
    davaTuru: "Kira bedelinin ödenmemesi (temerrüt) nedeniyle tahliye",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Sulh Hukuk Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). SULH HUKUK MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
TAŞINMAZ          : [İL]/[İLÇE], [MAHALLE], [ADA] ada [PARSEL] parsel
                    [BAĞIMSIZ BÖLÜM / KAPI NO]
DAVA DEĞERİ       : [TUTAR] TL (yıllık kira bedeli)
KONU              : Kira bedelinin ödenmemesi nedeniyle kiralananın TAHLİYESİ ve birikmiş kira alacağının tahsili istemidir.

AÇIKLAMALAR:
1- Müvekkil, yukarıda künyesi yazılı taşınmazın malikidir. (EK-1: Tapu kaydı)
2- Taşınmaz, [SÖZLEŞME TARİHİ] başlangıç tarihli kira sözleşmesi ile aylık [TUTAR] TL bedelle davalıya kiralanmış olup kira bedelinin her ayın [GÜN]. günü ödenmesi kararlaştırılmıştır. (EK-2: Kira sözleşmesi)
3- Davalı, [DÖNEM — ör. ... / ... ayları] kira bedellerini vadesinde ödememiş; ödenmeyen kira alacağı toplamı [TUTAR] TL'ye ulaşmıştır.
4- Müvekkil, [İHTAR TARİHİ] tarihinde keşide ettiği ve [TEBLİĞ TARİHİ] tarihinde davalıya tebliğ edilen ihtarname ile ödenmeyen kira bedellerinin TBK m. 315 uyarınca verilen otuz günlük süre içinde ödenmesini, aksi hâlde kira sözleşmesinin feshedileceğini bildirmiştir. (EK-3: İhtarname ve tebliğ şerhi)
5- Tanınan süre dolmasına rağmen davalı ödemede bulunmamış, temerrüdü devam etmiştir. Konut ve çatılı işyeri kiralarında öngörülen otuz günlük süre koşulu somut olayda gerçekleşmiştir.
6- Kira ilişkisinden kaynaklanan uyuşmazlıklarda dava şartı olan arabuluculuk sürecine başvurulmuş, [TARİH] tarihli görüşme anlaşmama ile sonuçlanmıştır. (EK-4: Arabuluculuk son tutanağı)
7- Bu nedenlerle işbu davanın açılması zorunlu hâle gelmiştir.

HUKUKİ NEDENLER   : 6098 sayılı TBK m. 299 vd., m. 313 vd., m. 315; 6325 sayılı Kanun m. 18/B; 6100 sayılı HMK m. 4 ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : Tapu kaydı, kira sözleşmesi, ihtarname ve tebliğ belgeleri, banka kayıtları ve ödeme dekontları, arabuluculuk son tutanağı, keşif, bilirkişi incelemesi, tanık, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle davanın KABULÜ ile;
1- Kira sözleşmesinin feshi ile davalının yukarıda künyesi belirtilen taşınmazdan TAHLİYESİNE,
2- Birikmiş [TUTAR] TL kira alacağının her bir kira bedelinin muaccel olduğu tarihten itibaren işleyecek [FAİZ TÜRÜ] faiziyle birlikte davalıdan tahsiline,
3- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "kira-tespit",
    kategori: "Kira ve Gayrimenkul",
    baslik: "Kira Bedelinin Tespiti Davası Dilekçesi",
    aciklama: "Yeni kira döneminde ödenecek kira bedelinin hakkaniyete uygun olarak belirlenmesi istemi (TBK m. 344).",
    davaTuru: "Kira bedelinin tespiti",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Sulh Hukuk Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). SULH HUKUK MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
TAŞINMAZ          : [İL]/[İLÇE], [MAHALLE], [ADA] ada [PARSEL] parsel
                    [BAĞIMSIZ BÖLÜM / KAPI NO]
DAVA DEĞERİ       : [TUTAR] TL (talep edilen yıllık kira artış farkı)
KONU              : [DÖNEM — ör. ... / ... tarihinde başlayan] kira dönemi için aylık kira bedelinin TESPİTİ istemidir.

AÇIKLAMALAR:
1- Müvekkil, yukarıda künyesi yazılı taşınmazın malikidir. (EK-1: Tapu kaydı)
2- Taşınmaz, [SÖZLEŞME TARİHİ] başlangıç tarihli kira sözleşmesi ile davalıya kiralanmış olup hâlen aylık [MEVCUT KİRA] TL kira bedeli ödenmektedir. (EK-2: Kira sözleşmesi)
3- Kira ilişkisi [SÜRE — ör. ... yıldır] kesintisiz devam etmekte olup, sözleşmede kararlaştırılan kira bedeli aradan geçen süre içinde taşınmazın gerçek getirisinin çok altında kalmıştır.
4- Taşınmazın bulunduğu bölgede benzer nitelik, konum ve büyüklükteki taşınmazlar için ödenen emsal kira bedelleri aylık [EMSAL TUTAR] TL civarındadır. Taşınmazın [ÖZELLİKLER — ör. brüt/net metrekare, kat, ısıtma, konum] nitelikleri de bu tespiti desteklemektedir.
5- Taraflar arasında yeni dönem kira bedeli konusunda anlaşma sağlanamamış; [TARİH] tarihli ihtarname ile yapılan artış talebi sonuçsuz kalmıştır. (EK-3: İhtarname)
6- Kira ilişkisinden kaynaklanan uyuşmazlıklarda dava şartı olan arabuluculuk sürecine başvurulmuş, [TARİH] tarihli görüşme anlaşmama ile sonuçlanmıştır. (EK-4: Arabuluculuk son tutanağı)
7- Kira bedelinin, hâkim tarafından taşınmazın durumu ve emsal kira bedelleri gözetilerek hakkaniyete uygun biçimde belirlenmesi gerekmektedir.

HUKUKİ NEDENLER   : 6098 sayılı TBK m. 299 vd., m. 344, m. 345; 6325 sayılı Kanun m. 18/B; 6100 sayılı HMK m. 4 ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : Tapu kaydı, kira sözleşmesi, ihtarname, emsal kira sözleşmeleri ve emsal araştırması, banka kayıtları, arabuluculuk son tutanağı, keşif, bilirkişi incelemesi, tanık, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle davanın KABULÜ ile;
1- [DÖNEM] kira döneminden geçerli olmak üzere aylık kira bedelinin brüt [TALEP EDİLEN TUTAR] TL olarak TESPİTİNE,
2- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "tapu-iptal-tescil",
    kategori: "Kira ve Gayrimenkul",
    baslik: "Tapu İptali ve Tescil Davası Dilekçesi",
    aciklama: "Yolsuz tescil nedeniyle tapu kaydının iptali ile taşınmazın müvekkil adına tesciline karar verilmesi istemi.",
    davaTuru: "Tapu iptali ve tescil",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Asliye Hukuk Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). ASLİYE HUKUK MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

— Taşınmazın aynına ilişkin dava olup taşınmazın bulunduğu yer mahkemesi kesin yetkilidir (HMK m. 12). —

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
TAŞINMAZ          : [İL]/[İLÇE], [MAHALLE], [ADA] ada [PARSEL] parsel
                    [YÜZÖLÇÜMÜ / NİTELİK / VARSA BAĞIMSIZ BÖLÜM]
DAVA DEĞERİ       : [TUTAR] TL (taşınmazın dava tarihindeki değeri)
KONU              : Taşınmaza ilişkin tapu kaydının İPTALİ ile müvekkil adına TESCİLİ; bu talep kabul görmezse [TUTAR] TL tazminata hükmedilmesi istemidir.

AÇIKLAMALAR:
1- Yukarıda künyesi yazılı taşınmaz hâlen davalı adına kayıtlı görünmektedir. (EK-1: Tapu kaydı ve tapu işlem dosyası)
2- Müvekkil, taşınmaz üzerinde [KAZANIM SEBEBİ — ör. ... tarihli satış vaadi sözleşmesi / miras / bedelin ödenmesi] nedeniyle hak sahibidir; [SOMUT OLGULARIN KRONOLOJİK ANLATIMI].
3- Davalı adına yapılan tescil, [YOLSUZLUK SEBEBİ — ör. muvazaa / hukuki sebebin geçersizliği / iradeyi sakatlayan hâl] nedeniyle hukuki sebepten yoksundur ve yolsuz tescil niteliğindedir.
4- Tapu sicilindeki kayıt müvekkilin mülkiyet hakkını zedelemekte olup, TMK m. 1025 uyarınca yolsuz tescilin düzeltilmesi gerekmektedir.
5- Davalının iyiniyetli olduğundan söz edilemez; zira [İYİNİYETİ ORTADAN KALDIRAN OLGULAR].
6- Taşınmazın üçüncü kişilere devri hâlinde telafisi güç zararlar doğacağından tapu kaydına tedbir konulması zorunludur.
7- Bu nedenlerle işbu davanın açılması zorunluluğu doğmuştur.

HUKUKİ NEDENLER   : 4721 sayılı TMK m. 683, m. 705, m. 1023, m. 1024, m. 1025; 6098 sayılı TBK; 6100 sayılı HMK m. 2, m. 12, m. 389 vd. ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : Tapu kaydı ve tapu işlem dosyası, kadastro ve tapu tesis kayıtları, veraset ilamı, banka kayıtları ve ödeme belgeleri, keşif, bilirkişi incelemesi, tanık, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle;
1- Öncelikle taşınmazın üçüncü kişilere devrinin önlenmesi bakımından tapu kaydına İHTİYATİ TEDBİR KONULMASINA,
2- Davanın KABULÜ ile taşınmazın davalı adına olan tapu kaydının İPTALİNE ve müvekkil adına TESCİLİNE,
3- Tescil talebinin kabul görmemesi hâlinde fazlaya ilişkin haklarımız saklı kalmak kaydıyla şimdilik [TUTAR] TL tazminatın dava tarihinden itibaren işleyecek [FAİZ TÜRÜ] faiziyle birlikte davalıdan tahsiline,
4- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "elatmanin-onlenmesi",
    kategori: "Kira ve Gayrimenkul",
    baslik: "Elatmanın Önlenmesi ve Ecrimisil Davası Dilekçesi",
    aciklama: "Taşınmaza haksız müdahalenin men'i, eski hâle getirme ve haksız kullanım dönemine ilişkin ecrimisil istemi.",
    davaTuru: "Elatmanın önlenmesi (müdahalenin men'i) ve ecrimisil",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Asliye Hukuk Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). ASLİYE HUKUK MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

— Taşınmazın aynına ilişkin dava olup taşınmazın bulunduğu yer mahkemesi kesin yetkilidir (HMK m. 12). —

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
TAŞINMAZ          : [İL]/[İLÇE], [MAHALLE], [ADA] ada [PARSEL] parsel
                    [YÜZÖLÇÜMÜ / NİTELİK]
DAVA DEĞERİ       : [TUTAR] TL (elatılan kısmın değeri ile talep edilen ecrimisil toplamı)
KONU              : Taşınmaza vaki haksız elatmanın ÖNLENMESİ, muhdesatın kaldırılması ve fazlaya ilişkin haklarımız saklı kalmak kaydıyla şimdilik [TUTAR] TL ECRİMİSİLİN tahsili istemidir.

AÇIKLAMALAR:
1- Müvekkil, yukarıda künyesi yazılı taşınmazın [TAM / [PAY] paylı] malikidir. (EK-1: Tapu kaydı)
2- Davalı, hiçbir hukuki dayanağı bulunmaksızın taşınmazın [ELATILAN KISIM — ör. yaklaşık ... m² bölümünü] fiilen kullanmakta; bu alanda [MÜDAHALENİN NİTELİĞİ — ör. yapı/eklenti inşa etme, tarımsal kullanım, işgal] suretiyle müvekkilin mülkiyet hakkına müdahale etmektedir.
3- Elatma [BAŞLANGIÇ TARİHİ] tarihinden bu yana kesintisiz sürmekte olup davalının taşınmazı kullanmasını haklı kılan kira, intifa veya başka bir hukuki ilişki bulunmamaktadır.
4- Müvekkil, [İHTAR TARİHİ] tarihli ihtarname ile davalıdan müdahalenin sonlandırılmasını ve taşınmazın tahliyesini talep etmiş; ihtarname [TEBLİĞ TARİHİ] tarihinde tebliğ edilmesine rağmen sonuç alınamamıştır. (EK-2: İhtarname ve tebliğ şerhi)
5- Davalı, ihtarnamenin tebliğinden itibaren kötüniyetli zilyet konumundadır; haksız kullanım süresince taşınmazın getirisinden yoksun kalan müvekkil lehine ecrimisile hükmedilmesi gerekmektedir.
6- Talep edilen ecrimisil, [DÖNEM — ör. ... / ... tarihleri arası] dönemine ilişkin olup taşınmazın emsal kira getirisi esas alınarak hesaplanacaktır. Kesin miktar keşif ve bilirkişi incelemesi sonucunda belirlenecektir.
7- Bu nedenlerle işbu davanın açılması zorunluluğu doğmuştur.

HUKUKİ NEDENLER   : 4721 sayılı TMK m. 683, m. 995; 6098 sayılı TBK; 6100 sayılı HMK m. 2, m. 12, m. 107 ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : Tapu kaydı, kadastro ve çap kayıtları, imar durumu ve mimari proje, ihtarname ve tebliğ belgeleri, emsal kira sözleşmeleri, keşif, bilirkişi incelemesi, tanık, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle davanın KABULÜ ile;
1- Müvekkilin maliki bulunduğu taşınmaza davalı tarafından yapılan haksız ELATMANIN ÖNLENMESİNE,
2- Davalı tarafından taşınmaz üzerinde meydana getirilen muhdesatın KALDIRILMASINA ve taşınmazın eski hâle getirilmesine,
3- Fazlaya ilişkin haklarımız saklı kalmak kaydıyla şimdilik [TUTAR] TL ecrimisilin dava tarihinden itibaren işleyecek [FAİZ TÜRÜ] faiziyle birlikte davalıdan tahsiline,
4- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "ortakligin-giderilmesi",
    kategori: "Kira ve Gayrimenkul",
    baslik: "Ortaklığın Giderilmesi (İzale-i Şuyu) Davası Dilekçesi",
    aciklama: "Paylı veya elbirliği mülkiyetine konu taşınmazda ortaklığın aynen taksim, mümkün değilse satış yoluyla giderilmesi istemi.",
    davaTuru: "Ortaklığın giderilmesi (izale-i şuyu)",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Sulh Hukuk Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). SULH HUKUK MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

— Taşınmazın bulunduğu yer mahkemesi kesin yetkilidir (HMK m. 12). —

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALILAR         : 1- [AD SOYAD] (T.C.: [T.C. KİMLİK NO]) — [ADRES]
                    2- [AD SOYAD] (T.C.: [T.C. KİMLİK NO]) — [ADRES]
                    3- [DİĞER PAYDAŞLAR]
TAŞINMAZ          : [İL]/[İLÇE], [MAHALLE], [ADA] ada [PARSEL] parsel
                    [YÜZÖLÇÜMÜ / NİTELİK / VARSA BAĞIMSIZ BÖLÜM]
DAVA DEĞERİ       : [TUTAR] TL (müvekkilin payına düşen değer)
KONU              : Taşınmaz üzerindeki ortaklığın öncelikle aynen taksim, bu mümkün olmadığı takdirde SATIŞ suretiyle GİDERİLMESİ istemidir.

AÇIKLAMALAR:
1- Yukarıda künyesi yazılı taşınmaz, müvekkil ile davalıların [PAYLI / ELBİRLİĞİ] mülkiyetindedir. Müvekkilin payı [PAY ORANI]'dır. (EK-1: Tapu kaydı ve paydaşlar listesi)
2- Ortaklık [SEBEP — ör. ... tarihinde vefat eden [MURİS AD SOYAD]'dan intikal / satın alma] yoluyla doğmuştur. (EK-2: Veraset ilamı)
3- Paydaşlar arasında taşınmazın kullanımı ve idaresi konusunda anlaşma sağlanamamakta, süregelen uyuşmazlık nedeniyle müvekkil payından gereği gibi yararlanamamaktadır.
4- Taşınmazın rızaen taksimi yönünde yapılan girişimler sonuçsuz kalmış; paydaşlar arasında paylaşma biçimi üzerinde uzlaşma sağlanamamıştır.
5- Ortaklığın devamını zorunlu kılan bir sözleşme veya yasal engel bulunmamaktadır; müvekkil her zaman paylaşma isteminde bulunabilir (TMK m. 698).
6- Taşınmazın niteliği, yüzölçümü ve imar durumu itibarıyla aynen taksimin mümkün olup olmadığı keşif ve bilirkişi incelemesi ile belirlenecektir. Aynen taksim mümkün değilse ortaklığın satış suretiyle giderilmesi gerekmektedir (TMK m. 699).
7- Bu nedenlerle işbu davanın açılması zorunluluğu doğmuştur.

HUKUKİ NEDENLER   : 4721 sayılı TMK m. 683, m. 688 vd., m. 698, m. 699, m. 701 vd.; 6100 sayılı HMK m. 4, m. 12; 2004 sayılı İİK'nın satışa ilişkin hükümleri ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : Tapu kaydı, paydaşlar listesi, veraset ilamı, nüfus kayıtları, kadastro ve çap kayıtları, imar durumu, keşif, bilirkişi incelemesi, tanık, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle davanın KABULÜ ile;
1- Yukarıda künyesi belirtilen taşınmaz üzerindeki ortaklığın öncelikle AYNEN TAKSİM suretiyle giderilmesine,
2- Aynen taksimin mümkün olmaması hâlinde ortaklığın SATIŞ suretiyle giderilmesine ve satış bedelinin paydaşlara payları oranında dağıtılmasına,
3- Yargılama giderleri ile vekâlet ücretinin paylar oranında taraflara yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
];
