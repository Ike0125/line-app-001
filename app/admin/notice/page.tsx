import { prisma } from "@/app/_lib/prisma";
import { requireNoticeEditorUserId } from "@/app/_lib/requireNoticeEditor";
import { renderEventNoticeHtml } from "@/app/_lib/eventNoticeRender";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

const STATUS_OPTIONS = ["初期設定", "開催", "中止", "お知らせ", "非表示"] as const;
const TZ = "Asia/Tokyo";

function getJstStartOfTodayUtc(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);

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
  }).format(date);

  return `${md}(${wd}) ${title}`;
}

export default async function AdminNoticePage({
  searchParams,
}: {
  searchParams?: Promise<{ eventId?: string; saved?: string; confirm?: string; published?: string }>;
}) {
  const sp = (await searchParams) ?? {};

  // 権限チェック（notice編集者のみ許可）
  // ※ /admin のログイン自体は middleware が保護している前提
  try {
    await requireNoticeEditorUserId();
  } catch (e: any) {
    const msg = String(e?.message ?? e);

    if (msg.includes("FORBIDDEN")) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow p-6 max-w-lg w-full">
            <h1 className="text-xl font-bold text-red-600 mb-2">アクセス権限がありません</h1>
            <p className="text-gray-700">このページは「開催通知の編集者」のみ利用できます。</p>
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

  // 表示対象イベント（isActive優先 / 今日以降 5件）
  const start = getJstStartOfTodayUtc();

  const events = await prisma.event.findMany({
    where: { date: { gte: start } },
    orderBy: { date: "asc" },
    take: 5,
    select: { id: true, title: true, date: true, isActive: true },
  });

  const selectedEventId = sp.eventId;
  const current =
    (selectedEventId ? events.find((e) => e.id === selectedEventId) : null) ??
    events.find((e) => e.isActive) ??
    events[0] ??
    null;

  const currentNotice = current
    ? await prisma.eventNotice.findUnique({ where: { eventId: current.id } })
    : null;

  const draftStatus = (currentNotice?.draftStatus ?? currentNotice?.status ?? "初期設定") as
    (typeof STATUS_OPTIONS)[number];
  const draftMessage = currentNotice?.draftMessage ?? currentNotice?.message ?? "";

  // 表示用（名前）
  const session = await getServerSession(authOptions);

  // 確認ボタン：下書き保存（isPublished=false）してプレビュー表示へ
  async function confirmAction(formData: FormData) {
    "use server";

    // 保存時も編集者チェック（安全のため）
    const userId = await requireNoticeEditorUserId();

    const eventId = String(formData.get("eventId") ?? "");
    const status = String(formData.get("status") ?? "");
    const message = String(formData.get("message") ?? "");

    if (!eventId) return;
    if (!STATUS_OPTIONS.includes(status as any)) return;

    const trimmedMessage = message.trim() ? message.trim() : null;
    const existing = await prisma.eventNotice.findUnique({ where: { eventId } });

    if (!existing) {
      await prisma.eventNotice.create({
        data: {
          eventId,
          status,
          message: trimmedMessage,
          draftStatus: status,
          draftMessage: trimmedMessage,
          updatedByUserId: userId,
          isPublished: false,
          publishedAt: null,
        },
      });
    } else if (existing.isPublished) {
      await prisma.eventNotice.update({
        where: { eventId },
        data: {
          draftStatus: status,
          draftMessage: trimmedMessage,
          updatedByUserId: userId,
        },
      });
    } else {
      await prisma.eventNotice.update({
        where: { eventId },
        data: {
          status,
          message: trimmedMessage,
          draftStatus: status,
          draftMessage: trimmedMessage,
          updatedByUserId: userId,
          isPublished: false,
          publishedAt: null,
        },
      });
    }

    redirect(`/admin/notice?eventId=${encodeURIComponent(eventId)}&confirm=1`);
  }

  // 送信ボタン：公開確定（isPublished=true）
  async function publishAction(formData: FormData) {
    "use server";

    const userId = await requireNoticeEditorUserId();
    const eventId = String(formData.get("eventId") ?? "");

    if (!eventId) return;

    const existing = await prisma.eventNotice.findUnique({ where: { eventId } });

    if (!existing) return;

    await prisma.eventNotice.update({
      where: { eventId },
      data: {
        status: existing.draftStatus ?? existing.status,
        message: existing.draftMessage ?? existing.message,
        draftStatus: null,
        draftMessage: null,
        isPublished: true,
        publishedAt: new Date(),
        updatedByUserId: userId,
      },
    });

    redirect(`/admin/notice?eventId=${encodeURIComponent(eventId)}&published=1`);
  }

  // 公開画面と同一HTMLをプレビューする
  const previewStatus = draftStatus;
  const previewHtml = renderEventNoticeHtml({
    status: previewStatus,
    eventTitle: current ? formatEventLabel(current.date, current.title) : "",
    message: draftMessage,
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">イベント開催情報</h1>
            <p className="text-sm text-gray-500 mt-1">
              編集者：{session?.user?.name ?? "（名前未取得）"}
            </p>
            {/*
            <div className="text-xs text-gray-500">
              埋め込みURL：<span className="font-mono">/api/public/event-notice</span>
            </div>
            */}
          </div>
          {/*
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
          */}
        </div>

        {sp.published === "1" && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm">
            公開しました（/api/public/event-notice に反映済み）
          </div>
        )}

        {!current ? (
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-700">イベントが未登録です。</p>
          </div>
        ) : (
          <>
            <form action={confirmAction} className="bg-white rounded-xl shadow p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">対象イベント</label>
                <select name="eventId" defaultValue={current.id} className="w-full border rounded px-3 py-2">
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
                      defaultChecked={draftStatus === s}
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
                  defaultValue={draftMessage}
                  rows={4}
                  className="w-full border rounded px-3 py-2 h-28"
                  placeholder="例：雨天のため中止です／現地の路面が滑りやすいのでご注意ください"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="text-sm bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                  確認
                </button>

                {sp.confirm === "1" && (
                  <span className="text-sm text-gray-600">下に確認表示が出ています</span>
                )}
              </div>
            </form>

            {sp.confirm === "1" && (
              <div className="mt-6 bg-white rounded-xl shadow p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800">確認（プレビュー）</h2>
                  <div className="flex justify-end">
                    <form action={publishAction}>
                      <input type="hidden" name="eventId" value={current.id} />
                      <button
                        type="submit"
                        className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        送信（公開）
                      </button>
                    </form>
                  </div>
                  {/*
                  <a
                    href={`/admin/notice?eventId=${encodeURIComponent(current.id)}`}
                    className="text-sm bg-gray-200 px-3 py-2 rounded hover:bg-gray-300"
                  >
                    編集に戻る
                  </a>
                  */}
                </div>

                <div className="border rounded overflow-hidden bg-white">
                  <iframe
                    title="公開プレビュー"
                    srcDoc={previewHtml}
                    className="w-full h-64"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  ※「確認」は下書き保存のみです。公開は「送信（公開）」で確定します。
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
