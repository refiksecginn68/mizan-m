import { randomBytes, randomInt } from "crypto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Onay linki geçerlilik süresi (gün)
export const APPROVAL_TOKEN_TTL_DAYS = 7;

// Karışabilen karakterler (0/O, 1/I) hariç
const REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateReferenceCode(): string {
  let code = "";
  for (let i = 0; i < 5; i++) code += REF_CHARS[randomInt(REF_CHARS.length)];
  return `MZN-${code}`;
}

export interface PaymentRequestRow {
  id: string;
  user_id: string;
  package_code: string;
  amount_try: number;
  reference_code: string;
  approval_token: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

// Pending payment_request oluşturur; referans kodu çakışırsa yeniden dener
export async function createPaymentRequest(
  svc: Any,
  userId: string,
  packageCode: string,
  amountTry: number
): Promise<PaymentRequestRow | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await svc
      .from("payment_requests")
      .insert({
        user_id: userId,
        package_code: packageCode,
        amount_try: amountTry,
        reference_code: generateReferenceCode(),
        approval_token: randomBytes(32).toString("hex"),
      })
      .select("*")
      .single();

    if (!error) return data as PaymentRequestRow;
    // 23505 = unique_violation (referans kodu çakışması) → tekrar dene
    if (error.code !== "23505") {
      console.error("[odeme] payment_request insert hatası:", error.message);
      return null;
    }
  }
  return null;
}
