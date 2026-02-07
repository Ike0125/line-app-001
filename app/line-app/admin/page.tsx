import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/_lib/prisma";

// 環境変数から管理者IDを読み込み
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

export default async function AdminPage() {
  // 1. ログインチェック
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/api/auth/signin?callbackUrl=/line-app/admin");
  }

  // 2. セキュリティチェック
  if (!ADMIN_USER_ID) {
    return (
      <div className="p-10 text-red-600">
        管理者IDが設定されていません。.env / .env.local を確認してください。（ADMIN_USER_ID）
      </div>
    );
  }

  // ログイン中のIDを取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserId = (session.user as any).id;

  if (currentUserId !== ADMIN_USER_ID) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">アクセス権限がありません</h1>
          <p className="text-gray-600 mb-6">
            このページは管理者専用です。
            <br />
            あなたのID: {currentUserId || "不明"}
          </p>
          <a
            href="/line-app"
            className="inline-block bg-gray-500 text-white font-bold py-2 px-6 rounded hover:bg-gray-600 transition"
          >
            トップページへ戻る
          </a>
        </div>
      </div>
    );
  }

  // --- 以下、管理者のみ閲覧可能 ---

  // 3. イベント情報の取得
  const event =
    (await prisma.event.findFirst({ where: { isActive: true } })) ??
    (await prisma.event.findFirst({ orderBy: { deadline: "desc" } }));

  // イベントが無い場合でも管理画面を表示し、登録画面へ誘導する
  if (!event) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-6 text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">管理ダッシュボード</h1>
          <p className="text-gray-600 mb-6">イベントが未登録です。</p>

          <a
            href="/line-app/admin/event"
            className="inline-block bg-blue-600 text-white font-bold py-3 px-5 rounded-xl"
          >
            ➕ イベント登録
          </a>
        </div>
      </div>
    );
  }

  // ★追加機能: データ削除処理 (Server Action)
  async function resetData(formData: FormData) {
    "use server";

    const s = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((s?.user as any)?.id !== process.env.ADMIN_USER_ID) return;

    const confirm = String(formData.get("confirm") ?? "");
    if (confirm !== "DELETE") return;

    await prisma.rsvp.deleteMany({
      where: { eventId: event.id },
    });

    revalidatePath("/line-app/admin");
  }

  // ★追加機能: 受付（チェックイン） (Server Action)
  async function checkinAction(formData: FormData) {
    "use server";

    const s = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((s?.user as any)?.id !== process.env.ADMIN_USER_ID) return;

    const userId = String(formData.get("userId") ?? "");
    if (!userId) return;

    await prisma.rsvp.update({
      where: { eventId_userId: { eventId: event.id, userId } },
      data: { checkedInAt: new Date() },
    });

    revalidatePath("/line-app/admin");
  }

  // ★追加機能: 受付取消 (Server Action)
  async function undoCheckinAction(formData: FormData) {
    "use server";

    const s = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((s?.user as any)?.id !== process.env.ADMIN_USER_ID) return;

    const userId = String(formData.get("userId") ?? "");
    if (!userId) return;

    await prisma.rsvp.update({
      where: { eventId_userId: { eventId: event.id, userId } },
      data: { checkedInAt: null },
    });

    revalidatePath("/line-app/admin");
  }

  // 4. 参加者データの取得
  const rsvps = await prisma.rsvp.findMany({
    where: { eventId: event.id },
    orderBy: { updatedAt: "desc" },
  });

  // 5. 集計
  const joinCount = rsvps.filter((r) => r.status === "join").length;
  const absentCount = rsvps.filter((r) => r.status === "absent").length;
  const totalCount = rsvps.length;
  const checkedInCount = rsvps.filter((r) => r.checkedInAt != null).length;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">管理ダッシュボード</h1>
            <p className="text-sm text-gray-500 mt-1">LINEミニアプリ参加状況</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-sm bg-white px-4 py-2 rounded shadow-sm">
              管理者: <span className="font-bold text-green-600">{session.user.name}</span>
            </div>

            <div className="bg-white px-4 py-3 rounded shadow-sm w-[280px]">
              <div className="text-xs text-gray-500 mb-1">現在のイベント</div>
              <div className="font-bold text-gray-900 truncate">{event.title}</div>
              <div className="text-sm text-gray-700 mt-1">開催：{event.date}</div>
            </div>

            <a
              href="/line-app/admin/event"
              className="text-xs bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition"
            >
              イベント管理
            </a>
          </div>
        </div>

        {/* 集計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm font-bold uppercase">回答総数</p>
            <p className="text-3xl font-bold text-gray-800">
              {totalCount} <span className="text-sm font-normal">件</span>
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
            <p className="text-gray-500 text-sm font-bold uppercase">参加予定</p>
            <p className="text-3xl font-bold text-green-600">
              {joinCount} <span className="text-sm font-normal">人</span>
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
            <p className="text-gray-500 text-sm font-bold uppercase">欠席</p>
            <p className="text-3xl font-bold text-red-600">
              {absentCount} <span className="text-sm font-normal">人</span>
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
            <p className="text-gray-500 text-sm font-bold uppercase">受付済み</p>
            <p className="text-3xl font-bold text-purple-700">
              {checkedInCount} <span className="text-sm font-normal">人</span>
            </p>
          </div>
        </div>

        {/* 参加者リスト */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-700">参加者リスト</h2>
            <span className="text-xs text-gray-500">イベント: {event.title}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-bold text-xs">
                <tr>
                  <th className="px-6 py-3">名前</th>
                  <th className="px-6 py-3">状況</th>
                  <th className="px-6 py-3">受付</th>
                  <th className="px-6 py-3">コメント</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {rsvps.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      まだ回答がありません
                    </td>
                  </tr>
                ) : (
                  rsvps.map((rsvp) => {
                    const isJoin = rsvp.status === "join";
                    const isCheckedIn = !!rsvp.checkedInAt;

                    return (
                      <tr key={rsvp.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{rsvp.displayName}</td>

                        <td className="px-6 py-4">
                          {isJoin ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              参加 🙆‍♂️
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              欠席 🙅‍♂️
                            </span>
                          )}
                        </td>

                        {/* ★受付：管理者が行う */}
                        <td className="px-6 py-4">
                          {!isJoin ? (
                            <span className="text-xs text-gray-400">参加者のみ</span>
                          ) : isCheckedIn ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-purple-700">受付済み</span>
                              <span className="text-xs text-gray-500">
                                {new Date(rsvp.checkedInAt as unknown as string).toLocaleTimeString("ja-JP", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <form action={undoCheckinAction}>
                                <input type="hidden" name="userId" value={rsvp.userId} />
                                <button
                                  type="submit"
                                  className="text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-100"
                                >
                                  取消
                                </button>
                              </form>
                            </div>
                          ) : (
                            <form action={checkinAction}>
                              <input type="hidden" name="userId" value={rsvp.userId} />
                              <button
                                type="submit"
                                className="text-xs bg-purple-600 text-white font-bold rounded px-3 py-1 hover:bg-purple-700"
                              >
                                受付
                              </button>
                            </form>
                          )}
                        </td>

                        <td className="px-6 py-4 max-w-xs truncate text-gray-500">{rsvp.comment || "-"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 危険操作 */}
        <div className="bg-white mt-8 p-6 rounded-lg shadow-sm border border-red-200">
          <h3 className="font-bold text-red-600 mb-2">危険操作</h3>
          <p className="text-sm text-gray-600 mb-4">
            テストデータを全削除します（元に戻せません）。実行するには下の入力欄に <b>DELETE</b> と入力してください。
          </p>

          <form action={resetData} className="flex gap-3 items-center">
            <input
              name="confirm"
              placeholder="DELETE と入力"
              className="border rounded px-3 py-2 w-48"
            />
            <button
              type="submit"
              className="bg-red-600 text-white font-bold px-4 py-2 rounded hover:bg-red-700"
            >
              全削除を実行
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
