import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isAdmin } from "@/app/_lib/auth-utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const userEmail = session?.user?.email ?? null;

  return NextResponse.json({
    ok: true,
    isAdmin: isAdmin(session),
    userId: userId ?? null,
    userEmail,
    adminUserIds: process.env.ADMIN_USER_ID ?? process.env.ADMIN_LINE_USER_IDS ?? "",
    adminEmails: process.env.ADMIN_USER_EMAILS ?? "",
  });
}
