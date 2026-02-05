import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

function isAdmin(session: any) {
  const adminId = process.env.ADMIN_USER_ID;
  const uid = (session?.user as any)?.id;
  return !!adminId && uid === adminId;
}

export default async function EventEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/api/auth/signin?callbackUrl=/line-app/admin/event/${id}`);
  }
  if (!isAdmin(session)) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm text-center">
          <h1 className="text-lg font-bold text-red-600 mb-2">アクセス権限がありません</h1>
          <a
            href="/line-app/admin/event"
            className="inline-block mt-4 bg-gray-700 text-white font-bold py-2 px-4 rounded-xl"
          >
            イベント一覧へ戻る
          </a>
        </div>
      </div>
    );
  }

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm text-center">
          <h1 className="text-lg font-bold text-gray-800 mb-2">イベントが見つかりません</h1>
          <a
            href="/line-app/admin/event"
            className="inline-block mt-4 bg-blue-600 text-white font-bold py-2 px-4 rounded-xl"
          >
            一覧へ戻る
          </a>
        </div>
      </div>
    );
  }

  async function updateEvent(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user) return;
    if (!isAdmin(s)) return;

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

    revalidatePath("/line-app");
    revalidatePath("/line-app/admin");
    revalidatePath("/line-app/admin/event");
    revalidatePath(`/line-app/admin/event/${id}`);
    redirect("/line-app/admin/event");
  }

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
    revalidatePath(`/line-app/admin/event/${id}`);
    redirect("/line-app/admin/event");
  }

  async function deleteEvent(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user) return;
    if (!isAdmin(s)) return;

    const id = String(formData.get("id") || "").trim();
    const confirm = String(formData.get("confirm") || "").trim();
    if (!id || confirm !== "DELETE") return;

    // RSVP も削除（イベント消すなら整合性のため）
    await prisma.rsvp.deleteMany({ where: { eventId: id } });
    await prisma.event.delete({ where: { id } });

    revalidatePath("/line-app");
    revalidatePath("/line-app/admin");
    revalidatePath("/line-app/admin/event");
    redirect("/line-app/admin/event");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-800">イベント編集</h1>
            <div className="text-sm text-gray-500 mt-1">ID：{event.id}</div>
          </div>
          <a href="/line-app/admin/event" className="text-sm text-blue-600 font-bold">
            一覧へ戻る
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-gray-800">基本情報</div>
            {event.isActive ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                現在のイベント
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                非アクティブ
              </span>
            )}
          </div>

          {!event.isActive && (
            <form action={setActiveEvent} className="mb-4">
              <input type="hidden" name="id" value={event.id} />
              <button type="submit" className="text-sm bg-gray-800 text-white font-bold py-2 px-4 rounded-xl">
                現在のイベントにする
              </button>
            </form>
          )}

          <form action={updateEvent} className="space-y-3">
            <input type="hidden" name="id" value={event.id} />

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">イベント名（title）</label>
              <input
                name="title"
                required
                defaultValue={event.title}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">開催日時（date：文字列）</label>
              <input
                name="date"
                required
                defaultValue={event.date}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">締切日時（deadline）</label>
              <input
                name="deadline"
                type="datetime-local"
                required
                defaultValue={(event.deadline as any).toISOString?.().slice(0, 16) ?? ""}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">場所（place）</label>
              <input
                name="place"
                required
                defaultValue={event.place}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">会費（fee）</label>
              <input
                name="fee"
                required
                defaultValue={event.fee}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">メモ（memo：任意）</label>
              <textarea
                name="memo"
                rows={3}
                defaultValue={event.memo ?? ""}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-xl">
              更新する
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-4">
          <div className="font-bold text-red-600">危険操作：削除</div>
          <div className="text-sm text-gray-600 mt-1">
            イベントを削除します（このイベントの参加登録データも削除します）。
          </div>
          <div className="text-xs text-gray-500 mt-1">
            実行するには <b>DELETE</b> と入力してください。
          </div>

          <form action={deleteEvent} className="mt-3 flex flex-col sm:flex-row gap-2">
            <input type="hidden" name="id" value={event.id} />
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
    </div>
  );
}
