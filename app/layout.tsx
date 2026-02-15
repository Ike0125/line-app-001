import { Metadata, Viewport } from 'next';
import { NextAuthProvider } from "./NextAuthProvider";
import RootShell from "@/app/components/RootShell";
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
          <RootShell>{children}</RootShell>
        </NextAuthProvider>
      </body>
    </html>
  );
}
