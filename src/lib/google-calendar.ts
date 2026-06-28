import { google } from "googleapis";

const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/google-calendar/callback";

export function createOAuthClient() {
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
