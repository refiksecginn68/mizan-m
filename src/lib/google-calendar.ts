import { google } from "googleapis";

const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/google-calendar/callback";

export function createOAuthClient() {
  // Savunma: GOOGLE_REDIRECT_URI'ye yanlışlıkla client id yazılırsa Google invalid_request döner.
  // http(s) ile başlamayan bir değer (ör. "...apps.googleusercontent.com") sessizce geçmesin.
  if (!/^https?:\/\//.test(REDIRECT_URI)) {
    throw new Error(
      `GOOGLE_REDIRECT_URI geçersiz: "${REDIRECT_URI}". Bir URL olmalı (https://mizanim.com/api/google-calendar/callback). Muhtemelen env değerine client id yazılmış.`
    );
  }
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}

export function getAuthUrl() {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar"],
  });
}

export function getCalendarClient(accessToken: string, refreshToken: string | null, expiryDate: number | null) {
  const client = createOAuthClient();
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken ?? undefined,
    expiry_date: expiryDate ?? undefined,
  });
  return google.calendar({ version: "v3", auth: client });
}

export function eventTypeToDescription(eventType: string): string {
  const map: Record<string, string> = {
    durusma: "Duruşma",
    toplanti: "Toplantı",
    sure: "Süre",
    diger: "Diğer",
  };
  return map[eventType] ?? "Mizanım Etkinliği";
}
