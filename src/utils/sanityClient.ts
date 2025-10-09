// src/utils/sanityClient.ts

import { createClient } from 'next-sanity';
import createImageUrlBuilder from '@sanity/image-url'; // 🛑 NEW IMPORT 🛑
import { SanityImageSource } from '@sanity/image-url/lib/types/types'; // Optional for better TypeScript

// 🛑 Replace these with your actual NEXT_PUBLIC environment variables 🛑
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION;

if (!projectId || !dataset || !apiVersion) {
  throw new Error(
    "Missing Sanity Environment Variables. Check .env.local and Vercel settings."
  );
}

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // `true` uses the cache/CDN for faster lookups
});

/**
 * Sanity Fetch Function
 */
export async function sanityFetch<T>({ query, params = {} }: { 
    query: string, 
    // 🛑 FIX: Apply the linter disable comment
    params?: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any 
}): Promise<T> {
    return client.fetch<T>(query, params);
}

// ---------------------------------------------------------------
// 🛑 IMAGE UTILITY FUNCTIONS 🛑
// ---------------------------------------------------------------

// Initialize the Image URL Builder once
const imageBuilder = createImageUrlBuilder({
    projectId: projectId as string,
    dataset: dataset as string,
});

/**
 * Generates a Next.js-compatible URL for a Sanity image source (mainImage or body image object).
 * * @param source The Sanity image object (e.g., post.mainImage or the image object from Portable Text).
 * @returns A Sanity URL builder object. Call .url() on this object to get the final string URL.
 */
export function urlForImage(source: SanityImageSource) {
    // You can chain methods like .width(800).url() on the returned object in your components
    return imageBuilder.image(source);
}