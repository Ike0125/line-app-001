import { Metadata, Viewport } from 'next';
import { NextAuthProvider } from "./NextAuthProvider";
import Sidebar from "./components/Sidebar";
import "./globals.css"; 

export const metadata: Metadata = {
  title: 'My LINE App',
  description: 'Line integration app',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-100 text-gray-900">
        <NextAuthProvider>
          <Sidebar />
          <main className="md:ml-64 px-4 pb-4 pt-16 sm:p-8 min-h-screen transition-all duration-300">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-8 min-h-[calc(100vh-4rem)]">
              {children}
            </div>
          </main>
        </NextAuthProvider>
      </body>
    </html>
  );
}