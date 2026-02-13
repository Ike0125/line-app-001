// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = {
  matcher: ["/admin/:path*"],
};

function parseIds(raw?: string) {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // 未ログイン → サインインへ
  if (!token) {
    const url = new URL("/api/auth/signin", req.url);
    // callbackUrl は「パス＋クエリ」だけにするのが安全
    url.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // ★ 管理者判定は token.sub を使う（LINEの userId が入る）
  const uid = token.sub; // string | undefined

  // ADMIN_LINE_USER_ID 互換も残す
  const raw =
    process.env.ADMIN_LINE_USER_IDS ??
    process.env.ADMIN_LINE_USER_ID ??
    "";

  const allow = parseIds(raw);

  if (!uid || allow.length === 0 || !allow.includes(uid)) {
    return NextResponse.redirect(new URL("/line-app", req.url));
  }

  return NextResponse.next();
}
