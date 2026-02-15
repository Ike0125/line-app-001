import Sidebar from "@/app/components/admin/Sidebar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 md:pl-64">
      <Sidebar />
      <main className="min-h-screen pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
