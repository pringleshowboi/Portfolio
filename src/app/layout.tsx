import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientLayoutShell from "./ClientLayoutShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://m4n.co.za"),
  title: {
    default: "Secure Intelligent Systems | GRC Advisory, Data Engineering & Web Development",
    template: "%s | Secure Intelligent Systems"
  },
  description: "GRC & compliance advisory (POPIA readiness, policy development, risk registers, audit prep), data analysis & engineering, and full-stack web development for South African businesses.",
  keywords: ["GRC", "POPIA compliance", "Compliance advisory", "Risk assessment", "Policy development", "Audit readiness", "Data analysis", "Data engineering", "Dashboards", "Web development", "CRM development", "Next.js", "South Africa"],
  authors: [{ name: "Secure Intelligent Systems" }],
  creator: "Secure Intelligent Systems",
  icons: {
    icon: "/images/M4n.png",
  },
  verification: {
    google: "YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE", // TODO: Replace with your actual code
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://m4n.co.za",
    title: "Secure Intelligent Systems | GRC Advisory, Data Engineering & Web Development",
    description: "GRC & compliance advisory (POPIA), data analysis & engineering, and full-stack web development for South African businesses.",
    siteName: "Secure Intelligent Systems",
    images: [
      {
        url: "/images/lady-justice.png", // Using existing asset as fallback OG image
        width: 1200,
        height: 630,
        alt: "Guardian Protocol - Secure Digital Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Secure Intelligent Systems | GRC Advisory, Data Engineering & Web Development",
    description: "GRC & compliance advisory (POPIA), data analysis & engineering, and full-stack web development.",
    images: ["/images/lady-justice.png"],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ClientLayoutShell>{children}</ClientLayoutShell>
      </body>
    </html>
  );
}
