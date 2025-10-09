// src/app/blog/[slug]/page.tsx
import { PortableText } from '@portabletext/react'; 
// The import below might be causing an issue if the package isn't installed.
// We will replace 'PortableTextContent' with 'any' + a linter disable comment for now.
// import type { PortableTextContent } from '@portabletext/types'; 
import { sanityFetch, client, urlForImage } from '../../../utils/sanityClient'; 
import Image from 'next/image'; 
import { groq } from 'next-sanity'; 
import components from '../../components/BlogPortableText/PortableTextComponents'; 

// --- Configuration & Types ---

const postQuery = groq`
    *[_type == "post" && slug.current == $slug][0] {
        title,
        slug,
        publishedAt,
        body,
        mainImage {
            asset->{_ref}, 
            alt
        }
    }
`;

// Define the type for the data structure you expect from Sanity
interface Post {
    title: string;
    slug: { current: string };
    publishedAt: string;
    // 🛑 THE FIX: Use 'any' but disable the linter rule for this line.
    body: any; // eslint-disable-line @typescript-eslint/no-explicit-any 
    mainImage?: {
        asset: {
            _ref: string;
        };
        alt?: string;
    };
}

// 2. Define static paths for Next.js build
// ... (generateStaticParams remains unchanged)
export async function generateStaticParams() {
    const slugs: string[] = await client.fetch(
        groq`*[_type == "post" && defined(slug.current)][].slug.current`
    );
    return slugs.map((slug) => ({ slug }));
}


export default async function BlogPostPage({ params }: { params: { slug: string } }) {
    // 3. Fetch the post data
    const post = await sanityFetch<Post>({
        query: postQuery,
        params: { slug: params.slug },
    });

    // ROBUST ERROR CHECK: Prevents ReferenceError if no post is found
    if (!post) {
        return <p className="text-red-500 p-8">ERROR 404: POST NOT FOUND IN DATASTREAM</p>;
    }

    const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        // SCROLL FIX: Explicitly set height to viewport height minus the 64px (py-8) padding.
        <div 
            className="py-8 px-10 w-full overflow-y-auto"
            style={{ height: 'calc(100vh - 64px)' }} 
        > 
            
            {/* 🛑 CRITICAL GUARD CLAUSE FIX: Only render if asset reference exists 🛑 */}
            {post.mainImage && post.mainImage.asset && post.mainImage.asset._ref && (
                <div className="mb-8 border-b-2 border-green-400 pb-4">
                    <Image
                        className="w-full h-auto object-cover border-2 border-green-400 p-1"
                        // This is now safe because we checked for the '_ref'
                        src={urlForImage(post.mainImage).width(1200).url()} 
                        alt={post.mainImage.alt || post.title}
                        width={1200}
                        height={600}
                        priority
                    />
                </div>
            )}
            
            {/* Post Title */}
            <h2 className="text-4xl text-yellow-400 mb-2 font-bold">{post.title}</h2>
            <p className="text-xs mb-8 border-b border-green-400 pb-2">
                LOGGED: {formattedDate} | STATUS: OK 
            </p>

            {/* Render Sanity's block content with custom components for images/links/styles */}
            <div className="prose prose-terminal">
                <PortableText 
                    value={post.body} 
                    components={components} 
                />
            </div>
            
            {/* Command Line Footer */}
            <p className="mt-8 text-white font-bold">
                C:\BLOG\READ_COMPLETE$: <span className="animate-pulse">_</span>
            </p>
        </div>
    );
}