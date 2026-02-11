import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

function parseIds(value?: string) {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Server Component / Server Action 用
 * - 未ログイン → サインインへ
 * - 権限なし → 例外（表示側で捕捉しても良い）
 */
export async function requireNoticeEditorUserId(): Promise<string> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    // 管理画面配下なので callbackUrl は固定
    redirect("/api/auth/signin?callbackUrl=/line-app/admin/notice");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id as string | undefined;
  if (!userId) throw new Error("UNAUTHORIZED");

  const allow = parseIds(process.env.NOTICE_EDITOR_USER_IDS);

  if (allow.length === 0) {
    throw new Error("NOTICE_EDITOR_USER_IDS is not set");
  }
  if (!allow.includes(userId)) {
    throw new Error("FORBIDDEN");
  }
  return userId;
}
