"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function PublishButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    setError(null);

    const formData = new FormData();
    formData.set("eventId", eventId);

    startTransition(async () => {
      const res = await fetch("/api/admin/notice/publish", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        setError("公開に失敗しました");
        return;
      }

      router.replace(`/admin/notice?eventId=${encodeURIComponent(eventId)}&published=1`);
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        className={`text-sm px-4 py-2 rounded ${
          pending ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
        } text-white`}
        onClick={onClick}
        disabled={pending}
      >
        {pending ? "公開中..." : "送信（公開）"}
      </button>
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}
