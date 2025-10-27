import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Job Board - Modern Job Matching Platform",
    template: "%s | Job Board",
  },
  description: "Fast, transparent, and affordable job board platform. Find your dream job or post opportunities to connect with top talent.",
  keywords: ["jobs", "careers", "employment", "job board", "hiring", "recruitment", "job search"],
  authors: [{ name: "Job Board Team" }],
  creator: "Job Board",
  publisher: "Job Board",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "Job Board - Modern Job Matching Platform",
    description: "Fast, transparent, and affordable job board platform. Find your dream job or post opportunities to connect with top talent.",
    type: "website",
    locale: "en_US",
    siteName: "Job Board",
  },
  twitter: {
    card: "summary_large_image",
    title: "Job Board - Modern Job Matching Platform",
    description: "Fast, transparent, and affordable job board platform",
    creator: "@jobboard",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification tokens here when available
    // google: 'your-google-verification-token',
    // yandex: 'your-yandex-verification-token',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
