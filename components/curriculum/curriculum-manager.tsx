'use client'

import { useEffect, useState } from 'react'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { Download, Eye, FileText, ImageIcon, Loader2, Music, Pencil, Plus, Trash2, Video } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { storage } from '@/lib/firebase'
import { createCurriculumResource, deleteCurriculumResource, listCurriculumResources, updateCurriculumResource, type CurriculumResource, type CurriculumResourcePayload, type CurriculumResourceType } from '@/lib/backend-api'

const empty: CurriculumResourcePayload = { title: '', description: '', type: 'paragraph', url: '', fileName: '', mimeType: '', allowDownload: false }
const types: Array<{ value: CurriculumResourceType; label: string }> = [{ value: 'paragraph', label: 'Paragraph / written lesson' }, { value: 'pdf', label: 'PDF document' }, { value: 'recording', label: 'Lesson recording' }, { value: 'video', label: 'Video' }, { value: 'audio', label: 'Audio' }, { value: 'image', label: 'Image' }, { value: 'file', label: 'Other file' }]

function ResourcePreview({ item }: { item: CurriculumResource }) {
  if (item.type === 'paragraph') return <p className='whitespace-pre-wrap text-sm leading-6 text-muted-foreground'>{item.description}</p>
  if (item.type === 'image') return <img src={item.url} alt={item.title} className='max-h-72 w-full rounded-xl border object-contain' />
  if (item.type === 'video' || (item.type === 'recording' && item.mimeType.startsWith('video/'))) return <video src={item.url} controls controlsList={item.allowDownload ? undefined : 'nodownload'} className='max-h-80 w-full rounded-xl border' />
  if (item.type === 'audio' || item.type === 'recording') return <audio src={item.url} controls controlsList={item.allowDownload ? undefined : 'nodownload'} className='w-full' />
  if (item.type === 'pdf') return <iframe src={item.url + '#toolbar=' + (item.allowDownload ? '1' : '0')} title={item.title} className='h-80 w-full rounded-xl border bg-white' />
  return null
}

export function CurriculumManager() {
  const [items, setItems] = useState<CurriculumResource[]>([])
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const load = () => listCurriculumResources().then(({ resources }) => setItems(resources)).catch((error: Error) => toast.error(error.message)).finally(() => setLoading(false))
  useEffect(() => { void load(); const refresh = () => void load(); window.addEventListener('magical-live-update', refresh); return () => window.removeEventListener('magical-live-update', refresh) }, [])
  const reset = () => { setForm(empty); setEditingId(''); setFile(null) }
  const edit = (item: CurriculumResource) => { setEditingId(item.id); setForm({ title: item.title, description: item.description, type: item.type, url: item.url, fileName: item.fileName, mimeType: item.mimeType, allowDownload: item.allowDownload }); setFile(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const save = async () => {
    if (!form.title.trim()) return toast.error('Add a resource title')
    if (form.type === 'paragraph' && !form.description.trim()) return toast.error('Add the paragraph content')
    if (form.type !== 'paragraph' && !file && !form.url) return toast.error('Choose a file or add a media URL')
    setSaving(true)
    try {
      let payload = { ...form, title: form.title.trim(), description: form.description.trim() }
      if (file) { const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '-'); const target = ref(storage, 'curriculum/' + Date.now() + '-' + safe); await uploadBytes(target, file, { contentType: file.type || 'application/octet-stream' }); payload = { ...payload, url: await getDownloadURL(target), fileName: file.name, mimeType: file.type || 'application/octet-stream' } }
      if (editingId) await updateCurriculumResource(editingId, payload); else await createCurriculumResource(payload)
      toast.success(editingId ? 'Curriculum resource updated' : 'Curriculum resource published')
      reset(); await load()
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Could not save resource') } finally { setSaving(false) }
  }
  const remove = async (item: CurriculumResource) => { if (!confirm('Delete "' + item.title + '"?')) return; try { await deleteCurriculumResource(item.id); setItems((current) => current.filter((entry) => entry.id !== item.id)); toast.success('Resource deleted') } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Could not delete resource') } }
  return <div className='space-y-7'>
    <div><p className='text-sm font-medium text-primary'>Learning library</p><h1 className='mt-1 text-3xl font-bold'>Curriculum Resources</h1><p className='mt-2 text-muted-foreground'>Publish written lessons, PDFs, recordings, videos, audio, images, and other learning files one by one.</p></div>
    <Card><CardHeader><CardTitle>{editingId ? 'Edit resource' : 'Add curriculum resource'}</CardTitle><CardDescription>Files upload to Firebase Storage; the resource details are saved in Firestore.</CardDescription></CardHeader><CardContent className='space-y-4'>
      <div className='grid gap-3 md:grid-cols-2'><label className='text-sm font-medium'>Resource title<Input className='mt-1' value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder='Example: Database lesson 01' /></label><label className='text-sm font-medium'>Resource type<select className='mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm' value={form.type} onChange={(event) => { const type = event.target.value as CurriculumResourceType; setForm({ ...form, type, ...(type === 'paragraph' ? { url: '', fileName: '', mimeType: '' } : {}) }); setFile(null) }}>{types.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label></div>
      <label className='block text-sm font-medium'>{form.type === 'paragraph' ? 'Paragraph content' : 'Description shown above the resource'}<textarea className='mt-1 min-h-28 w-full rounded-lg border bg-background p-3 text-sm' value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder='Write the explanation or supporting details...' /></label>
      {form.type !== 'paragraph' && <div className='grid gap-3 md:grid-cols-2'><label className='rounded-xl border border-dashed p-4 text-sm font-medium'>Choose file<input className='mt-2 block w-full text-sm' type='file' onChange={(event) => setFile(event.target.files?.[0] || null)} />{(file || form.fileName) && <span className='mt-2 block text-xs text-primary'>{file?.name || form.fileName}</span>}</label><label className='text-sm font-medium'>Or use a complete media/file URL<Input className='mt-1' type='url' value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder='https://...' /></label></div>}
      {form.type !== 'paragraph' && <label className='flex items-center justify-between rounded-xl border p-4'><span><b className='block text-sm'>Allow students/users to download</b><span className='text-xs text-muted-foreground'>Off means preview/read controls only.</span></span><input type='checkbox' className='h-5 w-5 accent-primary' checked={form.allowDownload} onChange={(event) => setForm({ ...form, allowDownload: event.target.checked })} /></label>}
      <div className='flex flex-wrap justify-end gap-2'>{editingId && <Button variant='outline' onClick={reset}>Cancel edit</Button>}<Button disabled={saving} onClick={() => void save()}>{saving ? <Loader2 className='h-4 w-4 animate-spin' /> : <Plus className='h-4 w-4' />}{editingId ? 'Save changes' : 'Publish resource'}</Button></div>
    </CardContent></Card>
    <section className='space-y-3'><div className='flex items-center justify-between'><h2 className='text-xl font-bold'>Published curriculum</h2><span className='text-sm text-muted-foreground'>{items.length} resources</span></div>{loading ? <div className='grid place-items-center py-16'><Loader2 className='h-7 w-7 animate-spin text-primary' /></div> : items.length === 0 ? <div className='rounded-xl border border-dashed py-16 text-center text-muted-foreground'>No curriculum resources published yet.</div> : items.map((item) => <Card key={item.id}><CardHeader><div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'><div><CardTitle className='flex items-center gap-2'>{item.type === 'image' ? <ImageIcon className='h-5 w-5 text-primary' /> : item.type === 'video' || item.type === 'recording' ? <Video className='h-5 w-5 text-primary' /> : item.type === 'audio' ? <Music className='h-5 w-5 text-primary' /> : <FileText className='h-5 w-5 text-primary' />}{item.title}</CardTitle><CardDescription className='mt-1 capitalize'>{item.type} · {item.allowDownload ? 'Preview and download' : 'View/read only'}</CardDescription></div><div className='flex gap-2'><Button size='sm' variant='outline' onClick={() => edit(item)}><Pencil className='h-4 w-4' />Edit</Button><Button size='sm' variant='destructive' onClick={() => void remove(item)}><Trash2 className='h-4 w-4' />Delete</Button></div></div></CardHeader><CardContent className='space-y-4'>{item.type !== 'paragraph' && item.description && <p className='whitespace-pre-wrap text-sm leading-6 text-muted-foreground'>{item.description}</p>}<ResourcePreview item={item} />{item.url && <div className='flex flex-wrap gap-2'><a href={item.url} target='_blank' rel='noreferrer'><Button variant='outline'><Eye className='h-4 w-4' />Open preview</Button></a>{item.allowDownload && <a href={item.url} download={item.fileName || item.title} target='_blank' rel='noreferrer'><Button><Download className='h-4 w-4' />Download {item.fileName || 'resource'}</Button></a>}</div>}</CardContent></Card>)}</section>
  </div>
}
