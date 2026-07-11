import { createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Kota tükendi yanıtı — tüm AI endpoint'leri aynı gövdeyi döner
export const QUOTA_EXHAUSTED_BODY = {
  error: "Sorgu kotanız tükenmiştir. Devam etmek için kredi yükleyin.",
  code: "quota_exhausted",
  cta: { label: "Kredi Yükle", href: "/kredi-yukle" },
};

// AI çağrısı öncesi 1 kota düşer (önce aylık, sonra kontör). false → 402 dönülmeli.
export async function checkAndConsumeQuota(userId: string): Promise<boolean> {
  const svc = createServiceClient() as Any;
  const { data, error } = await svc.rpc("spend_queries", {
    p_user_id: userId,
    p_amount: 1,
  });
  if (error) {
    console.error("[quota] spend_queries hatası:", error.message);
    return false;
  }
  return data === true;
}

// Başarısız AI çağrısı kotadan yemez — düşülen 1 kotayı iade eder
export async function refundQuota(userId: string): Promise<void> {
  try {
    const svc = createServiceClient() as Any;
    await svc.rpc("refund_queries", { p_user_id: userId, p_amount: 1 });
  } catch (e) {
    console.error("[quota] refund_queries hatası:", e);
  }
}
