import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-zy-navy">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zy-chrome/70">
        <span>© {new Date().getFullYear()} Zytrion Infrastructure Group, Inc. All rights reserved.</span>
        <nav className="flex items-center gap-5">
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms of Use
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <a href="mailto:info@getzytrion.com" className="hover:text-white transition-colors">
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
