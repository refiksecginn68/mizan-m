// Düz metin ↔ editör HTML dönüşümü.
// AI düz metin üretir; editör (TipTap) HTML ister. Export'lar HTML'i okur.

function kacis(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Dilekçe bölüm başlıkları — editörde ve export'ta kalın görünsün
const BASLIK_DESENI =
  /^(AÇIKLAMALAR|HUKUKİ NEDENLER|HUKUKİ DELİLLER|DELİLLER|SONUÇ VE İSTEM|SONUÇ VE TALEP|İTİRAZLARIMIZ|İSTİNAF NEDENLERİ|TEMYİZ NEDENLERİ|SAVUNMALARIMIZ|EKLER)\b/;

/** Düz metni editör HTML'ine çevirir. Mahkeme hitabı ortalanır, bölüm başlıkları kalınlaşır. */
export function duzMetinHtml(metin: string): string {
  if (!metin) return "";
  const satirlar = metin.replace(/\r\n/g, "\n").split("\n");

  return satirlar
    .map((satir, i) => {
      const t = satir.trim();
      if (!t) return "<p></p>";

      // İlk dolu satır mahkeme/makam hitabıysa ortala ve başlık yap
      const ilkDolu = satirlar.findIndex((s) => s.trim());
      if (i === ilkDolu && /(HÂKİMLİĞİ'NE|MAHKEMESİ'NE|BAŞKANLIĞI'NA|BAŞSAVCILIĞI'NA|MÜDÜRLÜĞÜ'NE|HEYETİ BAŞKANLIĞI'NA)\s*$/i.test(t)) {
        return `<h1 style="text-align: center">${kacis(t)}</h1>`;
      }

      if (BASLIK_DESENI.test(t)) {
        return `<p><strong>${kacis(satir)}</strong></p>`;
      }

      return `<p>${kacis(satir)}</p>`;
    })
    .join("");
}
