// Yıl-bazlı tarife seçimi. Yeni yıl eklenince sadece buraya bir satır eklenir.
import { TARIFE_2026 } from "./2026";

export const TARIFELER = {
  2026: TARIFE_2026,
} as const;

export type TarifeYili = keyof typeof TARIFELER;

export const VARSAYILAN_YIL: TarifeYili = 2026;

export function tarifeGetir(yil: TarifeYili = VARSAYILAN_YIL) {
  return TARIFELER[yil];
}

export const KULLANILABILIR_YILLAR = Object.keys(TARIFELER).map(Number) as TarifeYili[];
