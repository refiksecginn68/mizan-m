/** @type {import('next').NextConfig} */
const nextConfig = {
  // instrumentationHook disabled to prevent build errors
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
