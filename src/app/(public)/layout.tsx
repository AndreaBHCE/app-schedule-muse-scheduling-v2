import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}

      <footer className="public-footer">
        <div className="public-footer__inner">
          <div className="public-footer__links">
            <Link href="/support" className="public-footer__link">Support</Link>
            <Link href="/docs" className="public-footer__link">Documentation</Link>
            <Link href="/privacy" className="public-footer__link">Privacy Policy</Link>
            <Link href="/terms-of-use" className="public-footer__link">Terms of Service</Link>
          </div>
          <p className="public-footer__copyright">
            © 2026 Live Laugh Sail Media Production LLC. for ScheduleMuse AI
          </p>
        </div>
      </footer>
    </>
  );
}