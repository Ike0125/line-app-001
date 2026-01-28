import Link from 'next/link';

export default function Sidebar() {
  return (
    // ここで背景色を濃い色(bg-slate-900)に指定しています
    <aside className="h-screen w-64 bg-slate-900 text-white flex flex-col shadow-lg fixed left-0 top-0">
      <div className="p-6 border-b border-slate-700">
        <h2 className="text-xl font-bold tracking-wider">LINE Connect</h2>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link 
              href="/" 
              className="block p-3 rounded hover:bg-slate-800 transition-colors duration-200 flex items-center gap-3"
            >
              <span>🏠</span> ホーム
            </Link>
          </li>
          <li>
            <Link 
              href="/line-app" 
              className="block p-3 rounded hover:bg-slate-800 transition-colors duration-200 flex items-center gap-3"
            >
              <span>📱</span> LINEミニアプリ
            </Link>
          </li>
          <li>
            <Link 
              href="/calendar" 
              className="block p-3 rounded hover:bg-slate-800 transition-colors duration-200 flex items-center gap-3"
            >
              <span>📅</span> カレンダー連携
            </Link>
          </li>
          <li>
            <Link 
              href="/database" 
              className="block p-3 rounded hover:bg-slate-800 transition-colors duration-200 flex items-center gap-3"
            >
              <span>🗄️</span> データベース
            </Link>
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700 text-xs text-slate-400 text-center">
        © 2026 My App
      </div>
    </aside>
  );
}