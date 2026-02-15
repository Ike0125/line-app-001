'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

type PreviewMode = 'normal' | 'mobile';

const PREVIEW_STORAGE_KEY = 'preview-mode';
const PREVIEW_QUERY_KEY = 'previewViewport';
const PREVIEW_EVENT_NAME = 'preview-mode-change';

function getSavedMode(): PreviewMode {
  const mode = localStorage.getItem(PREVIEW_STORAGE_KEY);
  return mode === 'mobile' ? 'mobile' : 'normal';
}

export default function PreviewViewport({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [previewMode, setPreviewMode] = useState<PreviewMode>('normal');
  const [isDesktop, setIsDesktop] = useState(false);

  const isEmbeddedPreview = searchParams.get(PREVIEW_QUERY_KEY) === '1';

  useEffect(() => {
    setPreviewMode(getSavedMode());

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateDesktop = () => setIsDesktop(mediaQuery.matches);

    updateDesktop();
    mediaQuery.addEventListener('change', updateDesktop);

    const syncMode = () => setPreviewMode(getSavedMode());
    const onStorage = (event: StorageEvent) => {
      if (event.key === PREVIEW_STORAGE_KEY) {
        syncMode();
      }
    };

    const onModeChange = () => syncMode();

    window.addEventListener('storage', onStorage);
    window.addEventListener(PREVIEW_EVENT_NAME, onModeChange);

    return () => {
      mediaQuery.removeEventListener('change', updateDesktop);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(PREVIEW_EVENT_NAME, onModeChange);
    };
  }, []);

  const iframeSrc = useMemo(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set(PREVIEW_QUERY_KEY, '1');
    const query = nextParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  if (previewMode !== 'mobile' || !isDesktop || isEmbeddedPreview) {
    return <>{children}</>;
  }

  return (
    <div data-preview-shell>
      <div data-preview-phone>
        <iframe title="Mobile Preview" src={iframeSrc} className="h-full w-full border-0" />
      </div>
    </div>
  );
}
