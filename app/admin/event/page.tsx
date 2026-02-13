import { prisma } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formatJstDateTime } from "@/app/_lib/formatDate";

export default async function EventAdminListPage() {
  // middleware が /admin/* を保護するので、ここでの認証・権限チェックは不要

  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
  });

  async function setActiveEvent(formData: FormData) {
    "use server";

    const id = String(formData.get("id") || "").trim();
    if (!id) return;

    await prisma.event.updateMany({ data: { isActive: false } });
    await prisma.event.update({ where: { id }, data: { isActive: true } });

    // 管理画面側の再描画
    revalidatePath("/admin");
    revalidatePath("/admin/event");

    // ユーザー側（/line-app）に「現在イベント」を出しているなら再描画
    revalidatePath("/line-app");

    redirect("/admin/event");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-800">イベント管理（一覧）</h1>
            <div className="text-sm text-gray-500 mt-1">イベントの作成・編集・現在イベントの切替</div>
          </div>

          <a href="/admin" className="text-sm text-blue-600 font-bold">
            戻る
          </a>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-4 text-gray-600">
            まだイベントがありません。
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((e) => (
              <div key={e.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {e.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                          現在のイベント
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                          非アクティブ
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-gray-900 truncate">{e.title}</div>
                    <div className="text-sm text-gray-700 mt-1">開催：{formatJstDateTime(e.date)}</div>
                    <div className="text-xs text-gray-500 mt-1 truncate">場所：{e.place} / 会費：{e.fee}</div>
                    <div className="text-xs text-gray-500 mt-1">締切：{formatJstDateTime(e.deadline)}</div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {!e.isActive && (
                      <form action={setActiveEvent}>
                        <input type="hidden" name="id" value={e.id} />
                        <button
                          type="submit"
                          className="text-xs bg-gray-800 text-white font-bold py-2 px-3 rounded-lg"
                        >
                          現在にする
                        </button>
                      </form>
                    )}

                    <a
                      href={`/admin/event/${e.id}`}
                      className="text-xs bg-white border border-gray-300 text-gray-800 font-bold py-2 px-3 rounded-lg"
                    >
                      編集
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
