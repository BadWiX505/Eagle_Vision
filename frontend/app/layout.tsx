import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eagle Vision — Surveillance Dashboard",
  description: "AI-powered stadium surveillance control system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-[#050c14] text-[#b8cde0] overflow-hidden">
        {children}
      </body>
    </html>
  );
}
