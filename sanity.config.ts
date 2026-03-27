import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'portfolio-blog',

  projectId: 'yzp4zaeb',
  dataset: 'production',
  
  // ADD THIS LINE - Required for embedded Studio at /studio sub-route
  basePath: '/studio', 

  apiVersion: '2025-09-10',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
  
  // Note: 'cors' is not a valid key here. 
  // You must add these URLs at https://www.sanity.io/manage
})
