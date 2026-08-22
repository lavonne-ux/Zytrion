import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Zytrion | Governance Readiness Platform",
  description:
    "Zytrion measures governance readiness across five pillars and gives founders a documented path to build a business that survives scrutiny from lenders, investors, and partners.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
