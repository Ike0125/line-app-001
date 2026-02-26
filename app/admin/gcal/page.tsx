import { prisma } from "@/app/_lib/prisma";
import { formatJstDateTime } from "@/app/_lib/formatDate";

type AdminGcalPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function AdminGcalPage({ searchParams }: AdminGcalPageProps) {
  const params = await searchParams;
  const expectedEmail = (process.env.GCAL_SYNC_EMAIL ?? "").trim().toLowerCase();

  const [targetAuth, authRows, syncedEventCount, latestEvent] = await Promise.all([
    expectedEmail
      ? prisma.googleAuth.findUnique({
          where: { email: expectedEmail },
          select: { email: true, updatedAt: true, createdAt: true },
        })
      : Promise.resolve(null),
    prisma.googleAuth.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { email: true, updatedAt: true },
    }),
    prisma.event.count({
      where: { gcalEventId: { not: null } },
    }),
    prisma.event.findFirst({
      where: {
        gcalEventId: { not: null },
        gcalUpdatedAt: { not: null },
      },
      orderBy: { gcalUpdatedAt: "desc" },
      select: {
        title: true,
        date: true,
        gcalUpdatedAt: true,
      },
    }),
  ]);

  const statusLabel = !expectedEmail
    ? "設定不足"
    : targetAuth
      ? "認証済み"
      : "未認証";
  const statusClass = !expectedEmail
    ? "text-yellow-700 bg-yellow-50 border-yellow-200"
    : targetAuth
      ? "text-green-700 bg-green-50 border-green-200"
      : "text-red-700 bg-red-50 border-red-200";

  const success = params?.success;
  const error = params?.error;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Googleカレンダー連携状態</h1>
          <p className="text-sm text-gray-600 mt-1">
            同期対象: {expectedEmail || "GCAL_SYNC_EMAIL が未設定です"}
          </p>
        </div>
        <a href="/admin/events" className="border rounded px-3 py-2 text-sm">
          同期画面へ
        </a>
      </div>

      {success ? (
        <div className="rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">
          OAuth認証が完了しました。
        </div>
      ) : null}
      {error ? (
        <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          エラー: {error}
        </div>
      ) : null}

      <div className={`rounded border px-4 py-3 ${statusClass}`}>
        <div className="text-sm">認証状態: <span className="font-semibold">{statusLabel}</span></div>
      </div>

      <section className="rounded border bg-white p-4 space-y-2">
        <h2 className="font-semibold">対象アカウントの連携情報</h2>
        <div className="text-sm text-gray-700">
          メール: {targetAuth?.email ?? "-"}
        </div>
        <div className="text-sm text-gray-700">
          初回連携: {targetAuth ? formatJstDateTime(targetAuth.createdAt) : "-"}
        </div>
        <div className="text-sm text-gray-700">
          最終更新: {targetAuth ? formatJstDateTime(targetAuth.updatedAt) : "-"}
        </div>
        <div className="pt-2 flex flex-wrap gap-2">
          <a
            href="/api/google/oauth/start"
            className="rounded px-3 py-2 bg-black text-white text-sm"
          >
            Google再認証を実行
          </a>
          <a href="/admin/gcal" className="rounded px-3 py-2 border text-sm">
            再読込
          </a>
        </div>
      </section>

      <section className="rounded border bg-white p-4 space-y-2">
        <h2 className="font-semibold">同期データ状態</h2>
        <div className="text-sm text-gray-700">
          Google由来イベント件数: {syncedEventCount} 件
        </div>
        <div className="text-sm text-gray-700">
          最終同期（gcalUpdatedAt最大）:{" "}
          {latestEvent?.gcalUpdatedAt ? formatJstDateTime(latestEvent.gcalUpdatedAt) : "-"}
        </div>
        <div className="text-sm text-gray-700">
          直近イベント: {latestEvent?.title ?? "-"}{" "}
          {latestEvent?.date ? `(${formatJstDateTime(latestEvent.date)})` : ""}
        </div>
      </section>

      <section className="rounded border bg-white p-4 space-y-2">
        <h2 className="font-semibold">最近のGoogleAuth更新（最大5件）</h2>
        {authRows.length === 0 ? (
          <div className="text-sm text-gray-600">レコードがありません。</div>
        ) : (
          <ul className="divide-y">
            {authRows.map((row) => (
              <li key={row.email} className="py-2 text-sm flex flex-wrap justify-between gap-2">
                <span className="font-mono">{row.email}</span>
                <span className="text-gray-600">{formatJstDateTime(row.updatedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
