import Sidebar from "@/app/components/admin/Sidebar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <main className="min-h-screen bg-gray-100 p-3 sm:p-6 md:ml-64">
        {children}
      </main>
    </div>
  );
}
