import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

function requireAdmin(session: any) {
  if (!session || !session.user) return false;
  const uid = (session.user as any).id;
  return !!ADMIN_USER_ID && uid === ADMIN_USER_ID;
}

export default async function EventAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/api/auth/signin?callbackUrl=/line-app/admin/event");
  }
  if (!requireAdmin(session)) {
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
    orderBy: { deadline: "desc" },
  });

  async function createEvent(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s || !(s as any).user) return;
    const uid = ((s as any).user as any).id;
    if (!process.env.ADMIN_USER_ID || uid !== process.env.ADMIN_USER_ID) return;

    const title = String(formData.get("title") || "").trim();
    const date = String(formData.get("date") || "").trim();
    const place = String(formData.get("place") || "").trim();
    const fee = String(formData.get("fee") || "").trim();
    const memo = String(formData.get("memo") || "").trim();
    const deadlineStr = String(formData.get("deadline") || "").trim();

    if (!title || !date || !place || !fee || !deadlineStr) return;

    await prisma.event.create({
      data: {
        title,
        date,
        place,
        fee,
        memo: memo || null,
        deadline: new Date(deadlineStr),
      },
    });

    revalidatePath("/line-app/admin");
    revalidatePath("/line-app/admin/event");
    redirect("/line-app/admin/event");
  }

  async function updateEvent(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s || !(s as any).user) return;
    const uid = ((s as any).user as any).id;
    if (!process.env.ADMIN_USER_ID || uid !== process.env.ADMIN_USER_ID) return;

    const id = String(formData.get("id") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const date = String(formData.get("date") || "").trim();
    const place = String(formData.get("place") || "").trim();
    const fee = String(formData.get("fee") || "").trim();
    const memo = String(formData.get("memo") || "").trim();
    const deadlineStr = String(formData.get("deadline") || "").trim();

    if (!id || !title || !date || !place || !fee || !deadlineStr) return;

    await prisma.event.update({
      where: { id },
      data: {
        title,
        date,
        place,
        fee,
        memo: memo || null,
        deadline: new Date(deadlineStr),
      },
    });

    revalidatePath("/line-app/admin");
    revalidatePath("/line-app/admin/event");
    redirect("/line-app/admin/event");
  }
    async function setActiveEvent(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s || !(s as any).user) return;
    const uid = ((s as any).user as any).id;
    if (!process.env.ADMIN_USER_ID || uid !== process.env.ADMIN_USER_ID) return;

    const id = String(formData.get("id") || "").trim();
    if (!id) return;

    // いったん全部OFF → 指定だけON（常に1つだけ）
    await prisma.event.updateMany({ data: { isActive: false } });
    await prisma.event.update({ where: { id }, data: { isActive: true } });

    revalidatePath("/line-app");
    revalidatePath("/line-app/admin");
    revalidatePath("/line-app/admin/event");
    redirect("/line-app/admin/event");
    }

  async function deleteEvent(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s || !(s as any).user) return;
    const uid = ((s as any).user as any).id;
    if (!process.env.ADMIN_USER_ID || uid !== process.env.ADMIN_USER_ID) return;

    const id = String(formData.get("id") || "").trim();
    const confirm = String(formData.get("confirm") || "").trim();
    if (!id || confirm !== "DELETE") return;

    await prisma.rsvp.deleteMany({ where: { eventId: id } });
    await prisma.event.delete({ where: { id } });

    revalidatePath("/line-app/admin");
    revalidatePath("/line-app/admin/event");
    redirect("/line-app/admin/event");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-gray-800">イベント管理</h1>
          <a href="/line-app/admin" className="text-sm text-blue-600 font-bold">
            戻る
          </a>
        </div>

        {/* 新規登録 */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="font-bold text-gray-800 mb-3">新規イベント登録</div>
          <form action={createEvent} className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">イベント名（title）</label>
              <input name="title" required className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">開催日時（date：文字列）</label>
              <input
                name="date"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="例：2026/02/15 10:00"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">締切日時（deadline）</label>
              <input
                name="deadline"
                type="datetime-local"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">場所（place）</label>
              <input name="place" required className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">会費（fee）</label>
              <input
                name="fee"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="例：200円"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">メモ（memo：任意）</label>
              <textarea name="memo" rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">
              登録する
            </button>
          </form>
        </div>

        {/* 一覧＋編集 */}
        <div className="space-y-4">
          <div className="font-bold text-gray-800">登録済みイベント一覧</div>

          {events.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-4 text-gray-600">
              まだイベントがありません。
            </div>
          ) : (
            events.map((e) => (
              <div key={e.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="text-sm text-gray-500 mb-2">
                  <span className="font-bold text-gray-700">ID</span>：{e.id}
                </div>

                <form action={updateEvent} className="space-y-3">
                  <input type="hidden" name="id" value={e.id} />

                    <div className="flex items-center justify-between mb-2">
                    <div className="text-sm">
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

                    {!e.isActive && (
                        <form action={setActiveEvent}>
                        <input type="hidden" name="id" value={e.id} />
                        <button
                            type="submit"
                            className="text-xs bg-gray-800 text-white font-bold py-2 px-3 rounded-lg hover:bg-gray-900 transition"
                        >
                            現在にする
                        </button>
                        </form>
                    )}
                    </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">イベント名（title）</label>
                    <input
                      name="title"
                      required
                      defaultValue={e.title}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">開催日時（date：文字列）</label>
                    <input
                      name="date"
                      required
                      defaultValue={e.date}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">締切日時（deadline）</label>
                    <input
                      name="deadline"
                      type="datetime-local"
                      required
                      defaultValue={(e.deadline as any).toISOString?.().slice(0, 16) ?? ""}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">場所（place）</label>
                    <input
                      name="place"
                      required
                      defaultValue={e.place}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">会費（fee）</label>
                    <input
                      name="fee"
                      required
                      defaultValue={e.fee}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">メモ（memo：任意）</label>
                    <textarea
                      name="memo"
                      rows={3}
                      defaultValue={e.memo ?? ""}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>

                  <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-xl">
                    更新する
                  </button>
                </form>

                {/* 削除（DELETE確認） */}
                <div className="mt-4 border-t pt-4">
                  <div className="text-xs text-gray-500 mb-2">
                    ※削除すると参加登録（RSVP）も削除します。実行するには <b>DELETE</b> と入力してください。
                  </div>
                  <form action={deleteEvent} className="flex flex-col sm:flex-row gap-2">
                    <input type="hidden" name="id" value={e.id} />
                    <input
                      name="confirm"
                      type="text"
                      className="w-full sm:w-56 rounded-lg border border-gray-300 px-3 py-2"
                      placeholder="DELETE と入力"
                      required
                    />
                    <button type="submit" className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg">
                      削除する
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
