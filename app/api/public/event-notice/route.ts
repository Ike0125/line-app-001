import { prisma } from "@/app/_lib/prisma";
import { renderEventNoticeHtml } from "@/app/_lib/eventNoticeRender";

export const revalidate = 0;

export const dynamic = "force-dynamic"; // 常に最新を返す（キャッシュが邪魔しないように）

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function statusStyle(status: string) {
  // 現GASの「開催情報設定」相当をコード化（必要なら後でDB化可）
  // ここは見た目だけの設定なので最小で。
  switch (status) {
    case "開催":
      return { bg: "#e6f4ea", fg: "#1e4620", border: "#34a853", label: "【本日のイベントは開催します】" };
    case "中止":
      return { bg: "#fce8e6", fg: "#a50e0e", border: "#ea4335", label: "【本日のイベントは中止です】" };
    case "その他":
      return { bg: "#e8f0fe", fg: "#174ea6", border: "#4285f4", label: "【その他】" };
    case "初期設定":
      return { bg: "#f3f4f6", fg: "#111827", border: "#9ca3af", label: "【開催情報】" };
    case "メッセージのみ":
      return { bg: "#fff7ed", fg: "#7c2d12", border: "#fb923c", label: "【お知らせ】" };
    case "非表示":
      return { bg: "#ffffff", fg: "#111827", border: "#ffffff", label: "" };
    default:
      return { bg: "#f3f4f6", fg: "#111827", border: "#9ca3af", label: escapeHtml(status) };
  }
}

function normalizeEventTitle(title: string) {
  // 既存GASの「(Wed)」「10:00」等を消す動きに寄せる
  // 必要に応じて調整
  return title
    .replace(/\([^)]*\)/g, "")           // (Wed) など
    .replace(/\b\d{1,2}:\d{2}\b/g, "")   // 10:00
    .replace(/\s{2,}/g, " ")
    .trim();
}

const TZ = "Asia/Tokyo";

function formatEventLabel(date: Date | string | null | undefined, title: string) {
  if (!date) return title;

  const d = typeof date === "string" ? new Date(date) : date;

  const md = new Intl.DateTimeFormat("ja-JP", {
    timeZone: TZ,
    month: "2-digit",
    day: "2-digit",
  }).format(d);

  const wd = new Intl.DateTimeFormat("ja-JP", {
    timeZone: TZ,
    weekday: "short",
  }).format(d);

  return `${md}(${wd}) ${title}`;
}

const DEFAULT_FIXED_MESSAGE = "中止の場合は、当日の朝８時までに掲示します";

function renderHtml(params: {
  status: string;
  eventTitle?: string | null;
  message?: string | null;
}) {
  const { status, eventTitle, message } = params;

  if (status === "非表示") {
    return `<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>`;
  }

  const st = statusStyle(status);

  // 表示ルール（現GAS互換）
  const showEvent = status !== "初期設定" && status !== "メッセージのみ";
  const showMessage = status !== "メッセージのみ"; // 初期設定でもメッセージ枠を出す

  // 初期設定のときは固定メッセージを必ず表示（既存メッセージがあれば後ろに追記）
  const mergedMessage =
    status === "初期設定"
      ? (message?.trim()
          ? `${DEFAULT_FIXED_MESSAGE}\n${message}`
          : DEFAULT_FIXED_MESSAGE)
      : (message ?? "");


  const safeEvent = eventTitle ? escapeHtml(eventTitle) : "";
  const safeMsg = mergedMessage ? escapeHtml(mergedMessage).replaceAll("\n", "<br>") : "";

return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SWF 開催通知</title>
  <style>
    body { margin:0; padding:0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans JP", sans-serif; }
    .wrap { padding: 10px; }
    .box {
      border-left: 6px solid ${st.border};
      background: ${st.bg};
      color: ${st.fg};
      padding: 10px 12px;
      border-radius: 8px;
      line-height: 1.4;
    }
    .status { font-weight: 800; font-size: 18px; margin-bottom: 6px; }
    .event  { font-weight: 700; font-size: 16px; margin-bottom: 6px; }
    .msg    { font-size: 16px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="box">
      <div class="status">${escapeHtml(st.label)}</div>
      ${showEvent && safeEvent ? `<div class="event">${safeEvent}</div>` : ``}
      ${showMessage && safeMsg ? `<div class="msg">${safeMsg}</div>` : ``}
    </div>
  </div>
</body>
</html>`;
}

export async function GET() {
  // 公開済み情報だけを取得する
  const notice = await prisma.eventNotice.findFirst({
    where: { isPublished: true },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    include: { event: true },
  });


  // 通知が1件も無い場合はブランク
  if (!notice) {
    const html = renderHtml({ status: "非表示" });
    return new Response(html, { headers: commonHeaders() });
  }

  // 通知未登録は「初期設定」扱い（何も出さない/最小表示）
  const status = notice?.status ?? "初期設定";
  const message = notice?.message ?? "";

  const eventTitleLabel = formatEventLabel(
    notice.event?.date,
    notice.event?.title ?? ""
  );
  const html = renderHtml({
    status,
    eventTitle: eventTitleLabel,
    message,
  });

  return new Response(html, { headers: commonHeaders() });
}

function commonHeaders() {
  return new Headers({
    "Content-Type": "text/html; charset=utf-8",

    // キャッシュ無効化（強め）
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",

    // iframe 表示許可（必要に応じて Jimdo に絞る）
    "Content-Security-Policy": "frame-ancestors *;",
  });
}
