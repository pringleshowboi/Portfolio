import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'portfolio-blog',

  projectId: 'yzp4zaeb',
  dataset: 'production',

  basePath: '/studio',
  
  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
