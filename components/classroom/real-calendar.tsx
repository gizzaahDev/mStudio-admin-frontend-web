'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, ChevronLeft, ChevronRight, ClipboardList, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { listBatchContent, listBatches, listMyBatches } from '@/lib/backend-api'
import { useAuth } from '@/lib/auth-context'

type Audience = 'student' | 'teacher' | 'admin'
type CalendarEvent = { id: string; contentId: string; batchId: string; batchName: string; title: string; kind: 'quiz' | 'assignment-open' | 'assignment-deadline'; date: string }

function readDetails(content: string) {
  try { return JSON.parse(content) as { title?: string; question?: string; availableAt?: string; deadline?: string; questions?: Array<{ question?: string }> } }
  catch { return { title: content } }
}
function dateKey(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export function RealCalendar({ audience }: { audience?: Audience }) {
  const { role } = useAuth()
  const view = audience || (role === 'student' ? 'student' : role === 'admin' ? 'admin' : 'teacher')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const batches = view === 'student' ? (await listMyBatches()).batches : (await listBatches()).batches
        const groups = await Promise.all(batches.map(async (batch) => ({ batch, content: (await listBatchContent(batch.id)).content })))
        const next: CalendarEvent[] = []
        for (const { batch, content } of groups) for (const item of content) {
          if (item.type !== 'quiz' && item.type !== 'assignment') continue
          const details = readDetails(item.content)
          const title = details.title || details.questions?.[0]?.question || details.question || (item.type === 'quiz' ? 'ICT Quiz' : 'ICT Assignment')
          if (details.availableAt) next.push({ id: item.id + '-open', contentId: item.id, batchId: batch.id, batchName: batch.name, title, kind: item.type === 'quiz' ? 'quiz' : 'assignment-open', date: details.availableAt })
          if (item.type === 'assignment' && details.deadline) next.push({ id: item.id + '-deadline', contentId: item.id, batchId: batch.id, batchName: batch.name, title, kind: 'assignment-deadline', date: details.deadline })
        }
        if (active) setEvents(next.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
      } catch (loadError: any) { if (active) setError(loadError.message || 'Could not load calendar events') }
      finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [view])

  const days = useMemo(() => Array.from({ length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1)), [month])
  const eventMap = useMemo(() => events.reduce<Record<string, CalendarEvent[]>>((result, event) => { (result[dateKey(event.date)] ||= []).push(event); return result }, {}), [events])
  const selectedEvents = eventMap[selectedDate] || []
  const title = view === 'student' ? 'My Learning Calendar' : view === 'teacher' ? 'Teaching Calendar' : 'Administration Calendar'

  const moveMonth = (amount: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + amount, 1)
    setMonth(next)
    setSelectedDate(dateKey(next))
  }

  return <div className="space-y-6">
    <div><p className="text-sm font-medium text-primary">{view === 'student' ? 'My schedule' : 'Batch schedule'}</p><h1 className="mt-1 text-3xl font-bold">{title}</h1><p className="mt-2 text-muted-foreground">{view === 'student' ? 'Dates from assignments and quizzes in your own batches.' : 'Dates from assignments and quizzes across managed batches.'}</p></div>
    <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" />{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</CardTitle><CardDescription>{loading ? 'Loading Firebase events...' : events.length + ' scheduled event' + (events.length === 1 ? '' : 's')}</CardDescription></div><div className="flex gap-2"><Button size="icon" variant="outline" onClick={() => moveMonth(-1)} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" onClick={() => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedDate(dateKey(now)) }}>Today</Button><Button size="icon" variant="outline" onClick={() => moveMonth(1)} aria-label="Next month"><ChevronRight className="h-4 w-4" /></Button></div></div></CardHeader><CardContent className="space-y-6">
      {error && <p className="rounded-lg bg-red-500/10 p-4 text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{days.map((day) => {
        const key = dateKey(day)
        const dayEvents = eventMap[key] || []
        const selected = selectedDate === key
        return <button key={key} onClick={() => setSelectedDate(key)} className={'relative rounded-xl border p-3 text-left transition ' + (selected ? 'border-primary bg-primary/10 ring-1 ring-primary' : dayEvents.length ? 'border-amber-500/60 bg-amber-500/10 hover:border-primary' : 'hover:bg-muted')}><p className="text-xs text-muted-foreground">{day.toLocaleDateString(undefined, { weekday: 'short' })}</p><p className="text-xl font-bold">{day.getDate()}</p>{dayEvents.length > 0 && <p className="mt-1 text-xs font-semibold text-amber-600">{dayEvents.length} event{dayEvents.length === 1 ? '' : 's'}</p>}</button>
      })}</div>
      <section className="rounded-xl border bg-muted/20 p-4"><h2 className="font-bold">{new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2><div className="mt-3 space-y-3">{selectedEvents.length ? selectedEvents.map((event) => {
        const Icon = event.kind === 'quiz' ? HelpCircle : ClipboardList
        const label = event.kind === 'quiz' ? 'Quiz opens' : event.kind === 'assignment-open' ? 'Assignment opens' : 'Assignment deadline'
        const studentHref = '/student/space?batchId=' + encodeURIComponent(event.batchId) + '&contentId=' + encodeURIComponent(event.contentId)
        return <div key={event.id} className="flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className={'h-fit rounded-lg p-2 ' + (event.kind === 'assignment-deadline' ? 'bg-red-500/10 text-red-600' : 'bg-primary/10 text-primary')}><Icon className="h-5 w-5" /></span><div><p className="font-semibold">{event.title}</p><p className="text-sm text-muted-foreground">{event.batchName} · {label}</p><time className="text-xs text-muted-foreground" dateTime={event.date}>{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div></div>{view === 'student' && <Button asChild size="sm" variant="outline"><Link href={studentHref}>Open in ICT Space</Link></Button>}</div>
      }) : <p className="py-6 text-center text-sm text-muted-foreground">Nothing scheduled for this date.</p>}</div></section>
    </CardContent></Card>
  </div>
}
