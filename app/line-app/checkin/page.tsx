"use client";

import { useEffect, useState } from "react";

function formatJst(iso: string | null | undefined) {
  if (!iso) return "";
  const dt = new Date(iso);
  return dt.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CheckinPage() {
  const [data, setData] = useState<any>(null);
  const [msg, setMsg] = useState<string>("");
  const [openDetail, setOpenDetail] = useState(false);

  async function reload() {
    const refreshed = await fetch("/api/me/reservations/current", { cache: "no-store" }).then((r) => r.json());
    setData(refreshed);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return <main className="p-4">読み込み中...</main>;

  const { event, rsvp } = data;
  if (!event) return <main className="p-4">現在受付中のイベントはありません。</main>;

  const canCheckin = rsvp && rsvp.status === "join" && rsvp.approvalStatus === "approved";
  const already = !!rsvp?.checkedInAt;

  async function checkin() {
    setMsg("");
    const res = await fetch("/api/me/checkin", { method: "POST" });
    const d = await res.json();

    if (d.error) {
      setMsg(`受付できません: ${d.error}`);
      return;
    }

    if (d.message === "already_checked_in") {
      setMsg("すでに受付済みです");
    } else {
      setMsg("受付しました");
    }

    await reload();
  }

  const startText = formatJst(event.date);
  const endText = formatJst(event.endAt);

  return (
    <main className="p-4 space-y-3">
      <h1 className="text-xl font-bold">当日受付</h1>

      <div className="rounded-lg border p-4 space-y-2">
        {/* タイトル行：詳細ボタンを近くに */}
        <div className="flex items-start justify-between gap-3">
          <div className="font-semibold break-words">{event.title}</div>
          <button
            className="shrink-0 border rounded px-3 py-1 text-sm"
            onClick={() => setOpenDetail((v) => !v)}
          >
            {openDetail ? "閉じる" : "詳細"}
          </button>
        </div>

        <div className="text-sm text-gray-600">
          日時：{startText}
          {endText ? ` ～ ${endText}` : ""}
        </div>

        <div className="text-sm text-gray-600">場所：{event.place ?? "未設定"}</div>

        {/* 詳細展開 */}
        {openDetail && (
          <div className="rounded border bg-gray-50 p-3 text-sm space-y-2">
            <div>
              <span className="font-semibold">参加費：</span>
              {event.fee ?? "未設定"}
            </div>

            {event.memo ? (
              <div className="whitespace-pre-wrap break-words">
                <div className="font-semibold mb-1">内容</div>
                {event.memo}
              </div>
            ) : (
              <div className="text-gray-500">内容：なし</div>
            )}

            {/* 受付の参考情報（任意） */}
            {event.gcalEventId ? (
              <div className="text-gray-500 break-all">gcalEventId: {event.gcalEventId}</div>
            ) : null}
          </div>
        )}
      </div>

      {!canCheckin ? (
        <div className="rounded-lg border p-4">
          参加申請が管理者に承認されるまで受付できません。
        </div>
      ) : (
        <div className="rounded-lg border p-4 space-y-2">
          <div>状態：{already ? "受付済み" : "未受付"}</div>
          <button className="border rounded px-3 py-2" onClick={checkin}>
            受付する
          </button>
        </div>
      )}

      {msg && <div className="text-sm">{msg}</div>}

      <a className="underline" href="/line-app">
        戻る
      </a>
    </main>
  );
}
