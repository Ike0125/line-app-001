"use client";

import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={`font-bold px-5 py-2 rounded ${
        pending ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
      } text-white`}
      disabled={pending}
    >
      {pending ? "保存中..." : "保存"}
    </button>
  );
}

export default function NoticeForm({
  action,
  events,
  currentId,
  currentStatus,
  currentMessage,
  formatEventLabel,
}: any) {
  return (
    <form action={action} className="bg-white rounded-xl shadow p-6 space-y-5">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">対象イベント</label>
        <select name="eventId" defaultValue={currentId} className="w-full border rounded px-3 py-2">
          {events.map((e: any) => (
            <option key={e.id} value={e.id}>
              {formatEventLabel(e.date, e.title)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">開催情報</label>
        <select name="status" defaultValue={currentStatus} className="w-full border rounded px-3 py-2">
          {["初期設定", "開催", "中止", "その他", "メッセージのみ", "非表示"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">メッセージ（任意）</label>
        <textarea
          name="message"
          defaultValue={currentMessage}
          rows={4}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div className="flex items-center justify-between">
        <SubmitButton />
        <div className="text-xs text-gray-500">保存中はボタンが無効になります</div>
      </div>
    </form>
  );
}
