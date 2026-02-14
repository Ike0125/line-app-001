import NextAuth, { NextAuthOptions, User } from "next-auth"; // ★Userを追加
import LineProvider from "next-auth/providers/line";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/app/_lib/prisma";

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
    async signIn({ user, account, profile }) {
      await logLoginEvent(user);

      if (account?.provider === "line") {
        const p: any = profile;
        const lineUserId = p?.sub ?? p?.userId ?? user?.id;
        if (lineUserId) {
          const displayName = user?.name ?? p?.name ?? null;
          const pictureUrl = p?.picture ?? p?.pictureUrl ?? user?.image ?? null;

          await prisma.lineLoginUser.upsert({
            where: { lineUserId },
            create: {
              lineUserId,
              displayName,
              pictureUrl,
              lastLoginAt: new Date(),
            },
            update: {
              displayName,
              pictureUrl,
              lastLoginAt: new Date(),
            },
          });
        }
      }
      return true;
    },

    async jwt({ token, profile, account }) {
      // 初回ログイン時に LINE の userId を token に保存
      if (account?.provider === "line") {
        const p: any = profile;

        // LINE OIDC の userId は通常 sub に入る
        token.lineUserId = p?.sub ?? p?.userId ?? token.lineUserId;
        token.name = p?.name ?? token.name;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        // ★ここを token.sub ではなく token.lineUserId にする
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = (token as any).lineUserId ?? token.sub;

        // （任意）sessionにも明示的に持たせたいなら
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session as any).lineUserId = (token as any).lineUserId;
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