'use client'

import { useEffect, useState } from 'react'
import { Edit3, Megaphone, Plus, Quote, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createDashboardContent, deleteDashboardContent, listDashboardContent, updateDashboardContent, type DashboardContentInput, type DashboardContentItem } from '@/lib/backend-api'

const emptyForm: DashboardContentInput = { type: 'notice', title: '', content: '', category: '', url: '', active: true }

export function DashboardContentManager() {
  const [items, setItems] = useState<DashboardContentItem[]>([])
  const [form, setForm] = useState<DashboardContentInput>(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [saving, setSaving] = useState(false)
  const load = () => listDashboardContent().then((result) => setItems(result.items)).catch((error: Error) => toast.error(error.message || 'Could not load dashboard content'))
  useEffect(() => { void load() }, [])
  const edit = (item: DashboardContentItem) => { setEditingId(item.id); setForm({ type: item.type, title: item.title, content: item.content, category: item.category || '', url: item.url || '', active: item.active !== false }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const reset = () => { setEditingId(''); setForm(emptyForm) }
  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) return toast.error('Add a title and content')
    setSaving(true)
    try { if (editingId) await updateDashboardContent(editingId, form); else await createDashboardContent(form); toast.success(editingId ? 'Dashboard content updated' : 'Dashboard content published'); reset(); await load() }
    catch (error: any) { toast.error(error.message || 'Could not save dashboard content') }
    finally { setSaving(false) }
  }
  const remove = async (id: string) => { if (!confirm('Delete this dashboard item?')) return; try { await deleteDashboardContent(id); if (editingId === id) reset(); await load(); toast.success('Deleted') } catch (error: any) { toast.error(error.message || 'Could not delete item') } }

  return <div className="space-y-6">
    <div><p className="text-sm font-medium text-primary">Student dashboard publishing</p><h1 className="mt-1 text-3xl font-bold">Quotes & Special Notices</h1><p className="mt-2 text-muted-foreground">Publish a dashboard quote or important information such as exam timetables, gazettes, links, and announcements for all students.</p></div>
    <Card><CardHeader><CardTitle>{editingId ? 'Edit dashboard item' : 'Create dashboard item'}</CardTitle><CardDescription>Students see active items at the top of their dashboard.</CardDescription></CardHeader><CardContent className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Content type<select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as 'quote' | 'notice' })}><option value="quote">Quote</option><option value="notice">Special notice</option></select></label><label className="text-sm font-medium">Category<Input className="mt-1" value={form.category || ''} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Exam timetable, Gazette, Motivation..." /></label></div>
      <label className="block text-sm font-medium">Title<Input className="mt-1" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
      <label className="block text-sm font-medium">Content<textarea className="mt-1 min-h-32 w-full rounded-md border bg-background p-3" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /></label>
      <label className="block text-sm font-medium">Optional reading link<Input className="mt-1" type="url" value={form.url || ''} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://..." /></label>
      <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="h-5 w-5 accent-primary" />Show this item to students</label>
      <div className="flex gap-2"><Button onClick={() => void save()} disabled={saving}><Plus className="h-4 w-4" />{saving ? 'Saving...' : editingId ? 'Save changes' : 'Publish'}</Button>{editingId && <Button variant="outline" onClick={reset}>Cancel</Button>}</div>
    </CardContent></Card>
    <div className="grid gap-4 lg:grid-cols-2">{items.map((item) => <Card key={item.id} className={item.active ? '' : 'opacity-60'}><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2">{item.type === 'quote' ? <Quote className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}{item.title}</CardTitle><CardDescription>{item.type === 'quote' ? 'Quote' : 'Special notice'}{item.category ? ' · ' + item.category : ''}{item.active ? ' · Active' : ' · Hidden'}</CardDescription></div><div className="flex gap-1"><Button size="icon" variant="outline" onClick={() => edit(item)}><Edit3 className="h-4 w-4" /></Button><Button size="icon" variant="destructive" onClick={() => void remove(item.id)}><Trash2 className="h-4 w-4" /></Button></div></div></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm">{item.content}</p>{item.url && <a href={item.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-primary underline">Open linked information</a>}</CardContent></Card>)}{!items.length && <Card><CardContent className="py-12 text-center text-muted-foreground">No dashboard content has been created.</CardContent></Card>}</div>
  </div>
}