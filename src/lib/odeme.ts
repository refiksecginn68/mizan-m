import { randomBytes, randomInt } from "crypto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// Onay linki geçerlilik süresi (gün) — env ile ayarlanabilir
export const APPROVAL_TOKEN_TTL_DAYS = Number(process.env.APPROVAL_TOKEN_TTL_DAYS ?? 7);

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

export interface TokenHata {
  baslik: string;
  mesaj: string;
  detay?: string;
}

// Token'ı doğrular: bulunamadı / işlenmiş / süresi dolmuş durumlarını ayırt eder.
// Hiçbir şey DEĞİŞTİRMEZ — hem GET (sayfa) hem POST (işlem) bunu kullanır.
export async function validatePendingRequest(
  svc: Any,
  token: string | null
): Promise<{ req: PaymentRequestRow; hata: null } | { req: null; hata: TokenHata }> {
  if (!token) {
    return { req: null, hata: { baslik: "Geçersiz Bağlantı", mesaj: "Bağlantı eksik veya hatalı." } };
  }

  const { data: req } = await svc
    .from("payment_requests")
    .select("id, user_id, package_code, amount_try, reference_code, approval_token, status, created_at")
    .eq("approval_token", token)
    .single();

  if (!req) {
    return { req: null, hata: { baslik: "Geçersiz Bağlantı", mesaj: "Bu bağlantı sistemde bulunamadı." } };
  }

  if (req.status !== "pending") {
    return {
      req: null,
      hata: {
        baslik: "Bağlantı Kullanılmış",
        mesaj: `Bu talep daha önce işlenmiş (${req.status === "approved" ? "onaylandı" : "reddedildi"}).`,
        detay: `Referans: ${req.reference_code}`,
      },
    };
  }

  const yasMs = Date.now() - new Date(req.created_at).getTime();
  if (yasMs > APPROVAL_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000) {
    return {
      req: null,
      hata: {
        baslik: "Bağlantı Süresi Dolmuş",
        mesaj: `Onay bağlantıları ${APPROVAL_TOKEN_TTL_DAYS} gün geçerlidir. Kullanıcıdan yeni talep oluşturmasını isteyin.`,
        detay: `Referans: ${req.reference_code}`,
      },
    };
  }

  return { req: req as PaymentRequestRow, hata: null };
}

// POST body'den token okur (form veya JSON)
export async function readTokenFromPost(request: Request): Promise<string | null> {
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = await request.json() as { token?: string };
      return body.token ?? null;
    }
    const form = await request.formData();
    const token = form.get("token");
    return typeof token === "string" ? token : null;
  } catch {
    return null;
  }
}
