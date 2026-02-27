"use client";

import { useEffect, useState } from "react";

type Row = {
  eventId: string;
  title: string;
  date: string;
  place: string;
  fee: string;
  memo: string | null;
  status: string; // join / absent
  approvalStatus: string | null;
  checkedInAt: string | null;
  comment: string;
  updatedAt: string;
};

export default function HistoryPage() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    fetch("/api/me/history", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setRows(d.history ?? []));
  }, []);

  if (!rows) return <main className="p-4">読み込み中...</main>;

  return (
    <main className="p-4 space-y-3">
      <h1 className="text-xl font-bold">参加履歴</h1>

      {rows.length === 0 ? (
        <div className="rounded-lg border p-4">履歴はまだありません。</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const statusLabel = r.status === "join" ? "参加 🙆‍♂️" : "欠席 🙅‍♂️";
            const approvalLabel =
              r.status !== "join"
                ? "-"
                : r.approvalStatus === "approved"
                  ? "確認済み"
                  : r.approvalStatus === "rejected"
                    ? "却下"
                    : "確認待ち";
            const checkinLabel = r.checkedInAt ? "受付済み" : "未受付";
            return (
              <div key={r.eventId + r.updatedAt} className="rounded-lg border p-4 space-y-1">
                <div className="font-semibold">{r.title}</div>
                <div className="text-sm text-gray-600">日時：{r.date}</div>
                <div className="text-sm text-gray-600">場所：{r.place}</div>
                <div className="text-sm text-gray-600">参加費：{r.fee}</div>
                {r.memo && <div className="text-sm text-gray-600">メモ：{r.memo}</div>}

                <div className="pt-2 text-sm">
                  状態：<span className="font-semibold">{statusLabel}</span> ／
                  受付確認：{approvalLabel} ／ 受付：{checkinLabel}
                </div>

                {r.comment && <div className="text-sm text-gray-600">コメント：{r.comment}</div>}
              </div>
            );
          })}
        </div>
      )}

      <a className="underline" href="/line-app">戻る</a>
    </main>
  );
}
