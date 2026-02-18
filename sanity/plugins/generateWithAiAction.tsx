'use client'

/**
 * Document action "Generate with AI" for Blog Post.
 * Calls the app API to generate title, description, body; then creates or updates the document.
 * New (unsaved) documents don't exist in the dataset yet, so we create them first when patch fails.
 */

import { useClient } from 'sanity'
import type { DocumentActionComponent } from 'sanity'

function isDocumentNotFoundError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /document.*not found|was not found/i.test(message)
}

export const generateWithAiAction: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: '2024-01-01' })
  const docId = props.id

  return {
    label: 'Generate with AI',
    onHandle: async () => {
      const topic = window.prompt('Topic for the blog post (e.g. "how to save money on groceries"):')
      if (!topic?.trim()) return

      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        const res = await fetch(`${origin}/api/v2/blog/generate-with-ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: topic.trim() }),
        })
        const data = await res.json()

        if (!res.ok) {
          window.alert(data?.message || 'Failed to generate content')
          return
        }

        const paragraphs = (data.body || '')
          .split(/\n\n+/)
          .filter((p: string) => p.trim())
        const blockKey = () => Math.random().toString(36).slice(2)
        const blocks = paragraphs.map((p: string) => ({
          _type: 'block',
          _key: blockKey(),
          style: 'normal',
          markDefs: [],
          children: [{ _type: 'span', _key: blockKey(), text: p.replace(/\n/g, ' ') }],
        }))

        const today = new Date().toISOString().slice(0, 10)
        const payload = {
          title: data.title || 'Untitled',
          description: data.description || '',
          slug: data.slug ? { _type: 'slug' as const, current: data.slug } : undefined,
          datePublished: today,
          author: 'Spair Money',
          body: blocks,
        }

        try {
          await client
            .patch(docId)
            .set(payload)
            .commit()
        } catch (patchErr) {
          if (isDocumentNotFoundError(patchErr)) {
            await client.createIfNotExists({
              _id: docId,
              _type: 'post',
              ...payload,
            })
          } else {
            throw patchErr
          }
        }

        window.alert('Content generated! Review and add slug if needed, then publish.')
      } catch (err) {
        console.error(err)
        window.alert('Something went wrong. Check the console.')
      }
    },
  }
}
