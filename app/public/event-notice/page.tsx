export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function PublicEventNoticePage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-3xl mx-auto space-y-3">
        <h1 className="text-lg font-bold text-gray-800">イベント開催情報</h1>
        <div className="border rounded bg-white overflow-hidden">
          <iframe
            title="イベント開催情報"
            src="/api/public/event-notice"
            className="w-full h-64"
          />
        </div>
        <p className="text-xs text-gray-500">
          ホーム画面に追加する場合はこのページを利用してください。
        </p>
      </div>
    </div>
  );
}
