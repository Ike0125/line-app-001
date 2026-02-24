import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/app/_lib/auth-utils";

const prisma = new PrismaClient();

export default async function EventNewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/line-app/admin/event/new");
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

  async function createEvent(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user) return;
    if (!isAdmin(s)) return;

    const title = String(formData.get("title") || "").trim();
    const date = String(formData.get("date") || "").trim(); // String運用
    const place = String(formData.get("place") || "").trim();
    const fee = String(formData.get("fee") || "").trim();
    const memo = String(formData.get("memo") || "").trim();
    const deadlineStr = String(formData.get("deadline") || "").trim(); // yyyy-MM-ddTHH:mm

    if (!title || !date || !place || !fee || !deadlineStr) return;

    const makeActive = String(formData.get("makeActive") || "") === "on";

    if (makeActive) {
      await prisma.event.updateMany({ data: { isActive: false } });
    }

    await prisma.event.create({
      data: {
        title,
        date,
        place,
        fee,
        memo: memo || null,
        deadline: new Date(deadlineStr),
        isActive: makeActive,
      },
    });

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
            <h1 className="text-lg font-bold text-gray-800">新規イベント作成</h1>
            <div className="text-sm text-gray-500 mt-1">必要項目を入力して登録します</div>
          </div>
          <a href="/line-app/admin/event" className="text-sm text-blue-600 font-bold">
            一覧へ戻る
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <form action={createEvent} className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">イベント名（title）</label>
              <input
                name="title"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
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
              <input
                name="place"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
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
              <textarea
                name="memo"
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input id="makeActive" name="makeActive" type="checkbox" className="h-4 w-4" />
              <label htmlFor="makeActive" className="text-sm text-gray-700">
                このイベントを「現在のイベント」にする
              </label>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">
              登録する
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
