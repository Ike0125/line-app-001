import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";

export async function GET(req: Request) {
  const clientId = process.env.GCAL_OAUTH_CLIENT_ID ?? process.env.GCAL_CLIENT_ID;
  const clientSecret = process.env.GCAL_OAUTH_CLIENT_SECRET ?? process.env.GCAL_CLIENT_SECRET;
  const redirectUri = process.env.GCAL_OAUTH_REDIRECT_URI ?? process.env.GOOGLE_REDIRECT_URI;
  const expectedEmailRaw = process.env.GCAL_SYNC_EMAIL;

  if (!clientId || !clientSecret || !redirectUri || !expectedEmailRaw) {
    return NextResponse.json(
      { message: "Missing Google Calendar OAuth env vars" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) return NextResponse.json({ error }, { status: 400 });
  if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = await res.json();
  if (!res.ok) {
    return NextResponse.json({ message: "token exchange failed", detail: json }, { status: 500 });
  }

  if (!json.refresh_token) {
    return NextResponse.json({ message: "missing refresh_token" }, { status: 500 });
  }

  if (!json.access_token) {
    return NextResponse.json(
      { message: "missing access_token", detail: json },
      { status: 500 }
    );
  }

  // ✅ 実際に認証したアカウントのメールアドレスを取得
  const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${json.access_token}` },
  });

  const userinfo = await userinfoRes.json();
  if (!userinfoRes.ok || !userinfo.email) {
    return NextResponse.json(
      { message: "Failed to get user email", detail: userinfo },
      { status: 500 }
    );
  }

  const authenticatedEmail = String(userinfo.email).trim().toLowerCase();
  const expectedEmail = expectedEmailRaw.trim().toLowerCase();

  // ✅ GCAL_SYNC_EMAIL と一致するかバリデーション
  if (authenticatedEmail !== expectedEmail) {
    return NextResponse.json(
      {
        message: `Account mismatch: authenticated as ${authenticatedEmail}, but expected ${expectedEmail}`,
        authenticated: authenticatedEmail,
        expected: expectedEmail,
      },
      { status: 400 }
    );
  }

  await prisma.googleAuth.upsert({
    where: { email: authenticatedEmail },
    create: { email: authenticatedEmail, refreshToken: json.refresh_token },
    update: { refreshToken: json.refresh_token },
  });

  return NextResponse.json({
    message: "OAuth linked (refresh_token saved)",
    email: authenticatedEmail,
  });
}
