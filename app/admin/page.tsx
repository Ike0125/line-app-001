import { revalidatePath } from "next/cache";
import { prisma } from "@/app/_lib/prisma";
import { formatJstDateTime } from "@/app/_lib/formatDate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const PAGE_SIZE = 25;

type AdminPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  const adminDisplayName = session?.user?.name || session?.user?.email || "不明";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminActor = (session?.user as any)?.id || session?.user?.email || session?.user?.name || "admin";

  // 1) イベント情報の取得
  const event = await prisma.event.findFirst({
    orderBy: [{ isActive: "desc" }, { deadline: "desc" }],
    select: {
      id: true,
      title: true,
      date: true,
    },
  });

  // ★追加機能: データ削除処理 (Server Action)
  async function resetData(formData: FormData) {
    "use server";

    const confirm = String(formData.get("confirm") ?? "");
    if (confirm !== "DELETE") return;

    if (!event) return;

    await prisma.rsvp.deleteMany({
      where: { eventId: event.id },
    });

    revalidatePath("/admin");
  }

  // ★追加機能: 受付（チェックイン） (Server Action)
  async function checkinAction(formData: FormData) {
    "use server";

    const userId = String(formData.get("userId") ?? "");
    if (!userId) return;

    if (!event) return;

    const row = await prisma.rsvp.findUnique({
      where: { eventId_userId: { eventId: event.id, userId } },
      select: { status: true, approvalStatus: true },
    });
    if (!row || row.status !== "join" || row.approvalStatus !== "approved") return;

    await prisma.rsvp.update({
      where: { eventId_userId: { eventId: event.id, userId } },
      data: { checkedInAt: new Date() },
    });

    revalidatePath("/admin");
  }

  // ★追加機能: 受付取消 (Server Action)
  async function undoCheckinAction(formData: FormData) {
    "use server";

    const userId = String(formData.get("userId") ?? "");
    if (!userId) return;

    if (!event) return;

    await prisma.rsvp.update({
      where: { eventId_userId: { eventId: event.id, userId } },
      data: { checkedInAt: null },
    });

    revalidatePath("/admin");
  }

  async function approveAction(formData: FormData) {
    "use server";

    const userId = String(formData.get("userId") ?? "");
    if (!userId || !event) return;

    await prisma.rsvp.update({
      where: { eventId_userId: { eventId: event.id, userId } },
      data: {
        approvalStatus: "approved",
        approvedAt: new Date(),
        approvedBy: adminActor,
        approvalNote: null,
      },
    });

    revalidatePath("/admin");
  }

  async function rejectAction(formData: FormData) {
    "use server";

    const userId = String(formData.get("userId") ?? "");
    if (!userId || !event) return;

    await prisma.rsvp.update({
      where: { eventId_userId: { eventId: event.id, userId } },
      data: {
        approvalStatus: "rejected",
        approvedAt: null,
        approvedBy: adminActor,
        checkedInAt: null,
      },
    });

    revalidatePath("/admin");
  }

  // イベントが無い場合でも管理画面を表示し、登録画面へ誘導する
  if (!event) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-6 text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">管理ダッシュボード</h1>
          <p className="text-gray-600 mb-6">イベントが未登録です。</p>

          <a
            href="/admin/event"
            className="inline-block bg-blue-600 text-white font-bold py-3 px-5 rounded-xl"
          >
            ➕ イベント登録
          </a>
        </div>
      </div>
    );
  }

  const rawPage = Number(params?.page ?? "1");
  const safePage = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

  const [totalCount, pendingCount, approvedCount, absentCount, checkedInCount] = await prisma.$transaction([
    prisma.rsvp.count({ where: { eventId: event.id } }),
    prisma.rsvp.count({ where: { eventId: event.id, status: "join", approvalStatus: "pending" } }),
    prisma.rsvp.count({ where: { eventId: event.id, status: "join", approvalStatus: "approved" } }),
    prisma.rsvp.count({ where: { eventId: event.id, status: "absent" } }),
    prisma.rsvp.count({ where: { eventId: event.id, checkedInAt: { not: null } } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(safePage, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;

  // 2) 参加者データの取得（最新25件をページング）
  const rsvps = await prisma.rsvp.findMany({
    where: { eventId: event.id },
    orderBy: { updatedAt: "desc" },
    skip: offset,
    take: PAGE_SIZE,
    select: {
      id: true,
      displayName: true,
      status: true,
      approvalStatus: true,
      checkedInAt: true,
      userId: true,
      comment: true,
    },
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">管理ダッシュボード</h1>
            <p className="text-sm text-gray-500 mt-1">LINEミニアプリ参加状況</p>
          </div>

          <div className="flex w-full flex-col items-start gap-2 xl:w-auto xl:items-end">
            <div className="w-full rounded bg-white px-4 py-2 text-sm shadow-sm xl:w-auto">
              管理者: <span className="font-bold text-green-600">{adminDisplayName}</span>
            </div>

            <div className="w-full rounded bg-white px-4 py-3 shadow-sm xl:w-[320px]">
              <div className="text-xs text-gray-500 mb-1">現在のイベント</div>
              <div className="font-bold text-gray-900 truncate">{event.title}</div>
              <div className="text-sm text-gray-700 mt-1">開催：{formatJstDateTime(event.date)}</div>
            </div>

            <a
              href="/admin/event"
              className="w-full rounded bg-blue-600 px-4 py-2 text-center text-xs font-bold text-white transition hover:bg-blue-700 xl:w-auto"
            >
              イベント管理
            </a>
          </div>
        </div>

        {/* 集計 */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-gray-50 rounded-md px-3 py-3">
              <p className="text-gray-500 text-xs font-bold uppercase">回答総数</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800 tabular-nums">
                {totalCount} <span className="text-xs font-normal">件</span>
              </p>
            </div>

            <div className="bg-gray-50 rounded-md px-3 py-3">
              <p className="text-gray-500 text-xs font-bold uppercase">受付確認待ち</p>
              <p className="text-2xl sm:text-3xl font-bold text-amber-600 tabular-nums">
                {pendingCount} <span className="text-xs font-normal">人</span>
              </p>
            </div>

            <div className="bg-gray-50 rounded-md px-3 py-3">
              <p className="text-gray-500 text-xs font-bold uppercase">受付確認済み</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-700 tabular-nums">
                {approvedCount} <span className="text-xs font-normal">人</span>
              </p>
            </div>

            <div className="bg-gray-50 rounded-md px-3 py-3">
              <p className="text-gray-500 text-xs font-bold uppercase">欠席</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600 tabular-nums">
                {absentCount} <span className="text-xs font-normal">人</span>
              </p>
            </div>

            <div className="bg-gray-50 rounded-md px-3 py-3">
              <p className="text-gray-500 text-xs font-bold uppercase">受付済み</p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-700 tabular-nums">
                {checkedInCount} <span className="text-xs font-normal">人</span>
              </p>
            </div>
          </div>
        </div>

        {/* 参加者リスト */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b bg-gray-50 flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
            <h2 className="font-bold text-gray-700">参加者リスト</h2>
            <span className="text-xs text-gray-500 sm:max-w-[60%] sm:text-right sm:truncate">
              イベント: {event.title}
            </span>
          </div>
          <div className="px-4 sm:px-6 py-3 border-b bg-white flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {totalCount === 0
                ? "0件"
                : `${offset + 1}-${Math.min(offset + PAGE_SIZE, totalCount)} / ${totalCount}件`}
            </span>
            <div className="flex items-center gap-2">
              <a
                href={currentPage > 1 ? `/admin?page=${currentPage - 1}` : "#"}
                aria-disabled={currentPage <= 1}
                className={`rounded border px-3 py-1 text-xs ${
                  currentPage > 1
                    ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                    : "cursor-not-allowed border-gray-200 text-gray-300"
                }`}
              >
                前へ
              </a>
              <span className="text-xs text-gray-600">
                {currentPage} / {totalPages}
              </span>
              <a
                href={currentPage < totalPages ? `/admin?page=${currentPage + 1}` : "#"}
                aria-disabled={currentPage >= totalPages}
                className={`rounded border px-3 py-1 text-xs ${
                  currentPage < totalPages
                    ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                    : "cursor-not-allowed border-gray-200 text-gray-300"
                }`}
              >
                次へ
              </a>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-bold text-xs">
                <tr>
                  <th className="px-6 py-3">名前</th>
                  <th className="px-6 py-3">状況</th>
                  <th className="px-6 py-3">受付確認</th>
                  <th className="px-6 py-3">受付</th>
                  <th className="px-6 py-3">コメント</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {rsvps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      まだ回答がありません
                    </td>
                  </tr>
                ) : (
                  rsvps.map((rsvp) => {
                    const isJoin = rsvp.status === "join";
                    const isApproved = rsvp.approvalStatus === "approved";
                    const isPending = rsvp.approvalStatus === "pending";
                    const isRejected = rsvp.approvalStatus === "rejected";
                    const isCheckedIn = !!rsvp.checkedInAt;
                    const statusLabel = !isJoin
                      ? "欠席"
                      : isApproved
                        ? "参加確定"
                        : isRejected
                          ? "参加申請（却下）"
                          : "参加申請";
                    const statusClass = !isJoin
                      ? "bg-red-100 text-red-800"
                      : isApproved
                        ? "bg-blue-100 text-blue-800"
                        : isRejected
                          ? "bg-gray-200 text-gray-700"
                          : "bg-amber-100 text-amber-800";

                    return (
                      <tr key={rsvp.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{rsvp.displayName}</td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
                          >
                            {statusLabel}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {!isJoin ? (
                            <span className="text-xs text-gray-400">対象外</span>
                          ) : isApproved ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-blue-700">確認済み</span>
                              <form action={rejectAction}>
                                <input type="hidden" name="userId" value={rsvp.userId} />
                                <button
                                  type="submit"
                                  className="text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-100"
                                >
                                  差戻し
                                </button>
                              </form>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-xs font-bold ${isRejected ? "text-red-700" : isPending ? "text-amber-700" : "text-gray-500"}`}
                              >
                                {isRejected ? "却下" : isPending ? "確認待ち" : "未設定"}
                              </span>
                              <form action={approveAction}>
                                <input type="hidden" name="userId" value={rsvp.userId} />
                                <button
                                  type="submit"
                                  className="text-xs bg-blue-600 text-white font-bold rounded px-3 py-1 hover:bg-blue-700"
                                >
                                  確認OK
                                </button>
                              </form>
                              <form action={rejectAction}>
                                <input type="hidden" name="userId" value={rsvp.userId} />
                                <button
                                  type="submit"
                                  className="text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-100"
                                >
                                  却下
                                </button>
                              </form>
                            </div>
                          )}
                        </td>

                        {/* ★受付：管理者が行う */}
                        <td className="px-6 py-4">
                          {!isJoin ? (
                            <span className="text-xs text-gray-400">参加者のみ</span>
                          ) : !isApproved ? (
                            <span className="text-xs text-amber-700">受付確認後に受付可能</span>
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

          <form action={resetData} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <input name="confirm" placeholder="DELETE と入力" className="border rounded px-3 py-2 w-full sm:w-48" />
            <button
              type="submit"
              className="bg-red-600 text-white font-bold px-4 py-2 rounded hover:bg-red-700 w-full sm:w-auto"
            >
              全削除を実行
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
