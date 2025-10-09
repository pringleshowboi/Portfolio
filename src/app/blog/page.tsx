// src/app/blog/page.tsx (Sanity Version)

import Link from 'next/link';
import { sanityFetch } from '@/utils/sanityClient';
import { groq } from 'next-sanity';

// Define the type for the metadata expected from Sanity
interface PostMetadata {
  title: string;
  slug: { current: string };
  publishedAt: string;
}

// Query to get all post titles and slugs, sorted by publish date
const metadataQuery = groq`
  *[_type == "post"] | order(publishedAt desc) {
    title,
    slug,
    publishedAt
  }
`;

export default async function BlogIndexPage() {
    // Fetch the list of posts from Sanity
    const posts = await sanityFetch<PostMetadata[]>({ query: metadataQuery }); 

    return (
        <div className="pt-4 pb-12">
            
            {/* ... (Header / Directory Path - unchanged) ... */}
            <p className="text-yellow-400 text-lg mb-4">
                Directory of C:\BLOG\DATASTREAM
            </p>

            {/* List Header - unchanged */}
            <div className="flex text-white font-bold border-b border-t border-green-400 py-1 mb-2 text-sm uppercase">
                <span className="w-1/12 text-center">Icon</span>
                <span className="w-6/12">File Name</span>
                <span className="w-2/12">Date Created</span>
                <span className="w-3/12">Status</span>
            </div>

            {/* Post List */}
            <div className="flex flex-col space-y-2">
                {posts.map((post) => (
                    <Link 
                        key={post.slug.current} 
                        href={`/blog/${post.slug.current}`}
                        // ... (styling classes - unchanged) ...
                        className="flex text-green-400 hover:bg-green-400 hover:text-black transition duration-150 ease-in-out cursor-pointer text-sm"
                    >
                        {/* 1. Icon */}
                        <span className="w-1/12 text-center text-yellow-400">📄</span>
                        
                        {/* 2. File Name (Link) */}
                        <span className="w-6/12 font-bold hover:underline">
                            {post.title}
                        </span>
                        
                        {/* 3. Date */}
                        <span className="w-2/12">
                            {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                        
                        {/* 4. Status */}
                        <span className="w-3/12 text-green-200">
                            OK
                        </span>
                    </Link>
                ))}
            </div>

            {/* ... (Footer Prompt - unchanged) ... */}
            <p className="mt-8 text-white font-bold">
                C:\BLOG\DATASTREAM$: <span className="animate-pulse">_</span>
            </p>
        </div>
    );
}