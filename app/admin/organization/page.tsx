'use client'

import { useEffect, useState } from 'react'
import { Building2, Loader2, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createInstitute, deleteInstitute, listInstitutes, updateInstitute, type Institute, type InstitutePayload } from '@/lib/backend-api'

const blankInstitute: InstitutePayload = { name: '', address: '', mapUrl: '', phone: '', email: '', details: '', grades: [], active: true }
const split = (value: string) => value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean)

export default function AdminOrganizationPage() {
  const [institutes, setInstitutes] = useState<Institute[]>([])
  const [form, setForm] = useState<InstitutePayload>(blankInstitute)
  const [editingId, setEditingId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const reload = async () => setInstitutes((await listInstitutes()).institutes)
  useEffect(() => { void reload().catch((error) => toast.error(error.message)).finally(() => setLoading(false)) }, [])
  const saveInstitute = async () => {
    if (!form.name.trim()) return toast.error('Institute name is required')
    setSaving(true)
    try { editingId ? await updateInstitute(editingId, form) : await createInstitute(form); await reload(); setForm(blankInstitute); setEditingId(''); toast.success(editingId ? 'Institute updated' : 'Institute added') }
    catch (error: any) { toast.error(error.message || 'Could not save institute') }
    finally { setSaving(false) }
  }
  const editInstitute = (item: Institute) => { setEditingId(item.id); setForm({ name: item.name, shortName: item.shortName, address: item.address, mapUrl: item.mapUrl, phone: item.phone, email: item.email, details: item.details, grades: item.grades || [], active: item.active }) }
  const removeInstitute = async (item: Institute) => { if (!window.confirm('Delete ' + item.name + '?')) return; try { await deleteInstitute(item.id); await reload(); toast.success('Institute deleted') } catch (error: any) { toast.error(error.message || 'Could not delete institute') } }
  if (loading) return <div className='flex gap-2 text-muted-foreground'><Loader2 className='h-5 w-5 animate-spin' />Loading institutes...</div>
  return <div className='space-y-8'>
    <div><p className='text-sm font-medium text-primary'>Organization administration</p><h1 className='mt-1 text-3xl font-bold'>Institutes</h1><p className='mt-2 text-muted-foreground'>Manage institute locations and contact details. Teacher public profiles are private to each teacher and are not editable by administrators.</p></div>
    <Card><CardHeader><CardTitle className='flex items-center gap-2'><Building2 className='h-5 w-5 text-primary' />Saved institutes</CardTitle><CardDescription>These locations are used by institute workspaces, batches, payments, and student requests.</CardDescription></CardHeader><CardContent>{institutes.length === 0 ? <p className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>No institutes have been added yet.</p> : <div className='grid gap-3 lg:grid-cols-2'>{institutes.map((item) => <div key={item.id} className='rounded-xl border p-4'><div className='flex justify-between gap-3'><div><p className='font-semibold'>{item.name}</p><p className='text-sm text-muted-foreground'>{item.address || item.details || 'No details added'}</p></div><span className={'h-fit rounded-full px-2 py-1 text-xs ' + (item.active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>{item.active ? 'Active' : 'Inactive'}</span></div><div className='mt-4 flex gap-2'><Button size='sm' variant='outline' onClick={() => editInstitute(item)}><Pencil className='h-4 w-4' />Edit</Button><Button size='sm' variant='destructive' onClick={() => void removeInstitute(item)}><Trash2 className='h-4 w-4' />Delete</Button></div></div>)}</div>}</CardContent></Card>
    <Card><CardHeader><CardTitle>{editingId ? 'Edit institute' : 'Add institute'}</CardTitle><CardDescription>Teacher public profile details are managed only in each teacher’s My Profile.</CardDescription></CardHeader><CardContent className='space-y-4'><div className='grid gap-4 md:grid-cols-2'><label className='text-sm font-medium'>Name<Input className='mt-1' value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className='text-sm font-medium'>Short name<Input className='mt-1' value={form.shortName || ''} onChange={(event) => setForm({ ...form, shortName: event.target.value })} /></label><label className='text-sm font-medium'>Phone<Input className='mt-1' value={form.phone || ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label className='text-sm font-medium'>Email<Input className='mt-1' type='email' value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label className='text-sm font-medium md:col-span-2'>Address<Input className='mt-1' value={form.address || ''} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label><label className='text-sm font-medium md:col-span-2'>Google Maps URL<Input className='mt-1' value={form.mapUrl || ''} onChange={(event) => setForm({ ...form, mapUrl: event.target.value })} /></label><label className='text-sm font-medium'>Institute grades<Input className='mt-1' value={(form.grades || []).join(', ')} onChange={(event) => setForm({ ...form, grades: split(event.target.value) })} /></label><label className='flex items-center gap-3 self-end rounded-lg border px-4 py-3'><input type='checkbox' className='h-5 w-5 accent-primary' checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />Active institute</label><label className='text-sm font-medium md:col-span-2'>Details<textarea className='mt-1 min-h-24 w-full rounded-md border bg-background p-3' value={form.details || ''} onChange={(event) => setForm({ ...form, details: event.target.value })} /></label></div><div className='flex gap-2'><Button disabled={saving} onClick={() => void saveInstitute()}>{editingId ? <Save className='h-4 w-4' /> : <Plus className='h-4 w-4' />}{editingId ? 'Update institute' : 'Add institute'}</Button>{editingId && <Button variant='outline' onClick={() => { setEditingId(''); setForm(blankInstitute) }}>Cancel</Button>}</div></CardContent></Card>
  </div>
}