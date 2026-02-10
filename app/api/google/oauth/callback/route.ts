import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) return NextResponse.json({ error }, { status: 400 });
  if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });

  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
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
    // 通常ここは出ない（あなたは true を確認済み）
    return NextResponse.json({ message: "missing refresh_token" }, { status: 500 });
  }

  // ✅ refresh_token をDBに保存（単一運用なのでemailは固定）
  const email = "swfsoma013@gmail.com";

  await prisma.googleAuth.upsert({
    where: { email },
    create: { email, refreshToken: json.refresh_token },
    update: { refreshToken: json.refresh_token },
  });

  // tokenは返さない（安全）
  return NextResponse.json({
    message: "OAuth linked (refresh_token saved)",
    email,
  });
}
