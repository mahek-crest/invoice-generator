import type { Metadata } from "next";
import { Geist, Newsreader } from "next/font/google";
import "./globals.css";
const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const serif = Newsreader({ variable: "--font-newsreader", subsets: ["latin"] });
export const metadata: Metadata = {
  title: "Studio Ledger — Quoin & Quill",
  description: "A considered invoice, for work made with care.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
