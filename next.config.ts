import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    
    // Add the 'images' configuration block here
    images: {
        remotePatterns: [
            {
                // Protocol must be secure
                protocol: 'https',
                // Hostname for all Sanity-hosted images
                hostname: 'cdn.sanity.io', 
                // The port is optional, but often useful to explicitly allow all ports
                port: '', 
                // Pathname is optional, but you can use it to restrict to your project ID
                // pathname: '/images/yzp4zaeb/**', 
            },
        ],
    },

    // Security Headers
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN' // Prevents clickjacking
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff' // Prevents MIME type sniffing
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' // Privacy-first
                    }
                ]
            }
        ];
    },
};

export default nextConfig;