"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <div className="flex items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className={`bg-green-600 text-white font-bold px-5 py-2 rounded hover:bg-green-700 ${
          pending ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
        {pending ? "送信中…" : "送信"}
      </button>

      {pending && (
        <span className="text-sm text-gray-600">送信しています。しばらくお待ちください。</span>
      )}
    </div>
  );
}
