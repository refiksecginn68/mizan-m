// İcra ve İflas hukuku dilekçe şablonları — TAMAMEN ÖZGÜN içerik.
// Yapı HMK/İİK usul kurallarından; somut cümleler sıfırdan yazılmıştır.

import { type DilekceSablonu, IMZA_BLOGU } from "./tipler";

export const ICRA_SABLONLARI: DilekceSablonu[] = [
  {
    id: "icra-itiraz",
    kategori: "İcra ve İflas",
    baslik: "İcra Takibine İtiraz Dilekçesi",
    aciklama: "İlamsız icra takibinde borca ve ferilerine itiraz iskeleti (İİK m. 62).",
    davaTuru: "Ödeme emrine itiraz",
    dilekceTipi: "İtiraz dilekçesi",
    yetkiliMahkeme: "İcra Dairesi",
    kaynak: "ozgun",
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
    id: "itirazin-iptali",
    kategori: "İcra ve İflas",
    baslik: "İtirazın İptali Dava Dilekçesi",
    aciklama: "Ödeme emrine itiraz üzerine duran takibin devamı için açılan itirazın iptali davası iskeleti (İİK m. 67).",
    davaTuru: "İtirazın iptali ve icra inkâr tazminatı",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Asliye Hukuk Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). ASLİYE HUKUK MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DAVACI
(ALACAKLI)        : [AD SOYAD / UNVAN] (T.C./VKN: [NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI
(BORÇLU)          : [AD SOYAD / UNVAN]
                    [ADRES]
İCRA DOSYA NO     : [İL] ( ). İcra Müdürlüğü [YIL]/[NO] E.
DAVA DEĞERİ       : [TUTAR] TL
KONU              : Davalının haksız itirazının İPTALİ ile takibin devamına ve icra inkâr tazminatına hükmedilmesi istemidir.

AÇIKLAMALAR:
1- Müvekkil ile davalı arasında [TARİH] tarihinde [SÖZLEŞME/TİCARİ İLİŞKİ] kurulmuş; müvekkil edimini eksiksiz ifa etmiştir. (EK-1)
2- Bu ilişkiden doğan [TUTAR] TL alacak [VADE TARİHİ] tarihinde muaccel olmuş, davalı ödeme yapmamıştır. (EK-2)
3- Alacağın tahsili için [İL] ( ). İcra Müdürlüğü'nün [YIL]/[NO] E. sayılı dosyası ile ilamsız takip başlatılmış, ödeme emri davalıya [TEBLİĞ TARİHİ] tarihinde tebliğ edilmiştir.
4- Davalı [İTİRAZ TARİHİ] tarihinde borca ve ferilerine itiraz etmiş, takip bu nedenle durmuştur. İtiraz tarafımıza [TEBLİĞ/ÖĞRENME TARİHİ] tarihinde bildirilmiştir. İşbu dava, İİK m. 67 uyarınca öngörülen bir yıllık süre içinde açılmaktadır.
5- Davalının itirazı hiçbir somut dayanaktan yoksundur. Borcun varlığı [DAYANAK BELGE — fatura, sözleşme, teslim tutanağı, cari hesap ekstresi] ile sabittir. (EK-3)
6- Davalı, alacağı ve miktarını gerçeğe aykırı biçimde inkâr ederek müvekkili dava açmak zorunda bırakmıştır. Alacak likit ve belgeye dayalı olduğundan, hükmolunan tutarın yüzde yirmisinden az olmamak üzere icra inkâr tazminatına hükmedilmesi gerekmektedir.

HUKUKİ NEDENLER   : 2004 sayılı İİK m. 67, 6098 sayılı TBK m. 112 vd., 6100 sayılı HMK ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : [İL] ( ). İcra Müdürlüğü [YIL]/[NO] E. sayılı takip dosyası, sözleşme, faturalar, teslim belgeleri, ticari defter ve kayıtlar, banka kayıtları, tanık, bilirkişi incelemesi, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle davanın KABULÜ ile;
1- Davalının [İL] ( ). İcra Müdürlüğü'nün [YIL]/[NO] E. sayılı dosyasına yaptığı itirazın İPTALİNE ve takibin [TUTAR] TL asıl alacak ve ferileri üzerinden DEVAMINA,
2- Alacağın likit olması nedeniyle davalı aleyhine, hükmolunan tutarın yüzde yirmisinden az olmamak üzere İCRA İNKÂR TAZMİNATINA hükmedilmesine,
3- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "itirazin-kaldirilmasi",
    kategori: "İcra ve İflas",
    baslik: "İtirazın Kaldırılması Talep Dilekçesi",
    aciklama: "İİK m. 68'de sayılan belgeye dayanan alacakta itirazın icra hukuk mahkemesinde kaldırılması istemi.",
    davaTuru: "İtirazın kaldırılması",
    dilekceTipi: "Talep dilekçesi",
    yetkiliMahkeme: "İcra Hukuk Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). İCRA HUKUK MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

ALACAKLI          : [AD SOYAD / UNVAN] (T.C./VKN: [NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
BORÇLU            : [AD SOYAD / UNVAN]
                    [ADRES]
İCRA DOSYA NO     : [İL] ( ). İcra Müdürlüğü [YIL]/[NO] E.
TALEP DEĞERİ      : [TUTAR] TL
KONU              : Borçlunun itirazının KALDIRILMASI ile takibin devamına ve icra inkâr tazminatına hükmedilmesi istemidir.

AÇIKLAMALAR:
1- Müvekkilin borçludan [TUTAR] TL alacağı bulunmakta olup alacak, [DAYANAK BELGE — imzası ikrar edilmiş adi senet / noterlikçe onaylı belge / resmî dairelerin yetkisi içinde düzenlediği belge] ile belgelendirilmiştir. (EK-1)
2- Alacağın tahsili için [İL] ( ). İcra Müdürlüğü'nün [YIL]/[NO] E. sayılı dosyası ile takip başlatılmış; ödeme emri borçluya [TEBLİĞ TARİHİ] tarihinde tebliğ edilmiştir.
3- Borçlu [İTİRAZ TARİHİ] tarihinde borca itiraz etmiş, takip durmuştur. İşbu talep, itirazın tarafımıza tebliğinden itibaren İİK m. 68 uyarınca öngörülen altı aylık süre içinde sunulmaktadır.
4- Takibe dayanak belge İİK m. 68 anlamında itirazın kaldırılmasına elverişli nitelikte olup borçlunun imzası [İKRAR EDİLMİŞ / NOTERLİKÇE ONAYLI] durumdadır.
5- Borçlu, itirazında [BORÇLUNUN İTİRAZ GEREKÇESİ] ileri sürmüşse de bu savunmasını İİK m. 68'de öngörülen nitelikte hiçbir belge ile ispat edememiştir. Ödeme, ibra veya zamanaşımı iddiası da belgelendirilmemiştir.
6- Borçlunun belgeye dayalı ve likit alacağı haksız yere inkâr etmesi nedeniyle aleyhine icra inkâr tazminatına hükmedilmesi gerekmektedir.

HUKUKİ NEDENLER   : 2004 sayılı İİK m. 68 ve devamı, 6098 sayılı TBK, 6100 sayılı HMK ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : [İL] ( ). İcra Müdürlüğü [YIL]/[NO] E. sayılı takip dosyası, takibe dayanak belge, noter kayıtları, banka kayıtları, ticari defterler, bilirkişi incelemesi ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle talebimizin KABULÜ ile;
1- Borçlunun [İL] ( ). İcra Müdürlüğü'nün [YIL]/[NO] E. sayılı dosyasına yaptığı itirazın KALDIRILMASINA ve takibin [TUTAR] TL asıl alacak ve ferileri üzerinden DEVAMINA,
2- Borçlu aleyhine, hükmolunan tutarın yüzde yirmisinden az olmamak üzere İCRA İNKÂR TAZMİNATINA hükmedilmesine,
3- Yargılama giderleri ile vekâlet ücretinin borçluya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "menfi-tespit",
    kategori: "İcra ve İflas",
    baslik: "Menfi Tespit Dava Dilekçesi",
    aciklama: "Takip konusu borcun bulunmadığının tespiti ve takibin durdurulması istemi (İİK m. 72).",
    davaTuru: "Borçlu olmadığının tespiti",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Asliye Hukuk Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). ASLİYE HUKUK MAHKEMESİ SAYIN HÂKİMLİĞİ'NE
[TİCARİ UYUŞMAZLIK İSE: [İL] ( ). ASLİYE TİCARET MAHKEMESİ SAYIN HÂKİMLİĞİ'NE]

— İhtiyati Tedbir Yoluyla Takibin Durdurulması İstemlidir —

DAVACI
(BORÇLU)          : [AD SOYAD / UNVAN] (T.C./VKN: [NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI
(ALACAKLI)        : [AD SOYAD / UNVAN]
                    [ADRES]
İCRA DOSYA NO     : [İL] ( ). İcra Müdürlüğü [YIL]/[NO] E.
DAVA DEĞERİ       : [TUTAR] TL
KONU              : Müvekkilin davalıya [TUTAR] TL borçlu OLMADIĞININ TESPİTİ ile takibin durdurulması ve kötü niyet tazminatı istemidir.

AÇIKLAMALAR:
1- Davalı, müvekkil aleyhine [İL] ( ). İcra Müdürlüğü'nün [YIL]/[NO] E. sayılı dosyası ile [TUTAR] TL bedelli [TAKİP TÜRÜ] takibi başlatmıştır. (EK-1)
2- Ancak müvekkilin davalıya işbu takibe konu edilen hiçbir borcu bulunmamaktadır. Şöyle ki; [BORCUN DOĞMADIĞI / ÖDENDİĞİ / İLİŞKİNİN SONA ERDİĞİ SOMUT AÇIKLAMA].
3- [BORCUN ÖDENDİĞİ HÂLDE: Takip konusu borç [ÖDEME TARİHİ] tarihinde [ÖDEME ŞEKLİ] ile tamamen ödenmiş olup ödemeye ilişkin [DEKONT/MAKBUZ] ektedir. (EK-2)]
4- [TEMİNAT SENEDİ İSE: Takibe dayanak senet, [SÖZLEŞME] kapsamında teminat amacıyla verilmiş olup kayıtsız şartsız bir borç ikrarı içermemektedir; senedin teminat senedi olduğu [BELGE] ile sabittir. (EK-3)]
5- Davalı, var olmayan bir alacağı takip konusu yaparak müvekkili zarara uğratmaktadır. Takibin devamı hâlinde müvekkilin malvarlığı üzerine haciz uygulanacak ve ticari itibarı zedelenecektir; bu nedenle alacağın yüzde on beşi oranında teminat karşılığında takibin durdurulmasına ilişkin ihtiyati tedbir kararı verilmesi zorunludur.
6- Davalının kötü niyetle takip başlattığı sabit olduğundan aleyhine tazminata hükmedilmesi gerekmektedir.

HUKUKİ NEDENLER   : 2004 sayılı İİK m. 72, 6098 sayılı TBK, 6100 sayılı HMK ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : [İL] ( ). İcra Müdürlüğü [YIL]/[NO] E. sayılı takip dosyası, ödeme dekontları, sözleşme, ticari defter ve kayıtlar, banka kayıtları, tanık, bilirkişi incelemesi, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle;
1- Öncelikle alacağın yüzde on beşi oranında teminat karşılığında İHTİYATİ TEDBİR yoluyla [İL] ( ). İcra Müdürlüğü'nün [YIL]/[NO] E. sayılı dosyasındaki TAKİBİN DURDURULMASINA,
2- Davanın KABULÜ ile müvekkilin davalıya [TUTAR] TL borçlu OLMADIĞININ TESPİTİNE,
3- Davalı aleyhine, talep konusu alacağın yüzde yirmisinden az olmamak üzere TAZMİNATA hükmedilmesine,
4- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "istirdat",
    kategori: "İcra ve İflas",
    baslik: "İstirdat Dava Dilekçesi",
    aciklama: "Cebrî icra tehdidi altında ödenen ve gerçekte borçlu olunmayan paranın geri alınması istemi (İİK m. 72/son).",
    davaTuru: "Ödenen paranın geri alınması",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Asliye Hukuk Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). ASLİYE HUKUK MAHKEMESİ SAYIN HÂKİMLİĞİ'NE
[TİCARİ UYUŞMAZLIK İSE: [İL] ( ). ASLİYE TİCARET MAHKEMESİ SAYIN HÂKİMLİĞİ'NE]

DAVACI
(BORÇLU)          : [AD SOYAD / UNVAN] (T.C./VKN: [NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI
(ALACAKLI)        : [AD SOYAD / UNVAN]
                    [ADRES]
İCRA DOSYA NO     : [İL] ( ). İcra Müdürlüğü [YIL]/[NO] E.
DAVA DEĞERİ       : [TUTAR] TL
KONU              : Cebrî icra tehdidi altında ödenen ve gerçekte borçlu olunmayan [TUTAR] TL'nin faiziyle İSTİRDADI istemidir.

AÇIKLAMALAR:
1- Davalı, müvekkil aleyhine [İL] ( ). İcra Müdürlüğü'nün [YIL]/[NO] E. sayılı dosyası ile [TUTAR] TL bedelli takip başlatmıştır. (EK-1)
2- Müvekkil, [HACİZ/SATIŞ TEHDİDİ AÇIKLAMASI — malvarlığı üzerine haciz konulması ve ticari faaliyetinin durma noktasına gelmesi] nedeniyle iradesi dışında, cebrî icra tehdidi altında [ÖDEME TARİHİ] tarihinde takip dosyasına [TUTAR] TL ödemek zorunda kalmıştır. (EK-2)
3- Ödeme, borcun kabulü anlamına gelmemektedir. Müvekkil, ödemeyi haczin ve satışın önlenmesi amacıyla ihtirazi kayıtla yapmıştır.
4- Oysa müvekkilin davalıya takibe konu edilen borcu hiçbir zaman doğmamıştır. Şöyle ki; [BORÇLU OLUNMADIĞININ SOMUT AÇIKLAMASI — sözleşmenin kurulmadığı / edimin hiç ifa edilmediği / borcun daha önce ödendiği].
5- [DELİLE BAĞLAMA: [BELGE] incelendiğinde takip konusu alacağın gerçekte doğmadığı açıkça görülecektir. (EK-3)]
6- İşbu dava, İİK m. 72/son uyarınca paranın icra dosyasına ödendiği tarihten itibaren öngörülen bir yıllık süre içinde açılmaktadır.

HUKUKİ NEDENLER   : 2004 sayılı İİK m. 72, 6098 sayılı TBK m. 77 vd., 6100 sayılı HMK ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : [İL] ( ). İcra Müdürlüğü [YIL]/[NO] E. sayılı takip dosyası, ödeme makbuzu ve dekontlar, sözleşme, ticari defter ve kayıtlar, banka kayıtları, tanık, bilirkişi incelemesi, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle davanın KABULÜ ile;
1- Müvekkilin davalıya borçlu olmadığının tespiti ile cebrî icra tehdidi altında ödenen [TUTAR] TL'nin ödeme tarihi olan [ÖDEME TARİHİ] tarihinden itibaren işleyecek [FAİZ TÜRÜ] faiziyle birlikte davalıdan tahsiline,
2- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "sikayet-icra-memur-islemi",
    kategori: "İcra ve İflas",
    baslik: "İcra Memuru İşlemini Şikâyet Dilekçesi",
    aciklama: "İcra müdürlüğünün hukuka aykırı işleminin kaldırılması için icra hukuk mahkemesine şikâyet (İİK m. 16).",
    davaTuru: "İcra memuru işlemini şikâyet",
    dilekceTipi: "Şikâyet dilekçesi",
    yetkiliMahkeme: "İcra Hukuk Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). İCRA HUKUK MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

— İcra Dosyasında İşlemlerin Durdurulması İstemlidir —

ŞİKÂYET EDEN
([ALACAKLI/BORÇLU/ÜÇÜNCÜ KİŞİ]) : [AD SOYAD / UNVAN] (T.C./VKN: [NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
KARŞI TARAF       : [AD SOYAD / UNVAN]
                    [ADRES]
İCRA DOSYA NO     : [İL] ( ). İcra Müdürlüğü [YIL]/[NO] E.
ŞİKÂYET KONUSU
İŞLEM             : [İL] ( ). İcra Müdürlüğü'nün [İŞLEM TARİHİ] tarihli [İŞLEMİN KONUSU] işlemi
ÖĞRENME TARİHİ    : [TARİH]
KONU              : Hukuka aykırı icra müdürlüğü işleminin KALDIRILMASI istemidir.

AÇIKLAMALAR:
1- [İL] ( ). İcra Müdürlüğü'nün [YIL]/[NO] E. sayılı dosyasında müvekkil [ALACAKLI/BORÇLU/ÜÇÜNCÜ KİŞİ] sıfatını haizdir.
2- İcra müdürlüğünce [İŞLEM TARİHİ] tarihinde [ŞİKÂYETE KONU İŞLEMİN AYRINTILI ANLATIMI] yönünde işlem tesis edilmiştir. (EK-1)
3- Söz konusu işlem müvekkile [TEBLİĞ/ÖĞRENME TARİHİ] tarihinde tebliğ edilmiş olup işbu şikâyet, İİK m. 16 uyarınca öngörülen yedi günlük süre içinde sunulmaktadır.
4- İşlem hukuka aykırıdır. Şöyle ki; [HUKUKA AYKIRILIĞIN SOMUT GEREKÇESİ — kanuna aykırılık / olaya uygun olmama / icra müdürünün takdir yetkisini aşması].
5- [SÜREYE TABİ OLMAYAN HÂL: Şikâyete konu işlem kamu düzenine aykırı olup bir hakkın yerine getirilmemesi niteliği taşıdığından süresiz şikâyete tabidir.]
6- Anılan işlem nedeniyle müvekkil [DOĞAN ZARAR / HAK KAYBI] ile karşı karşıya kalmıştır. Şikâyet sonuçlanıncaya kadar dosyada işlemlerin durdurulması gerekmektedir.

HUKUKİ NEDENLER   : 2004 sayılı İİK m. 16, 17, 18, 22 ve devamı, 6100 sayılı HMK ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : [İL] ( ). İcra Müdürlüğü [YIL]/[NO] E. sayılı takip dosyası, şikâyete konu icra müdürlüğü kararı, tebligat evrakı, [İLGİLİ BELGELER], bilirkişi incelemesi ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle;
1- Öncelikle şikâyet sonuçlanıncaya kadar [İL] ( ). İcra Müdürlüğü'nün [YIL]/[NO] E. sayılı dosyasında İŞLEMLERİN DURDURULMASINA,
2- Şikâyetimizin KABULÜ ile [İŞLEM TARİHİ] tarihli hukuka aykırı işlemin KALDIRILMASINA [VE/VEYA [DÜZELTİLMESİ İSTENEN HUSUS] yönünde DÜZELTİLMESİNE],
3- Yargılama giderleri ile vekâlet ücretinin karşı tarafa yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "haczin-kaldirilmasi",
    kategori: "İcra ve İflas",
    baslik: "Haczedilmezlik Şikâyeti / Haczin Kaldırılması Dilekçesi",
    aciklama: "Haczi caiz olmayan mal ve haklar üzerindeki haczin kaldırılması istemi (İİK m. 82).",
    davaTuru: "Haczedilmezlik şikâyeti",
    dilekceTipi: "Şikâyet dilekçesi",
    yetkiliMahkeme: "İcra Hukuk Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). İCRA HUKUK MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

— Satışın Durdurulması İstemlidir —

ŞİKÂYET EDEN
(BORÇLU)          : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
KARŞI TARAF
(ALACAKLI)        : [AD SOYAD / UNVAN]
                    [ADRES]
İCRA DOSYA NO     : [İL] ( ). İcra Müdürlüğü [YIL]/[NO] E.
HACİZ TARİHİ      : [TARİH]
ÖĞRENME TARİHİ    : [TARİH]
KONU              : Haczi caiz olmayan [MAL/HAK] üzerine konulan haczin KALDIRILMASI istemidir.

AÇIKLAMALAR:
1- Karşı taraf alacaklı tarafından müvekkil aleyhine [İL] ( ). İcra Müdürlüğü'nün [YIL]/[NO] E. sayılı dosyası ile takip başlatılmıştır.
2- [HACİZ TARİHİ] tarihinde müvekkilin [ADRES] adresindeki konutunda haciz işlemi uygulanmış ve [HACZEDİLEN MAL/HAK — ör. ev eşyaları / maaş / araç] üzerine haciz konulmuştur. (EK-1: Haciz tutanağı)
3- Müvekkil haciz işlemini [ÖĞRENME TARİHİ] tarihinde öğrenmiş olup işbu şikâyet, İİK m. 16 uyarınca öngörülen yedi günlük süre içinde sunulmaktadır.
4- Haczedilen mallar, İİK m. 82 uyarınca haczi caiz olmayan mallardandır. Şöyle ki; söz konusu eşyalar müvekkilin ve ailesinin birlikte yaşadığı konutta bulunan ve yaşamlarını sürdürebilmeleri için zorunlu olan ev eşyalarıdır. Aynı amaca hizmet eden birden fazla eşya bulunmamaktadır.
5- [MESLEK ARACI İSE: Haczedilen [ARAÇ/ALET], müvekkilin [MESLEK] mesleğini sürdürebilmesi ve geçimini sağlayabilmesi için zorunlu olan araç niteliğindedir; haczi caiz değildir.]
6- [MAAŞ HACZİ İSE: Müvekkilin [İŞVEREN] nezdinde aldığı maaşın tamamı üzerine haciz konulmuştur. Oysa maaşın ancak dörtte biri haczedilebilir; ayrıca müvekkilin ve ailesinin geçimi için zorunlu olan kısım haczedilemez. (EK-2: Ücret bordrosu)]
7- [EMEKLİ MAAŞI İSE: Haczedilen tutar emekli maaşı olup 5510 sayılı Kanun m. 93 uyarınca müvekkilin muvafakati bulunmaksızın haczedilemez. (EK-3)]
8- Hukuka aykırı haciz nedeniyle müvekkil ve ailesi mağdur olmuş, [DOĞAN ZARAR] ile karşı karşıya kalmıştır. Şikâyet sonuçlanıncaya kadar haczedilen malların satışının durdurulması gerekmektedir.

HUKUKİ NEDENLER   : 2004 sayılı İİK m. 16, 82, 83 ve devamı, 6100 sayılı HMK ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : [İL] ( ). İcra Müdürlüğü [YIL]/[NO] E. sayılı takip dosyası, haciz tutanağı, ikametgâh ve nüfus kayıtları, ücret bordroları, SGK kayıtları, keşif, bilirkişi incelemesi, tanık ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle;
1- Öncelikle şikâyet sonuçlanıncaya kadar haczedilen [MAL/HAK] bakımından SATIŞIN DURDURULMASINA,
2- Şikâyetimizin KABULÜ ile [HACİZ TARİHİ] tarihli haciz işleminin haczi caiz olmayan [MAL/HAK] yönünden KALDIRILMASINA,
3- Yargılama giderleri ile vekâlet ücretinin karşı tarafa yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
];
