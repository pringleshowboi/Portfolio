// components/BlogPortableText/PortableTextComponents.tsx

import type { PortableTextComponents } from '@portabletext/react'
import Image from 'next/image' 
import { urlForImage } from '../../../utils/sanityClient' // Adjust path if necessary

const components: PortableTextComponents = {
  // Renders custom types defined in blockContent.ts
  types: {
    // Component to render inline images
    image: ({ value }) => {
      if (!value?.asset?._ref) {
        return null;
      }
      return (
        <div className="my-8 flex justify-center">
          <Image
            className="w-full h-auto object-cover max-w-lg border-2 border-green-400 p-1"
            src={urlForImage(value).width(800).url()}
            alt={value.alt || 'Blog Post Image'}
            width={800}
            height={500}
            style={{ filter: "grayscale(100%) sepia(20%) hue-rotate(90deg)" }} 
          />
        </div>
      );
    },
    // Component to render the custom horizontal rule
    horizontalRule: () => (
        <hr className="border-t-2 border-green-400 my-8" />
    ),
  },
  
  // Custom styling for standard HTML blocks (e.g., headings, paragraphs)
  block: {
    // You can override default headers here to add Tailwind classes
    h1: ({ children }) => <h1 className="text-4xl text-yellow-400 mb-4 font-bold">{children}</h1>,
    h2: ({ children }) => <h2 className="text-3xl text-yellow-400 mb-3 mt-6 font-bold">{children}</h2>,
    h3: ({ children }) => <h3 className="text-2xl text-green-400 mb-2 mt-4 font-bold">{children}</h3>,
    normal: ({ children }) => <p className="mb-4">{children}</p>, // Add margin below paragraphs
  },
  
  // Custom styling for annotations (e.g., links, which are 'mark' types)
  marks: {
    // Renders external links with terminal styling
    link: ({value, children}) => {
      const target = (value?.href || '').startsWith('http') ? '_blank' : undefined
      return (
        <a 
          href={value?.href} 
          target={target} 
          rel={target === '_blank' ? 'noopener noreferrer' : undefined}
          className="text-yellow-400 underline hover:text-white"
        >
          {children}
        </a>
      )
    },
    // Renders inline code with terminal styling
    code: ({children}) => (
        <code className="bg-gray-800 text-green-300 px-1 py-0.5 rounded text-sm">{children}</code>
    ),
  },

  // Custom styling for lists
  list: {
    bullet: ({children}) => <ul className="list-disc list-inside ml-4 my-4">{children}</ul>,
    number: ({children}) => <ol className="list-decimal list-inside ml-4 my-4">{children}</ol>,
  },

  // Custom styling for list items
  listItem: {
    bullet: ({children}) => <li className="mb-1">{children}</li>,
    number: ({children}) => <li className="mb-1">{children}</li>,
  }
}

export default components;