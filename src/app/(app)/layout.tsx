import AppSidebar from "@/components/layout/AppSidebar";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-layout">
      <AppSidebar />
      <main className="app-main">{children}</main>
    </div>
  );
}
