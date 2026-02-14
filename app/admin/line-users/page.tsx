import { prisma } from "@/app/_lib/prisma";
import { formatJstDateTime } from "@/app/_lib/formatDate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLineUsersPage() {
  const users = await prisma.lineLoginUser.findMany({
    orderBy: { lastLoginAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">LINEログインユーザー</h1>
            <p className="text-sm text-gray-500 mt-1">ログインしたユーザーの一覧</p>
          </div>
          <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded shadow-sm">
            件数: <span className="font-semibold">{users.length}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left text-sm text-gray-600 min-w-[720px]">
              <thead className="bg-gray-50 text-gray-700 uppercase font-bold text-xs">
                <tr>
                  <th className="px-6 py-3">ユーザー</th>
                  <th className="px-6 py-3">LINE User ID</th>
                  <th className="px-6 py-3">最終ログイン</th>
                  <th className="px-6 py-3">初回登録</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                      まだログインユーザーがいません
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {u.pictureUrl ? (
                            <img
                              src={u.pictureUrl}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gray-200" />
                          )}
                          <div className="font-medium text-gray-900">
                            {u.displayName ?? "（名前未取得）"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-800">
                        {u.lineUserId}
                      </td>
                      <td className="px-6 py-4">{formatJstDateTime(u.lastLoginAt)}</td>
                      <td className="px-6 py-4">{formatJstDateTime(u.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden">
            {users.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-400">
                まだログインユーザーがいません
              </div>
            ) : (
              <div className="divide-y">
                {users.map((u) => (
                  <div key={u.id} className="p-4">
                    <div className="flex items-center gap-3">
                      {u.pictureUrl ? (
                        <img
                          src={u.pictureUrl}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200" />
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">
                          {u.displayName ?? "（名前未取得）"}
                        </div>
                        <div className="text-xs text-gray-500">LINE User ID</div>
                        <div className="text-xs font-mono text-gray-800 break-all">
                          {u.lineUserId}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-600">
                      <div>
                        <div className="text-gray-500">最終ログイン</div>
                        <div>{formatJstDateTime(u.lastLoginAt)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">初回登録</div>
                        <div>{formatJstDateTime(u.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
