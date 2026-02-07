import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/app/_lib/prisma";

type SearchParams = { [key: string]: string | string[] | undefined };

function getParam(params: SearchParams, key: string): string | undefined {
  const v = params[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

export default async function LineAppPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // 1) セッション
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/api/auth/signin?callbackUrl=/line-app");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id || session.user.email;
  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm text-center">
          <div className="text-lg font-bold text-gray-800">ユーザーIDが取得できませんでした</div>
          <div className="text-sm text-gray-600 mt-2">再ログインをお試しください。</div>
        </div>
      </div>
    );
  }

  // 2) 現在イベント
  const event = await prisma.event.findFirst({ where: { isActive: true } });
  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm text-center">
          <div className="text-lg font-bold text-gray-800">現在受付中のイベントはありません</div>
          <div className="text-sm text-gray-600 mt-2">受付開始までしばらくお待ちください。</div>
        </div>
      </div>
    );
  }

  // 3) 自分のRSVP
  const myRsvp = await prisma.rsvp.findUnique({
    where: { eventId_userId: { eventId: event.id, userId } },
  });

  // 4) Server Action：参加
  async function joinAction() {
    "use server";

    const currentSession = await getServerSession(authOptions);
    if (!currentSession || !currentSession.user) {
      redirect("/api/auth/signin?callbackUrl=/line-app");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentUserId = (currentSession.user as any).id || currentSession.user.email;
    if (!currentUserId) throw new Error("UNAUTHORIZED");

    const existing = await prisma.rsvp.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: currentUserId } },
    });

    const fallbackName =
      (currentSession.user as any).name ||
      (currentSession.user as any).displayName ||
      "（名前未設定）";

    await prisma.rsvp.upsert({
      where: { eventId_userId: { eventId: event.id, userId: currentUserId } },
      update: { status: "join" },
      create: {
        eventId: event.id,
        userId: currentUserId,
        displayName: existing?.displayName ?? fallbackName,
        status: "join",
        comment: existing?.comment ?? "",
      },
    });

    redirect(`/line-app?updated=join`);
  }

  // 5) Server Action：欠席
  async function absentAction() {
    "use server";

    const currentSession = await getServerSession(authOptions);
    if (!currentSession || !currentSession.user) {
      redirect("/api/auth/signin?callbackUrl=/line-app");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentUserId = (currentSession.user as any).id || currentSession.user.email;
    if (!currentUserId) throw new Error("UNAUTHORIZED");

    const existing = await prisma.rsvp.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: currentUserId } },
    });

    const fallbackName =
      (currentSession.user as any).name ||
      (currentSession.user as any).displayName ||
      "（名前未設定）";

    await prisma.rsvp.upsert({
      where: { eventId_userId: { eventId: event.id, userId: currentUserId } },
      update: { status: "absent" },
      create: {
        eventId: event.id,
        userId: currentUserId,
        displayName: existing?.displayName ?? fallbackName,
        status: "absent",
        comment: existing?.comment ?? "",
      },
    });

    redirect(`/line-app?updated=absent`);
  }

  const updated = getParam(params, "updated");
  const statusText =
    myRsvp?.status === "join" ? "参加 🙆‍♂️" : myRsvp?.status === "absent" ? "欠席 🙅‍♂️" : "未登録";

  const updatedText =
    updated === "join" ? "参加に更新しました" : updated === "absent" ? "欠席に更新しました" : null;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6 flex flex-col justify-center">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{event.title}</h1>
        <p className="text-gray-600">ワンタップで出欠を更新できます</p>
      </div>

      {updatedText && (
        <div className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-green-100">
          <div className="text-sm font-bold text-green-700">{updatedText}</div>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl shadow-sm mb-6 space-y-2">
        <div className="text-sm text-gray-600">場所：{event.place}</div>
        <div className="text-sm text-gray-600">日時：{event.date}</div>
        <div className="text-sm text-gray-600">参加費：{event.fee}</div>
        {event.memo && <div className="text-sm text-gray-600">メモ：{event.memo}</div>}

        <div className="pt-3 border-t mt-3">
          <div className="text-sm font-bold text-gray-700">あなたの状態：{statusText}</div>
          {myRsvp?.displayName && (
            <div className="text-sm text-gray-600 mt-1">お名前：{myRsvp.displayName}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* ★重要：action に「関数をラップして渡さない」 */}
        <form action={joinAction}>
          <button
            type="submit"
            className="w-full bg-green-600 text-white font-bold py-3 rounded-full hover:shadow-lg transition"
          >
            参加 🙆‍♂️
          </button>
        </form>

        <form action={absentAction}>
          <button
            type="submit"
            className="w-full bg-red-500 text-white font-bold py-3 rounded-full hover:shadow-lg transition"
          >
            欠席 🙅‍♂️
          </button>
        </form>
      </div>

      <div className="text-xs text-gray-500 mt-5 text-center">
        受付締切：{new Date(event.deadline).toLocaleString("ja-JP")}
      </div>
    </div>
  );
}
