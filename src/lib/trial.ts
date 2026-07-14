// Avukat deneme sistemi: 8 gün + 1.000 sorgu, tüm özellikler (UYAP/UETS dahil)

export interface TrialProfil {
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  trial_queries_left?: number | null;
}

export interface TrialDurum {
  baslamis: boolean;
  aktif: boolean;
  kalanGun: number;
  kalanKredi: number;
}

export function getTrialDurum(p: TrialProfil): TrialDurum {
  const bitis = p.trial_ends_at ? new Date(p.trial_ends_at) : null;
  const kalanKredi = Math.max(0, p.trial_queries_left ?? 0);
  const kalanMs = bitis ? bitis.getTime() - Date.now() : 0;
  return {
    baslamis: !!p.trial_started_at,
    // Özellik erişimi süreye bağlı; kredi bitse bile süre içinde erişim açık
    // (AI çağrıları krediyle sınırlı kalır)
    aktif: kalanMs > 0,
    kalanGun: Math.max(0, Math.ceil(kalanMs / (24 * 60 * 60 * 1000))),
    kalanKredi,
  };
}
