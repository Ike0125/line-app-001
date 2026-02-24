export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-40 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="h-16 animate-pulse rounded bg-gray-100" />
            <div className="h-16 animate-pulse rounded bg-gray-100" />
            <div className="h-16 animate-pulse rounded bg-gray-100" />
            <div className="h-16 animate-pulse rounded bg-gray-100" />
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
          <div className="mt-4 space-y-3">
            <div className="h-10 animate-pulse rounded bg-gray-100" />
            <div className="h-10 animate-pulse rounded bg-gray-100" />
            <div className="h-10 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
