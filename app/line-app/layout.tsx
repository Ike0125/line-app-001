import Sidebar from "@/app/components/line-app/Sidebar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LineAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-100 p-3 sm:p-6">
        {children}
      </main>
    </div>
  );
}
