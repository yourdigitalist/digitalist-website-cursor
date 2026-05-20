import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digitalist",
  description: "Web design, branding & marketing strategy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
