//schemaTypes/post.ts

import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title', // Automatically generate from the title
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      options: {
         dateFormat: 'YYYY-MM-DD',
      }
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {
        hotspot: true, // Allow cropping
      },
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent', // This is where the rich text editor lives
    }),
  ],
  preview: {
    select: {
      title: 'title',
      date: 'publishedAt',
    },
    prepare(selection) {
      const {title, date} = selection;
      return {
        title: title || 'No Title',
        subtitle: date ? new Date(date).toLocaleDateString() : 'No publish date set',
      };
    },
  },
});