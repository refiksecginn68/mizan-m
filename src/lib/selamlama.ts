// Saate göre selamlama — kullanıcının YEREL saati verilmeli (sunucu saati değil).
// 05:00–11:59 Günaydın · 12:00–17:59 İyi günler · 18:00–22:59 İyi akşamlar · 23:00–04:59 İyi geceler
export function selamla(saat: number): string {
  if (saat >= 5 && saat < 12) return "Günaydın";
  if (saat >= 12 && saat < 18) return "İyi günler";
  if (saat >= 18 && saat < 23) return "İyi akşamlar";
  return "İyi geceler";
}
