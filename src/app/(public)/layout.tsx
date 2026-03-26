import Footer from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-layout">
      <main className="public-layout__content">
        {children}
      </main>
      <Footer />
    </div>
  );
}