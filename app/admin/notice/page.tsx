import { prisma } from "@/app/_lib/prisma";
import { requireNoticeEditorUserId } from "@/app/_lib/requireNoticeEditor";
import { renderEventNoticeHtml } from "@/app/_lib/eventNoticeRender";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import NoticeForm from "./NoticeForm";
import PublishButton from "./PublishButton";

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

  // 表示対象イベント（今日以降 5件）
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

  const eventOptions = events.map((e) => ({
    id: e.id,
    label: formatEventLabel(e.date, e.title),
  }));

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
            <NoticeForm
              eventOptions={eventOptions}
              currentId={current.id}
              statusOptions={STATUS_OPTIONS}
              currentStatus={draftStatus}
              currentMessage={draftMessage}
              showConfirmHint={sp.confirm === "1"}
            />

            {sp.confirm === "1" && (
              <div className="mt-6 bg-white rounded-xl shadow p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800">確認画面</h2>
                  <PublishButton eventId={current.id} />
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
