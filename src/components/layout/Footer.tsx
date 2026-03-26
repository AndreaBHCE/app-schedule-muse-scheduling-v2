import Link from "next/link";

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <nav className="app-footer__links" aria-label="Footer navigation">
          <Link href="/support" className="app-footer__link">Support</Link>
          <Link href="/docs" className="app-footer__link">Documentation</Link>
          <Link href="/privacy" className="app-footer__link">Privacy Policy</Link>
          <Link href="/terms-of-use" className="app-footer__link">Terms of Service</Link>
        </nav>
        <p className="app-footer__copyright">
          © 2026 Live Laugh Sail Media Production LLC. for ScheduleMuse AI
        </p>
      </div>
    </footer>
  );
}
