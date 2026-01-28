import NextAuth from "next-auth"
import LineProvider from "next-auth/providers/line";

const handler = NextAuth({
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID as string,
      clientSecret: process.env.LINE_CLIENT_SECRET as string,
    }),
  ],
  // 意見: デバッグ時はtrueにしておくとエラー原因が分かりやすいです
  debug: process.env.NODE_ENV === 'development',
})

export { handler as GET, handler as POST }