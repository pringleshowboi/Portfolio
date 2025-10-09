// src/utils/posts.ts

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Define the type for the data we want to display on the index page
export interface PostMetadata {
  title: string;
  date: string;
  slug: string;
  status: string; // The custom status field for your theme
}

// Set the directory where your Markdown files live (adjust if necessary)
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts'); // <-- ONLY ONE DECLARATION 👍

/**
 * Reads all Markdown files in the content/posts directory,
 * extracts the frontmatter metadata, and returns a sorted list.
 */
export function getPostMetadata(): PostMetadata[] {
  // 1. Get file names in the directory
  const fileNames = fs.readdirSync(POSTS_DIR);

  // 2. Map through each file, read content, and extract frontmatter
  const posts = fileNames
    .map((fileName) => {
      // Create the full path to the file
      const fullPath = path.join(POSTS_DIR, fileName);
      
      // Read the file content
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      
      // Use gray-matter to parse the metadata (frontmatter)
      const { data } = matter(fileContents);
      
      // Construct the final metadata object
      return {
        title: data.title as string,
        date: data.date as string,
        slug: data.slug as string,
        status: data.status as string,
      };
    })
    // 3. Optional: Sort posts by date (newest first)
    .sort((a, b) => (a.date < b.date ? 1 : -1)); 

  return posts;
}


/**
 * Reads the full content and metadata for a single blog post.
 */
export function getPostContent(slug: string) {
  const fullPath = path.join(POSTS_DIR, `${slug}.md`);

  // Check if the file exists (important for error handling)
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  // Read the file content
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  // Use gray-matter to parse the metadata and the markdown body
  const { data, content } = matter(fileContents);

  return {
    metadata: {
      title: data.title as string,
      date: data.date as string,
      slug: data.slug as string,
      status: data.status as string,
    } as PostMetadata,
    content, // The raw markdown text
  };
}


/**
 * REQUIRED for Next.js Dynamic Routes: Tells Next.js which paths exist.
 */
export function getAllPostSlugs() {
  const fileNames = fs.readdirSync(POSTS_DIR);
  return fileNames.map(fileName => fileName.replace(/\.md$/, ''));
}