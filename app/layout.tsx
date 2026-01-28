import { NextAuthProvider } from "./NextAuthProvider";
import Sidebar from "./components/Sidebar";
import "./globals.css"; 

export const metadata = {
  title: 'My LINE App',
  description: 'Line integration app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      {/* 全体の背景色を薄いグレーに設定 */}
      <body className="bg-gray-100 text-gray-900">
        <NextAuthProvider>
          
          {/* サイドバーを表示 */}
          <Sidebar />

          {/* メインコンテンツエリア */}
          {/* ml-64: サイドバー(幅64)の分だけ左を空ける */}
          <main className="ml-64 p-8 min-h-screen">
            {/* 白いカードの中にコンテンツを表示 */}
            <div className="bg-white rounded-lg shadow-md p-8 min-h-[calc(100vh-4rem)]">
              {children}
            </div>
          </main>

        </NextAuthProvider>
      </body>
    </html>
  );
}