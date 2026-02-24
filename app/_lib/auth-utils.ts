import { Session } from "next-auth";

const isDev = process.env.NODE_ENV === "development";
const debugLog = (...args: unknown[]) => {
  if (isDev) console.log(...args);
};

/**
 * IDまたはメールアドレスのリストをパース
 */
function parseIds(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * ユーザーが管理者かどうかを判定
 * - LINE User IDでチェック（ADMIN_USER_ID）
 * - メールアドレスでチェック（ADMIN_USER_EMAILS）
 */
export function isAdmin(session: Session | null): boolean {
  if (!session?.user) {
    debugLog("[isAdmin] No session or user");
    return false;
  }

  // LINE User IDでチェック
  const adminUserIds = parseIds(
    process.env.ADMIN_USER_ID ?? process.env.ADMIN_LINE_USER_IDS
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id as string | undefined;
  
  debugLog("[isAdmin] ===== START DEBUG =====");
  debugLog("[isAdmin] Session User Info:", {
    userId,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  if (userId && adminUserIds.includes(userId)) {
    debugLog("[isAdmin] ✓ LINE User ID match:", { userId, adminUserIds });
    debugLog("[isAdmin] ===== END DEBUG (ADMIN) =====");
    return true;
  }

  // メールアドレスでチェック（Google認証用）
  const adminEmails = parseIds(process.env.ADMIN_USER_EMAILS);
  const userEmail = session.user.email?.toLowerCase();
  
  debugLog("[isAdmin] Environment Variables:", {
    ADMIN_USER_EMAILS_RAW: process.env.ADMIN_USER_EMAILS,
    ADMIN_USER_IDS_RAW: process.env.ADMIN_LINE_USER_IDS || process.env.ADMIN_USER_ID,
  });

  debugLog("[isAdmin] Email Check Details:", { 
    rawUserEmail: session.user.email,
    normalizedUserEmail: userEmail,
    adminEmailsArray: adminEmails,
    adminEmailsCount: adminEmails.length,
  });

  if (adminEmails.length > 0) {
    adminEmails.forEach((email, index) => {
      const normalizedAdminEmail = email.toLowerCase().trim();
      const isMatch = normalizedAdminEmail === userEmail;
      debugLog(`[isAdmin] Comparing email[${index}]: "${normalizedAdminEmail}" === "${userEmail}" ? ${isMatch}`);
    });
  } else {
    debugLog("[isAdmin] ⚠️ No admin emails configured in ADMIN_USER_EMAILS");
  }
  
  if (userEmail && adminEmails.some(email => email.toLowerCase().trim() === userEmail)) {
    debugLog("[isAdmin] ✓ Email match found:", { userEmail });
    debugLog("[isAdmin] ===== END DEBUG (ADMIN) =====");
    return true;
  }

  debugLog("[isAdmin] ✗ No admin match found");
  debugLog("[isAdmin] ===== END DEBUG (NOT ADMIN) =====");
  return false;
}

/**
 * ユーザーが通知編集権限を持っているかを判定
 * - 管理者は常に編集可能
 * - LINE User IDでチェック（NOTICE_EDITOR_USER_IDS）
 * - メールアドレスでチェック（NOTICE_EDITOR_EMAILS）
 */
export function canEditNotice(session: Session | null): boolean {
  if (!session?.user) return false;

  // 管理者は常に編集可能
  if (isAdmin(session)) return true;

  // LINE User IDでチェック
  const editorUserIds = parseIds(process.env.NOTICE_EDITOR_USER_IDS);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id as string | undefined;
  
  if (userId && editorUserIds.includes(userId)) {
    return true;
  }

  // メールアドレスでチェック（Google認証用）
  const editorEmails = parseIds(process.env.NOTICE_EDITOR_EMAILS);
  const userEmail = session.user.email?.toLowerCase();
  
  if (userEmail && editorEmails.some(email => email.toLowerCase() === userEmail)) {
    return true;
  }

  return false;
}

/**
 * 通知編集権限チェック（既存のrequireNoticeEditorUserIdの代替）
 * @returns {string} ユーザーID（LINEの場合）またはメールアドレス（Googleの場合）
 * @throws {Error} 権限がない場合
 */
export function checkNoticeEditorPermission(session: Session | null): string {
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  if (!canEditNotice(session)) {
    throw new Error("FORBIDDEN");
  }

  // ユーザー識別子を返す（LINEならID、GoogleならEmail）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id as string | undefined;
  if (userId) return userId;

  const userEmail = session.user.email;
  if (userEmail) return userEmail;

  throw new Error("UNAUTHORIZED");
}
