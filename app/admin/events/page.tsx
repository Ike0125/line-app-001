"use client";

import { useEffect, useMemo, useState } from "react";

type EventRow = {
  id: string;
  title: string;
  memo: string | null;
  date: string; // JSONではstringで来る
  endAt: string | null;
  place: string | null;
  fee: string | null;
  isActive: boolean;
  gcalEventId: string | null;
};

function ymd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function formatJst(iso: string | null) {
  if (!iso) return "";
  const dt = new Date(iso);
  // ブラウザ側のロケール(JST環境ならJST表示)
  return dt.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminEventsPage() {
  const today = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState(ymd(startOfMonth(today)));
  const [endDate, setEndDate] = useState(ymd(endOfMonth(today)));

  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);

  async function loadEvents() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const url = `/api/events?startDate=${encodeURIComponent(
        startDate
      )}&endDate=${encodeURIComponent(endDate)}`;

      const res = await fetch(url, { method: "GET" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message ?? `Failed to load events (${res.status})`);
      }
      setEvents(Array.isArray(data?.events) ? data.events : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  async function runSync() {
    setSyncing(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/gcal/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message ?? `Sync failed (${res.status})`);
      }

      setMessage(`同期OK：fetched=${data?.fetched ?? "?"} / upserted=${data?.upserted ?? "?"}`);
      await loadEvents();
    } catch (e: any) {
      setError(e?.message ?? "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

    async function activateEvent(eventId: string) {
    try {
        const res = await fetch("/api/admin/events/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message ?? "activate failed");

        // 表示更新
        await loadEvents();
    } catch (e: any) {
        alert(e?.message ?? "activate failed");
    }
    }


  useEffect(() => {
    // 初回表示で読み込み
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">イベント管理（同期・一覧）</h1>

      {/* 期間＋操作 */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">開始日</label>
            <input
              type="date"
              className="border rounded px-2 py-1"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">終了日</label>
            <input
              type="date"
              className="border rounded px-2 py-1"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button
            onClick={loadEvents}
            disabled={loading || syncing}
            className="border rounded px-3 py-2"
          >
            {loading ? "読み込み中…" : "一覧更新"}
          </button>

          <button
            onClick={runSync}
            disabled={loading || syncing}
            className="rounded px-3 py-2 bg-black text-white disabled:opacity-50"
          >
            {syncing ? "同期中…" : "Googleカレンダー取り込み"}
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600">
            エラー：{error}
          </div>
        )}
        {message && (
          <div className="text-sm text-green-700">
            {message}
          </div>
        )}
      </div>

      {/* 一覧 */}
      <div className="rounded-lg border">
        <div className="px-4 py-2 border-b text-sm text-gray-600">
          件数：{events.length}
        </div>

        {events.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">
            イベントがありません（期間を変えてください）
          </div>
        ) : (
          <ul className="divide-y">
            {events.map((ev) => {
              const opened = openId === ev.id;
              return (
                <li key={ev.id} className="p-4 space-y-2">
                  <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="font-semibold break-words">{ev.title}</div>
                      <div className="text-sm text-gray-600">
                        開始：{formatJst(ev.date)}
                        {ev.endAt ? ` / 終了：${formatJst(ev.endAt)}` : ""}
                      </div>
                      {ev.place ? (
                        <div className="text-sm text-gray-600 break-words">
                          場所：{ev.place}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end md:items-center">
                      <button
                        className="text-sm text-blue-700 underline underline-offset-2"
                        onClick={() => setOpenId(opened ? null : ev.id)}
                      >
                        {opened ? "閉じる" : "詳細"}
                      </button>
                      <button
                        className={`rounded px-3 py-1 text-sm ${
                          ev.isActive ? "bg-green-600 text-white" : "border"
                        }`}
                        onClick={() => activateEvent(ev.id)}
                      >
                        {ev.isActive ? "現在" : "現在にする"}
                      </button>
                    </div>
                  </div>

                  {opened && (
                    <div className="rounded bg-gray-50 border p-3 text-sm space-y-2">
                      {ev.memo ? (
                        <div className="whitespace-pre-wrap break-words">
                          <div className="font-semibold mb-1">内容</div>
                          {ev.memo}
                        </div>
                      ) : (
                        <div className="text-gray-500">内容：なし</div>
                      )}

                      <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <div>
                          <span className="font-semibold">参加費：</span>
                          {ev.fee ?? "未設定"}
                        </div>
                        <div>
                          <span className="font-semibold">isActive：</span>
                          {String(ev.isActive)}
                        </div>
                        <div>
                          <span className="font-semibold">gcalEventId：</span>
                          {ev.gcalEventId ?? "なし"}
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
