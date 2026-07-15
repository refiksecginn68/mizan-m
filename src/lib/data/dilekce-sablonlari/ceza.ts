// Ceza hukuku dilekçe şablonları — TAMAMEN ÖZGÜN içerik.
//
// TELİF: Hiçbir ticari/telifli platformdan (Corpus, Lexpera vb.) metin alınmamıştır.
// Dilekçe yapısı CMK usul kuralıdır ve serbesttir; somut cümleler bu projede
// sıfırdan üretilmiştir.
//
// MERCİ AYRIMI: Şikâyet ve suç duyurusu Cumhuriyet Başsavcılığına; kovuşturmaya yer
// olmadığına dair karara itiraz Sulh Ceza Hâkimliğine; savunma, katılma ve tahliye
// talebi kovuşturmayı yürüten ceza mahkemesine verilir.
//
// Taraf adlandırması ceza usulünde farklıdır: şüpheli/sanık, müşteki/katılan, mağdur.

import { type DilekceSablonu } from "./tipler";

export const CEZA_SABLONLARI: DilekceSablonu[] = [
  {
    id: "suc-duyurusu",
    kategori: "Ceza Hukuku",
    baslik: "Suç Duyurusu / Şikâyet Dilekçesi",
    aciklama: "Cumhuriyet Başsavcılığına şikâyet ve soruşturma istemi iskeleti.",
    davaTuru: "Suç duyurusu",
    dilekceTipi: "Suç duyurusu dilekçesi",
    yetkiliMahkeme: "Cumhuriyet Başsavcılığı",
    kaynak: "ozgun",
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
    id: "sikayet-dilekcesi",
    kategori: "Ceza Hukuku",
    baslik: "Şikâyet Dilekçesi (Şikâyete Tabi Suçlar)",
    aciklama:
      "Soruşturulması şikâyete bağlı suçlarda altı aylık süre içinde Cumhuriyet Başsavcılığına sunulan şikâyet dilekçesi iskeleti.",
    davaTuru: "Şikâyete tabi suç",
    dilekceTipi: "Şikâyet dilekçesi",
    yetkiliMahkeme: "Cumhuriyet Başsavcılığı",
    kaynak: "ozgun",
    icerik: `[İL] CUMHURİYET BAŞSAVCILIĞI'NA

MÜŞTEKİ           : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
ŞÜPHELİ           : [AD SOYAD] (T.C.: [T.C. KİMLİK NO] / kimliği soruşturma ile tespit edilecektir)
                    [ADRES]
SUÇ               : [SUÇ ADI — ör. hakaret, tehdit, konut dokunulmazlığının ihlali]
SUÇ TARİHİ / YERİ : [TARİH] / [YER]
ÖĞRENME TARİHİ    : [TARİH]
KONU              : Şüpheli hakkındaki şikâyetimizin sunulması ile soruşturma başlatılması istemidir.

AÇIKLAMALAR:
1- Müvekkil ile şüpheli arasında [TARAFLAR ARASINDAKİ İLİŞKİ — ör. komşuluk, iş, akrabalık ilişkisi] bulunmaktadır. Taraflar arasında [UYUŞMAZLIĞIN KAYNAĞI] nedeniyle önceden de anlaşmazlık yaşanmıştır.
2- [SUÇ TARİHİ] tarihinde [YER] adresinde, şüpheli [EYLEMİN SOMUT ANLATIMI — kullanılan sözler, hareketler, kim neyi ne şekilde yaptı]. Olay sırasında [OLAY YERİNDE BULUNANLAR] hazır bulunmuştur.
3- Şüphelinin eylemi tek bir olaydan ibaret olmayıp [SÜREKLİLİK / TEKERRÜR AÇIKLAMASI — varsa]. Bu durum müvekkilin [ZARAR — manevi baskı, güvenlik endişesi, maddi kayıp] yaşamasına yol açmıştır.
4- Eylemin ispatına yarayacak [DELİL TÜRÜ — ses kaydı, mesaj görüntüleri, kamera kaydı, doktor raporu] mevcut olup dilekçemiz ekinde sunulmuştur. (EK-1, EK-2)
5- Şüphelinin eylemi 5237 sayılı Türk Ceza Kanunu kapsamında [SUÇ ADI] suçunu oluşturmaktadır. Söz konusu suç, soruşturulması ve kovuşturulması şikâyete bağlı suçlardan olup müvekkil fiili ve failini [ÖĞRENME TARİHİ] tarihinde öğrenmiştir. TCK m. 73 uyarınca öngörülen altı aylık şikâyet süresi içinde işbu dilekçe sunulmaktadır. Müvekkil şüpheliden şikâyetçidir.

HUKUKİ NEDENLER   : 5237 sayılı TCK m. 73 ve ilgili hükümleri, 5271 sayılı CMK m. 158 ve sair mevzuat.
HUKUKİ DELİLLER   : [BELGELER], olay yeri kamera kayıtları, HTS kayıtları, mesaj ve çağrı dökümleri, [VARSA: adli tıp/doktor raporu], tanık beyanları ([TANIK AD SOYAD — ADRES]), bilirkişi incelemesi ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle;
1- Şüpheli hakkında soruşturma başlatılmasına,
2- Sunulan delillerin toplanması ile [YER] adresindeki güvenlik kamerası kayıtlarının ilgili yerlerden temin edilmesine,
3- Soruşturma sonucunda şüphelinin eylemine uyan sevk maddeleri uyarınca cezalandırılması istemiyle hakkında KAMU DAVASI AÇILMASINA
karar verilmesini müvekkil adına saygıyla arz ve talep ederiz.

[TARİH]

Müşteki Vekili
Av. [AD SOYAD]
(e-imzalıdır)

EKLER:
1- Vekâletname örneği
2- [DELİL BELGESİ]
3- [DELİL BELGESİ]`,
  },
  {
    id: "ceza-savunma-dilekcesi",
    kategori: "Ceza Hukuku",
    baslik: "Savunma / Esas Hakkında Beyan Dilekçesi",
    aciklama:
      "Sanık müdafii tarafından ceza mahkemesine sunulan savunma ve esas hakkında beyan dilekçesi iskeleti.",
    davaTuru: "Ceza yargılaması savunması",
    dilekceTipi: "Savunma dilekçesi",
    yetkiliMahkeme: "Asliye Ceza / Ağır Ceza Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). [ASLİYE CEZA MAHKEMESİ SAYIN HÂKİMLİĞİ'NE / AĞIR CEZA MAHKEMESİ BAŞKANLIĞI'NA]

DOSYA NO          : [YIL]/[NO] E.
SANIK             : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
MÜDAFİİ           : Av. [AD SOYAD] — [BÜRO ADRESİ]
MÜŞTEKİ / KATILAN : [AD SOYAD]
SUÇ               : [İDDİANAMEDEKİ SUÇ ADI]
KONU              : Müvekkil sanığın savunması ile esas hakkındaki beyanlarımızın sunulmasıdır.

AÇIKLAMALAR:
1- [TARİH] tarihli iddianame ile müvekkil hakkında [SUÇ ADI] suçundan kamu davası açılmıştır. İddianamede özetle, müvekkilin [İDDİANIN ÖZETİ] suretiyle eylemi gerçekleştirdiği ileri sürülmektedir. İddia, aşağıda açıklanacağı üzere dosya kapsamıyla bağdaşmamaktadır.
2- OLAYIN GERÇEK MAHİYETİ: [SUÇ TARİHİ] tarihinde [OLAYIN MÜVEKKİL AÇISINDAN ANLATIMI — kim, ne zaman, nerede, hangi sırayla]. Müvekkilin bu olaydaki konumu [MÜVEKKİLİN ROLÜ] olup iddia edildiği şekilde bir eylemi bulunmamaktadır.
3- MADDİ VAKIA YÖNÜNDEN: Dosyada bulunan [DELİL — ör. kamera kaydı, HTS dökümü, bilirkişi raporu] incelendiğinde, olay anında müvekkilin [SAVUNMAYI DESTEKLEYEN OLGU] olduğu açıkça görülmektedir. Bu delil, iddianamedeki anlatımı doğrudan çürütmektedir. (EK-1)
4- BEYANLARIN DEĞERLENDİRİLMESİ: Müşteki beyanı, [ÇELİŞKİ — soruşturma ve kovuşturma aşamaları arasındaki farklılık] yönünden kendi içinde çelişkilidir. [TANIK AD SOYAD] beyanı ise müvekkilin savunmasını doğrulamaktadır. Soyut ve tek başına kalan, başkaca delille desteklenmeyen beyanın mahkûmiyete esas alınması mümkün değildir.
5- HUKUKİ NİTELENDİRME YÖNÜNDEN: Kabul anlamına gelmemek kaydıyla, müvekkile atfedilen eylem sabit görülse dahi bu eylem [İDDİANAMEDEKİ SUÇ] suçunun unsurlarını taşımamaktadır; zira [UNSUR EKSİKLİĞİ — kast, netice, hukuka aykırılık unsuru bakımından açıklama]. Eylemin [ALTERNATİF NİTELENDİRME] olarak değerlendirilmesi gerekir.
6- [VARSA LEHE HÜKÜMLER: Müvekkil lehine haksız tahrik, meşru savunma, hata hükümlerinin uygulanması koşulları mevcuttur. Ayrıca müvekkil sabıkasız olup yargılama boyunca duruşmalara katılmış, gösterdiği pişmanlık ve iyi hâl nedeniyle takdiri indirim nedenlerinin uygulanması gerekir.]
7- Ceza yargılamasının amacı maddi gerçeğin hiçbir kuşkuya yer bırakmayacak biçimde ortaya çıkarılmasıdır. Şüpheden sanık yararlanır ilkesi uyarınca, kuşkunun bulunduğu hâllerde mahkûmiyet hükmü kurulamaz. Somut dosyada müvekkilin atılı suçu işlediği yönünde kesin, inandırıcı ve yeterli delil bulunmamaktadır.

HUKUKİ NEDENLER   : 5271 sayılı CMK m. 216, 223 ve ilgili hükümleri, 5237 sayılı TCK'nın ilgili hükümleri, Anayasa m. 38 ve sair mevzuat.
HUKUKİ DELİLLER   : Soruşturma ve kovuşturma dosyasının tamamı, [BELGELER], kamera kayıtları, HTS kayıtları, tanık beyanları, bilirkişi incelemesi, keşif ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan ve Sayın Mahkemenizce resen gözetilecek nedenlerle;
1- Öncelikle müvekkil sanığın atılı suçu işlemediği sabit olduğundan BERAATİNE,
2- Aksi kanaatte olunması hâlinde eylemin [ALTERNATİF NİTELENDİRME] olarak nitelendirilmesine ve müvekkil lehine tüm indirim hükümlerinin uygulanmasına,
3- [VARSA: Müvekkil hakkındaki adli kontrol tedbirinin kaldırılmasına]
karar verilmesini müvekkil adına saygıyla arz ve talep ederim.

[TARİH]

Sanık Müdafii
Av. [AD SOYAD]
(e-imzalıdır)`,
  },
  {
    id: "katilma-talebi",
    kategori: "Ceza Hukuku",
    baslik: "Davaya Katılma (Müdahillik) Talebi",
    aciklama:
      "Suçtan zarar gören müştekinin kamu davasına katılan sıfatıyla katılmasına ilişkin talep dilekçesi iskeleti (CMK m. 237 vd.).",
    davaTuru: "Kamu davasına katılma",
    dilekceTipi: "Katılma talebi dilekçesi",
    yetkiliMahkeme: "Asliye Ceza / Ağır Ceza Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). [ASLİYE CEZA MAHKEMESİ SAYIN HÂKİMLİĞİ'NE / AĞIR CEZA MAHKEMESİ BAŞKANLIĞI'NA]

DOSYA NO          : [YIL]/[NO] E.
KATILMA TALEBİNDE
BULUNAN (MÜŞTEKİ) : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
SANIK             : [AD SOYAD]
SUÇ               : [SUÇ ADI]
KONU              : Müvekkilin kamu davasına KATILMA talebimizin sunulmasıdır.

AÇIKLAMALAR:
1- Sayın Mahkemenizin yukarıda esas numarası yazılı dosyasında, sanık [AD SOYAD] hakkında [SUÇ ADI] suçundan açılan kamu davasının yargılaması yürütülmektedir.
2- Dava konusu eylem [SUÇ TARİHİ] tarihinde [YER] adresinde gerçekleşmiş olup, müvekkil bu eylemin doğrudan mağdurudur. Nitekim müvekkil soruşturma aşamasında müşteki sıfatıyla beyanda bulunmuş ve iddianamede müşteki olarak gösterilmiştir.
3- Müvekkil, sanığın eylemi nedeniyle [ZARARIN SOMUT ANLATIMI — bedensel zarar, mal varlığı kaybı, manevi zarar] görmüştür. Bu itibarla müvekkil suçtan doğrudan zarar gören konumunda olup kamu davasına katılma hakkına sahiptir.
4- 5271 sayılı Ceza Muhakemesi Kanunu'nun 237 ve devamı maddeleri uyarınca, suçtan zarar gören kişi kovuşturma evresinde hüküm verilinceye kadar kamu davasına katılabilir. Müvekkil bakımından katılma koşulları oluşmuş olup talebimiz süresinde sunulmaktadır.
5- Müvekkilin davaya katılması, maddi gerçeğin ortaya çıkarılmasına da hizmet edecektir. Müvekkil, [SUNULACAK DELİLLER — olay yeri görüntüleri, tanık bilgileri, belgeler] bakımından yargılamaya katkı sağlayabilecek durumdadır.

HUKUKİ NEDENLER   : 5271 sayılı CMK m. 237 ve devamı maddeleri ile sair ilgili mevzuat.
HUKUKİ DELİLLER   : Sayın Mahkemenizin [YIL]/[NO] esas sayılı dosyası, soruşturma evrakı, [BELGELER], tanık beyanları ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle;
1- Müvekkilin suçtan doğrudan zarar gördüğü sabit olduğundan KAMU DAVASINA KATILMASINA ve kendisine KATILAN sıfatı verilmesine,
2- Tarafımızın katılan vekili olarak dosyaya kabulü ile duruşma gün ve saatlerinin tarafımıza tebliğine,
3- Yargılama sonunda sanığın eylemine uyan hükümler uyarınca cezalandırılmasına ve vekâlet ücretinin sanığa yükletilmesine
karar verilmesini müvekkil adına saygıyla arz ve talep ederim.

[TARİH]

Müşteki Vekili
Av. [AD SOYAD]
(e-imzalıdır)

EKLER:
1- Vekâletname örneği
2- [ZARARA İLİŞKİN BELGE]`,
  },
  {
    id: "takipsizlik-itiraz",
    kategori: "Ceza Hukuku",
    baslik: "Kovuşturmaya Yer Olmadığına Dair Karara İtiraz",
    aciklama:
      "Cumhuriyet Başsavcılığının takipsizlik kararına karşı on beş gün içinde Sulh Ceza Hâkimliğine yapılan itiraz dilekçesi iskeleti (CMK m. 173).",
    davaTuru: "Takipsizlik kararına itiraz",
    dilekceTipi: "İtiraz dilekçesi",
    yetkiliMahkeme: "Sulh Ceza Hâkimliği",
    kaynak: "ozgun",
    icerik: `[İL] ( ). SULH CEZA HÂKİMLİĞİ'NE
Gönderilmek Üzere
[İL] CUMHURİYET BAŞSAVCILIĞI'NA

SORUŞTURMA NO     : [YIL]/[NO]
KARAR NO          : [YIL]/[NO]
İTİRAZ EDEN
(MÜŞTEKİ)         : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    [ADRES]
VEKİLİ            : Av. [AD SOYAD] — [BÜRO ADRESİ]
ŞÜPHELİ           : [AD SOYAD]
SUÇ               : [SUÇ ADI]
KARAR TARİHİ      : [TARİH]
TEBLİĞ TARİHİ     : [TARİH]
KONU              : [İL] Cumhuriyet Başsavcılığının [YIL]/[NO] sayılı kovuşturmaya yer olmadığına dair kararına İTİRAZLARIMIZIN sunulmasıdır.

AÇIKLAMALAR:
1- SÜRE YÖNÜNDEN: İtiraza konu kovuşturmaya yer olmadığına dair karar müvekkile [TEBLİĞ TARİHİ] tarihinde tebliğ edilmiştir. 5271 sayılı CMK m. 173 uyarınca öngörülen on beş günlük itiraz süresi içinde işbu dilekçe sunulmakta olup itirazımız süresindedir.
2- Müvekkil, [SUÇ TARİHİ] tarihinde [YER] adresinde gerçekleşen olay nedeniyle şüpheli hakkında [ŞİKÂYET TARİHİ] tarihinde şikâyette bulunmuştur. Soruşturma sonucunda, [KARARIN GEREKÇESİNİN ÖZETİ] gerekçesiyle kovuşturmaya yer olmadığına karar verilmiştir. Karar aşağıda açıklanan nedenlerle hukuka aykırıdır.
3- DELİLLER TOPLANMAMIŞTIR: Müvekkil şikâyet dilekçesinde [TOPLANMASI İSTENEN DELİL — ör. olay yeri kamera kayıtları, HTS kayıtları, banka hareketleri] toplanmasını talep etmiş; ancak bu deliller hiç araştırılmamıştır. Söz konusu deliller, eylemin ispatı bakımından belirleyici niteliktedir. Delil toplanmaksızın ulaşılan sonuç eksik soruşturmaya dayanmaktadır.
4- TANIKLAR DİNLENMEMİŞTİR: Olayın görgü tanığı olan [TANIK AD SOYAD] ve [TANIK AD SOYAD] soruşturma kapsamında dinlenmemiştir. Adı geçenlerin beyanları alınmaksızın maddi olayın aydınlatıldığı söylenemez.
5- MEVCUT DELİLLER HATALI DEĞERLENDİRİLMİŞTİR: Dosyada bulunan [DELİL] incelendiğinde, [DELİLİN GÖSTERDİĞİ OLGU] açıkça görülmektedir. Buna karşın kararda bu delil hiç tartışılmamış, şüphelinin soyut inkâra dayanan beyanı esas alınmıştır.
6- Kovuşturmaya yer olmadığına dair karar, ancak kamu davası açılmasını gerektirecek yeterli şüphe bulunmadığı hâllerde verilebilir. Soruşturma aşamasında aranan ölçüt, mahkûmiyete yeterlilik değil, yeterli şüphenin varlığıdır. Somut olayda toplanan ve toplanması gereken deliller birlikte değerlendirildiğinde, şüphelinin eylemi gerçekleştirdiğine ilişkin yeterli şüphe mevcut olup iddianame düzenlenmesi gerekmektedir.

HUKUKİ NEDENLER   : 5271 sayılı CMK m. 160, 170, 172, 173 ve sair ilgili mevzuat.
HUKUKİ DELİLLER   : [İL] Cumhuriyet Başsavcılığının [YIL]/[NO] sayılı soruşturma dosyasının tamamı, [BELGELER], kamera ve HTS kayıtları, tanık beyanları, bilirkişi incelemesi ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle;
1- İtirazımızın KABULÜ ile [İL] Cumhuriyet Başsavcılığının [YIL]/[NO] sayılı kovuşturmaya yer olmadığına dair kararının KALDIRILMASINA,
2- Eksik bırakılan delillerin toplanmasına ve şüpheli hakkında KAMU DAVASI AÇILMASINA
karar verilmesini müvekkil adına saygıyla arz ve talep ederim.

[TARİH]

Müşteki Vekili
Av. [AD SOYAD]
(e-imzalıdır)

EKLER:
1- Vekâletname örneği
2- Kovuşturmaya yer olmadığına dair karar ve tebliğ evrakı örneği`,
  },
  {
    id: "tahliye-talebi",
    kategori: "Ceza Hukuku",
    baslik: "Tutukluluğun Kaldırılması / Tahliye Talebi",
    aciklama:
      "Tutuklu şüpheli veya sanık hakkında tutukluluğun kaldırılması, aksi hâlde adli kontrol uygulanması istemli dilekçe iskeleti (CMK m. 104).",
    davaTuru: "Tutukluluğun kaldırılması",
    dilekceTipi: "Tahliye talebi dilekçesi",
    yetkiliMahkeme: "Asliye Ceza / Ağır Ceza Mahkemesi",
    kaynak: "ozgun",
    icerik: `[İL] ( ). [ASLİYE CEZA MAHKEMESİ SAYIN HÂKİMLİĞİ'NE / AĞIR CEZA MAHKEMESİ BAŞKANLIĞI'NA]

DOSYA NO          : [YIL]/[NO] E.
TUTUKLU SANIK     : [AD SOYAD] (T.C.: [T.C. KİMLİK NO])
                    Hâlen [CEZA İNFAZ KURUMU ADI]'nda tutuklu
MÜDAFİİ           : Av. [AD SOYAD] — [BÜRO ADRESİ]
SUÇ               : [SUÇ ADI]
TUTUKLANMA TARİHİ : [TARİH]
KONU              : Müvekkil hakkındaki tutukluluk hâlinin kaldırılarak TAHLİYESİNE, aksi kanaatte adli kontrol tedbiri uygulanmasına karar verilmesi istemidir.

AÇIKLAMALAR:
1- Müvekkil, [SUÇ ADI] suçundan [TUTUKLANMA TARİHİ] tarihinde tutuklanmış olup hâlen [CEZA İNFAZ KURUMU ADI]'nda tutukludur. Müvekkilin tutukluluğu bu tarih itibarıyla [SÜRE] devam etmektedir.
2- Tutuklama, ceza muhakemesinin en ağır koruma tedbiri olup ancak kanunda öngörülen koşulların birlikte gerçekleşmesi hâlinde uygulanabilir. Tedbirin devamı için, kuvvetli suç şüphesinin yanı sıra kaçma ya da delilleri karartma şeklindeki tutuklama nedenlerinin somut olgularla desteklenmesi ve tedbirin ölçülü olması gerekir. Somut olayda bu koşullar ortadan kalkmıştır.
3- DELİL KARARTMA ŞÜPHESİ KALMAMIŞTIR: Soruşturma aşamasında toplanması gereken tüm deliller toplanmış, [DELİL — ör. dijital materyaller, banka kayıtları, kamera görüntüleri] dosyaya kazandırılmıştır. Müşteki ve tanık beyanları alınmış olup dosyada müvekkilin etki edebileceği bir delil bulunmamaktadır.
4- KAÇMA ŞÜPHESİ BULUNMAMAKTADIR: Müvekkilin [ADRES] adresinde yerleşik sabit ikametgâhı, [İŞ / MESLEK] şeklinde düzenli işi ve [AİLE DURUMU — ör. bakmakla yükümlü olduğu eşi ve iki çocuğu] bulunmaktadır. Müvekkil, [YAKALANMA/TESLİM OLMA DURUMU — ör. hakkındaki soruşturmayı öğrenir öğrenmez kendiliğinden kolluğa başvurmuş], yargılama boyunca tüm çağrılara uymuştur. Bu olgular kaçma şüphesinin bulunmadığını göstermektedir.
5- ÖLÇÜLÜLÜK YÖNÜNDEN: Müvekkil sabıkasız olup [SAĞLIK DURUMU / KİŞİSEL DURUM — varsa açıklama]. Tutukluluğun devamı, müvekkilin kişi hürriyeti bakımından ölçüsüz bir müdahale niteliği taşımakta ve tedbir niteliğini aşarak cezaya dönüşmektedir. Kişi hürriyeti ve güvenliği hakkı Anayasa m. 19 ile güvence altına alınmış olup tutuklama son çare olarak başvurulması gereken bir tedbirdir.
6- Kaldı ki tutuklama ile ulaşılmak istenen amaç, kanunda öngörülen adli kontrol tedbirleri ile de sağlanabilecek durumdadır. Müvekkil hakkında [ADLİ KONTROL TÜRÜ — ör. yurt dışına çıkış yasağı, belirli aralıklarla kolluğa başvurma yükümlülüğü, konutu terk etmeme] gibi daha hafif tedbirlerin uygulanması yeterli olacaktır.

HUKUKİ NEDENLER   : 5271 sayılı CMK m. 100, 101, 104, 109 ve devamı maddeleri, Anayasa m. 19, Avrupa İnsan Hakları Sözleşmesi m. 5 ve sair mevzuat.
HUKUKİ DELİLLER   : Sayın Mahkemenizin [YIL]/[NO] esas sayılı dosyası, adli sicil kaydı, ikametgâh ve iş belgeleri, [VARSA: sağlık raporu], nüfus kayıt örneği ve her türlü yasal delil.

SONUÇ VE İSTEM    : Yukarıda açıklanan ve Sayın Mahkemenizce resen gözetilecek nedenlerle;
1- Müvekkil hakkındaki tutukluluk hâlinin KALDIRILARAK TAHLİYESİNE,
2- Aksi kanaatte olunması hâlinde tutuklama tedbiri yerine [ADLİ KONTROL TÜRÜ] şeklinde ADLİ KONTROL TEDBİRİ uygulanmasına
karar verilmesini müvekkil adına saygıyla arz ve talep ederim.

[TARİH]

Tutuklu Sanık Müdafii
Av. [AD SOYAD]
(e-imzalıdır)`,
  },
];
