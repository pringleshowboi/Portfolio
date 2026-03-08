'use client'

import { usePathname } from 'next/navigation'
import { GoogleAnalytics } from '@next/third-parties/google'
import Script from 'next/script'
import { PostHogProvider } from './providers'
import PostHogPageView from './PostHogPageView'
import React from 'react'

export default function ClientLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isStudio = pathname?.startsWith('/studio')

  if (isStudio) {
    return <>{children}</>
  }

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
  }

  return (
    <>
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
      <GoogleAnalytics gaId="G-XXXXXXXXXX" />
      <Script id="clarity-script" strategy="afterInteractive">
        {`
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "YOUR_CLARITY_ID");
        `}
      </Script>
    </>
  )
}
