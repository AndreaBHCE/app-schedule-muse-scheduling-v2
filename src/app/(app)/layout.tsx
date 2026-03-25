import AppSidebar from "@/components/layout/AppSidebar";
import { ToastProvider } from "@/components/ui/toast";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="app-layout">
        <AppSidebar />
        <main className="app-main">{children}</main>
      </div>
    </ToastProvider>
  );
}
