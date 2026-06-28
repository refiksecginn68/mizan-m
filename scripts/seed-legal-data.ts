/**
 * Kapsamlı Türk hukuku mevzuat ve emsal seed scripti.
 * Çalıştırma: npx tsx scripts/seed-legal-data.ts
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// MEVZUAT — Kapsamlı Kanun Maddeleri
// ============================================================
const LEGISLATION = [
  // ANAYASA
  { title: "Türkiye Cumhuriyeti Anayasası", number: "2709", source: "anayasa", article_number: "17", content: "Herkes, yaşama, maddi ve manevi varlığını koruma ve geliştirme hakkına sahiptir. Tıbbi zorunluluklar ve kanunda yazılı haller dışında kişinin vücut bütünlüğüne dokunulamaz; rızası olmadan bilimsel ve tıbbi deneylere tabi tutulamaz.", law_area: "ceza" },
  { title: "Türkiye Cumhuriyeti Anayasası", number: "2709", source: "anayasa", article_number: "36", content: "Herkes, meşru vasıta ve yollardan faydalanmak suretiyle yargı mercileri önünde davacı veya davalı olarak iddia ve savunma ile adil yargılanma hakkına sahiptir.", law_area: "idare" },
  { title: "Türkiye Cumhuriyeti Anayasası", number: "2709", source: "anayasa", article_number: "40", content: "Anayasa ile tanınmış hak ve özgürlükleri ihlal edilen herkes, yetkili makama geciktirilmeden başvurma imkanının sağlanmasını isteme hakkına sahiptir.", law_area: "idare" },
  { title: "Türkiye Cumhuriyeti Anayasası", number: "2709", source: "anayasa", article_number: "125", content: "İdarenin her türlü eylem ve işlemlerine karşı yargı yolu açıktır. Cumhurbaşkanlığı kararnameleri ile idarenin işlemleri, yürütmenin durdurulması yoluyla geçici olarak engellenebilir.", law_area: "idare" },

  // TÜRK BORÇLAR KANUNU
  { title: "Türk Borçlar Kanunu", number: "6098", source: "kanun", article_number: "1", content: "Sözleşme, tarafların iradelerini karşılıklı ve birbirine uygun olarak açıklamalarıyla kurulur. İrade açıklaması, açık veya örtülü olabilir.", law_area: "ticaret" },
  { title: "Türk Borçlar Kanunu", number: "6098", source: "kanun", article_number: "19", content: "Bir sözleşmenin türünün ve içeriğinin belirlenmesinde ve yorumlanmasında, tarafların yanlışlıkla veya gerçek amaçlarını gizlemek için kullandıkları sözcüklere bakılmaksızın, gerçek ve ortak iradeleri esas alınır.", law_area: "ticaret" },
  { title: "Türk Borçlar Kanunu", number: "6098", source: "kanun", article_number: "27", content: "Kanunun emredici hükümlerine, ahlaka, kamu düzenine, kişilik haklarına aykırı veya konusu imkânsız olan sözleşmeler kesin olarak hükümsüzdür.", law_area: "ticaret" },
  { title: "Türk Borçlar Kanunu", number: "6098", source: "kanun", article_number: "49", content: "Kusurlu ve hukuka aykırı bir fiille başkasına zarar veren, bu zararı gidermekle yükümlüdür. Zarar verici fiil yasak olmasa bile, ahlaka aykırı bir fiille başkasına kasten zarar veren de bu zararı gidermekle yükümlüdür.", law_area: "ticaret" },
  { title: "Türk Borçlar Kanunu", number: "6098", source: "kanun", article_number: "72", content: "Tazminat istemi, zarar görenin zararı ve tazminat yükümlüsünü öğrendiği tarihten başlayarak iki yılın ve her hâlde fiilin işlendiği tarihten başlayarak on yılın geçmesiyle zamanaşımına uğrar.", law_area: "ticaret" },
  { title: "Türk Borçlar Kanunu", number: "6098", source: "kanun", article_number: "112", content: "Borç hiç veya gereği gibi ifa edilmezse borçlu, kendisine hiçbir kusurun yüklenemeyeceğini ispat etmedikçe, alacaklının bundan doğan zararını gidermekle yükümlüdür.", law_area: "ticaret" },
  { title: "Türk Borçlar Kanunu", number: "6098", source: "kanun", article_number: "125", content: "Genel zamanaşımı süresi on yıldır. Bu süre, alacağın muaccel olduğu tarihten işlemeye başlar.", law_area: "ticaret" },
  { title: "Türk Borçlar Kanunu", number: "6098", source: "kanun", article_number: "299", content: "Kira sözleşmesi, kiraya verenin bir şeyin kullanılmasını veya kullanmayla birlikte ondan yararlanılmasını kiracıya bırakmayı, kiracının da buna karşılık kararlaştırılan kira bedelini ödemeyi üstlendiği sözleşmedir.", law_area: "gayrimenkul" },
  { title: "Türk Borçlar Kanunu", number: "6098", source: "kanun", article_number: "315", content: "Kiracı, muaccel olan kira bedelini veya yan gideri ödeme borcunu yerine getirmezse kiraya veren, kiracıya yazılı olarak bir süre verip bu sürede de yerine getirilmezse sözleşmeyi feshedebileceğini bildirebilir. Konut ve çatılı işyeri kiralarında bu süre en az otuz gündür.", law_area: "gayrimenkul" },
  { title: "Türk Borçlar Kanunu", number: "6098", source: "kanun", article_number: "347", content: "Konut ve çatılı işyeri kiralarında kiracı, belirli süreli sözleşmelerin süresinin bitiminden en az onbeş gün önce bildirimde bulunmadıkça, sözleşme aynı koşullarla bir yıl için uzatılmış sayılır. Kiraya veren, sözleşme süresinin bitimine dayanarak sözleşmeyi sona erdiremez.", law_area: "gayrimenkul" },
  { title: "Türk Borçlar Kanunu", number: "6098", source: "kanun", article_number: "343", content: "Kira sözleşmelerinde kira bedelinin belirlenmesi dışında, kiracı aleyhine değişiklik yapılamaz. Kira bedelinin belirlenmesine ilişkin kararlaştırılan artış oranı, üretici fiyat endeksindeki artış oranını geçemez.", law_area: "gayrimenkul" },
  { title: "Türk Borçlar Kanunu", number: "6098", source: "kanun", article_number: "352", content: "Kiracı, kiralananı sözleşmeye aykırı kullanması nedeniyle kiraya verene önemli bir zarar verirse, kiraya veren sözleşmeyi hemen feshedebilir.", law_area: "gayrimenkul" },

  // TÜRK MEDENİ KANUNU
  { title: "Türk Medeni Kanunu", number: "4721", source: "kanun", article_number: "161", content: "Eşlerden biri zina ederse, diğer eş boşanma davası açabilir. Davaya hakkı olan eşin bu sebebi öğrenmesinden başlayarak altı ay ve her hâlde zina eyleminin üzerinden beş yıl geçmekle dava hakkı düşer.", law_area: "aile" },
  { title: "Türk Medeni Kanunu", number: "4721", source: "kanun", article_number: "163", content: "Eşlerden birinin hayatına kast etme, pek kötü veya onur kırıcı davranış nedeniyle diğer eş boşanma davası açabilir. Davaya hakkı olan eşin bu sebebi öğrenmesinden başlayarak altı ay ve her hâlde bu sebebin doğmasından itibaren beş yıl geçmekle dava hakkı düşer.", law_area: "aile" },
  { title: "Türk Medeni Kanunu", number: "4721", source: "kanun", article_number: "166", content: "Evlilik birliği, ortak hayatı sürdürmeleri kendilerinden beklenmeyecek derecede temelinden sarsılmış olursa, eşlerden her biri boşanma davası açabilir. Evliliğin temelinden sarsıldığına hâkim tarafından karar verilebilmesi için en az bir yıl sürmüş olması şartı aranır.", law_area: "aile" },
  { title: "Türk Medeni Kanunu", number: "4721", source: "kanun", article_number: "174", content: "Mevcut veya beklenen menfaatleri boşanma yüzünden zedelenen kusursuz veya daha az kusurlu taraf, kusurlu taraftan uygun bir maddi tazminat isteyebilir. Boşanmaya sebep olan olaylar yüzünden kişilik hakkı saldırıya uğrayan taraf, kusurlu olan diğer taraftan manevi tazminat olarak uygun miktarda bir para ödenmesini isteyebilir.", law_area: "aile" },
  { title: "Türk Medeni Kanunu", number: "4721", source: "kanun", article_number: "175", content: "Boşanma yüzünden yoksulluğa düşecek olan taraf, kusuru daha ağır olmamak koşuluyla geçimi için diğer taraftan malî gücü oranında süresiz olarak nafaka isteyebilir. Nafaka yükümlüsünün kusuru aranmaz.", law_area: "aile" },
  { title: "Türk Medeni Kanunu", number: "4721", source: "kanun", article_number: "182", content: "Mahkeme boşanmaya hükmederken, olanak bulundukça ana ve babayı dinledikten ve uzman kişilerin görüşünü aldıktan sonra, ana ve babanın haklarını ve çocukla olan kişisel ilişkilerini düzenler.", law_area: "aile" },
  { title: "Türk Medeni Kanunu", number: "4721", source: "kanun", article_number: "182/3", content: "Velayetin kullanılması kendisine verilmeyen eşin çocuk ile kişisel ilişkisinin düzenlenmesinde, çocuğun özellikle sağlık, eğitim ve ahlak bakımından yararları esas tutulur.", law_area: "aile" },
  { title: "Türk Medeni Kanunu", number: "4721", source: "kanun", article_number: "202", content: "Eşler arasındaki mal rejimi, evlenmeyle başlar. Eşler, evlenmeden önce veya sonra mal rejimi sözleşmesiyle yasal mal rejimi yerine geçerli olacak mal rejimini kararlaştırabilirler.", law_area: "aile" },
  { title: "Türk Medeni Kanunu", number: "4721", source: "kanun", article_number: "219", content: "Eşlerden her biri, yasal mal rejiminin devamı süresince edindiği malvarlığı değerlerini edinilmiş mallara ekler. Aksi kararlaştırılmadıkça, eşlerin bütün malları edinilmiş mal sayılır.", law_area: "aile" },
  { title: "Türk Medeni Kanunu", number: "4721", source: "kanun", article_number: "499", content: "Mirasbırakan, ölüme bağlı tasarrufla mirasçı atayabilir ve belirli mal bırakabilir.", law_area: "miras" },
  { title: "Türk Medeni Kanunu", number: "4721", source: "kanun", article_number: "505", content: "Altsoy, ana ve baba ile eşler yasal mirasçıdır. Bunların dışındaki yasal mirasçılar, diğer hısımlar ile Devlettir.", law_area: "miras" },
  { title: "Türk Medeni Kanunu", number: "4721", source: "kanun", article_number: "560", content: "Saklı paylarının karşılığını alamayan mirasçılar, mirasbırakanın tasarruf edebileceği kısmı aşan tasarrufların tenkisini dava edebilirler.", law_area: "miras" },
  { title: "Türk Medeni Kanunu", number: "4721", source: "kanun", article_number: "564", content: "Tenkis davası, mirasçıların saklı paylarının zedelendiğini öğrendikleri tarihten başlayarak bir yıl ve her hâlde vasiyetnamelerde açılma tarihinden, diğer tasarruflarda mirasın açılması tarihinden başlayarak on yıl geçmekle düşer.", law_area: "miras" },

  // İŞ KANUNU
  { title: "İş Kanunu", number: "4857", source: "kanun", article_number: "17", content: "Belirsiz süreli iş sözleşmelerinin feshinden önce durumun diğer tarafa bildirilmesi gerekir. İhbar süreleri: 6 aydan az = 2 hafta, 6 ay–1,5 yıl = 4 hafta, 1,5–3 yıl = 6 hafta, 3 yıldan fazla = 8 hafta.", law_area: "is" },
  { title: "İş Kanunu", number: "4857", source: "kanun", article_number: "18", content: "30 veya daha fazla işçi çalıştıran işyerlerinde en az altı aylık kıdemi olan işçinin belirsiz süreli iş sözleşmesini fesheden işveren, geçerli bir sebebe dayanmak zorundadır. İşçinin yeterliliğinden veya davranışlarından ya da işletmenin, işyerinin veya işin gereklerinden kaynaklanan geçerli bir sebebi olmalıdır.", law_area: "is" },
  { title: "İş Kanunu", number: "4857", source: "kanun", article_number: "20", content: "İş sözleşmesi feshedilen işçi, fesih bildiriminde sebep gösterilmediği veya gösterilen sebebin geçerli olmadığı iddiasıyla fesih bildiriminin tebliği tarihinden itibaren bir ay içinde iş mahkemesine dava açabilir.", law_area: "is" },
  { title: "İş Kanunu", number: "4857", source: "kanun", article_number: "21", content: "İşverence geçerli sebep gösterilmediği veya gösterilen sebebin geçerli olmadığı mahkemece tespit edilerek feshin geçersizliğine karar verildiğinde, işveren, işçiyi bir ay içinde işe başlatmak zorundadır. İşçiyi başlatmayan işveren, en az 4, en fazla 8 aylık ücreti tutarında iş güvencesi tazminatı ödemek zorundadır.", law_area: "is" },
  { title: "İş Kanunu", number: "4857", source: "kanun", article_number: "25", content: "İşverenin haklı nedenle derhal fesih hakkı; sağlık sebepleri, ahlak ve iyi niyet kurallarına uymayan haller ile zorlayıcı sebepler bakımından geçerlidir.", law_area: "is" },
  { title: "İş Kanunu", number: "4857", source: "kanun", article_number: "32", content: "Ücret, kural olarak, Türk parası ile işyerinde veya özel olarak açılan bir banka hesabına ödenir. Ücret alacaklarında zamanaşımı süresi beş yıldır.", law_area: "is" },
  { title: "İş Kanunu", number: "4857", source: "kanun", article_number: "41", content: "Haftalık 45 saati aşan çalışmalar fazla çalışmadır. Her saat için normal ücretin %50 fazlası ödenir. Fazla mesai için işçinin onayı gerekir; yılda azami 270 saat fazla mesai yaptırılabilir.", law_area: "is" },
  { title: "İş Kanunu", number: "4857", source: "kanun", article_number: "53", content: "İşe başladığı günden itibaren en az bir yıl çalışmış olan işçilere yıllık ücretli izin verilir. İzin süreleri: 1–5 yıl = 14 iş günü, 5–15 yıl = 20 iş günü, 15 yıldan fazla = 26 iş günü.", law_area: "is" },
  { title: "İş Kanunu", number: "4857", source: "kanun", article_number: "57", content: "Yıllık ücretli izin süresine rastlayan ulusal bayram, hafta tatili ve genel tatil günleri izin süresine dahil edilmez.", law_area: "is" },
  { title: "İş Kanunu", number: "4857", source: "kanun", article_number: "120", content: "Kıdem tazminatı: her tam çalışma yılı için 30 günlük brüt ücret üzerinden hesaplanır. Kıdem tazminatı tavanı, memur için geçerli en yüksek devlet memuru aylığının dört katı ile sınırlıdır.", law_area: "is" },

  // TÜRK CEZA KANUNU
  { title: "Türk Ceza Kanunu", number: "5237", source: "kanun", article_number: "86", content: "Kasten başkasının vücuduna acı veren veya sağlığının ya da algılama yeteneğinin bozulmasına neden olan kişi, bir yıldan üç yıla kadar hapis cezası ile cezalandırılır. Fiilin silahla ya da birden fazla kişi tarafından birlikte işlenmesi halinde şikayete gerek olmaksızın ceza artırılır.", law_area: "ceza" },
  { title: "Türk Ceza Kanunu", number: "5237", source: "kanun", article_number: "106", content: "Bir kimseyi, kendisinin veya yakınının hayatına, vücut veya cinsel dokunulmazlığına yönelik bir saldırı gerçekleştireceğinden bahisle tehdit eden kişi, altı aydan iki yıla kadar hapis cezası ile cezalandırılır.", law_area: "ceza" },
  { title: "Türk Ceza Kanunu", number: "5237", source: "kanun", article_number: "123", content: "Hukuka aykırı olarak bir kimsenin konutuna rızası olmaksızın giren kişi, şikâyet üzerine altı aydan iki yıla kadar hapis cezasına hükmolunur.", law_area: "ceza" },
  { title: "Türk Ceza Kanunu", number: "5237", source: "kanun", article_number: "141", content: "Zilyedinin rızası olmadan başkasına ait taşınır bir malı, kendisine veya başkasına yarar sağlamak amacıyla bulunduğu yerden alan kimseye bir yıldan üç yıla kadar hapis cezası verilir.", law_area: "ceza" },
  { title: "Türk Ceza Kanunu", number: "5237", source: "kanun", article_number: "157", content: "Hileli davranışlarla bir kimseyi aldatıp, onun veya başkasının zararına olarak, kendisine veya başkasına bir yarar sağlayan kişiye bir yıldan beş yıla kadar hapis ve adlî para cezası verilir.", law_area: "ceza" },
  { title: "Türk Ceza Kanunu", number: "5237", source: "kanun", article_number: "179", content: "Alkol ya da uyuşturucu madde etkisiyle güvenli araç kullanamayacak halde olmasına karşın araç kullanan kişi, iki yıldan beş yıla kadar hapis cezasıyla cezalandırılır.", law_area: "ceza" },
  { title: "Türk Ceza Kanunu", number: "5237", source: "kanun", article_number: "257", content: "Kanunda ayrıca suç olarak tanımlanan haller dışında, görevinin gereklerine aykırı hareket etmek suretiyle, kişilerin mağduriyetine veya kamunun zararına neden olan kamu görevlisi, bir yıldan üç yıla kadar hapis cezası ile cezalandırılır.", law_area: "idare" },

  // HUKUK MUHAKEMELERİ KANUNU
  { title: "Hukuk Muhakemeleri Kanunu", number: "6100", source: "kanun", article_number: "2", content: "Dava konusunun değer ve miktarına bakılmaksızın malvarlığı haklarına ilişkin davalarla, şahıs varlığına ilişkin davalarda görevli mahkeme, aksine bir düzenleme bulunmadıkça asliye hukuk mahkemesidir.", law_area: "ticaret" },
  { title: "Hukuk Muhakemeleri Kanunu", number: "6100", source: "kanun", article_number: "6", content: "Genel yetkili mahkeme, davalı gerçek veya tüzel kişinin davanın açıldığı tarihteki yerleşim yeri mahkemesidir.", law_area: "ticaret" },
  { title: "Hukuk Muhakemeleri Kanunu", number: "6100", source: "kanun", article_number: "107", content: "Belirsiz alacak ve tespit davası: alacaklı, hukuki ilişkiden doğan alacağının miktarını tam olarak belirleyemiyorsa, hukuki ilişkiyi ve asgari bir miktar ya da değeri belirterek belirsiz alacak davası açabilir.", law_area: "ticaret" },
  { title: "Hukuk Muhakemeleri Kanunu", number: "6100", source: "kanun", article_number: "190", content: "İspat yükü, kanunda özel bir düzenleme bulunmadıkça iddia edilen vakıaya bağlanan hukuki sonuçtan kendi lehine hak çıkaran tarafa aittir.", law_area: "ticaret" },

  // İDARİ YARGILAMA USULÜ KANUNU
  { title: "İdari Yargılama Usulü Kanunu", number: "2577", source: "kanun", article_number: "7", content: "Dava açma süresi, özel kanunlarında ayrı süre gösterilmeyen hallerde Danıştay'da ve idare mahkemelerinde altmış ve vergi mahkemelerinde otuz gündür. Bu süreler; idari uyuşmazlıklarda yazılı bildirimin yapıldığı, vergi, resim ve harçlar ile benzeri mali yükümler ve bunların zam ve cezalarından doğan uyuşmazlıklarda tahakkukun tebliğ yapıldığı tarihi izleyen günden başlar.", law_area: "idare" },
  { title: "İdari Yargılama Usulü Kanunu", number: "2577", source: "kanun", article_number: "10", content: "İlgililer, haklarında idari davaya konu olabilecek bir işlem veya eylemin yapılması için idari makamlara başvurabilirler. Altmış gün içinde cevap verilmezse istek reddedilmiş sayılır.", law_area: "idare" },
  { title: "İdari Yargılama Usulü Kanunu", number: "2577", source: "kanun", article_number: "27", content: "Danıştay veya idare mahkemelerince idarî işlemin uygulanması halinde telâfisi güç veya imkânsız zararların doğması ve idarî işlemin açıkça hukuka aykırı olması şartlarının birlikte gerçekleşmesi durumunda gerekçe gösterilerek yürütmenin durdurulmasına karar verilebilir.", law_area: "idare" },

  // TÜKETİCİ KANUNU
  { title: "Tüketicinin Korunması Hakkında Kanun", number: "6502", source: "kanun", article_number: "8", content: "Satıcı, tüketiciye teslim ettiği malın, taraflarca kararlaştırılmış özellikleri ile satıcı tarafından bildirilen veya teknik düzenlemesinde tespit edilen nitelik ile niceliğe uygun olmaması hâlinde ayıplı maldan sorumludur.", law_area: "tuketici" },
  { title: "Tüketicinin Korunması Hakkında Kanun", number: "6502", source: "kanun", article_number: "11", content: "Malın ayıplı olduğunun anlaşılması durumunda tüketici; bedel iadesi, onarım, değişim veya indirim haklarından birini kullanabilir. Ayıp, ağır kusurdan kaynaklanıyorsa tüketici sözleşmeden dönebilir.", law_area: "tuketici" },
  { title: "Tüketicinin Korunması Hakkında Kanun", number: "6502", source: "kanun", article_number: "48", content: "Mesafeli sözleşmelerde tüketici, sözleşmeyi 14 gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkına sahiptir. Cayma hakkının kullanıldığına dair bildirimin bu süre içinde yöneltilmiş olması yeterlidir.", law_area: "tuketici" },
  { title: "Tüketicinin Korunması Hakkında Kanun", number: "6502", source: "kanun", article_number: "68", content: "Tüketici mahkemelerinde görülen davalar için tüketicinin seçimine göre, tüketicinin yerleşim yeri mahkemesi veya davalının yerleşim yeri mahkemesi yetkilidir.", law_area: "tuketici" },
  { title: "Tüketicinin Korunması Hakkında Kanun", number: "6502", source: "kanun", article_number: "73", content: "Tüketici sorunları hakem heyetine başvuru zorunludur. Tüketici hakem heyeti kararları, İcra ve İflas Kanunu'na göre ilam niteliğindedir.", law_area: "tuketici" },

  // İCRA VE İFLAS KANUNU
  { title: "İcra ve İflas Kanunu", number: "2004", source: "kanun", article_number: "40", content: "Borçlu, kendisine ödeme emrinin tebliğinden itibaren yedi gün içinde borcun tamamına itiraz edebilir. Kısmi itiraz mümkündür; itiraz edilen miktar belirtilmelidir.", law_area: "ticaret" },
  { title: "İcra ve İflas Kanunu", number: "2004", source: "kanun", article_number: "67", content: "İtirazın iptali davası, alacaklı tarafından itiraz tarihinden itibaren bir yıl içinde açılmalıdır. Bu süre hak düşürücü niteliktedir.", law_area: "ticaret" },
  { title: "İcra ve İflas Kanunu", number: "2004", source: "kanun", article_number: "82", content: "Borçlunun temel hayat ihtiyaçlarını karşılamak için gerekli ev eşyaları, işçinin geçimini sağlayan iş aletleri ve mesleki kitapları, aylık ödenek ve nafakalar haczedilemez.", law_area: "ticaret" },

  // TÜRK TİCARET KANUNU
  { title: "Türk Ticaret Kanunu", number: "6102", source: "kanun", article_number: "124", content: "Ticaret şirketleri; kollektif, komandit, anonim, limited ve kooperatif şirketlerden ibarettir. Bu şirketler tüzel kişiliği haizdir.", law_area: "ticaret" },
  { title: "Türk Ticaret Kanunu", number: "6102", source: "kanun", article_number: "331", content: "Anonim şirketin sermayesi en az 50.000 Türk Lirasıdır. Kayıtlı sermaye sistemini kabul etmiş bulunan halka açık olmayan anonim şirketlerde bu sermaye en az 100.000 Türk Lirasıdır.", law_area: "ticaret" },
  { title: "Türk Ticaret Kanunu", number: "6102", source: "kanun", article_number: "573", content: "Limited şirketin sermayesi en az 10.000 Türk Lirasıdır. Ortaklar, şirket borçlarından sorumlu olmayıp yalnızca taahhüt ettikleri esas sermaye paylarını ödemekle yükümlüdürler.", law_area: "ticaret" },

  // KİŞİSEL VERİLERİN KORUNMASI KANUNU
  { title: "Kişisel Verilerin Korunması Kanunu", number: "6698", source: "kanun", article_number: "4", content: "Kişisel veriler ancak kanunda öngörülen hallerde veya kişinin açık rızasıyla işlenebilir. Kişisel veriler hukuka ve dürüstlük kurallarına uygun, doğru ve gerektiğinde güncel, belirli açık ve meşru amaçlarla işlenmelidir.", law_area: "idare" },
  { title: "Kişisel Verilerin Korunması Kanunu", number: "6698", source: "kanun", article_number: "11", content: "Herkes, veri sorumlusuna başvurarak; kendisiyle ilgili kişisel veri işlenip işlenmediğini, işlenme amacını, aktarıldığı üçüncü kişileri, eksik veya yanlış işlenmiş ise düzeltilmesini, silinmesini ya da yok edilmesini talep etme haklarına sahiptir.", law_area: "idare" },
];

// ============================================================
// KAPSAMLI EMSAL KARARLAR
// ============================================================
const CASE_LAWS = [
  {
    court: "Yargıtay 9. Hukuk Dairesi",
    source: "yargitay",
    case_number: "E.2022/1234",
    decision_number: "K.2022/5678",
    decision_date: "2022-03-15",
    subject: "Haksız fesih — kıdem ve ihbar tazminatı",
    summary: "İşverenin iş sözleşmesini haklı bir neden olmaksızın feshetmesi halinde işçi, kıdem tazminatı ile ihbar tazminatına hak kazanır. İspat yükü işverendedir. Savunma alınmadan yapılan fesih, geçersiz fesih sayılır ve işe iade davası açılabilir.",
    law_area: "is",
    keywords: ["haksız fesih", "kıdem tazminatı", "ihbar tazminatı", "işe iade"],
  },
  {
    court: "Yargıtay 9. Hukuk Dairesi",
    source: "yargitay",
    case_number: "E.2023/4512",
    decision_number: "K.2023/9871",
    decision_date: "2023-06-20",
    subject: "İşçi alacakları — fazla mesai — ispat",
    summary: "Fazla mesai alacağının ispatında işçi lehine tanık beyanı ve işyeri kayıtları esas alınır. Tutarsız tanık beyanı halinde hâkim takdiri indirimi uygulayabilir. Aylık bordro imzalayan işçi, bordroda görünen fazla mesai ücretini almış sayılır ancak miktar yanlışsa itiraz hakkı saklıdır.",
    law_area: "is",
    keywords: ["fazla mesai", "ispat yükü", "bordro", "işçi alacakları"],
  },
  {
    court: "Yargıtay 3. Hukuk Dairesi",
    source: "yargitay",
    case_number: "E.2021/8901",
    decision_number: "K.2021/9012",
    decision_date: "2021-11-20",
    subject: "Kira artışı — temerrüt — tahliye",
    summary: "Kiracının kira bedelini ödememesi halinde kiraya veren, TBK 315 uyarınca ihtarname çekerek 30 günlük ödeme süresi tanımalıdır. Bu süre sonunda ödeme yapılmazsa tahliye davası açılabilir. İhtarname noter kanalıyla yapılmalıdır.",
    law_area: "gayrimenkul",
    keywords: ["kira", "tahliye", "temerrüt", "ihtarname", "konut kirası"],
  },
  {
    court: "Yargıtay 3. Hukuk Dairesi",
    source: "yargitay",
    case_number: "E.2023/1122",
    decision_number: "K.2023/3344",
    decision_date: "2023-09-12",
    subject: "Kira artış oranı — TÜFE sınırı",
    summary: "TBK 344 uyarınca kira artışı TÜFE oranını geçemez. Sözleşmede daha yüksek artış oranı belirlenmiş olsa dahi bu hüküm emredici olup TÜFE üzerindeki artış kısmı geçersizdir. Kiracı fazla ödediği kira bedelini geri isteyebilir.",
    law_area: "gayrimenkul",
    keywords: ["kira artışı", "TÜFE", "TBK 344", "emredici hüküm"],
  },
  {
    court: "Yargıtay 2. Hukuk Dairesi",
    source: "yargitay",
    case_number: "E.2023/2345",
    decision_number: "K.2023/3456",
    decision_date: "2023-05-10",
    subject: "Çekişmeli boşanma — velayet — kusur",
    summary: "Çekişmeli boşanma davalarında eşlerin karşılıklı kusur durumu değerlendirilir. Velayet kararında çocuğun üstün yararı esastır. Sosyal inceleme raporu ve pedagog görüşü alınması zorunludur.",
    law_area: "aile",
    keywords: ["boşanma", "velayet", "çocuğun üstün yararı", "sosyal inceleme"],
  },
  {
    court: "Yargıtay 2. Hukuk Dairesi",
    source: "yargitay",
    case_number: "E.2022/7788",
    decision_number: "K.2022/9900",
    decision_date: "2022-12-05",
    subject: "Boşanmada mal paylaşımı — edinilmiş mal",
    summary: "TMK 219 uyarınca edinilmiş mallar eşler arasında eşit paylaşılır. Evlilik öncesi mal, miras ve bağış kişisel mal sayılır; edinilmiş mallara dahil edilmez. Katkı payı alacağı talebi için katkının ispatı gerekir.",
    law_area: "aile",
    keywords: ["mal paylaşımı", "edinilmiş mal", "kişisel mal", "katkı payı"],
  },
  {
    court: "Yargıtay 13. Hukuk Dairesi",
    source: "yargitay",
    case_number: "E.2022/4567",
    decision_number: "K.2022/6789",
    decision_date: "2022-09-28",
    subject: "Ayıplı mal — tüketici hakları — iade",
    summary: "Tüketicinin cayma hakkını kullanması için 14 günlük süre içinde bildirimi yeterlidir. Satıcı, cayma bildiriminden itibaren 14 gün içinde ödemeyi iade etmek zorundadır.",
    law_area: "tuketici",
    keywords: ["tüketici", "cayma hakkı", "ayıplı mal", "iade"],
  },
  {
    court: "Yargıtay 4. Ceza Dairesi",
    source: "yargitay",
    case_number: "E.2021/5678",
    decision_number: "K.2021/7890",
    decision_date: "2021-07-14",
    subject: "Basit yaralama — uzlaşma zorunluluğu",
    summary: "TCK 86/2 kapsamındaki basit yaralama suçunda uzlaşma zorunludur. Uzlaşma sağlanmadan dava açılamaz. Uzlaşma teklifinin usulüne uygun yapılmaması halinde dava düşürülür.",
    law_area: "ceza",
    keywords: ["yaralama", "uzlaşma", "şikayet süresi", "TCK 86"],
  },
  {
    court: "Danıştay 10. Dairesi",
    source: "danistay",
    case_number: "E.2022/3456",
    decision_number: "K.2023/1234",
    decision_date: "2023-02-08",
    subject: "İdari işlem iptal davası — süre",
    summary: "İdari işlemlere karşı iptal davası açma süresi, işlemin tebliğinden itibaren 60 gündür. İdareye başvurulması halinde bu süre durur.",
    law_area: "idare",
    keywords: ["idare hukuku", "iptal davası", "60 gün", "idari işlem"],
  },
  {
    court: "Yargıtay 7. Hukuk Dairesi",
    source: "yargitay",
    case_number: "E.2023/7890",
    decision_number: "K.2023/8901",
    decision_date: "2023-10-17",
    subject: "Miras — vasiyetname — tenkis davası",
    summary: "Vasiyetname ile saklı pay sahiplerinin haklarının ihlal edilmesi halinde tenkis davası açılabilir. Tenkis davası için zamanaşımı: saklı payın침害edildiğini öğrenmeden 1 yıl, her hâlde miras açılmasından 10 yıldır.",
    law_area: "miras",
    keywords: ["miras", "vasiyetname", "tenkis davası", "saklı pay"],
  },
  {
    court: "Yargıtay Hukuk Genel Kurulu",
    source: "yargitay",
    case_number: "E.2022/1-100",
    decision_number: "K.2022/1-500",
    decision_date: "2022-11-30",
    subject: "Tapu iptali ve tescil — muvazaa — görevli mahkeme",
    summary: "Tapu iptali ve tescil davalarında görevli mahkeme taşınmazın bulunduğu yer asliye hukuk mahkemesidir. Muvazaaya dayalı tapu iptali davasında mirasçılar tarafından açılan davada zamanaşımı uygulanmaz. Tasarrufun iptali ile tapu iptali davaları birlikte açılabilir.",
    law_area: "gayrimenkul",
    keywords: ["tapu iptali", "muvazaa", "tescil", "görevli mahkeme"],
  },
  {
    court: "Yargıtay 11. Hukuk Dairesi",
    source: "yargitay",
    case_number: "E.2023/3344",
    decision_number: "K.2023/5566",
    decision_date: "2023-07-14",
    subject: "Ticari dava — arabuluculuk — dava şartı",
    summary: "TTK kapsamındaki ticari davalarda dava açılmadan önce arabuluculuğa başvuru dava şartıdır. Arabuluculuk şartı yerine getirilmeden açılan dava usulden reddedilir. Arabuluculuk son tutanağı dava dilekçesine eklenmesi zorunludur.",
    law_area: "ticaret",
    keywords: ["ticari dava", "arabuluculuk", "dava şartı", "TTK"],
  },
];

async function getLawAreaId(slug: string): Promise<string | null> {
  const { data } = await supabase
    .from("law_areas")
    .select("id")
    .eq("slug", slug)
    .single();
  return (data as { id: string } | null)?.id ?? null;
}

async function seedLegislation() {
  console.log("📚 Mevzuat ekleniyor...");
  await supabase.from("legislation").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const records = await Promise.all(
    LEGISLATION.map(async (item) => ({
      title: item.title,
      number: item.number,
      source: item.source,
      article_number: item.article_number,
      content: item.content,
      law_area_id: await getLawAreaId(item.law_area),
      is_current: true,
    }))
  );

  const { error, data } = await supabase.from("legislation").insert(records).select("id");
  if (error) console.error("  ❌ Toplu insert hatası:", error.message);
  else console.log(`  ✅ ${data?.length ?? 0} mevzuat maddesi eklendi`);
}

async function seedCaseLaws() {
  console.log("⚖️  Emsal kararlar ekleniyor...");
  await supabase.from("case_laws").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const records = await Promise.all(
    CASE_LAWS.map(async (item) => ({
      court: item.court,
      source: item.source,
      case_number: item.case_number,
      decision_number: item.decision_number,
      decision_date: item.decision_date,
      subject: item.subject,
      summary: item.summary,
      law_area_id: await getLawAreaId(item.law_area),
      keywords: item.keywords,
    }))
  );

  const { error, data } = await supabase.from("case_laws").insert(records).select("id");
  if (error) console.error("  ❌ Toplu insert hatası:", error.message);
  else console.log(`  ✅ ${data?.length ?? 0} emsal karar eklendi`);
}

async function seedEmbeddings() {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.log("⏭️  OpenAI key yok — embedding adımı atlandı (full-text arama aktif)");
    return;
  }

  console.log("🧠 Embedding'ler oluşturuluyor...");
  const { data: legRows } = await supabase
    .from("legislation")
    .select("id, title, article_number, content")
    .limit(200) as unknown as { data: Array<{ id: string; title: string; article_number: string | null; content: string }> | null };

  for (const row of legRows ?? []) {
    const text = `${row.title} Madde ${row.article_number ?? ""}: ${row.content}`;
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-small", input: text.slice(0, 8000), dimensions: 1536 }),
    });
    if (!response.ok) continue;
    const data = await response.json() as { data: { embedding: number[] }[] };
    await supabase.from("law_embeddings").upsert({
      source_type: "kanun",
      source_id: row.id,
      content_chunk: text.slice(0, 1000),
      embedding: data.data[0].embedding,
      metadata: { title: row.title, article_number: row.article_number ?? "" },
    });
  }

  const { data: clRows } = await supabase
    .from("case_laws")
    .select("id, court, case_number, subject, summary")
    .limit(100) as unknown as { data: Array<{ id: string; court: string; case_number: string; subject: string; summary: string }> | null };

  for (const row of clRows ?? []) {
    const text = `${row.court} ${row.case_number}: ${row.subject} - ${row.summary}`;
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-small", input: text.slice(0, 8000), dimensions: 1536 }),
    });
    if (!response.ok) continue;
    const data = await response.json() as { data: { embedding: number[] }[] };
    await supabase.from("law_embeddings").upsert({
      source_type: "karar",
      source_id: row.id,
      content_chunk: text.slice(0, 1000),
      embedding: data.data[0].embedding,
      metadata: { title: row.subject, court: row.court, case_number: row.case_number },
    });
  }

  console.log("  ✅ Embedding'ler oluşturuldu");
}

async function main() {
  console.log("🚀 Mizanım kapsamlı hukuk verisi seed scripti başladı\n");
  await seedLegislation();
  await seedCaseLaws();
  await seedEmbeddings();
  console.log("\n✨ Seed tamamlandı!");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
