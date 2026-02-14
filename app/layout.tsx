import { Metadata, Viewport } from 'next';
import { NextAuthProvider } from "./NextAuthProvider";
import Sidebar from "@/app/components/Sidebar";
import "./globals.css"; 

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'SWF LINE App',
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
          <main className="md:ml-64 px-2 pb-2 pt-12 sm:p-6 lg:p-8 min-h-screen transition-all duration-300">
            <div className="bg-transparent shadow-none rounded-none p-0 sm:bg-white sm:rounded-lg sm:shadow-md sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
              {children}
            </div>
          </main>
        </NextAuthProvider>
      </body>
    </html>
  );
}