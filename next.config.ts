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
};

export default nextConfig;