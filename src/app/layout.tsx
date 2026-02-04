import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://guardian-protocol.com"),
  title: {
    default: "Guardian Protocol | Secure-First Digital Solutions",
    template: "%s | Guardian Protocol"
  },
  description: "Enterprise-grade security, high-performance web development, and data-driven insights. The Force Multiplier for modern businesses.",
  keywords: ["Cybersecurity", "Next.js Development", "IT Consultation", "Secure Web Design", "Automation Ops", "Guardian Protocol"],
  authors: [{ name: "Guardian Protocol Team" }],
  creator: "Guardian Protocol",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://guardian-protocol.com",
    title: "Guardian Protocol | Secure-First Digital Solutions",
    description: "We build secure, high-performance digital infrastructure for businesses that value data integrity.",
    siteName: "Guardian Protocol",
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
    title: "Guardian Protocol | Secure-First Digital Solutions",
    description: "Enterprise-grade security & development. The Force Multiplier for your business.",
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
        {children}
      </body>
    </html>
  );
}
