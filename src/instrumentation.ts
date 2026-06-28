export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { createServiceClient } = await import("./lib/supabase/server");
    const supabase = createServiceClient();

    // Storage bucket'larını otomatik oluştur (zaten varsa hata vermez)
    await supabase.storage.createBucket("documents", {
      public: false,
      fileSizeLimit: 52428800,
      allowedMimeTypes: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    });
  } catch {
    // Zaten varsa sessizce geç
  }

  try {
    const { createServiceClient } = await import("./lib/supabase/server");
    const supabase = createServiceClient();

    await supabase.storage.createBucket("generated-documents", {
      public: true,
      fileSizeLimit: 10485760,
      allowedMimeTypes: ["application/pdf"],
    });
  } catch {
    // Zaten varsa sessizce geç
  }
}
