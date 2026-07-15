// Aile Hukuku dilekçe şablonları — TAMAMEN ÖZGÜN içerik.
//
// TELİF: Hiçbir ticari/telifli platformdan (Corpus, Lexpera vb.) metin alınmamıştır.
// Dilekçenin yapısı HMK usul kuralıdır; somut cümleler bu projede sıfırdan yazılmıştır.
//
// NOT: Aile hukuku davalarında dava şartı arabuluculuk uygulanmaz; şablonlarda
// bilinçli olarak arabuluculuk tutanağı/şartı yer almamaktadır.

import { type DilekceSablonu, IMZA_BLOGU } from "./tipler";

export const AILE_SABLONLARI: DilekceSablonu[] = [
  {
    id: "anlasmali-bosanma",
    kategori: "Aile Hukuku",
    baslik: "Anlaşmalı Boşanma Dava Dilekçesi",
    aciklama: "TMK m. 166/3 uyarınca protokole dayalı anlaşmalı boşanma iskeleti.",
    davaTuru: "Anlaşmalı boşanma",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Aile Mahkemesi",
    kaynak: "ozgun",
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
    id: "cekismeli-bosanma",
    kategori: "Aile Hukuku",
    baslik: "Çekişmeli Boşanma Dava Dilekçesi",
    aciklama:
      "Evlilik birliğinin temelinden sarsılması nedeniyle boşanma, velayet, nafaka ve tazminat istemli dava iskeleti.",
    davaTuru: "Çekişmeli boşanma (evlilik birliğinin temelinden sarsılması)",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Aile Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). AİLE MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

— Tedbir Nafakası ve Geçici Velayet İstemlidir —

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
KONU              : Evlilik birliğinin temelinden sarsılması nedeniyle tarafların boşanmalarına, müşterek çocuğun velayetinin müvekkile verilmesine, nafaka ve tazminat istemlerimizin kabulüne karar verilmesi istemidir.

AÇIKLAMALAR:
1- Taraflar [EVLİLİK TARİHİ] tarihinde evlenmiştir. Bu evlilikten [DOĞUM TARİHİ] doğumlu [ÇOCUK ADI SOYADI] adlı müşterek çocukları bulunmaktadır. (EK-1: Nüfus kayıt örneği)
2- Evliliğin ilk yıllarında taraflar arasındaki ilişki olağan seyrinde devam etmiş; ancak [TARİH] tarihinden itibaren davalının [KUSURLU DAVRANIŞLARIN SOMUT ANLATIMI — güven sarsıcı davranış, birlik görevlerinin ihmali, hakaret, şiddet vb.] biçimindeki davranışları nedeniyle taraflar arasında ciddi geçimsizlik doğmuştur.
3- Davalı, [SOMUT OLAY — tarih, yer ve olayın anlatımı] tarihli olayda [DAVRANIŞ] eylemini gerçekleştirmiş; bu olaya [TANIK ADLARI] tanık olmuştur. (EK-2: [KOLLUK/HASTANE/MESAJ KAYDI vb. BELGE])
4- Anılan davranışlar karşısında müvekkil [TARİH] tarihinde ortak konutu terk etmek zorunda kalmış olup taraflar bu tarihten bu yana fiilen ayrı yaşamaktadır. Ortak hayatın yeniden kurulması ihtimali kalmamış, evlilik birliği müvekkil bakımından çekilmez hâle gelmiştir.
5- Evlilik birliğinin temelinden sarsılmasına yol açan olaylarda müvekkilin kusuru bulunmamakta, kusur tümüyle davalıya ait bulunmaktadır. Bu nedenle müvekkilin dava açmakta korunmaya değer menfaati mevcuttur.
6- Müşterek çocuk [ÇOCUK ADI], doğumundan bu yana fiilen müvekkilin bakım ve gözetimi altındadır. Çocuğun üstün yararı, alışmış olduğu düzenin korunması ve müvekkil yanında kalmasını gerektirmektedir. Bu nedenle velayetin müvekkile verilmesi gerekir.
7- Müvekkilin düzenli ve yeterli geliri bulunmamaktadır. Yargılama süresince müvekkil ve müşterek çocuk yararına tedbir nafakasına, boşanma kararının kesinleşmesinden sonra ise müvekkil yararına yoksulluk, müşterek çocuk yararına iştirak nafakasına hükmedilmesi zorunludur.
8- Davalının kusurlu davranışları müvekkilin kişilik haklarına saldırı niteliğinde olup müvekkil ağır bir üzüntü yaşamıştır. Boşanma ile mevcut ve beklenen menfaatleri de zedelendiğinden maddi ve manevi tazminat koşulları oluşmuştur.

HUKUKİ NEDENLER   : 4721 sayılı Türk Medeni Kanunu'nun boşanma, velayet, nafaka ve tazminata ilişkin hükümleri (özellikle m. 166), 4787 sayılı Aile Mahkemelerinin Kuruluş, Görev ve Yargılama Usullerine Dair Kanun, 6100 sayılı Hukuk Muhakemeleri Kanunu ve sair ilgili mevzuat.

HUKUKİ DELİLLER   : Nüfus kayıt örneği, tarafların ekonomik ve sosyal durum araştırması, banka ve tapu kayıtları, SGK kayıtları, [KOLLUK/SAVCILIK SORUŞTURMA DOSYASI NO], mesaj ve arama kayıtları, fotoğraflar, tanık beyanları, uzman/pedagog incelemesi, bilirkişi incelemesi ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle davanın KABULÜ ile;
1- Evlilik birliğinin temelinden sarsılması nedeniyle tarafların BOŞANMALARINA,
2- Müşterek çocuk [ÇOCUK ADI]'nın velayetinin müvekkile VERİLMESİNE; yargılama süresince geçici velayetin müvekkile tevdiine,
3- Yargılama süresince müvekkil yararına aylık [TUTAR] TL, müşterek çocuk yararına aylık [TUTAR] TL TEDBİR NAFAKASINA; kararın kesinleşmesiyle bu nafakaların müvekkil yönünden yoksulluk, çocuk yönünden iştirak nafakası olarak DEVAMINA,
4- Müvekkil yararına [TUTAR] TL maddi ve [TUTAR] TL manevi TAZMİNATIN davalıdan tahsiline,
5- Davalı ile müşterek çocuk arasında çocuğun yaşı ve eğitim düzeni gözetilerek KİŞİSEL İLİŞKİ TESİSİNE,
6- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "nafaka-artirim",
    kategori: "Aile Hukuku",
    baslik: "Nafakanın Artırılması Dava Dilekçesi",
    aciklama:
      "Değişen ekonomik koşullar nedeniyle iştirak ve yoksulluk nafakasının artırılması istemli dava iskeleti.",
    davaTuru: "İştirak / yoksulluk nafakasının artırılması",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Aile Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). AİLE MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
DAVA DEĞERİ       : [TUTAR] TL (artırılması istenen aylık farkın bir yıllık tutarı)
KONU              : [MAHKEME ADI]'nın [ESAS NO] E. ve [KARAR NO] K. sayılı kararı ile hükmedilen nafakanın, değişen koşullar gözetilerek aylık [TUTAR] TL'ye ARTIRILMASI istemidir.

AÇIKLAMALAR:
1- Taraflar, [MAHKEME ADI]'nın [KARAR TARİHİ] tarihli, [ESAS NO] E. ve [KARAR NO] K. sayılı kararı ile boşanmış olup karar [KESİNLEŞME TARİHİ] tarihinde kesinleşmiştir. (EK-1: Gerekçeli karar ve kesinleşme şerhi)
2- Anılan kararla müşterek çocuk [ÇOCUK ADI]'nın velayeti müvekkile verilmiş; çocuk yararına aylık [TUTAR] TL iştirak nafakasına, müvekkil yararına aylık [TUTAR] TL yoksulluk nafakasına hükmedilmiştir.
3- Nafakanın belirlendiği tarihten bu yana [SÜRE] yıl geçmiştir. Bu süre içinde ülke genelindeki fiyat artışları, kira, gıda, eğitim ve sağlık giderlerindeki yükselme nedeniyle hükmedilen nafaka miktarı, karşılamayı amaçladığı ihtiyaçların çok altında kalmıştır.
4- Müşterek çocuk [ÇOCUK ADI] bu süre içinde büyümüş ve [SINIF/OKUL] öğrencisi olmuştur. Çocuğun eğitim, ulaşım, kırtasiye, giyim ve [VARSA: sağlık/özel ders] giderleri artmış; aylık zorunlu gideri [TUTAR] TL'ye ulaşmıştır. (EK-2: Öğrenci belgesi ve gider belgeleri)
5- Müvekkilin geliri [GELİR DURUMU — ör. asgari ücret düzeyinde / geliri bulunmamakta] olup artan giderleri tek başına karşılamaya elverişli değildir. Buna karşılık davalının ekonomik durumu nafakanın belirlendiği tarihe göre iyileşmiş; davalı hâlen [İŞ/GÖREV] olarak çalışmakta ve aylık [TUTAR] TL gelir elde etmektedir. (EK-3: SGK hizmet dökümü / gelir belgesi)
6- Tarafların değişen sosyal ve ekonomik durumları ile hakkaniyet ilkesi karşısında nafakanın artırılması koşulları oluşmuştur. Nafakanın gelecek yıllarda yeniden dava açılmasına gerek kalmaksızın her yıl ÜFE oranında artırılmasına da karar verilmesini talep etme zorunluluğu doğmuştur.

HUKUKİ NEDENLER   : 4721 sayılı Türk Medeni Kanunu'nun nafaka yükümlülüğü, nafakanın belirlenmesi ve nafakanın değiştirilmesine ilişkin hükümleri, 4787 sayılı Kanun, 6100 sayılı Hukuk Muhakemeleri Kanunu ve sair ilgili mevzuat.

HUKUKİ DELİLLER   : [MAHKEME ADI]'nın [ESAS NO] sayılı dosyası, nüfus kayıt örneği, tarafların ekonomik ve sosyal durum araştırması, SGK hizmet dökümü ve gelir kayıtları, banka kayıtları, öğrenci belgesi, kira sözleşmesi, harcama belgeleri, TÜİK verileri, tanık, bilirkişi incelemesi ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle davanın KABULÜ ile;
1- Müşterek çocuk [ÇOCUK ADI] yararına hükmedilen aylık [TUTAR] TL iştirak nafakasının dava tarihinden itibaren aylık [TUTAR] TL'ye ARTIRILMASINA,
2- Müvekkil yararına hükmedilen aylık [TUTAR] TL yoksulluk nafakasının dava tarihinden itibaren aylık [TUTAR] TL'ye ARTIRILMASINA,
3- Nafakaların her yıl [TÜFE/ÜFE] oranında kendiliğinden artırılmasına,
4- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "velayet-degisikligi",
    kategori: "Aile Hukuku",
    baslik: "Velayetin Değiştirilmesi Dava Dilekçesi",
    aciklama:
      "Velayet kendisine bırakılan tarafın koşullarının değişmesi nedeniyle velayetin değiştirilmesi istemli dava iskeleti.",
    davaTuru: "Velayetin değiştirilmesi",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Aile Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). AİLE MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

— Geçici Velayet (İhtiyati Tedbir) İstemlidir —

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
KONU              : Müşterek çocuk [ÇOCUK ADI]'nın velayetinin davalıdan alınarak müvekkile verilmesi istemidir.

AÇIKLAMALAR:
1- Taraflar, [MAHKEME ADI]'nın [KARAR TARİHİ] tarihli, [ESAS NO] E. ve [KARAR NO] K. sayılı kararı ile boşanmıştır. Anılan kararla [DOĞUM TARİHİ] doğumlu müşterek çocuk [ÇOCUK ADI]'nın velayeti davalıya bırakılmış, müvekkil ile çocuk arasında kişisel ilişki kurulmuştur. (EK-1: Gerekçeli karar ve kesinleşme şerhi)
2- Velayetin düzenlendiği tarihten sonra davalının durumu esaslı biçimde değişmiştir. Davalı, [DEĞİŞİKLİĞİN SOMUT ANLATIMI — ör. çocuğun bakımını üçüncü kişilere bırakması, sürekli yer değiştirmesi, sağlık durumu, çalışma koşulları] nedeniyle çocuğun bakım ve gözetimini fiilen sağlayamaz hâle gelmiştir.
3- Bu durum çocuğa doğrudan yansımıştır. [ÇOCUK ADI], [OKUL ADI]'nda [SINIF] öğrencisi olup [TARİH] tarihinden itibaren derslerine düzenli devam edememekte, başarı durumu belirgin biçimde gerilemiştir. (EK-2: Devamsızlık ve not durum belgesi)
4- Ayrıca [SOMUT OLAY — tarih, yer ve olayın anlatımı] olayında görüldüğü üzere davalı, çocuğun sağlık, güvenlik ve psikososyal gelişimini gözetme yükümlülüğünü yerine getirmemiştir. (EK-3: [BELGE])
5- Davalı, mahkeme kararıyla kurulan kişisel ilişkinin kullanılmasını da [ENGELLEME BİÇİMİ] suretiyle sürekli olarak engellemekte; çocuğu müvekkile karşı yabancılaştırmaktadır. (EK-4: [İCRA DOSYASI NO / TUTANAK])
6- Müvekkilin çocuğun bakım, eğitim ve gözetimini üstlenmeye elverişli konutu, düzenli geliri ve zamanı bulunmaktadır. Müvekkil [İŞ/GÖREV] olarak çalışmakta olup aylık [TUTAR] TL geliri mevcuttur. [VARSA: Müvekkilin ikamet ettiği konut çocuğun okuluna yakındır.]
7- Velayet düzenlemesinde tek ölçüt çocuğun üstün yararıdır. Yukarıda açıklanan değişiklikler karşısında velayetin müvekkile devredilmesi çocuğun yararına olup velayetin değiştirilmesi koşulları oluşmuştur. Yargılama sonuna kadar çocuğun mevcut koşullarda kalması telafisi güç zararlar doğuracağından geçici velayetin müvekkile tevdii de gereklidir.

HUKUKİ NEDENLER   : 4721 sayılı Türk Medeni Kanunu'nun velayete ilişkin hükümleri (m. 335 vd.), 4787 sayılı Kanun, 6100 sayılı Hukuk Muhakemeleri Kanunu, Çocuk Haklarına Dair Sözleşme ve sair ilgili mevzuat.

HUKUKİ DELİLLER   : [MAHKEME ADI]'nın [ESAS NO] sayılı dosyası, nüfus kayıt örneği, tarafların ekonomik ve sosyal durum araştırması, okul kayıtları ve devamsızlık belgeleri, sağlık kayıtları, [VARSA: kolluk/savcılık soruşturma dosyası], [VARSA: icra dosyası], uzman (pedagog, psikolog, sosyal çalışmacı) incelemesi, çocuğun idrak çağında ise dinlenmesi, tanık ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle davanın KABULÜ ile;
1- Öncelikle ve ivedilikle müşterek çocuk [ÇOCUK ADI]'nın GEÇİCİ VELAYETİNİN müvekkile TEVDİİNE,
2- Müşterek çocuk [ÇOCUK ADI]'nın VELAYETİNİN davalıdan alınarak MÜVEKKİLE VERİLMESİNE,
3- Davalı ile çocuk arasında çocuğun yaşı ve eğitim düzeni gözetilerek uygun biçimde KİŞİSEL İLİŞKİ TESİSİNE,
4- Davalının ekonomik gücü oranında çocuk yararına aylık [TUTAR] TL İŞTİRAK NAFAKASINA hükmedilmesine,
5- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "tedbir-nafakasi",
    kategori: "Aile Hukuku",
    baslik: "Tedbir Nafakası Talep Dilekçesi",
    aciklama:
      "Derdest dosyada müvekkil ve müşterek çocuk yararına tedbir nafakasına hükmedilmesi için ara karar talebi iskeleti.",
    davaTuru: "Tedbir nafakası",
    dilekceTipi: "Ara karar talebi (beyan dilekçesi)",
    yetkiliMahkeme: "Aile Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). AİLE MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

— İvedi Ara Karar Verilmesi İstemlidir —

DOSYA NO          : [ESAS NO]
TALEPTE BULUNAN
(DAVACI)          : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
KONU              : Müvekkil ve müşterek çocuk yararına, duruşma günü beklenmeksizin tedbir nafakasına hükmedilmesi talebimizdir.

AÇIKLAMALAR:
1- Sayın Mahkemenizin yukarıda esas numarası yazılı dosyasında taraflar arasında [DAVA TÜRÜ — ör. boşanma] davası derdesttir.
2- Taraflar [AYRILIK TARİHİ] tarihinden bu yana fiilen ayrı yaşamaktadır. Müşterek çocuk [ÇOCUK ADI] bu tarihten itibaren müvekkilin yanında kalmakta; bakım, gözetim ve tüm giderleri müvekkil tarafından karşılanmaktadır.
3- Davalı, ayrılık tarihinden bu yana müvekkile ve müşterek çocuğa hiçbir ödeme yapmamış, birlikten doğan bakım yükümlülüğünü yerine getirmemiştir.
4- Müvekkilin düzenli ve yeterli geliri bulunmamaktadır. [GELİR DURUMUNUN SOMUT ANLATIMI — ör. çalışmamaktadır / asgari ücretle çalışmaktadır]. Buna karşılık müvekkil ve çocuğun aylık zorunlu gideri; [TUTAR] TL kira, [TUTAR] TL gıda, [TUTAR] TL eğitim ve [TUTAR] TL sağlık gideri olmak üzere toplam [TUTAR] TL'dir. (EK-1: Kira sözleşmesi ve gider belgeleri)
5- Davalı ise [İŞ/GÖREV] olarak çalışmakta olup aylık [TUTAR] TL geliri ve [MALVARLIĞI] mevcuttur; nafaka yükümlülüğünü karşılamaya ekonomik gücü elverişlidir. (EK-2: SGK hizmet dökümü / [BELGE])
6- Müvekkil ve müşterek çocuk hâlihazırda geçim sıkıntısı içindedir. Yargılamanın uzun süreceği gözetildiğinde, duruşma gününün beklenmesi telafisi güç mağduriyet doğuracaktır. Tedbir nafakası, tarafların kusur durumu tartışılmaksızın ve talep tarihinden geçerli olmak üzere hükmedilebilecek nitelikte olduğundan talebimizin ivedilikle karara bağlanması gerekmektedir.

HUKUKİ NEDENLER   : 4721 sayılı Türk Medeni Kanunu'nun evlilik birliğinin korunması, geçici önlemler ve nafaka yükümlülüğüne ilişkin hükümleri, 4787 sayılı Kanun, 6100 sayılı Hukuk Muhakemeleri Kanunu ve sair ilgili mevzuat.

HUKUKİ DELİLLER   : Sayın Mahkemenizin [ESAS NO] sayılı dosyası, nüfus kayıt örneği, tarafların ekonomik ve sosyal durum araştırması, SGK hizmet dökümü, banka ve tapu kayıtları, kira sözleşmesi, harcama belgeleri, tanık ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle;
1- Talep tarihinden geçerli olmak üzere müvekkil yararına aylık [TUTAR] TL TEDBİR NAFAKASINA,
2- Talep tarihinden geçerli olmak üzere müşterek çocuk [ÇOCUK ADI] yararına aylık [TUTAR] TL TEDBİR NAFAKASINA,
3- Nafakaların her ayın [GÜN]. günü müvekkilin [IBAN] numaralı hesabına peşin olarak ödenmesine,
4- Talebimizin ivediliği gözetilerek duruşma günü beklenmeksizin ARA KARARLA hükmedilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "mal-rejimi-tasfiye",
    kategori: "Aile Hukuku",
    baslik: "Mal Rejiminin Tasfiyesi (Katılma Alacağı) Dava Dilekçesi",
    aciklama:
      "Edinilmiş mallara katılma rejiminin tasfiyesi ile katılma alacağının tahsili istemli dava iskeleti.",
    davaTuru: "Mal rejiminin tasfiyesi / katılma alacağı",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Aile Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). AİLE MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

— İhtiyati Tedbir İstemlidir —

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
DAVA DEĞERİ       : [TUTAR] TL (belirsiz alacak — HMK m. 107)
KONU              : Taraflar arasındaki edinilmiş mallara katılma rejiminin tasfiyesi ile fazlaya ilişkin haklarımız saklı kalmak kaydıyla şimdilik [TUTAR] TL katılma alacağının faiziyle tahsili istemidir.

AÇIKLAMALAR:
1- Taraflar [EVLİLİK TARİHİ] tarihinde evlenmiş; [MAHKEME ADI]'nın [KARAR TARİHİ] tarihli, [ESAS NO] E. ve [KARAR NO] K. sayılı kararı ile boşanmış, karar [KESİNLEŞME TARİHİ] tarihinde kesinleşmiştir. (EK-1: Gerekçeli karar ve kesinleşme şerhi)
2- Taraflar evlilik süresince herhangi bir mal rejimi sözleşmesi yapmamıştır. Bu nedenle aralarında yasal mal rejimi olan edinilmiş mallara katılma rejimi geçerli olmuş; rejim, boşanma davasının açıldığı [DAVA TARİHİ] tarihi itibarıyla sona ermiştir.
3- Mal rejiminin devamı süresince davalı adına aşağıdaki malvarlığı değerleri edinilmiştir:
   a) [İL/İLÇE] ilçesi, [ADA/PARSEL] sayılı taşınmaz — [EDİNİM TARİHİ] tarihinde [BEDEL] TL bedelle satın alınmıştır. (EK-2: Tapu kaydı)
   b) [PLAKA] plakalı [MARKA/MODEL] araç — [EDİNİM TARİHİ] tarihinde edinilmiştir. (EK-3: Trafik tescil kaydı)
   c) [BANKA ADI] nezdindeki [HESAP/YATIRIM] hesabındaki [TUTAR] TL tutarındaki değerler. (EK-4)
4- Anılan değerlerin tamamı, evlilik birliği içinde ve tarafların çalışma karşılığı elde ettikleri gelirlerle edinilmiş olup edinilmiş mal niteliğindedir. Davalı bu değerlerin kişisel malı olduğunu ispat edememektedir; kanun gereği edinilmiş mal karinesi geçerlidir.
5- Müvekkil de evlilik süresince [KATKININ SOMUT ANLATIMI — ör. [İŞ] olarak çalışarak elde ettiği geliri aile bütçesine aktarmış / ev işlerini ve çocuk bakımını üstlenerek birliğe katkı sunmuştur].
6- [VARSA: Davalı, mal rejiminin sona ermesinden önceki bir yıl içinde müvekkilin rızası bulunmaksızın [DEVİR KONUSU MAL]'ı [DEVREDİLEN KİŞİ]'ye karşılıksız devretmiştir. Katılma alacağını azaltmak amacıyla yapılan bu devrin tasfiyede dikkate alınması gerekir. (EK-5)]
7- Tasfiye sonunda davalının edinilmiş mallarının, rejimin sona erdiği tarihteki değil, karara en yakın tarihteki sürüm değerleri üzerinden hesaplanması; borçlar ve varsa denkleştirme alacakları düşüldükten sonra kalan artık değer üzerinden müvekkilin katılma alacağının belirlenmesi gerekmektedir. Alacağın tam miktarı ancak dosyaya celbedilecek kayıtlar ve yapılacak bilirkişi incelemesi ile belirlenebileceğinden dava belirsiz alacak davası olarak açılmıştır.
8- Davalının dava konusu taşınmaz ve aracı üçüncü kişilere devretmesi hâlinde alacağın elde edilmesi önemli ölçüde güçleşecektir. Bu nedenle söz konusu değerler üzerine ihtiyati tedbir konulması zorunludur.

HUKUKİ NEDENLER   : 4721 sayılı Türk Medeni Kanunu'nun mal rejimlerine ve edinilmiş mallara katılma rejiminin tasfiyesine ilişkin hükümleri (m. 202 vd.), 4787 sayılı Kanun, 6100 sayılı Hukuk Muhakemeleri Kanunu (özellikle m. 107, 389 vd.) ve sair ilgili mevzuat.

HUKUKİ DELİLLER   : [MAHKEME ADI]'nın [ESAS NO] sayılı boşanma dosyası, nüfus kayıt örneği, tapu kayıtları ve akit tabloları, trafik tescil kayıtları, banka hesap hareketleri ve kredi dosyaları, SGK hizmet dökümü ve ücret kayıtları, ticaret sicil kayıtları, vergi kayıtları, keşif, bilirkişi incelemesi, tanık, yemin ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle;
1- Öncelikle davalı adına kayıtlı [ADA/PARSEL] sayılı taşınmaz ile [PLAKA] plakalı araç üzerine üçüncü kişilere devrinin önlenmesi bakımından İHTİYATİ TEDBİR KONULMASINA,
2- Taraflar arasındaki edinilmiş mallara katılma rejiminin TASFİYESİNE,
3- Fazlaya ilişkin haklarımız saklı kalmak kaydıyla, bilirkişi incelemesi sonucunda belirlenecek katılma alacağından şimdilik [TUTAR] TL'nin, karar kesinleşmesinden itibaren işleyecek yasal faiziyle birlikte davalıdan alınarak müvekkile ÖDENMESİNE,
4- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
  {
    id: "kisisel-iliski-tesisi",
    kategori: "Aile Hukuku",
    baslik: "Çocukla Kişisel İlişki Kurulması Dava Dilekçesi",
    aciklama:
      "Velayet kendisinde bulunmayan taraf yararına kişisel ilişki kurulması veya mevcut ilişkinin yeniden düzenlenmesi istemli dava iskeleti.",
    davaTuru: "Kişisel ilişki kurulması / düzenlenmesi",
    dilekceTipi: "Dava dilekçesi",
    yetkiliMahkeme: "Aile Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). AİLE MAHKEMESİ SAYIN HÂKİMLİĞİ'NE

— Geçici Kişisel İlişki (İhtiyati Tedbir) İstemlidir —

DAVACI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
DAVALI            : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
KONU              : Müvekkil ile müşterek çocuk [ÇOCUK ADI] arasında kişisel ilişki kurulması / mevcut kişisel ilişkinin çocuğun yaşı ve koşulları gözetilerek yeniden düzenlenmesi istemidir.

AÇIKLAMALAR:
1- Taraflar [MAHKEME ADI]'nın [KARAR TARİHİ] tarihli, [ESAS NO] E. ve [KARAR NO] K. sayılı kararı ile boşanmış olup [DOĞUM TARİHİ] doğumlu müşterek çocuk [ÇOCUK ADI]'nın velayeti davalıya bırakılmıştır. (EK-1: Gerekçeli karar ve kesinleşme şerhi)
2- [SEÇENEK A — İLİŞKİ HİÇ KURULMAMIŞSA: Anılan kararla müvekkil ile çocuk arasında kişisel ilişki düzenlenmemiştir. Velayet hakkına sahip olmayan ana/babanın çocuğu ile uygun kişisel ilişki kurulmasını isteme hakkı bulunduğundan işbu davayı açma zorunluluğu doğmuştur.]
3- [SEÇENEK B — MEVCUT İLİŞKİ YETERSİZSE: Anılan kararla kurulan [MEVCUT DÜZEN — ör. her ayın birinci ve üçüncü hafta sonu] biçimindeki kişisel ilişki, çocuğun [YAŞ] yaşına gelmesi ve [OKUL/SOSYAL DÜZEN] koşulları karşısında yetersiz kalmıştır. Karar tarihinden bu yana [SÜRE] geçmiş, çocuğun günlük düzeni ve ihtiyaçları değişmiştir.]
4- Müvekkil, kararla düzenlenen kişisel ilişki günlerinde [BULUŞMA YERİ]'nde hazır bulunmasına rağmen davalı, [ENGELLEME BİÇİMİNİN SOMUT ANLATIMI] suretiyle çocuğu müvekkile teslim etmemektedir. Bu nedenle [İCRA MÜDÜRLÜĞÜ] nezdinde [TAKİP NO] sayılı takip başlatılmış; [TARİH] tarihli tutanakla teslimin gerçekleşmediği tespit edilmiştir. (EK-2)
5- Müvekkil ile çocuk arasındaki bağın sürdürülmesi, çocuğun sağlıklı kişilik gelişimi bakımından zorunludur. Çocuğun ana ve babasıyla düzenli ilişki kurma hakkı, aynı zamanda çocuğun üstün yararının gereğidir. Kişisel ilişkinin kesintiye uğraması çocukta ebeveyn yabancılaşmasına yol açacaktır.
6- Müvekkilin [ADRES] adresinde çocuğun konaklamasına elverişli konutu ve düzenli geliri bulunmaktadır. Müvekkil hakkında çocuğun huzur ve güvenliğini tehlikeye düşürecek herhangi bir durum söz konusu değildir.
7- Yargılamanın uzayacak olması karşısında, süreç boyunca çocuk ile müvekkil arasındaki bağın tümüyle kopmaması için yargılama süresince geçici kişisel ilişki kurulmasına karar verilmesi de gereklidir.

HUKUKİ NEDENLER   : 4721 sayılı Türk Medeni Kanunu'nun kişisel ilişki kurulmasına ve velayete ilişkin hükümleri, 4787 sayılı Kanun, 6100 sayılı Hukuk Muhakemeleri Kanunu, Çocuk Haklarına Dair Sözleşme ve sair ilgili mevzuat.

HUKUKİ DELİLLER   : [MAHKEME ADI]'nın [ESAS NO] sayılı dosyası, [İCRA MÜDÜRLÜĞÜ]'nün [TAKİP NO] sayılı dosyası, nüfus kayıt örneği, tarafların ekonomik ve sosyal durum araştırması, okul kayıtları, mesaj ve arama kayıtları, uzman (pedagog, psikolog, sosyal çalışmacı) incelemesi, çocuğun idrak çağında ise dinlenmesi, tanık ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle davanın KABULÜ ile;
1- Yargılama süresince müvekkil ile müşterek çocuk [ÇOCUK ADI] arasında GEÇİCİ KİŞİSEL İLİŞKİ KURULMASINA,
2- Müvekkil ile müşterek çocuk [ÇOCUK ADI] arasında;
   a) Her ayın [BELİRLENEN HAFTALAR]. hafta sonu [GÜN/SAAT] ile [GÜN/SAAT] arasında,
   b) Her yıl [AY]-[AY] ayları arasında [SÜRE] süreyle yaz tatilinde,
   c) Dinî bayramların ikinci günü [SAAT] ile üçüncü günü [SAAT] arasında,
   d) Yarıyıl tatilinin [BELİRLENEN GÜNLERİ]'nde,
   e) [YIL İÇİ ÖZEL GÜNLER — ör. babalar/anneler günü, çocuğun doğum günü]'nde [SAAT] saatleri arasında,
   müvekkil yanında kalmak üzere KİŞİSEL İLİŞKİ TESİSİNE,
3- Yargılama giderleri ile vekâlet ücretinin davalıya yükletilmesine,
karar verilmesini saygıyla arz ve talep ederiz.

${IMZA_BLOGU}`,
  },
];
