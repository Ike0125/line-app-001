import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * API/Server Component 用：ログイン中の userId を返す
 * NextAuth session.user.id は token.sub を格納済み（あなたの実装）
 */
export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);

  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) throw new Error("UNAUTHORIZED");

  return userId;
}
