import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreditSea | Loan Management System",
  description: "Digital, transparent loan applications and operations management.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
