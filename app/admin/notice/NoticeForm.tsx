"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type EventOption = {
  id: string;
  label: string;
};

type Props = {
  eventOptions: EventOption[];
  currentId: string;
  statusOptions: readonly string[];
  currentStatus: string;
  currentMessage: string;
  showConfirmHint?: boolean;
};

export default function NoticeForm({
  eventOptions,
  currentId,
  statusOptions,
  currentStatus,
  currentMessage,
  showConfirmHint,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const eventId = String(formData.get("eventId") ?? "");

    startTransition(async () => {
      const res = await fetch("/api/admin/notice/confirm", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        setError("確認の保存に失敗しました");
        return;
      }

      router.replace(`/admin/notice?eventId=${encodeURIComponent(eventId)}&confirm=1`);
    });
  };

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-6 space-y-5">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">対象イベント</label>
        <select
          name="eventId"
          defaultValue={currentId}
          className="w-full border rounded px-3 py-2 text-gray-900"
        >
          {eventOptions.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700 mb-2">通知ステータス</label>
        {statusOptions.map((s) => (
          <label key={s} className="flex items-center space-x-2 text-gray-800">
            <input
              type="radio"
              name="status"
              value={s}
              defaultChecked={currentStatus === s}
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
          defaultValue={currentMessage}
          rows={4}
          className="w-full border rounded px-3 py-2 h-28 text-gray-900 placeholder:text-gray-400"
          placeholder="例：雨天のため中止です／現地の路面が滑りやすいのでご注意ください"
        />
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          className={`text-sm px-4 py-2 rounded ${
            pending ? "bg-gray-400" : "bg-gray-700 hover:bg-gray-800"
          } text-white`}
          disabled={pending}
        >
          {pending ? "保存中..." : "確認"}
        </button>
        {showConfirmHint && <span className="text-sm text-gray-600">下に確認表示が出ています</span>}
      </div>
    </form>
  );
}
