'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageBlockRenderer } from './page-block-renderer'
import { useClassroomStore, type PageBlock, type PageBlockType } from '@/lib/classroom-store'
import { Eye, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { deleteBatchContent, publishBatchContent, updateBatchContent } from '@/lib/backend-api'
import { storage } from '@/lib/firebase'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { NoticeBorderPicker, TextEditorToolbar } from './text-editor-toolbar'

const emptyBlock: Omit<PageBlock, 'id' | 'batchId' | 'createdAt'> = { type: 'text', content: '', url: '', color: '#1e293b', background: 'transparent', borderColor: '#2563eb', fontSize: 'base', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', align: 'left' }

export function SpaceBuilder({ batchId, batchName }: { batchId: string; batchName?: string }) {
  const store = useClassroomStore()
  const [block, setBlock] = useState(emptyBlock)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const blocks = useMemo(() => store.pageBlocks.filter((item) => item.batchId === batchId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [store.pageBlocks, batchId])
  const preview: PageBlock = { ...block, id: 'preview', batchId, createdAt: new Date().toISOString() }
  const publish = async () => {
    if (block.type !== 'divider' && !block.content.trim()) return toast.error('Enter content')
    setPublishing(true)
    try {
      let url = block.url
      let content = block.content
      let type = block.type
      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
        const fileRef = ref(storage, 'batch-resources/' + batchId + '/' + Date.now() + '-' + safeName)
        await uploadBytes(fileRef, file, { contentType: file.type || 'application/octet-stream' })
        url = await getDownloadURL(fileRef)
        content = content || file.name
        type = 'resource'
      }
      const payload = { type, content, url, batchName, style: { color: block.color, background: block.background, borderColor: block.borderColor, fontSize: block.fontSize, fontWeight: block.fontWeight, fontStyle: block.fontStyle, textDecoration: block.textDecoration, align: block.align } }
      if (editingId && !editingId.startsWith('block-')) {
        const result = await updateBatchContent(batchId, editingId, payload)
        store.upsertPageBlock({ id: result.content.id, batchId, type: result.content.type, content: result.content.content, url: result.content.url, color: result.content.style.color, background: result.content.style.background, borderColor: result.content.style.borderColor, fontSize: result.content.style.fontSize, fontWeight: result.content.style.fontWeight, fontStyle: result.content.style.fontStyle, textDecoration: result.content.style.textDecoration, align: result.content.style.align, createdAt: result.content.createdAt })
        toast.success('Published changes saved')
      } else if (editingId) {
        store.updatePageBlock(editingId, block)
        toast.success('Local demo block updated')
      } else {
        const result = await publishBatchContent(batchId, payload)
        store.upsertPageBlock({ id: result.content.id, batchId, type: result.content.type, content: result.content.content, url: result.content.url, color: result.content.style.color, background: result.content.style.background, borderColor: result.content.style.borderColor, fontSize: result.content.style.fontSize, fontWeight: result.content.style.fontWeight, fontStyle: result.content.style.fontStyle, textDecoration: result.content.style.textDecoration, align: result.content.style.align, createdAt: result.content.createdAt })
        toast.success('Published to Firebase and ICT Space')
      }
      setBlock(emptyBlock)
      setFile(null)
      setEditingId(null)
    } catch (error: any) {
      toast.error(error.message || 'Could not publish to Firebase')
    } finally {
      setPublishing(false)
    }
  }
  return <div className="grid gap-5 xl:grid-cols-2">
    <Card><CardHeader><CardTitle>Custom ICT Space editor</CardTitle><CardDescription>Add styled text, notices, headings, links, horizontal lines, recordings, PDFs, and other resources.</CardDescription></CardHeader><CardContent className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2"><select value={block.type} onChange={(e) => setBlock({ ...block, type: e.target.value as PageBlockType })} className="h-8 rounded-lg border bg-background px-3 text-sm">{(['heading', 'text', 'notice', 'link', 'divider', 'resource'] as PageBlockType[]).map((type) => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}</select><Input value={block.url} onChange={(e) => setBlock({ ...block, url: e.target.value })} placeholder="Link / recording / PDF URL" disabled={!['link', 'resource'].includes(block.type)} /></div>
      <label className="block rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">Attach a file (PDF, Word, Excel, PowerPoint, image, audio, video or other material)<input type="file" className="mt-2 block w-full text-sm" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />{file && <span className="mt-2 block text-primary">Ready to upload: {file.name}</span>}</label>
      {block.type !== 'divider' && <TextEditorToolbar block={block} setBlock={setBlock} />}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><label className="text-xs text-muted-foreground">Text colour<input type="color" value={block.color} onChange={(e) => setBlock({ ...block, color: e.target.value })} className="mt-1 h-8 w-full rounded border" /></label><label className="text-xs text-muted-foreground">Background<input type="color" value={block.background === 'transparent' ? '#ffffff' : block.background} onChange={(e) => setBlock({ ...block, background: e.target.value })} className="mt-1 h-8 w-full rounded border" /></label><select value={block.fontSize} onChange={(e) => setBlock({ ...block, fontSize: e.target.value as PageBlock['fontSize'] })} className="h-8 self-end rounded-lg border bg-background px-2 text-sm"><option value="sm">Small</option><option value="base">Normal</option><option value="lg">Large</option><option value="xl">Extra large</option><option value="2xl">Heading</option></select><select value={block.fontWeight} onChange={(e) => setBlock({ ...block, fontWeight: e.target.value as PageBlock['fontWeight'] })} className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="normal">Normal</option><option value="medium">Medium</option><option value="bold">Bold</option></select><select value={block.align} onChange={(e) => setBlock({ ...block, align: e.target.value as PageBlock['align'] })} className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select><Button variant="outline" onClick={() => setBlock({ ...block, background: 'transparent' })}>Clear background</Button></div>
      <div className="grid gap-3 sm:grid-cols-2"><NoticeBorderPicker block={block} setBlock={setBlock} /><div className="flex gap-2 sm:items-end"><Button onClick={publish} disabled={publishing}>{publishing ? 'Publishing...' : editingId ? 'Publish changes' : 'Publish to ICT Space'}</Button>{editingId && <Button variant="outline" onClick={() => { setEditingId(null); setBlock(emptyBlock) }}>Cancel editing</Button>}</div></div>
      <div className="space-y-2 border-t pt-4"><p className="text-sm font-semibold">Manage page blocks</p>{blocks.map((item, index) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-3"><div className="min-w-0"><p className="text-xs font-medium uppercase text-primary">{index + 1}. {item.type}</p><p className="truncate text-sm">{item.content || 'Horizontal line'}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setEditingId(item.id); setBlock({ type: item.type, content: item.content, url: item.url, color: item.color, background: item.background, fontSize: item.fontSize, fontWeight: item.fontWeight, align: item.align }) }}>Edit</Button><Button size="icon-sm" variant="destructive" onClick={async () => { try { if (!item.id.startsWith('block-')) await deleteBatchContent(batchId, item.id); store.deletePageBlock(item.id); toast.success('Content removed') } catch (error: any) { toast.error(error.message || 'Could not remove content') } }}><Trash2 className="h-4 w-4" /></Button></div></div>)}</div>
    </CardContent></Card>
    <Card className="h-fit xl:sticky xl:top-4"><CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" />Live student preview</CardTitle><CardDescription>Oldest content is first; new updates appear at the bottom.</CardDescription></CardHeader><CardContent><div className="min-h-[500px] space-y-3 rounded-xl border bg-background p-5">{blocks.map((item) => <PageBlockRenderer key={item.id} block={item} />)}<div className="rounded-xl border-2 border-dashed border-primary/30 p-2"><p className="mb-2 text-xs text-primary">New block preview</p><PageBlockRenderer block={preview} /></div></div></CardContent></Card>
  </div>
}
