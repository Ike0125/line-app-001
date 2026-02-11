import { prisma } from "@/app/_lib/prisma";
import { requireNoticeEditorUserId } from "@/app/_lib/requireNoticeEditor";
// import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import NoticeForm from "./NoticeForm";
import { SubmitButton } from "./_components/SubmitButton";

const STATUS_OPTIONS = ["初期設定", "開催", "中止", "その他", "メッセージのみ", "非表示"] as const;
const TZ = "Asia/Tokyo";

function getJstStartOfTodayUtc(): Date {
  // JSTの年月日を取得 → JST 00:00 を UTC に変換
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);

  // JST 00:00 = UTC 15:00(前日) なので 9時間引く
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - 9 * 60 * 60 * 1000);
}

function formatEventLabel(date: Date, title: string) {
  const md = new Intl.DateTimeFormat("ja-JP", {
    timeZone: TZ,
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  const wd = new Intl.DateTimeFormat("ja-JP", {
    timeZone: TZ,
    weekday: "short",
  }).format(date); // 例: "火"

  return `${md}(${wd}) ${title}`;
}

  export default async function AdminNoticePage({
    searchParams,
  }: {
    searchParams?: Promise<{ eventId?: string; saved?: string }>;
  }) {
    const sp = await searchParams;
  // 権限チェック（未ログイン→サインイン / 権限なし→例外）
  let editorUserId = "";
  try {
    editorUserId = await requireNoticeEditorUserId();
  } catch (e: any) {
    const msg = String(e?.message ?? e);

    // 画面表示を丁寧に（運用向け）
    if (msg.includes("FORBIDDEN")) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow p-6 max-w-lg w-full">
            <h1 className="text-xl font-bold text-red-600 mb-2">アクセス権限がありません</h1>
            <p className="text-gray-700">
              このページは「開催通知の編集者」のみ利用できます。
            </p>
          </div>
        </div>
      );
    }

    if (msg.includes("NOTICE_EDITOR_USER_IDS")) {
      return (
        <div className="p-10 text-red-600">
          NOTICE_EDITOR_USER_IDS が設定されていません。.env / Cloud Run の環境変数を確認してください。
        </div>
      );
    }

    throw e;
  }

  // 表示対象イベント（isActive優先）
  const start = getJstStartOfTodayUtc();

  const events = await prisma.event.findMany({
    where: { date: { gte: start } },   // 今日以降
    orderBy: { date: "asc" },         // 昇順
    take: 5,                          // 5件
    select: { id: true, title: true, date: true, isActive: true },
  });

  // デフォルト選択：isActive がこの5件にいればそれ、いなければ先頭
  //const current = events.find((e) => e.isActive) ?? events[0] ?? null;

  const selectedEventId = sp?.eventId;
  const current =
    (selectedEventId ? events.find((e) => e.id === selectedEventId) : null) ??
    events.find((e) => e.isActive) ??
    events[0] ??
    null;

  const currentNotice = current
    ? await prisma.eventNotice.findUnique({ where: { eventId: current.id } })
    : null;

  const session = await getServerSession(authOptions);

  async function saveAction(formData: FormData) {
    "use server";

    const userId = await requireNoticeEditorUserId();

    const eventId = String(formData.get("eventId") ?? "");
    const status = String(formData.get("status") ?? "");
    const message = String(formData.get("message") ?? "");

    if (!eventId) return;
    if (!STATUS_OPTIONS.includes(status as any)) return;

    await prisma.eventNotice.upsert({
      where: { eventId },
      create: {
        eventId,
        status,
        message: message.trim() ? message : null,
        updatedByUserId: userId,
      },
      update: {
        status,
        message: message.trim() ? message : null,
        updatedByUserId: userId,
      },
    });

    // 保存後は同じイベントを保持し、saved=1で通知
    redirect(`/line-app/admin/notice?eventId=${encodeURIComponent(eventId)}`);

    //revalidatePath("/line-app/admin/notice");
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">イベント開催情報</h1>
            <p className="text-sm text-gray-500 mt-1">
              編集者：{session?.user?.name ?? "（名前未取得）"}
            </p>
            <div className="text-xs text-gray-500">
              埋め込みURL：<span className="font-mono">/api/public/event-notice</span>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/api/public/event-notice"
              target="_blank"
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              rel="noreferrer"
            >
              公開表示を確認
            </a>
          </div>
        </div>

        {!current ? (
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-700">イベントが未登録です。</p>
          </div>
        ) : (
        <>

        <form action={saveAction} className="bg-white rounded-xl shadow p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">対象イベント</label>
            <select
              name="eventId"
              defaultValue={current.id}
              className="w-full border rounded px-3 py-2"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {formatEventLabel(e.date, e.title)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">通知ステータス</label>
            {STATUS_OPTIONS.map((s) => (
              <label key={s} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="status"
                  value={s}
                  defaultChecked={(currentNotice?.status ?? "初期設定") === s}
                  className="accent-blue-600"
                />
                <span>{s}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">メッセージ（任意）</label>
            <textarea
              name="message"
              defaultValue={currentNotice?.message ?? ""}
              rows={4}
              className="w-full border rounded px-3 py-2 h-28"
              placeholder="例：雨天のため中止です／現地の路面が滑りやすいのでご注意ください"
            />
          </div>

          <div className="flex items-center justify-between">
            {/* 送信ボタン */}
            <SubmitButton />

          </div>
        </form>
        </>            
        )}
      </div>
    </div>
  );
}
