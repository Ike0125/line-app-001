// app/api/google/oauth/start/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GCAL_OAUTH_CLIENT_ID ?? process.env.GCAL_CLIENT_ID;
  const redirectUri = process.env.GCAL_OAUTH_REDIRECT_URI ?? process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { message: "Missing Google Calendar OAuth env vars (client_id/redirect_uri)" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "openid",
      "email",
      "profile",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    login_hint: process.env.GCAL_SYNC_EMAIL ?? "",
  });

  const url =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    params.toString();

  return NextResponse.redirect(url);
}
