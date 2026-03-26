import AppSidebar from "@/components/layout/AppSidebar";
import Footer from "@/components/layout/Footer";
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
        <main className="app-main">
          {children}
        </main>
        <Footer />
      </div>
    </ToastProvider>
  );
}
