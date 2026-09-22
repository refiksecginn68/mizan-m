/** @type {import('next').NextConfig} */
const nextConfig = {
  // instrumentationHook disabled to prevent build errors
  // content/legal/*.md dinamik fs.readFileSync ile okunuyor — Next'in dosya
  // izleyicisi statik import olmadığı için bunu otomatik paketlemez.
  // Next 14'te bu ayar "experimental" altında (15'te stabil/top-level oldu) —
  // yanlış yere koyulduğunda "Unrecognized key" uyarısıyla SESSİZCE yok sayılıyordu.
  experimental: {
    outputFileTracingIncludes: {
      "/sozlesmeler/**": ["./content/legal/**/*.md"],
      "/api/auth/register": ["./content/legal/**/*.md"],
    },
  },
  async redirects() {
    return [
      // Eski iyzico kredi sayfası → yeni havale/EFT kredi yükleme akışı.
      // Geçici (307): iyzico tekrar açıldığında /kredi geri alınabilsin,
      // tarayıcılar 308'i agresif cache'liyor.
      { source: "/kredi", destination: "/kredi-yukle", permanent: false },
    ];
  },
};

export default nextConfig;
