import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; 
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export default async function LineAppPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // URLパラメータの取得 (awaitが必要です)
  const params = await searchParams;

  // 1. ログインセッションの取得
  const session = await getServerSession(authOptions);
  
  // ログインしていなければLINEログインへ転送
  if (!session || !session.user) {
    redirect('/api/auth/signin?callbackUrl=/line-app');
  }

  // 2. イベント情報の取得
  const event = await prisma.event.findFirst({ where: { isActive: true } });
  if (!event) {
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm text-center">
        <div className="text-lg font-bold text-gray-800">
          現在受付中のイベントはありません
        </div>
        <div className="text-sm text-gray-600 mt-2">
          受付開始までしばらくお待ちください。
        </div>
      </div>
    </div>
    );
  }

  // 3. 送信処理 (Server Action)
  async function submitRsvp(formData: FormData) {
    'use server';
    
    const currentSession = await getServerSession(authOptions);
    if (!currentSession || !currentSession.user) return;

    // ユーザーIDの取得 (LINE ID)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (currentSession.user as any).id || currentSession.user.email;

    if (!userId) {
       console.error("User ID not found");
       return;
    }
    
    // 登録または更新 (Upsert)
    await prisma.rsvp.upsert({
      where: {
        eventId_userId: {
          eventId: formData.get('eventId') as string,
          userId: userId,
        },
      },
      update: {
        displayName: formData.get('displayName') as string,
        status: formData.get('status') as string,
        comment: formData.get('comment') as string,
      },
      create: {
        eventId: formData.get('eventId') as string,
        userId: userId,
        displayName: formData.get('displayName') as string,
        status: formData.get('status') as string,
        comment: formData.get('comment') as string,
      },
    });

    // 完了パラメータをつけてリダイレクト
    redirect('/line-app?status=success');
  }

  // --- 画面表示 ---

  // A. 登録完了画面 (URLに ?status=success がある場合)
  if (params?.status === 'success') {
    // 最新の回答データを取得して表示
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id || session.user.email;

    const myRsvp = await prisma.rsvp.findUnique({
      where: {
        eventId_userId: {
          eventId: event.id,
          userId: userId,
        },
      },
    });

    return (
      <div className="max-w-md mx-auto min-h-screen bg-green-50 p-6 flex flex-col justify-center">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600 mb-2">登録完了</h1>
          <p className="text-gray-600">以下の内容で受付いたしました。</p>
        </div>

        {/* 登録内容の表示カード */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">
            YOUR TICKET
          </h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">イベント</p>
              <p className="font-bold text-gray-800">{event.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">お名前</p>
                <p className="font-bold text-gray-800 text-lg">{myRsvp?.displayName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">出欠</p>
                <p className={`font-bold text-lg ${myRsvp?.status === 'join' ? 'text-green-600' : 'text-red-500'}`}>
                  {myRsvp?.status === 'join' ? '参加 🙆‍♂️' : '欠席 🙅‍♂️'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">コメント</p>
              <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 whitespace-pre-wrap">
                {myRsvp?.comment || '（なし）'}
              </div>
            </div>
          </div>
        </div>

        <a 
          href="/line-app" 
          className="block w-full text-center text-green-700 font-bold border-2 border-green-600 py-3 rounded-full hover:bg-green-100 transition"
        >
          内容を修正する
        </a>
      </div>
    );
  }

  // B. 通常の入力フォーム画面
  return (
    <div className="max-w-md mx-auto min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6 flex flex-col justify-center">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{event.title}</h1>
        <p className="text-gray-600">イベント参加のご登録</p>
      </div>

      <form action={submitRsvp} className="space-y-6">
        <input type="hidden" name="eventId" value={event.id} />

        <div>
          <label htmlFor="displayName" className="block text-sm font-bold text-gray-700 mb-2">
            お名前
          </label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            required
            // ★ここを修正しました：セッションから名前を初期値としてセット
            defaultValue={session.user.name || ''}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="山田 太郎"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-bold text-gray-700 mb-2">
            出欠
          </label>
          <select
            id="status"
            name="status"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">選択してください</option>
            <option value="join">参加 🙆‍♂️</option>
            <option value="absent">欠席 🙅‍♂️</option>
          </select>
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-bold text-gray-700 mb-2">
            コメント（任意）
          </label>
          <textarea
            id="comment"
            name="comment"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="ご質問やご要望があればお知らせください"
            rows={3}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 rounded-full hover:shadow-lg transition"
        >
          登録する
        </button>
      </form>
    </div>
  );
}