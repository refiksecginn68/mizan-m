// CRM bildirim mailleri (yeni üyelik / ödeme alındı / deneme bitiyor) için
// "her olay tek mail" garantisi. Önce crm_bildirim_log'a idempotency key ile
// insert denenir; satır zaten varsa (webhook tekrarı vb.) gönderim atlanır.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export type CrmBildirimEvent = "yeni_uyelik" | "odeme_alindi" | "deneme_bitiyor";

export async function crmBildirimGonder(
  svc: Any,
  eventType: CrmBildirimEvent,
  idempotencyKey: string,
  userId: string | null,
  gonder: () => Promise<string | null>
): Promise<boolean> {
  const { data, error } = await svc
    .from("crm_bildirim_log")
    .insert({ event_type: eventType, idempotency_key: idempotencyKey, user_id: userId })
    .select("id")
    .maybeSingle();

  // Unique constraint çakışması = bu olay için mail zaten gönderildi, sessizce atla.
  if (error || !data) return false;

  try {
    await gonder();
    return true;
  } catch (e) {
    console.error(`[crm-bildirim] ${eventType} gönderilemedi:`, e);
    return false;
  }
}
