"use client";

export default function OfflinePage() {
  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "#0f1729",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "1.5rem",
        margin: 0,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "380px" }}>
        <div
          style={{
            width: "72px",
            height: "72px",
            background: "rgba(201,168,76,0.15)",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2">
            <path d="M1 6s4-2 11-2 11 2 11 2" />
            <path d="M5 10s3-1 7-1 7 1 7 1" />
            <path d="M9 14s1.5-.5 3-.5 3 .5 3 .5" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        </div>

        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>
          Bağlantı Yok
        </h1>

        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          İnternet bağlantınız kesildi. Ağınızı kontrol ettikten sonra tekrar deneyin.
          Önceden ziyaret ettiğiniz sayfalar çevrimdışı kullanılabilir.
        </p>

        <button
          onClick={() => window.location.reload()}
          style={{
            background: "#c9a84c",
            color: "white",
            border: "none",
            padding: "0.75rem 2rem",
            borderRadius: "12px",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Yeniden Dene
        </button>
      </div>
    </div>
  );
}
