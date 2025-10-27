import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Board - Modern Job Matching Platform",
  description: "Fast, transparent, and affordable job board platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
