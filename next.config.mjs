/** @type {import('next').NextConfig} */
const nextConfig = {
  // instrumentationHook disabled to prevent build errors
  async redirects() {
    return [
      // Eski iyzico kredi sayfası → yeni havale/EFT kredi yükleme akışı
      { source: "/kredi", destination: "/kredi-yukle", permanent: true },
    ];
  },
};

export default nextConfig;
