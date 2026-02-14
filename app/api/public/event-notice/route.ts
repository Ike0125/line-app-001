import { prisma } from "@/app/_lib/prisma";
import { renderEventNoticeHtml } from "@/app/_lib/eventNoticeRender";

export const revalidate = 0;

export const dynamic = "force-dynamic"; // 常に最新を返す（キャッシュが邪魔しないように）

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

export async function GET() {
  // 公開済み情報だけを取得する
  const notice = await prisma.eventNotice.findFirst({
    where: { isPublished: true },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    include: { event: true },
  });


  // 通知が1件も無い場合はブランク
  if (!notice) {
    const html = renderEventNoticeHtml({ status: "非表示" });
    return new Response(html, { headers: commonHeaders() });
  }

  // 通知未登録は「初期設定」扱い（何も出さない/最小表示）
  const status = notice?.status ?? "初期設定";
  const message = notice?.message ?? "";

  const eventTitleLabel = formatEventLabel(
    notice.event?.date,
    notice.event?.title ?? ""
  );
  const html = renderEventNoticeHtml({
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
