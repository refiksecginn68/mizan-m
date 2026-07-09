import { searchEmsalRaw } from "../src/lib/services/bedesten";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import * as path from "path";

// Mappings from itemType.name to API court filters
const COURT_TYPE_MAP: Record<string, string> = {
  YARGITAYKARARI: "yargitay",
  DANISTAYKARAR: "danistay",
  YERELHUKUK: "ilk_derece",
  ISTINAFHUKUK: "bam_hukuk",
  KYB: "bam_ceza",
};

const EXACT_TOPICS = [
  "kıdem tazminatı haklı fesih",
  "fazla mesai ispat tanık",
  "kira tespiti tüfe artış",
  "boşanma velayet kusur",
  "boşanma edinilmiş mal paylaşımı",
  "ayıplı mal iade süresi",
  "basit yaralama uzlaşma",
  "idari işlem iptal süresi",
  "vasiyetname tenkis davası",
  "tapu iptali ve tescil muvazaa",
  "ticari dava arabuluculuk",
  "hırsızlık gece vakti",
  "dolandırıcılık nitelikli",
  "işe iade davası arabuluculuk",
  "ödünç sözleşmesi alacak",
  "sebepsiz zenginleşme zamanaşımı",
  "tasarrufun iptali davası borçlu",
  "nafaka artırımı davası",
  "hizmet tespiti davası hak düşürücü süre",
  "bono ciro senedi keşideci",
];

const TOPIC_QUERIES = [
  "silahlı saldırı",
  "kıdem tazminatı zamanaşımı",
  "kira tespit davası",
  "velayet hakkının kötüye kullanılması",
  "haksız işgal ecrimisil tazminatı",
  "murisin mal kaçırması tapu iptal",
  "ayıplı araç satışı iade",
  "nitelikli dolandırıcılık bilişim sistemleri",
  "kat karşılığı inşaat sözleşmesi fesih",
  "trafik kazası destekten yoksun kalma",
  "iş kazası maddi manevi tazminat",
  "kamulaştırmasız el atma tazminat",
  "marka tecavüzünün önlenmesi",
  "tüketici hakem heyeti kararına itiraz",
  "hizmet tespiti davalarında hak düşürücü süre",
  "çek şikayeti karşılıksız çek",
  "önalım şufa davası hak düşürücü süre",
  "tasarrufun iptali davası mal kaçırma",
  "yıllık ücretli izin hakkı ispatı",
  "haksız ihtiyati tedbir tazminat",
];

async function main() {
  console.log("Generating evaluation gold set...");
  const kesinEslesme = [];

  for (let i = 0; i < EXACT_TOPICS.length; i++) {
    const topic = EXACT_TOPICS[i];
    console.log(`[${i + 1}/${EXACT_TOPICS.length}] Fetching target for topic: "${topic}"...`);
    
    // Search Bedesten to get one real document
    const res = await searchEmsalRaw({
      phrase: topic,
      courtTypes: ["YARGITAYKARARI", "DANISTAYKARAR"],
      pageSize: 1,
      pageNumber: 1
    });

    if (res && res.items.length > 0) {
      const item = res.items[0];
      const courtVal = COURT_TYPE_MAP[item.itemType?.name ?? ""] ?? "all";
      
      kesinEslesme.push({
        id: `kesin_${i + 1}`,
        query_type: "kesin_eslesme",
        // Query text to search with
        q: `${item.birimAdi ?? ""} ${item.esasNo ?? ""} E. ${item.kararNo ?? ""} K.`,
        // Filters to locate the document precisely
        filters: {
          q: "",
          court: courtVal,
          daire: item.birimAdi ?? "",
          esas: item.esasNo ?? "",
          karar: item.kararNo ?? "",
          startDate: "",
          endDate: "",
        },
        target_document_id: item.documentId,
        metadata: {
          court: item.birimAdi,
          esasNo: item.esasNo,
          kararNo: item.kararNo,
          kararTarihi: item.kararTarihi,
        }
      });
    } else {
      console.warn(`Warning: Could not find target for topic: "${topic}". Falling back to mock data...`);
      // Fallback in case Bedesten fails
      kesinEslesme.push({
        id: `kesin_${i + 1}`,
        query_type: "kesin_eslesme",
        q: `Yargıtay 9. Hukuk Dairesi E.2022/1234 K.2022/5678`,
        filters: {
          q: "",
          court: "yargitay",
          daire: "9. Hukuk Dairesi",
          esas: "2022/1234",
          karar: "2022/5678",
          startDate: "",
          endDate: "",
        },
        target_document_id: "de215360-e388-4cfa-98fc-bd4a418fe92c",
        metadata: {
          court: "Yargıtay 9. Hukuk Dairesi",
          esasNo: "E.2022/1234",
          kararNo: "K.2022/5678",
        }
      });
    }

    // Safety delay between Bedesten requests to avoid rate limits
    await new Promise((r) => setTimeout(r, 400));
  }

  const evalSet = {
    kesin_eslesme: kesinEslesme,
    konu_bazli: TOPIC_QUERIES.map((q, idx) => ({
      id: `konu_${idx + 1}`,
      query_type: "konu_bazli",
      q,
      filters: {
        q,
        court: "all",
        daire: "",
        esas: "",
        karar: "",
        startDate: "",
        endDate: "",
      }
    }))
  };

  // Ensure eval directory exists
  if (!existsSync("eval")) {
    mkdirSync("eval");
  }

  writeFileSync("eval/emsal_gold.json", JSON.stringify(evalSet, null, 2), "utf8");
  console.log(`Successfully generated eval/emsal_gold.json with ${kesinEslesme.length} exact match targets and ${TOPIC_QUERIES.length} topic queries.`);
}

main().catch(console.error);
