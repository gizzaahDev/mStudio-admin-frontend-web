'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ExternalLink, Loader2, RefreshCw, ShieldX, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  listInstituteSubscriptions,
  adjustTeacherTrial,
  setInstituteSubscriptionStatus,
  type InstituteSubscription,
  type InstituteSubscriptionStatus,
} from '@/lib/backend-api'

const money = (value?: number) => `LKR ${Number(value || 0).toLocaleString('en-LK')}`
type Filter = 'attention' | 'active' | 'all'

export function TeacherSubscriptionList() {
  const [subscriptions, setSubscriptions] = useState<InstituteSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [filter, setFilter] = useState<Filter>('attention')

  const load = async () => {
    setLoading(true)
    try {
      const result = await listInstituteSubscriptions()
      setSubscriptions(result.subscriptions.filter((item) => item.instituteId.startsWith('solo:')))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load teacher subscriptions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const visible = useMemo(() => subscriptions.filter((item) => {
    if (filter === 'active') return item.status === 'active' || item.status === 'trial'
    if (filter === 'attention') return item.paymentStatus === 'pending' || item.status === 'expired' || item.status === 'pending' || item.status === 'rejected'
    return true
  }), [subscriptions, filter])

  const update = async (item: InstituteSubscription, status: InstituteSubscriptionStatus) => {
    if (status === 'active' && !item.slipUrl) return toast.error('The teacher must upload a payment slip before approval')
    setSaving(item.instituteId + status)
    try {
      await setInstituteSubscriptionStatus(item.instituteId, status)
      toast.success(status === 'active' ? `${item.instituteName} subscription approved` : 'Subscription status updated')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update subscription')
    } finally {
      setSaving('')
    }
  }

  const updateTrial = async (item: InstituteSubscription, start: string, end: string) => {
    if (!start || !end) return toast.error('Select both trial dates')
    setSaving(item.instituteId + 'trial')
    try {
      await adjustTeacherTrial(item.ownerUid, new Date(start).toISOString(), new Date(end).toISOString())
      toast.success(`${item.instituteName} trial dates updated`)
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not update trial dates') }
    finally { setSaving('') }
  }

  return <div className='space-y-5'>
    <Card className='overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-background to-cyan-500/10'>
      <CardHeader>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div><CardTitle className='flex items-center gap-2'><Sparkles className='h-5 w-5 text-violet-500' />Teacher subscription list</CardTitle><CardDescription className='mt-1'>Review free trials, chosen packages, offer prices, payment slips, and student-app access.</CardDescription></div>
          <Button variant='outline' onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? 'animate-spin' : ''} />Refresh</Button>
        </div>
      </CardHeader>
      <CardContent className='flex flex-wrap gap-2'>
        {(['attention', 'active', 'all'] as Filter[]).map((value) => <Button key={value} size='sm' variant={filter === value ? 'default' : 'outline'} onClick={() => setFilter(value)} className='capitalize'>{value === 'attention' ? 'Needs attention' : value}</Button>)}
      </CardContent>
    </Card>

    {loading ? <div className='flex min-h-40 items-center justify-center gap-2 text-muted-foreground'><Loader2 className='h-5 w-5 animate-spin' />Loading teacher subscriptions...</div> : visible.length === 0 ? <Card><CardContent className='py-12 text-center text-muted-foreground'>No teacher subscriptions match this filter.</CardContent></Card> : <div className='grid gap-4 xl:grid-cols-2'>
      {visible.map((item) => {
        const hasOffer = Number(item.offerPrice || 0) > 0 && Number(item.offerPrice) < Number(item.regularPrice || item.price || 0)
        return <Card key={item.instituteId} className='overflow-hidden border-border/80 shadow-sm'>
          <CardHeader className='border-b bg-muted/25'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div><CardTitle>{item.instituteName || item.ownerEmail || 'Teacher account'}</CardTitle><CardDescription className='mt-1'>{item.ownerEmail || 'No email'} · {item.ownerUid}</CardDescription></div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${item.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : item.status === 'trial' ? 'bg-blue-500/10 text-blue-600' : item.status === 'expired' ? 'bg-amber-500/10 text-amber-700' : 'bg-muted text-muted-foreground'}`}>{item.status}</span>
            </div>
          </CardHeader>
          <CardContent className='space-y-4 pt-5'>
            <div className='grid grid-cols-2 gap-3 text-sm sm:grid-cols-3'>
              <Detail label='Package' value={item.tierId || 'Not selected'} />
              <Detail label='Capacity' value={item.studentCount ? `${item.studentCount.toLocaleString()} students` : 'Unlimited'} />
              <Detail label='Billing' value={item.plan} capitalize />
              <Detail label='Regular price' value={money(item.regularPrice || item.price)} crossed={hasOffer} />
              <Detail label='Payable price' value={money(item.price)} accent />
              <Detail label='Payment' value={(item.paymentStatus || 'not submitted').replaceAll('_', ' ')} capitalize />
            </div>
            {hasOffer && <p className='rounded-xl bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300'>Admin offer: {money(item.offerPrice)} · Teacher saves {money(Number(item.regularPrice || 0) - Number(item.offerPrice || 0))}</p>}
            <div className='rounded-xl border bg-muted/20 p-3 text-xs text-muted-foreground'>
              <p>Trial ends: {item.trialEndsAt ? new Date(item.trialEndsAt).toLocaleString() : 'Not recorded'}</p>
              <p>Payment submitted: {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : 'Not submitted'}</p>
              {item.note && <p className='mt-2 text-foreground'>Note: {item.note}</p>}
            </div>
            <TrialDateEditor item={item} disabled={saving === item.instituteId + 'trial'} onSave={(start, end) => void updateTrial(item, start, end)} />
            <div className='flex flex-wrap gap-2'>
              {item.slipUrl ? <a href={item.slipUrl} target='_blank' rel='noreferrer'><Button variant='outline'><ExternalLink />View payment slip</Button></a> : <Button variant='outline' disabled>No payment slip</Button>}
              <Button disabled={!item.slipUrl || saving === item.instituteId + 'active'} onClick={() => void update(item, 'active')}><CheckCircle2 />Approve & enable students</Button>
              <Button variant='destructive' disabled={saving === item.instituteId + 'rejected'} onClick={() => void update(item, 'rejected')}><ShieldX />Reject</Button>
            </div>
          </CardContent>
        </Card>
      })}
    </div>}
  </div>
}

function TrialDateEditor({ item, disabled, onSave }: { item: InstituteSubscription; disabled: boolean; onSave: (start: string, end: string) => void }) {
  const dateValue = (value?: string) => value ? new Date(value).toISOString().slice(0, 10) : ''
  const [start, setStart] = useState(dateValue(item.trialStartedAt))
  const [end, setEnd] = useState(dateValue(item.trialEndsAt))
  return <div className='grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end'><label className='text-xs font-medium'>Trial start<Input className='mt-1' type='date' value={start} onChange={(event) => setStart(event.target.value)} /></label><label className='text-xs font-medium'>Trial end<Input className='mt-1' type='date' value={end} onChange={(event) => setEnd(event.target.value)} /></label><Button variant='outline' disabled={disabled || !start || !end} onClick={() => onSave(start, end)}>{disabled ? 'Saving...' : 'Update trial'}</Button></div>
}

function Detail({ label, value, accent = false, crossed = false, capitalize = false }: { label: string; value: string; accent?: boolean; crossed?: boolean; capitalize?: boolean }) {
  return <div className='rounded-xl border bg-background/70 p-3'><p className='text-xs text-muted-foreground'>{label}</p><p className={`mt-1 font-bold ${accent ? 'text-primary' : ''} ${crossed ? 'line-through opacity-70' : ''} ${capitalize ? 'capitalize' : ''}`}>{value}</p></div>
}
