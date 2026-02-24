import Sidebar from "@/app/components/admin/Sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { isAdmin } from "@/app/_lib/auth-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const isDev = process.env.NODE_ENV === "development";
const debugLog = (...args: unknown[]) => {
  if (isDev) console.log(...args);
};
const debugWarn = (...args: unknown[]) => {
  if (isDev) console.warn(...args);
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  debugLog("[AdminLayout] ===== ACCESS ATTEMPT =====");
  debugLog("[AdminLayout] Session Status:", {
    hasSession: !!session,
    hasUser: !!session?.user,
    userName: session?.user?.name,
    userEmail: session?.user?.email,
  });

  // ★権限チェック：ログインしていなければサインインページへ
  if (!session?.user) {
    debugLog("[AdminLayout] ✗ No session/user - redirecting to signin");
    debugLog("[AdminLayout] ===== END (NO SESSION) =====");
    redirect("/api/auth/signin?callbackUrl=/admin");
  }

  // ★権限チェック：管理者でなければホームページへ
  const adminCheck = isAdmin(session);
  
  const userId = (session?.user as any)?.id;
  const userEmail = session?.user?.email;
  
  debugLog("[AdminLayout] Admin Check Result:", {
    isAdmin: adminCheck,
    userId,
    userEmail,
    userName: session?.user?.name,
    ADMIN_USER_EMAILS: process.env.ADMIN_USER_EMAILS,
    ADMIN_LINE_USER_IDS: process.env.ADMIN_LINE_USER_IDS || process.env.ADMIN_USER_ID,
  });

  if (!adminCheck) {
    debugWarn("[AdminLayout] ✗ Not an admin - redirecting to home:", { userId, userEmail, userName: session?.user?.name });
    debugLog("[AdminLayout] ===== END (NOT ADMIN) =====");
    redirect("/");
  }

  debugLog("[AdminLayout] ✓ Admin access granted");
  debugLog("[AdminLayout] ===== END (ADMIN OK) =====");

  return (
    <div className="min-h-screen bg-gray-100 md:pl-64">
      <Sidebar />
      <main className="min-h-screen pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
