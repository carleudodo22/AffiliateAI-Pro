import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AffiliateAI Pro",
  description: "AI-powered affiliate marketing SaaS platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          background: "#020403",
          color: "#ecffee",
        }}
      >
        {children}
      </body>
    </html>
  );
}