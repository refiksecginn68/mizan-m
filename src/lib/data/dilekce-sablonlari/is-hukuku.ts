// İş Hukuku dilekçe şablonları — TAMAMEN ÖZGÜN içerik.
// Ticari/telifli platformlardan hiçbir metin alınmamıştır; yalnızca HMK'nın
// öngördüğü serbest dilekçe yapısı (makam/taraflar/açıklamalar/sonuç-istem) izlenmiştir.

import { type DilekceSablonu, IMZA_BLOGU } from "./tipler";

export const IS_HUKUKU_SABLONLARI: DilekceSablonu[] = [
  {
    id: "ise-iade",
    kategori: "İş Hukuku",
    baslik: "İşe İade Davası Dilekçesi",
    aciklama: "Geçersiz fesih nedeniyle işe iade istemi (arabuluculuk sonrası) iskeleti.",
    davaTuru: "Feshin geçersizliğinin tespiti ve işe iade",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "İş Mahkemesi",
    kaynak: "ozgun",
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
    id: "kidem-ihbar-alacak",
    kategori: "İş Hukuku",
    baslik: "Kıdem ve İhbar Tazminatı Dava Dilekçesi",
    aciklama: "İşçilik alacakları (kıdem, ihbar, fazla mesai) belirsiz alacak iskeleti.",
    davaTuru: "Kıdem ve ihbar tazminatı alacağı",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "İş Mahkemesi",
    kaynak: "ozgun",
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
  {
    id: "fazla-mesai-alacak",
    kategori: "İş Hukuku",
    baslik: "Fazla Çalışma Ücreti Alacağı Dava Dilekçesi",
    aciklama: "Karşılığı ödenmeyen fazla çalışma ücretinin tahsili için belirsiz alacak iskeleti.",
    davaTuru: "Fazla çalışma ücreti alacağı",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "İş Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). İŞ MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI            : [İŞVEREN UNVANI]
                    [ADRES]
DAVA DEĞERİ       : [TUTAR] TL (belirsiz alacak — fazlaya ilişkin haklar saklıdır)
KONU              : Ödenmeyen fazla çalışma ücreti alacağının faiziyle tahsili istemidir. (HMK m. 107)

AÇIKLAMALAR:
1- Müvekkil, davalıya ait [İŞYERİ ADI] adresindeki işyerinde [GİRİŞ TARİHİ]–[ÇIKIŞ TARİHİ] döneminde [GÖREV] sıfatıyla, son brüt [ÜCRET] TL ücretle kesintisiz çalışmıştır. Çalışma olgusu SGK hizmet dökümü ile sabittir. (EK-1)
2- Müvekkilin çalışma düzeni haftanın [GÜN SAYISI] günü, [BAŞLANGIÇ SAATİ] – [BİTİŞ SAATİ] saatleri arasında olup, günlük [SÜRE] ara dinlenmesi düşüldükten sonra haftalık çalışma süresi 45 saati aşmaktadır. Aşan kısım 4857 sayılı İş Kanunu anlamında fazla çalışmadır.
3- Müvekkil, iş yoğunluğunun arttığı [DÖNEM] döneminde haftada ortalama [SAAT] saat fazla çalışma yapmış; ayrıca [VARSA: hafta tatili günlerinde de işe çağrılmıştır]. Bu çalışmaların karşılığı olan zamlı ücret bugüne kadar ödenmemiştir.
4- Fazla çalışmalar işyeri giriş-çıkış kayıtları, puantaj cetvelleri, nöbet ve vardiya listeleri ile [VARSA: kartlı geçiş sistemi kayıtları] üzerinden tespit edilebilecektir. Anılan kayıtlar davalı işveren nezdinde bulunmakta olup mahkemenizce celbi gerekmektedir.
5- Müvekkile imzalatılan ücret bordrolarında fazla çalışma tahakkuku ya hiç bulunmamakta ya da gerçek çalışmayı yansıtmayan maktu tutarlar gösterilmektedir. Bordroların ihtirazi kayıt konulmaksızın imzalatılmış olması, gerçekte yapılan çalışmanın tanık beyanlarıyla ispatına engel değildir.
6- 4857 sayılı Kanun uyarınca fazla çalışma ücreti, normal saat ücretinin yüzde elli fazlasıyla ödenmek zorundadır. Davalı bu yükümlülüğünü yerine getirmemiştir.
7- Uyuşmazlık konusu alacak, 7036 sayılı İş Mahkemeleri Kanunu m. 3 uyarınca dava şartı arabuluculuğa tabidir. [TARİH] tarihinde yapılan arabuluculuk görüşmesi taraflar anlaşamadığından anlaşmama ile sonuçlanmış olup son tutanak dilekçemiz ekindedir. (EK-2)
8- Alacağın miktarı, davalı elindeki kayıtların incelenmesi ve bilirkişi hesabı sonucunda belirlenebileceğinden dava belirsiz alacak davası olarak açılmıştır.

HUKUKİ NEDENLER   : 4857 sayılı İş Kanunu ilgili hükümleri, 6098 sayılı Türk Borçlar Kanunu ilgili hükümleri, 7036 sayılı İş Mahkemeleri Kanunu, 6100 sayılı HMK m. 107 ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : SGK hizmet dökümü ve işe giriş-çıkış bildirgeleri, işyeri özlük dosyası, iş sözleşmesi, ücret bordroları, banka ücret hesap ekstreleri, puantaj ve vardiya kayıtları, işyeri giriş-çıkış kayıtları, arabuluculuk son tutanağı, tanık beyanları, bilirkişi incelemesi, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle, fazlaya ilişkin haklarımız saklı kalmak kaydıyla davanın KABULÜ ile;
1- Şimdilik [TUTAR] TL fazla çalışma ücreti alacağının, yargılama sırasında bilirkişi raporuyla belirlenecek miktara artırılması hakkımız saklı kalmak üzere, en yüksek banka mevduat faiziyle birlikte davalıdan tahsiline,
2- Faizin [TEMERRÜT/DAVA TARİHİ] tarihinden itibaren işletilmesine,
3- Davalı elinde bulunan işyeri özlük dosyası, puantaj ve giriş-çıkış kayıtlarının mahkemenizce celbine,
4- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "hizmet-tespiti",
    kategori: "İş Hukuku",
    baslik: "Hizmet Tespiti Dava Dilekçesi",
    aciklama: "SGK'ya bildirilmeyen çalışma süresinin tespiti istemi (SGK husumetli) iskeleti.",
    davaTuru: "Sigortalı hizmet süresinin tespiti",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "İş Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). İŞ MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALILAR         : 1- [İŞVEREN UNVANI]
                       [ADRES]
                    2- Sosyal Güvenlik Kurumu Başkanlığı
                       [İLGİLİ SOSYAL GÜVENLİK İL MÜDÜRLÜĞÜ ADRESİ]
KONU              : Müvekkilin davalı işyerinde [BAŞLANGIÇ TARİHİ] – [BİTİŞ TARİHİ] tarihleri arasında geçen ve Kuruma bildirilmeyen sigortalı çalışmasının tespiti istemidir.

AÇIKLAMALAR:
1- Müvekkil, davalı işverene ait [İŞYERİ ADI / FAALİYET KONUSU] işyerinde [BAŞLANGIÇ TARİHİ] tarihinden [BİTİŞ TARİHİ] tarihine kadar [GÖREV] olarak, hizmet sözleşmesine dayalı biçimde, işverenin emir ve talimatları altında bağımlı olarak kesintisiz çalışmıştır.
2- Müvekkilin çalışması 5510 sayılı Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu anlamında hizmet akdine tabi sigortalı çalışma niteliğindedir. Ancak davalı işveren, işe giriş bildirgesini hiç düzenlememiş / [BİLDİRİLEN TARİH] tarihinde düzenlemekle birlikte öncesindeki çalışmayı Kuruma bildirmemiştir.
3- Davalı Kuruma ait hizmet dökümünde müvekkil adına yalnızca [BİLDİRİLEN DÖNEM] dönemine ilişkin [GÜN SAYISI] gün prim bildirimi görünmekte olup; fiilen çalışılan [TESPİTİ İSTENEN DÖNEM] dönemi kayıtlarda yer almamaktadır. (EK-1: SGK hizmet dökümü)
4- Müvekkilin bildirilmeyen dönemdeki çalışması; işyerinde aynı dönemde çalışan ve kayıtlarda görünen komşu işyeri sigortalıları ile birlikte çalıştığı mesai arkadaşlarının beyanlarıyla, ayrıca [VARSA: işyeri kayıtları, ücret ödeme belgeleri, imza föyleri, işyeri kimlik kartı, mesajlaşma kayıtları] ile ispatlanacaktır. (EK-2)
5- Söz konusu dönemde müvekkile aylık [ÜCRET] TL ücret ödenmiş olup, prime esas kazancın da bu tutar üzerinden tespiti gerekmektedir.
6- Hizmet tespiti davaları kamu düzenine ilişkin olduğundan mahkemece resen araştırma ilkesi uygulanmakta; bu kapsamda işyeri sicil dosyası, dönem bordroları ve komşu işyeri tanıklarının celbi gerekmektedir.
7- Hizmet tespiti davaları 7036 sayılı İş Mahkemeleri Kanunu uyarınca dava şartı arabuluculuk kapsamı dışında olup, işbu davanın doğrudan açılmasında usule aykırılık bulunmamaktadır.
8- Davalı Sosyal Güvenlik Kurumu Başkanlığı, verilecek hükmün sonuçlarından etkileneceğinden davada zorunlu olarak hasım gösterilmiştir.

HUKUKİ NEDENLER   : 5510 sayılı Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu ilgili hükümleri, 4857 sayılı İş Kanunu ilgili hükümleri, 7036 sayılı İş Mahkemeleri Kanunu, 6100 sayılı HMK ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : SGK hizmet dökümü ve sigortalı işe giriş bildirgeleri, davalı işverene ait işyeri sicil dosyası ve dönem bordroları, işyeri özlük dosyası, ücret ödeme belgeleri ve banka kayıtları, komşu işyeri sigortalıları ile mesai arkadaşlarının tanıklığı, kolluk marifetiyle işyeri araştırması, bilirkişi incelemesi ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle davanın KABULÜ ile;
1- Müvekkilin davalı işverene ait işyerinde [BAŞLANGIÇ TARİHİ] – [BİTİŞ TARİHİ] tarihleri arasında hizmet akdine tabi olarak, [GÜN SAYISI] gün süreyle ve aylık [ÜCRET] TL prime esas kazançla ÇALIŞTIĞININ TESPİTİNE,
2- Tespit edilecek sürenin müvekkilin hizmet cetveline işlenmesi ve eksik primlerin tahakkuku bakımından kararın davalı Kuruma bildirilmesine,
3- Yargılama giderleri ile vekâlet ücretinin davalılara yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "is-kazasi-tazminat",
    kategori: "İş Hukuku",
    baslik: "İş Kazası Maddi ve Manevi Tazminat Dava Dilekçesi",
    aciklama: "İş kazası nedeniyle işverenden maddi ve manevi tazminat istemi iskeleti.",
    davaTuru: "İş kazasından kaynaklı maddi ve manevi tazminat",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "İş Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). İŞ MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI            : [İŞVEREN UNVANI]
                    [ADRES]
DAVA DEĞERİ       : Maddi tazminat yönünden şimdilik [TUTAR] TL (belirsiz alacak), manevi tazminat yönünden [TUTAR] TL
KONU              : [KAZA TARİHİ] tarihli iş kazası nedeniyle uğranılan maddi zararın ve manevi zararın tazmini istemidir.

AÇIKLAMALAR:
1- Müvekkil, davalıya ait [İŞYERİ ADI / FAALİYET KONUSU] işyerinde [GİRİŞ TARİHİ] tarihinden itibaren [GÖREV] olarak, son brüt [ÜCRET] TL ücretle çalışmaktadır. (EK-1: SGK hizmet dökümü)
2- [KAZA TARİHİ] tarihinde saat [SAAT] sıralarında, işyerinde [GÖREVLENDİRME] işini yapmakta iken [KAZANIN OLUŞ ŞEKLİ — somut anlatım: hangi makine/ekipman, hangi ortam, nasıl gerçekleşti] biçiminde meydana gelen olay sonucu müvekkil ağır şekilde yaralanmıştır. Olay 5510 sayılı Kanun anlamında iş kazasıdır.
3- Kaza sonrası müvekkil [HASTANE ADI]'na kaldırılmış, [TEŞHİS] teşhisiyle [SÜRE] süreyle tedavi görmüş ve kendisine [SÜRE] gün iş göremezlik raporu verilmiştir. Tedavi süreci [DEVAM EDİYOR / TAMAMLANDI]. (EK-2: Hastane kayıtları ve raporlar)
4- Kaza, davalı işverenin iş sağlığı ve güvenliği yükümlülüklerini yerine getirmemesinden kaynaklanmıştır. Şöyle ki; işyerinde [SOMUT KUSURLAR — ör. risk değerlendirmesi yapılmamış, işe uygun kişisel koruyucu donanım verilmemiş, makine koruyucusu bulunmamakta, işçiye iş sağlığı ve güvenliği eğitimi verilmemiş, çalışma ortamı gerekli tedbirlerden yoksun]. İşveren, 6331 sayılı İş Sağlığı ve Güvenliği Kanunu kapsamındaki tedbir ve gözetim yükümlülüğüne aykırı davranmıştır.
5- Kaza sonrasında [VARSA: Çalışma ve Sosyal Güvenlik Bakanlığı iş müfettişlerince inceleme yapılmış / [İL] Cumhuriyet Başsavcılığının [SORUŞTURMA NO] sayılı soruşturması yürütülmektedir] ve düzenlenen raporlarda işverenin kusuru saptanmıştır. (EK-3)
6- Müvekkil, kaza nedeniyle [ORAN] oranında sürekli iş göremezliğe uğramış; mesleğini eskisi gibi icra edemez hâle gelmiştir. Bu durum müvekkilin kalan çalışma yaşamı boyunca elde edeceği kazançta kalıcı bir azalma doğurmuştur. Maddi zarar; müvekkilin yaşı, ücreti, iş göremezlik oranı, bakiye ömrü ve Kurumca bağlanan gelirin peşin sermaye değeri gözetilerek aktüerya bilirkişisince hesaplanacaktır.
7- Müvekkil, geçirdiği ağır olay ve sonrasındaki uzun tedavi süreci nedeniyle yoğun acı, elem ve üzüntü yaşamış; vücut bütünlüğünün kalıcı biçimde zedelenmesi kendisinde derin bir yıkım oluşturmuştur. Tarafların ekonomik ve sosyal durumları ile kusur derecesi gözetildiğinde talep edilen manevi tazminat, zenginleşme aracına dönüşmeyecek nitelikte, ölçülü bir miktardır.
8- İş kazasından kaynaklanan maddi ve manevi tazminat istemleri, 7036 sayılı İş Mahkemeleri Kanunu uyarınca dava şartı arabuluculuk kapsamı dışında olduğundan işbu dava doğrudan açılmıştır.
9- Maddi zararın miktarı, kusur oranı ve iş göremezlik derecesi yargılama sırasında alınacak raporlarla belirlenebileceğinden maddi tazminat istemi belirsiz alacak davası olarak açılmıştır.

HUKUKİ NEDENLER   : 6098 sayılı Türk Borçlar Kanunu ilgili hükümleri (haksız fiil, işverenin özen ve gözetim borcu, maddi ve manevi tazminat), 6331 sayılı İş Sağlığı ve Güvenliği Kanunu, 4857 sayılı İş Kanunu ilgili hükümleri, 5510 sayılı Kanun ilgili hükümleri, 7036 sayılı İş Mahkemeleri Kanunu, 6100 sayılı HMK m. 107 ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : SGK hizmet dökümü ve iş kazası dosyası, işyeri özlük dosyası, iş kazası bildirim formu, iş müfettişi inceleme raporu, ceza soruşturması/kovuşturması dosyası, hastane kayıtları ve tedavi belgeleri, iş göremezlik raporları, kişisel koruyucu donanım zimmet ve iş sağlığı güvenliği eğitim kayıtları, risk değerlendirme raporu, işyeri kamera kayıtları, keşif, tanık beyanları, Adli Tıp Kurumu raporu, kusur ve hesap bilirkişisi incelemesi ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle, fazlaya ilişkin haklarımız saklı kalmak kaydıyla davanın KABULÜ ile;
1- Şimdilik [TUTAR] TL maddi tazminatın (iş göremezlik zararı), yargılama sırasında alınacak bilirkişi raporuna göre artırılması hakkımız saklı kalmak üzere, kaza tarihinden itibaren işleyecek yasal faiziyle birlikte davalıdan tahsiline,
2- [TUTAR] TL manevi tazminatın kaza tarihinden itibaren işleyecek yasal faiziyle birlikte davalıdan tahsiline,
3- Müvekkilin iş kazası dosyası ile sürekli iş göremezlik oranına ilişkin kayıtların Sosyal Güvenlik Kurumundan, ceza dosyasının ilgili makamdan celbine,
4- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "mobbing-tazminat",
    kategori: "İş Hukuku",
    baslik: "Mobbing (Psikolojik Taciz) Tazminatı Dava Dilekçesi",
    aciklama: "İşyerinde sistematik psikolojik taciz nedeniyle manevi tazminat ve işçilik alacakları istemi iskeleti.",
    davaTuru: "İşyerinde psikolojik taciz nedeniyle manevi tazminat",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "İş Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). İŞ MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI            : [İŞVEREN UNVANI]
                    [ADRES]
DAVA DEĞERİ       : [TUTAR] TL
KONU              : İşyerinde maruz kalınan psikolojik taciz (mobbing) nedeniyle manevi tazminat ile haklı fesihten doğan kıdem tazminatının tahsili istemidir.

AÇIKLAMALAR:
1- Müvekkil, davalıya ait işyerinde [GİRİŞ TARİHİ]–[ÇIKIŞ TARİHİ] döneminde [GÖREV] olarak, son brüt [ÜCRET] TL ücretle çalışmıştır. Çalıştığı süre boyunca hakkında herhangi bir disiplin işlemi tesis edilmemiş, performansına ilişkin olumsuz bir değerlendirme yapılmamıştır. (EK-1)
2- [MOBBİNGİN BAŞLANGIÇ TARİHİ] tarihinden itibaren müvekkil, [FAİL — ör. bağlı bulunduğu birim yöneticisi [AD SOYAD]] tarafından sistematik ve süreklilik arz eden biçimde psikolojik tacize maruz bırakılmıştır.
3- Söz konusu davranışlar somut olarak şu şekilde gerçekleşmiştir: [SOMUT OLAYLAR — tarih vererek: diğer çalışanların önünde küçük düşürücü ifadeler kullanılması, görev tanımına aykırı ve niteliğinin altında işler verilmesi, hiç iş verilmeyerek yalnızlaştırılması, çalışma alanının izole bir bölüme taşınması, iletişim kanallarından ve toplantılardan dışlanması, izin taleplerinin sürekli ve gerekçesiz reddedilmesi, asılsız tutanaklarla savunma istenmesi].
4- Anılan davranışlar münferit ve geçici gerginlikler olmayıp; müvekkilin kişilik haklarını zedelemeye ve işyerinden ayrılmaya zorlamaya yönelik, [SÜRE] boyunca süregelen kasıtlı ve sistematik bir baskı oluşturmaktadır.
5- Müvekkil, maruz kaldığı bu durumu [BAŞVURU TARİHİ] tarihinde [MUHATAP — ör. insan kaynakları birimi / işveren vekili] nezdinde yazılı olarak bildirmiş; ancak işveren gözetim yükümlülüğüne rağmen hiçbir koruyucu önlem almamış, tacizin sürmesine göz yummuştur. (EK-2)
6- Müvekkil bu süreçte sağlığını yitirmiş; [TARİH] tarihinde [SAĞLIK KURULUŞU]'na başvurmuş ve [TEŞHİS — ör. anksiyete bozukluğu / depresif nöbet] teşhisiyle tedavi görmeye başlamıştır. Rapor ve reçeteler dilekçemiz ekindedir. (EK-3)
7- İşverenin işçiyi gözetme ve işçinin kişiliğini koruma borcu ile eşit davranma yükümlülüğü, 4857 sayılı İş Kanunu ve 6098 sayılı Türk Borçlar Kanunu ilgili hükümleriyle açıkça düzenlenmiştir. Davalı bu yükümlülüklerini ihlal etmiştir.
8- Katlanılamaz hâle gelen çalışma koşulları nedeniyle müvekkil, [FESİH TARİHİ] tarihli yazılı bildirimle iş sözleşmesini haklı nedenle feshetmiştir. Bu fesih kıdem tazminatına hak kazandırır niteliktedir; ancak davalı ödeme yapmamıştır. (EK-4)
9- Psikolojik tacizin niteliği gereği ispatı güç olduğundan, yaklaşık ispat yeterli görülmekte; tanık beyanları, kurum içi yazışmalar ve sağlık kayıtlarının birlikte değerlendirilmesi gerekmektedir.
10- Uyuşmazlık 7036 sayılı İş Mahkemeleri Kanunu m. 3 uyarınca dava şartı arabuluculuğa tabi olup; [TARİH] tarihli görüşme anlaşmama ile sonuçlanmıştır. (EK-5: Arabuluculuk son tutanağı)

HUKUKİ NEDENLER   : 4857 sayılı İş Kanunu ilgili hükümleri (işverenin eşit davranma borcu, işçinin haklı nedenle fesih hakkı), 6098 sayılı Türk Borçlar Kanunu ilgili hükümleri (işçinin kişiliğinin korunması, manevi tazminat), 1475 sayılı Kanun m. 14, 6331 sayılı İş Sağlığı ve Güvenliği Kanunu, Anayasa m. 17, 7036 sayılı İş Mahkemeleri Kanunu, 6100 sayılı HMK ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : SGK kayıtları, işyeri özlük dosyası, iş sözleşmesi, kurum içi yazışmalar ve elektronik posta kayıtları, mesajlaşma kayıtları, tutanaklar ve savunma istem yazıları, insan kaynaklarına yapılan başvuru, fesih bildirimi, sağlık kuruluşu kayıtları ve raporlar, arabuluculuk son tutanağı, tanık beyanları, bilirkişi incelemesi ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle, fazlaya ilişkin haklarımız saklı kalmak kaydıyla davanın KABULÜ ile;
1- Müvekkilin işyerinde psikolojik tacize maruz kaldığının tespiti ile [TUTAR] TL manevi tazminatın haksız fiil tarihinden itibaren işleyecek yasal faiziyle birlikte davalıdan tahsiline,
2- Haklı nedenle fesih nedeniyle şimdilik [TUTAR] TL kıdem tazminatının fesih tarihinden itibaren işleyecek en yüksek banka mevduat faiziyle birlikte davalıdan tahsiline,
3- Davalı elinde bulunan özlük dosyası ile kurum içi yazışmaların mahkemenizce celbine,
4- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "isci-alacaklari-genel",
    kategori: "İş Hukuku",
    baslik: "İşçilik Alacakları (Yıllık İzin, UBGT, Ücret) Dava Dilekçesi",
    aciklama: "Kullandırılmayan yıllık izin, ulusal bayram genel tatil ve ödenmeyen ücret alacaklarının tahsili iskeleti.",
    davaTuru: "Yıllık izin, ulusal bayram genel tatil ve ücret alacağı",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "İş Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). İŞ MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI            : [İŞVEREN UNVANI]
                    [ADRES]
DAVA DEĞERİ       : Şimdilik [TUTAR] TL (belirsiz alacak — fazlaya ilişkin haklar saklıdır)
KONU              : Kullandırılmayan yıllık ücretli izin, ulusal bayram ve genel tatil ile ödenmeyen ücret alacaklarının faiziyle tahsili istemidir. (HMK m. 107)

AÇIKLAMALAR:
1- Müvekkil, davalıya ait [İŞYERİ ADI] işyerinde [GİRİŞ TARİHİ]–[ÇIKIŞ TARİHİ] tarihleri arasında toplam [KIDEM SÜRESİ] süreyle [GÖREV] olarak, son brüt [ÜCRET] TL ücretle çalışmıştır. Hizmet süresi SGK kayıtlarıyla sabittir. (EK-1)
2- YILLIK ÜCRETLİ İZİN ALACAĞI: Müvekkilin kıdemi gözetildiğinde hak ettiği toplam yıllık ücretli izin süresi [GÜN SAYISI] gündür. Çalışma süresi boyunca izinlerinin yalnızca [KULLANILAN GÜN] günü kullandırılmış; kalan [BAKİYE GÜN] gün ne kullandırılmış ne de iş sözleşmesinin sona ermesinde ücreti ödenmiştir. 4857 sayılı İş Kanunu uyarınca sözleşmenin sona ermesinde kullandırılmayan izin sürelerine ait ücretin son ücret üzerinden ödenmesi zorunludur. İzin kullandırıldığının ispatı, usulüne uygun düzenlenmiş ve işçi imzasını taşıyan izin defteri veya belgesiyle işverene aittir; davalı nezdinde böyle bir belge bulunmamaktadır.
3- ULUSAL BAYRAM VE GENEL TATİL ALACAĞI: Müvekkil, çalışma süresi boyunca ulusal bayram ve genel tatil günlerinde de fiilen çalıştırılmıştır. 4857 sayılı Kanun uyarınca bu günlerde çalışılması hâlinde çalışılan her gün için ayrıca bir günlük ücret ödenmesi gerekirken, davalı bu ödemeyi yapmamıştır. Söz konusu çalışmalar puantaj ve vardiya kayıtları ile tanık beyanlarından anlaşılacaktır.
4- ÜCRET ALACAĞI: Müvekkilin [DÖNEM] dönemine ilişkin toplam [TUTAR] TL net ücreti bugüne kadar ödenmemiştir. Ayrıca müvekkilin ücreti bordroda asgari ücret düzeyinde gösterilmekle birlikte, gerçekte aylık net [GERÇEK ÜCRET] TL üzerinden anlaşılmış; aradaki fark elden ödenmiştir. Gerçek ücretin tespiti bakımından emsal ücret araştırması yapılması gerekmektedir.
5- Müvekkile imzalatılan bordrolarda anılan alacaklara ilişkin tahakkuk bulunmamakta; tahakkuk bulunan aylar bakımından ise ödemenin fiilen yapıldığı banka kayıtlarıyla ispatlanamamaktadır.
6- İş sözleşmesi [FESİH TARİHİ] tarihinde [FESİH ŞEKLİ] sona ermiş olup, sözleşmenin sona erme biçimi bu dilekçeye konu alacaklara hak kazanmaya engel değildir.
7- Uyuşmazlık, 7036 sayılı İş Mahkemeleri Kanunu m. 3 uyarınca dava şartı arabuluculuğa tabidir. [TARİH] tarihli arabuluculuk görüşmesi anlaşmama ile sonuçlanmış olup son tutanak ekte sunulmuştur. (EK-2)
8- Alacakların miktarı, davalı elindeki kayıtların incelenmesi ve bilirkişi hesabıyla belirlenebileceğinden dava belirsiz alacak davası olarak açılmıştır.

HUKUKİ NEDENLER   : 4857 sayılı İş Kanunu ilgili hükümleri (ücret, yıllık ücretli izin, ulusal bayram ve genel tatil), 6098 sayılı Türk Borçlar Kanunu ilgili hükümleri, 2429 sayılı Ulusal Bayram ve Genel Tatiller Hakkında Kanun, 7036 sayılı İş Mahkemeleri Kanunu, 6100 sayılı HMK m. 107 ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : SGK hizmet dökümü, işyeri özlük dosyası, iş sözleşmesi, yıllık izin defteri ve izin talep formları, ücret bordroları, banka hesap ekstreleri, puantaj ve vardiya kayıtları, emsal ücret araştırması (ilgili meslek odası ve sendika yazıları), arabuluculuk son tutanağı, tanık beyanları, bilirkişi incelemesi, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle, fazlaya ilişkin haklarımız saklı kalmak kaydıyla davanın KABULÜ ile;
1- Şimdilik [TUTAR] TL kullandırılmayan yıllık ücretli izin alacağının fesih tarihinden itibaren işleyecek yasal faiziyle,
2- Şimdilik [TUTAR] TL ulusal bayram ve genel tatil ücreti alacağının en yüksek banka mevduat faiziyle,
3- Şimdilik [TUTAR] TL ödenmeyen ücret alacağının en yüksek banka mevduat faiziyle,
yargılama sırasında alınacak bilirkişi raporu doğrultusunda talep miktarlarını artırma hakkımız saklı kalmak üzere [TEMERRÜT/DAVA TARİHİ] tarihinden itibaren işletilerek davalıdan tahsiline,
4- Davalı elinde bulunan özlük dosyası, izin defteri, bordro ve puantaj kayıtlarının mahkemenizce celbine,
5- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
];
