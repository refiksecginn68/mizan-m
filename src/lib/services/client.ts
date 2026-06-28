/**
 * Müvekkil servis katmanı.
 * createClientFromVekalet — tüm müvekkil oluşturma bu fonksiyondan geçer.
 * İleride içine gerçek UYAP/MERNİS API çağrısı eklenince sistem otomatik çalışır.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export interface VekaletInput {
  // Zorunlu
  full_name: string;
  lawyer_id: string;

  // Kimlik & iletişim
  tc_no?: string;
  phone?: string;
  email?: string;
  address?: string;

  // Vekalet bilgileri
  vekalet_no?: string;
  dosya_no?: string;
  vekalet_tarihi?: string;  // YYYY-MM-DD
  noter?: string;

  notes?: string;
}

export interface CreateClientResult {
  success: boolean;
  clientId?: string;
  alreadyExists?: boolean;
  error?: string;

  // TODO (ileride): uyap_synced, mernis_dogrulandi gibi alanlar eklenecek
}

/**
 * Vekalet bilgisinden müvekkil oluşturur veya günceller.
 *
 * Şu an: elle girilen bilgileri doğrudan Supabase'e yazar.
 * İleride: tc_no varsa MERNİS'ten ad/soyad doğrulama + UYAP'tan dosya listesi
 * çekme eklenecek — bu fonksiyonun imzası değişmeyecek.
 */
export async function createClientFromVekalet(
  supabase: SB,
  input: VekaletInput
): Promise<CreateClientResult> {
  try {
    // Aynı TC no ile kayıtlı müvekkil var mı?
    if (input.tc_no) {
      const { data: existing } = await supabase
        .from("clients")
        .select("id, full_name")
        .eq("lawyer_id", input.lawyer_id)
        .eq("tc_no", input.tc_no)
        .single();

      if (existing) {
        // Vekalet/dosya bilgilerini güncelle, isim aynıysa sessizce geç
        await supabase
          .from("clients")
          .update({
            vekalet_no:     input.vekalet_no     ?? existing.vekalet_no,
            dosya_no:       input.dosya_no       ?? existing.dosya_no,
            vekalet_tarihi: input.vekalet_tarihi ?? existing.vekalet_tarihi,
            noter:          input.noter          ?? existing.noter,
            phone:          input.phone          ?? existing.phone,
            email:          input.email          ?? existing.email,
            updated_at:     new Date().toISOString(),
          })
          .eq("id", existing.id);

        return { success: true, clientId: existing.id, alreadyExists: true };
      }
    }

    // Yeni müvekkil oluştur
    const { data, error } = await supabase
      .from("clients")
      .insert({
        lawyer_id:      input.lawyer_id,
        full_name:      input.full_name,
        tc_no:          input.tc_no          || null,
        phone:          input.phone          || null,
        email:          input.email          || null,
        address:        input.address        || null,
        vekalet_no:     input.vekalet_no     || null,
        dosya_no:       input.dosya_no       || null,
        vekalet_tarihi: input.vekalet_tarihi || null,
        noter:          input.noter          || null,
        notes:          input.notes          || null,
        uyap_synced:    false,
        is_active:      true,
      })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, clientId: data.id };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
