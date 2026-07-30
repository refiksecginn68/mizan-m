// Tüm büro başlıkları için tutarlı yükleniyor skeleton'ı (sunucu render sırasında).
// Layout'un <main>'i içinde render olur; başlığa özgü bir loading.tsx yoksa bu geçerlidir.
export default function BuroLoading() {
  return (
    <div className="p-4 sm:p-6 animate-pulse" aria-busy="true" aria-label="İçerik yükleniyor">
      {/* Başlık şeridi */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-5 w-40 rounded-lg bg-gray-200" />
          <div className="h-3 w-28 rounded bg-gray-100" />
        </div>
        <div className="h-9 w-32 rounded-xl bg-gray-200" />
      </div>

      {/* İçerik kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-3 w-full rounded bg-gray-100" />
            <div className="h-3 w-5/6 rounded bg-gray-100" />
            <div className="h-3 w-2/3 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
