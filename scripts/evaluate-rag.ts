import { GET } from "../src/app/api/emsal/search/route";
import { extractTerms } from "../src/lib/services/bedesten";
import { readFileSync, writeFileSync } from "fs";

// Load env vars
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const trLower = (s: string) => s.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase();

function computeOverlapRatio(query: string, subject: string, summary: string): number {
  const terms = extractTerms(query);
  if (terms.length === 0) return 0;
  
  const text = trLower(`${subject} ${summary}`);
  let matched = 0;
  for (const term of terms) {
    if (text.includes(trLower(term))) {
      matched++;
    }
  }
  return matched / terms.length;
}

interface EmsalResult {
  id?: string;
  documentId?: string;
  court: string;
  case_number: string;
  decision_number?: string | null;
  decision_date?: string | null;
  subject: string;
  summary: string;
  source_url?: string;
  score?: number;
}

async function callSearchApi(params: Record<string, string>): Promise<{ results: EmsalResult[]; total: number; source: string }> {
  const urlParams = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) urlParams.set(k, v);
  }
  const url = `http://localhost:3000/api/emsal/search?${urlParams.toString()}`;
  
  let attempt = 0;
  const maxAttempts = 3;
  while (attempt < maxAttempts) {
    try {
      const req = new Request(url);
      const res = await GET(req);
      if (res.ok) {
        return await res.json() as { results: EmsalResult[]; total: number; source: string };
      }
      console.warn(`API returned status ${res.status} on attempt ${attempt + 1}. Retrying...`);
    } catch (e) {
      console.warn(`API error on attempt ${attempt + 1}:`, e);
    }
    attempt++;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Failed to call search API for URL: ${url}`);
}

async function main() {
  console.log("Starting RAG evaluation...");
  const goldSet = JSON.parse(readFileSync("eval/emsal_gold.json", "utf8"));
  
  const kesinResults = [];
  const topicResults = [];
  
  // 1. Kesin Eşleşme Sorguları
  console.log("\n--- Running Kesin Eşleşme (Exact Match) Queries ---");
  for (const qObj of goldSet.kesin_eslesme) {
    console.log(`Querying ${qObj.id}: ${qObj.metadata.court} ${qObj.metadata.esasNo} E. ${qObj.metadata.kararNo} K. ...`);
    
    let results: EmsalResult[] = [];
    let source = "unknown";
    try {
      const apiRes = await callSearchApi(qObj.filters);
      results = apiRes.results;
      source = apiRes.source;
    } catch (e) {
      console.error(`Error querying ${qObj.id}:`, e);
    }
    
    // Find target document index (0-indexed)
    const targetId = qObj.target_document_id;
    const rank = results.findIndex((r) => r.documentId === targetId);
    
    const hit1 = rank === 0 ? 1 : 0;
    const recall5 = rank >= 0 && rank < 5 ? 1 : 0;
    const recall10 = rank >= 0 && rank < 10 ? 1 : 0;
    const precision5 = rank >= 0 && rank < 5 ? 0.2 : 0;
    const mrr = rank >= 0 ? 1 / (rank + 1) : 0;
    const ndcg10 = rank >= 0 && rank < 10 ? 1 / Math.log2(rank + 2) : 0;
    
    kesinResults.push({
      id: qObj.id,
      rank: rank === -1 ? "N/A" : rank + 1,
      source,
      hit1,
      recall5,
      recall10,
      precision5,
      mrr,
      ndcg10,
    });
    
    console.log(`Rank: ${rank === -1 ? "Not Found" : rank + 1} | Source: ${source} | Hit@1: ${hit1}`);
    // Safe delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 1500));
  }
  
  // 2. Konu Bazlı Sorgular
  console.log("\n--- Running Konu Bazlı (Topic Based) Queries ---");
  for (const qObj of goldSet.konu_bazli) {
    console.log(`Querying ${qObj.id}: "${qObj.q}"...`);
    
    let results: EmsalResult[] = [];
    let source = "unknown";
    try {
      const apiRes = await callSearchApi(qObj.filters);
      results = apiRes.results;
      source = apiRes.source;
    } catch (e) {
      console.error(`Error querying ${qObj.id}:`, e);
    }
    
    const top5 = results.slice(0, 5);
    const top5Outputs = top5.map((r, idx) => {
      const overlap = computeOverlapRatio(qObj.q, r.court + " " + r.subject, r.summary);
      return {
        rank: idx + 1,
        court: r.court,
        case_number: r.case_number,
        decision_number: r.decision_number,
        decision_date: r.decision_date,
        subject: r.subject,
        summary: r.summary,
        overlap_ratio: parseFloat(overlap.toFixed(4)),
      };
    });
    
    const avgOverlap = top5Outputs.length > 0
      ? top5Outputs.reduce((acc, curr) => acc + curr.overlap_ratio, 0) / top5Outputs.length
      : 0;
      
    topicResults.push({
      id: qObj.id,
      query: qObj.q,
      source,
      avg_overlap_ratio: parseFloat(avgOverlap.toFixed(4)),
      top5: top5Outputs,
    });
    
    console.log(`Results: ${results.length} found | Source: ${source} | Avg Overlap: ${(avgOverlap * 100).toFixed(1)}%`);
    // Safe delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 2500));
  }
  
  // 3. Aggregate Metrics
  const avgHit1 = kesinResults.reduce((acc, r) => acc + r.hit1, 0) / kesinResults.length;
  const avgRecall5 = kesinResults.reduce((acc, r) => acc + r.recall5, 0) / kesinResults.length;
  const avgRecall10 = kesinResults.reduce((acc, r) => acc + r.recall10, 0) / kesinResults.length;
  const avgPrecision5 = kesinResults.reduce((acc, r) => acc + r.precision5, 0) / kesinResults.length;
  const avgMrr = kesinResults.reduce((acc, r) => acc + r.mrr, 0) / kesinResults.length;
  const avgNdcg10 = kesinResults.reduce((acc, r) => acc + r.ndcg10, 0) / kesinResults.length;
  
  const avgTopicOverlap = topicResults.reduce((acc, r) => acc + r.avg_overlap_ratio, 0) / topicResults.length;
  
  const report = {
    timestamp: new Date().toISOString(),
    metrics: {
      exact_match: {
        hit1: parseFloat(avgHit1.toFixed(4)),
        recall5: parseFloat(avgRecall5.toFixed(4)),
        recall10: parseFloat(avgRecall10.toFixed(4)),
        precision5: parseFloat(avgPrecision5.toFixed(4)),
        mrr: parseFloat(avgMrr.toFixed(4)),
        ndcg10: parseFloat(avgNdcg10.toFixed(4)),
      },
      topic_search: {
        avg_overlap_ratio: parseFloat(avgTopicOverlap.toFixed(4)),
      }
    },
    exact_match_details: kesinResults,
    topic_search_details: topicResults,
  };
  
  const outputFilename = process.env.EVAL_OUT ?? (process.env.COHERE_API_KEY ? "eval/rerank_results.json" : "eval/baseline_results.json");
  writeFileSync(outputFilename, JSON.stringify(report, null, 2), "utf8");
  
  console.log("\n=================== EVALUATION COMPLETE ===================");
  console.log("METRICS:");
  console.log(`Hit@1 (Exact Match): ${(avgHit1 * 100).toFixed(2)}%`);
  console.log(`Recall@5 (Exact Match): ${(avgRecall5 * 100).toFixed(2)}%`);
  console.log(`Recall@10 (Exact Match): ${(avgRecall10 * 100).toFixed(2)}%`);
  console.log(`Precision@5 (Exact Match): ${(avgPrecision5 * 100).toFixed(2)}%`);
  console.log(`MRR (Exact Match): ${avgMrr.toFixed(4)}`);
  console.log(`nDCG@10 (Exact Match): ${avgNdcg10.toFixed(4)}`);
  console.log(`Average Term Overlap (Topic Search): ${(avgTopicOverlap * 100).toFixed(2)}%`);
  console.log(`Results saved to ${outputFilename}`);
}

main().catch(console.error);
