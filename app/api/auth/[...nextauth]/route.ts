import NextAuth, { NextAuthOptions, User } from "next-auth"; // ★Userを追加
import LineProvider from "next-auth/providers/line";
import GoogleProvider from "next-auth/providers/google";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/app/_lib/prisma";

const isDev = process.env.NODE_ENV === "development";
const debugLog = (...args: unknown[]) => {
  if (isDev) console.log(...args);
};
const debugError = (...args: unknown[]) => {
  if (isDev) console.error(...args);
};

// ログ記録関数：型を any から User に変更
const logLoginEvent = async (userInfo: User) => {
  if (!isDev) return;

  const logDir = path.join(process.cwd(), "logs");
  const logFile = path.join(logDir, "login.log");
  
  try {
    await fs.mkdir(logDir, { recursive: true });
  } catch (err) {
    debugError("Failed to create logs directory:", err);
  }

  const timestamp = new Date().toISOString();
  // userInfo.id が無い可能性も考慮して安全にアクセス
  const userId = userInfo.id || 'unknown';
  const logEntry = `[${timestamp}] User: ${userInfo.name} (ID: ${userId})\n`;

  try {
    await fs.appendFile(logFile, logEntry, "utf-8");
  } catch (err) {
    debugError("Failed to write login log:", err);
  }
};

export const authOptions: NextAuthOptions = {
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID as string,
      clientSecret: process.env.LINE_CLIENT_SECRET as string,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      debugLog("[SignIn Callback] ===== START =====");
      debugLog("[SignIn Callback] Provider:", account?.provider);
      debugLog("[SignIn Callback] User Info:", {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        image: user?.image,
      });
      debugLog("[SignIn Callback] Account:", {
        provider: account?.provider,
        type: account?.type,
      });
      debugLog("[SignIn Callback] Profile Keys:", profile ? Object.keys(profile) : null);

      await logLoginEvent(user);

      if (account?.provider === "line") {
        const p: any = profile;
        const lineUserId = p?.sub ?? p?.userId ?? user?.id;
        if (lineUserId) {
          const displayName = user?.name ?? p?.name ?? null;
          const pictureUrl = p?.picture ?? p?.pictureUrl ?? user?.image ?? null;

          debugLog("[SignIn Callback] LINE Login - upserting user:", {
            lineUserId,
            displayName,
            pictureUrl,
          });

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

      // Google認証の場合もログに記録（必要に応じてDBに保存も可能）
      if (account?.provider === "google") {
        debugLog("[SignIn Callback] Google login detected:", {
          email: user.email,
          name: user.name,
          id: user.id,
        });
        // 必要に応じてGoogleユーザー情報もDBに保存できます
      }

      debugLog("[SignIn Callback] ===== END (SUCCESS) =====");
      return true;
    },

    async jwt({ token, profile, account }) {
      debugLog("[JWT Callback] ===== START =====");
      debugLog("[JWT Callback] Input:", {
        account_provider: account?.provider,
        profile_sub: (profile as any)?.sub,
        token_existing_id: (token as any).id,
        token_sub: token.sub,
      });

      // 初回ログイン時に LINE の userId を token に保存
      if (account?.provider === "line") {
        const p: any = profile;

        // LINE OIDC の userId は通常 sub に入る
        token.lineUserId = p?.sub ?? p?.userId ?? token.lineUserId;
        token.name = p?.name ?? token.name;
        debugLog("[JWT Callback] LINE Provider detected:", {
          profile_sub: p?.sub,
          profile_userId: p?.userId,
          token_lineUserId: token.lineUserId,
        });
      }

      // Google認証の場合
      if (account?.provider === "google") {
        token.email = token.email ?? profile?.email;
        token.name = token.name ?? profile?.name;
        debugLog("[JWT Callback] Google Provider detected:", { 
          profile_email: profile?.email, 
          profile_sub: (profile as any)?.sub,
          token_email: token.email,
          token_name: token.name,
          token_sub: token.sub,
        });
      }

      debugLog("[JWT Callback] Output token:", {
        sub: token.sub,
        email: token.email,
        name: token.name,
        lineUserId: (token as any).lineUserId,
      });
      debugLog("[JWT Callback] ===== END =====");

      return token;
    },

    async session({ session, token }) {
      debugLog("[Session Callback] ===== START =====");
      debugLog("[Session Callback] Input token:", {
        sub: token.sub,
        email: token.email,
        name: token.name,
        lineUserId: (token as any).lineUserId,
        provider: (token as any).provider,
      });

      if (session.user) {
        // ★ここを token.sub ではなく token.lineUserId にする
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = (token as any).lineUserId ?? token.sub;

        // （任意）sessionにも明示的に持たせたいなら
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session as any).lineUserId = (token as any).lineUserId;

        // メールアドレスも確実にセッションに含める
        session.user.email = token.email as string;

        debugLog("[Session Callback] Output session.user:", {
          id: (session.user as any).id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        });

        debugLog("[Session Callback] Final session object:", {
          user_id: (session.user as any).id,
          user_email: session.user.email,
          user_name: session.user.name,
          token_email: token.email,
          token_lineUserId: (token as any).lineUserId,
          token_sub: token.sub,
        });
      }

      debugLog("[Session Callback] ===== END =====");
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
