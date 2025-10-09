// //schemaTypes/blockContent.ts 

import {defineType, defineArrayMember} from 'sanity'

export default defineType({
  title: 'Block Content',
  name: 'blockContent',
  type: 'array',
  of: [
    defineArrayMember({
      title: 'Block',
      type: 'block',
      // Styles define how text blocks appear (e.g., headings)
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'H1', value: 'h1'},
        {title: 'H2', value: 'h2'},
        {title: 'H3', value: 'h3'},
        {title: 'H4', value: 'h4'},
        {title: 'Quote', value: 'blockquote'},
      ],
      // Lists define ordered/unordered lists
      lists: [{title: 'Bullet', value: 'bullet'}, {title: 'Numbered', value: 'number'}],
      // Marks define inline formatting (bold, links, code)
      marks: {
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
          {title: 'Code', value: 'code'}, 
        ],
        annotations: [
          {
            title: 'URL',
            name: 'link',
            type: 'object',
            fields: [
              {
                title: 'URL',
                name: 'href',
                type: 'url',
                validation: Rule => Rule.uri({scheme: ['http', 'https', 'mailto', 'tel']}),
              },
            ],
          },
        ],
      },
    }),
    
    // 🛑 Allows INLINE IMAGES within the body 🛑
    defineArrayMember({
      type: 'image', 
      options: {hotspot: true},
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'A description of the image for accessibility/SEO.',
        },
      ],
    }),

    // 🛑 Allows a line separator (equivalent to the old Markdown '***') 🛑
    defineArrayMember({
        type: 'object',
        name: 'horizontalRule',
        title: 'Line Separator',
        fields: [{ name: 'dummy', type: 'string', title: 'Line Separator' }],
        options: { collapsible: true, collapsed: true }, 
    }),
  ],
})