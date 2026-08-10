'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createAdminAccount, listAdmins, type UserProfile } from '@/lib/backend-api'
import { Loader2, ShieldCheck, UserPlus } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function AdminAccountsPage() {
  const [admins, setAdmins] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ displayName: '', email: '', password: '' })
  const load = async () => { setLoading(true); try { setAdmins((await listAdmins()).admins) } catch (error: any) { toast.error(error.message || 'Could not load administrators') } finally { setLoading(false) } }
  useEffect(() => { load() }, [])
  const create = async () => { if (!form.displayName || !form.email || form.password.length < 8) return toast.error('Enter a name, email, and password of at least 8 characters'); setCreating(true); try { const result = await createAdminAccount(form); setAdmins((current) => [...current, result.profile]); setForm({ displayName: '', email: '', password: '' }); toast.success('Separate admin account created') } catch (error: any) { toast.error(error.message || 'Could not create admin') } finally { setCreating(false) } }
  return <div className="space-y-8">
    <div><p className="text-sm font-medium text-primary">Security</p><h1 className="mt-1 text-3xl font-bold">Admin Accounts</h1><p className="mt-2 text-muted-foreground">The owner recovery account can create separate named administrators. Never share the owner password.</p></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" />Create administrator</CardTitle><CardDescription>The backend creates both the Firebase login and its approved admin profile.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"><Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Admin name" /><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Admin email" /><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Temporary password" /><Button onClick={create} disabled={creating}>{creating && <Loader2 className="h-4 w-4 animate-spin" />}Create</Button></CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Current administrators</CardTitle><CardDescription>Approved accounts with full administration access.</CardDescription></CardHeader><CardContent>{loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading...</div> : <div className="space-y-2">{admins.map((admin) => <div key={admin.uid ?? admin.id} className="flex items-center justify-between rounded-xl border p-4"><div><p className="font-medium">{admin.displayName || `${admin.firstName ?? ''} ${admin.lastName ?? ''}`.trim() || 'Administrator'}</p><p className="text-sm text-muted-foreground">{admin.email}</p></div><span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700">Approved admin</span></div>)}</div>}</CardContent></Card>
    <Card className="border-amber-500/30 bg-amber-500/5"><CardHeader><CardTitle>Owner recovery account</CardTitle><CardDescription>If Firestore profiles are deleted, sign in through the Admin portal using the configured owner Firebase account. Its approved admin profile is recreated automatically. If Firebase Authentication itself is deleted, restore the owner account from the Firebase Console or a secure server-side bootstrap script.</CardDescription></CardHeader></Card>
  </div>
}
