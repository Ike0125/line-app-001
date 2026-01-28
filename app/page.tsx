'use client'; // クライアントコンポーネントとして動作させる

import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  if (session) {
    return (
      <>
        <p>ようこそ、{session.user?.name} さん</p>
        <button onClick={() => signOut()}>ログアウト</button>
      </>
    );
  }
  return (
    <>
      <p>ログインしていません</p>
      <button onClick={() => signIn("line")}>LINEでログイン</button>
    </>
  );
}