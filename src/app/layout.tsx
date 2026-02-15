import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google';
import Script from 'next/script';
import { PostHogProvider } from './providers';
import PostHogPageView from './PostHogPageView';
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
  icons: {
    icon: "/images/M4n.png",
  },
  verification: {
    google: "YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE", // TODO: Replace with your actual code
  },
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Guardian Protocol",
  "image": "https://guardian-protocol.com/images/M4n.png",
  "description": "Enterprise-grade security, high-performance web development, and data-driven insights.",
  "url": "https://guardian-protocol.com",
  "telephone": "+27-000-000-0000",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Your Business Address",
    "addressLocality": "Johannesburg",
    "addressRegion": "Gauteng",
    "postalCode": "2000",
    "addressCountry": "ZA"
  },
  "priceRange": "$$$",
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday"
    ],
    "opens": "09:00",
    "closes": "17:00"
  }
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
        <div className="scanlines" />
        <div className="vignette" />
        <PostHogProvider>
          <PostHogPageView />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          {children}
        </PostHogProvider>
        
        {/* Google Analytics - TODO: Replace GA_MEASUREMENT_ID with your actual ID */}
        <GoogleAnalytics gaId="G-XXXXXXXXXX" />
        
        {/* Microsoft Clarity Heatmap - TODO: Replace YOUR_CLARITY_ID with actual ID */}
        <Script id="clarity-script" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "YOUR_CLARITY_ID");
          `}
        </Script>
      </body>
    </html>
  );
}
