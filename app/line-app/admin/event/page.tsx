import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formatJstDateTime } from "@/app/_lib/formatDate";

const prisma = new PrismaClient();

function isAdmin(session: any) {
  const adminId = process.env.ADMIN_USER_ID;
  const uid = (session?.user as any)?.id;
  return !!adminId && uid === adminId;
}

export default async function EventAdminListPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/line-app/admin/event");
  }
  if (!isAdmin(session)) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm text-center">
          <h1 className="text-lg font-bold text-red-600 mb-2">アクセス権限がありません</h1>
          <a
            href="/line-app/admin"
            className="inline-block mt-4 bg-gray-700 text-white font-bold py-2 px-4 rounded-xl"
          >
            管理画面へ戻る
          </a>
        </div>
      </div>
    );
  }

  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
  });

  async function setActiveEvent(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user) return;
    if (!isAdmin(s)) return;

    const id = String(formData.get("id") || "").trim();
    if (!id) return;

    await prisma.event.updateMany({ data: { isActive: false } });
    await prisma.event.update({ where: { id }, data: { isActive: true } });

    revalidatePath("/line-app");
    revalidatePath("/line-app/admin");
    revalidatePath("/line-app/admin/event");
    redirect("/line-app/admin/event");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-800">イベント管理（一覧）</h1>
            <div className="text-sm text-gray-500 mt-1">イベントの作成・編集・現在イベントの切替</div>
          </div>
          <a href="/line-app/admin" className="text-sm text-blue-600 font-bold">
            戻る
          </a>
        </div>

        {/* <div className="mb-4">
          <a
            href="/line-app/admin/event/new"
            className="inline-flex items-center bg-blue-600 text-white font-bold py-2 px-4 rounded-xl"
          >
            ＋ 新規イベント作成
          </a>
        </div> 
        */}

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
                    <div className="text-xs text-gray-500 mt-1">
                      締切：{formatJstDateTime(e.deadline)}
                    </div>
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
                      href={`/line-app/admin/event/${e.id}`}
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
