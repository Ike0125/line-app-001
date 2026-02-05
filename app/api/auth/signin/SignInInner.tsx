"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SignInInner() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">ログイン</h1>

        <button
          onClick={() => signIn("line", { callbackUrl })}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors mb-4"
        >
          LINEでログイン
        </button>

        <p className="text-center text-gray-600 text-sm mt-4">
          LINEアカウントでログインしてください
        </p>
      </div>
    </div>
  );
}
