'use client'

import { Bold, Italic, Underline } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PageBlock } from '@/lib/classroom-store'

type Draft = Omit<PageBlock, 'id' | 'batchId' | 'createdAt'>

export function TextEditorToolbar({ block, setBlock }: { block: Draft; setBlock: (block: Draft) => void }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex flex-wrap gap-1 border-b border-border bg-muted/30 p-2">
        <Button type="button" size="icon-sm" variant={block.fontWeight === 'bold' ? 'default' : 'outline'} onClick={() => setBlock({ ...block, fontWeight: block.fontWeight === 'bold' ? 'normal' : 'bold' })} aria-label="Bold"><Bold className="h-4 w-4" /></Button>
        <Button type="button" size="icon-sm" variant={block.fontStyle === 'italic' ? 'default' : 'outline'} onClick={() => setBlock({ ...block, fontStyle: block.fontStyle === 'italic' ? 'normal' : 'italic' })} aria-label="Italic"><Italic className="h-4 w-4" /></Button>
        <Button type="button" size="icon-sm" variant={block.textDecoration === 'underline' ? 'default' : 'outline'} onClick={() => setBlock({ ...block, textDecoration: block.textDecoration === 'underline' ? 'none' : 'underline' })} aria-label="Underline"><Underline className="h-4 w-4" /></Button>
        <span className="mx-1 h-7 border-l border-border" />
        <select value={block.fontSize} onChange={(event) => setBlock({ ...block, fontSize: event.target.value as Draft['fontSize'] })} className="h-7 rounded border bg-background px-2 text-xs"><option value="sm">Small</option><option value="base">Normal</option><option value="lg">Large</option><option value="xl">XL</option><option value="2xl">Heading</option></select>
        <select value={block.align} onChange={(event) => setBlock({ ...block, align: event.target.value as Draft['align'] })} className="h-7 rounded border bg-background px-2 text-xs"><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select>
      </div>
      <textarea value={block.content} onChange={(event) => setBlock({ ...block, content: event.target.value })} placeholder="Write and format your content..." className="min-h-32 w-full resize-y bg-transparent p-3 text-sm outline-none" style={{ color: block.color, fontStyle: block.fontStyle, textDecoration: block.textDecoration }} />
    </div>
  )
}

export function NoticeBorderPicker({ block, setBlock }: { block: Draft; setBlock: (block: Draft) => void }) {
  if (block.type !== 'notice') return null
  return <label className="block text-xs text-muted-foreground">Notice left-border colour<input type="color" value={block.borderColor ?? '#2563eb'} onChange={(event) => setBlock({ ...block, borderColor: event.target.value })} className="mt-1 h-8 w-full rounded border" /></label>
}
