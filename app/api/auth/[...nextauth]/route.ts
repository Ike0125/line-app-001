import NextAuth, { NextAuthOptions, User } from "next-auth"; // ★Userを追加
import LineProvider from "next-auth/providers/line";
import { promises as fs } from "fs";
import path from "path";

// ログ記録関数：型を any から User に変更
const logLoginEvent = async (userInfo: User) => {
  const logDir = path.join(process.cwd(), "logs");
  const logFile = path.join(logDir, "login.log");
  
  try {
    await fs.mkdir(logDir, { recursive: true });
  } catch (err) {
    console.error("Failed to create logs directory:", err);
  }

  const timestamp = new Date().toISOString();
  // userInfo.id が無い可能性も考慮して安全にアクセス
  const userId = userInfo.id || 'unknown';
  const logEntry = `[${timestamp}] User: ${userInfo.name} (ID: ${userId})\n`;

  try {
    await fs.appendFile(logFile, logEntry, "utf-8");
  } catch (err) {
    console.error("Failed to write login log:", err);
  }
};

export const authOptions: NextAuthOptions = {
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID as string,
      clientSecret: process.env.LINE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      await logLoginEvent(user);
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        // ここはNextAuthの型定義を拡張しないとエラーになるため、
        // 今回は例外的にESLintの警告をこの行だけ無効化します
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };