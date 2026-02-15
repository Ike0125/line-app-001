'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { signOut, useSession } from "next-auth/react";

type PreviewMode = 'normal' | 'mobile';

const PREVIEW_STORAGE_KEY = 'preview-mode';
const PREVIEW_EVENT_NAME = 'preview-mode-change';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('normal');
  const { data: session } = useSession();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const savedMode = localStorage.getItem(PREVIEW_STORAGE_KEY);
    const mode = savedMode === 'mobile' ? 'mobile' : 'normal';
    setPreviewMode(mode);
    document.body.dataset.previewMode = mode;
  }, []);

  const applyPreviewMode = (mode: PreviewMode) => {
    setPreviewMode(mode);
    localStorage.setItem(PREVIEW_STORAGE_KEY, mode);
    document.body.dataset.previewMode = mode;
    window.dispatchEvent(new Event(PREVIEW_EVENT_NAME));
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const togglePreviewMode = () => {
    const nextMode = previewMode === 'normal' ? 'mobile' : 'normal';
    applyPreviewMode(nextMode);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 bg-slate-900 text-white p-2 rounded hover:bg-slate-800 transition-colors"
        aria-label="メニュー切り替え"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isOpen && (
        <div
          onClick={closeSidebar}
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-screen w-64 bg-slate-900 text-white flex flex-col shadow-lg
        transition-transform duration-300 z-40
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-6 border-b border-slate-700 pt-8 md:pt-6 flex items-center md:block">
          <div className="w-10 md:w-auto flex-shrink-0 md:hidden" />
          <h2 className="text-xl font-bold tracking-wider flex-1 md:flex-none">LINE Connect</h2>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/line-app"
                onClick={closeSidebar}
                className="block p-3 rounded hover:bg-slate-800 transition-colors duration-200 flex items-center gap-3"
              >
                <span>📱</span> LINE予約
              </Link>
            </li>
            <li>
              <Link
                href="/line-app/history"
                onClick={closeSidebar}
                className="block p-3 rounded hover:bg-slate-800 transition-colors duration-200 flex items-center gap-3"
              >
                <span>🗄️</span> 参加履歴
              </Link>
            </li>
            <li>
              <Link
                href="/admin/"
                onClick={closeSidebar}
                className="block p-3 rounded hover:bg-slate-800 transition-colors duration-200 flex items-center gap-3"
              >
                <span>🗄️</span> 管理者用ページ
              </Link>
            </li>
            {isMounted && (
              <li>
                <button
                  type="button"
                  onClick={togglePreviewMode}
                  aria-pressed={previewMode === 'mobile'}
                  className="w-full text-left p-3 rounded bg-slate-800 hover:bg-slate-700 transition-colors duration-200 flex items-center gap-3"
                >
                  <span>{previewMode === 'mobile' ? '🖥️' : '📲'}</span>
                  {previewMode === 'mobile' ? '通常表示に戻す' : 'スマホ表示テスト'}
                </button>
              </li>
            )}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700">
          {session ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-lg">
                  👤
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{session.user?.name}</p>
                  <p className="text-xs text-slate-400">オンライン</p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white text-sm py-2 px-3 rounded transition-colors"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-300 mb-3">ログインしていません</p>
              <Link
                href="/api/auth/signin"
                className="block w-full text-center bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-3 rounded transition-colors font-semibold"
                onClick={closeSidebar}
              >
                LINEでログイン
              </Link>
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-700 text-xs text-slate-400 text-center">
          © 2026 My App
        </div>
      </aside>
    </>
  );
}
