'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import PreviewViewport from '@/app/components/PreviewViewport';

type RootShellProps = {
  children: ReactNode;
};

export default function RootShell({ children }: RootShellProps) {
  const pathname = usePathname() || '';
  const isAdmin = pathname.startsWith('/admin');
  const isLineApp = pathname.startsWith('/line-app');

  if (isAdmin || isLineApp) {
    return <PreviewViewport>{children}</PreviewViewport>;
  }

  return (
    <PreviewViewport>
      <Sidebar />
      <main className="md:ml-64 md:w-[calc(100%-16rem)] px-2 pb-2 pt-12 sm:p-6 lg:p-8 min-h-screen transition-all duration-300">
        <div className="bg-transparent shadow-none rounded-none p-0 sm:bg-white sm:rounded-lg sm:shadow-md sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
          {children}
        </div>
      </main>
    </PreviewViewport>
  );
}
