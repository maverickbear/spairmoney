'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `/app/studio/[[...tool]]/page.tsx` route
 */

import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import { apiVersion, dataset, projectId } from './sanity/env'
import {generateWithAiAction} from './sanity/plugins/generateWithAiAction'
import {schema} from './sanity/schemaTypes'
import {structure} from './sanity/structure'

// Placeholder when Sanity is not configured so defineConfig always receives valid values
const safeProjectId = projectId || 'not-configured'

export default defineConfig({
  basePath: '/admin/studio',
  projectId: safeProjectId,
  dataset,
  schema,
  document: {
    actions: (prev, context) =>
      context.schemaType === 'post' ? [generateWithAiAction, ...prev] : prev,
  },
  plugins: [
    structureTool({structure}),
    // Vision is only loaded in development to avoid @sanity/vision vs sanity@3
    // export mismatch in production builds. Use it for GROQ in Studio when running dev.
    ...(process.env.NODE_ENV === 'development'
      ? [require('@sanity/vision').visionTool({defaultApiVersion: apiVersion})]
      : []),
  ],
})
