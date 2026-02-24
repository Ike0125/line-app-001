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

  // LINE User ID 判定（互換キー含む）
  const uid = token.sub;
  const adminUserIds = parseIds(
    process.env.ADMIN_USER_ID ??
      process.env.ADMIN_LINE_USER_IDS ??
      process.env.ADMIN_LINE_USER_ID
  );
  const isLineAdmin = !!uid && adminUserIds.includes(uid);

  // Google Email 判定
  const adminEmails = parseIds(process.env.ADMIN_USER_EMAILS).map((s) =>
    s.toLowerCase()
  );
  const tokenEmail = String(token.email ?? "").toLowerCase().trim();
  const isEmailAdmin = !!tokenEmail && adminEmails.includes(tokenEmail);

  if (!isLineAdmin && !isEmailAdmin) {
    return NextResponse.redirect(new URL("/line-app", req.url));
  }

  return NextResponse.next();
}
