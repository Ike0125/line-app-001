"use client";

import { useEffect, useState } from "react";

export default function CheckinPage() {
  const [data, setData] = useState<any>(null);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    fetch("/api/me/reservations/current", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <main className="p-4">読み込み中...</main>;

  const { event, rsvp } = data;
  if (!event) return <main className="p-4">現在受付中のイベントはありません。</main>;

  const canCheckin = rsvp && rsvp.status === "join";
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

    // 状態更新のため再取得
    const refreshed = await fetch("/api/me/reservations/current", { cache: "no-store" }).then((r) => r.json());
    setData(refreshed);
  }

  return (
    <main className="p-4 space-y-3">
      <h1 className="text-xl font-bold">当日受付</h1>

      <div className="rounded-lg border p-4">
        <div className="font-semibold">{event.title}</div>
        <div className="text-sm text-gray-600">場所：{event.place}</div>
        <div className="text-sm text-gray-600">日時：{event.date}</div>
      </div>

      {!canCheckin ? (
        <div className="rounded-lg border p-4">
          参加（join）の登録がないため受付できません。
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

      <a className="underline" href="/line-app">戻る</a>
    </main>
  );
}
