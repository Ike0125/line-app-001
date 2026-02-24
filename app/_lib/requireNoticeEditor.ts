import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { canEditNotice, checkNoticeEditorPermission } from "./auth-utils";

/**
 * Server Component / Server Action 用
 * - 未ログイン → サインインへ
 * - 権限なし → 例外（表示側で捕捉しても良い）
 */
export async function requireNoticeEditorUserId(): Promise<string> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    // 管理画面配下なので callbackUrl は固定
    redirect("/api/auth/signin?callbackUrl=/admin/notice");
  }

  // 権限チェック（LINE User ID または Google Email）
  if (!canEditNotice(session)) {
    throw new Error("FORBIDDEN: NOTICE_EDITOR_USER_IDS or NOTICE_EDITOR_EMAILS required");
  }

  // ユーザー識別子を返す
  return checkNoticeEditorPermission(session);
}
