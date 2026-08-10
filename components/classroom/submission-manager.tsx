'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, Download, FileText, Search } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { listAssignmentSubmissions, type AssignmentSubmissionRecord } from '@/lib/backend-api'

export function SubmissionManager({ audience }: { audience: 'teacher' | 'admin' }) {
  const [submissions, setSubmissions] = useState<AssignmentSubmissionRecord[]>([])
  const [batchId, setBatchId] = useState('all')
  const [contentId, setContentId] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listAssignmentSubmissions().then(({ submissions }) => setSubmissions(submissions)).catch((loadError: any) => setError(loadError.message || 'Could not load assignment submissions')).finally(() => setLoading(false))
  }, [])

  const batches = useMemo(() => Array.from(new Map(submissions.map((item) => [item.batchId, item.batchName])).entries()), [submissions])
  const assignments = useMemo(() => Array.from(new Map(submissions.filter((item) => batchId === 'all' || item.batchId === batchId).map((item) => [item.contentId, item.assignmentTitle])).entries()), [submissions, batchId])
  const visible = useMemo(() => submissions.filter((item) => {
    if (batchId !== 'all' && item.batchId !== batchId) return false
    if (contentId !== 'all' && item.contentId !== contentId) return false
    const value = (item.studentName + ' ' + item.studentId + ' ' + item.studentEmail + ' ' + item.assignmentTitle + ' ' + item.batchName).toLowerCase()
    return value.includes(search.toLowerCase())
  }), [submissions, batchId, contentId, search])
  const onTime = submissions.filter((item) => item.status !== 'late').length
  const late = submissions.filter((item) => item.status === 'late').length

  return <div className="space-y-7">
    <div><p className="text-sm font-medium text-primary">{audience === 'teacher' ? 'Student work' : 'Submission oversight'}</p><h1 className="mt-1 text-3xl font-bold">Assignment Submissions</h1><p className="mt-2 text-muted-foreground">Identify every submitted file by batch, assignment, student name, and student ID.</p></div>
    <div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="pt-6"><FileText className="h-7 w-7 text-primary" /><p className="mt-3 text-sm text-muted-foreground">Total submissions</p><p className="text-3xl font-bold">{submissions.length}</p></CardContent></Card><Card><CardContent className="pt-6"><CheckCircle2 className="h-7 w-7 text-emerald-600" /><p className="mt-3 text-sm text-muted-foreground">Before deadline</p><p className="text-3xl font-bold">{onTime}</p></CardContent></Card><Card><CardContent className="pt-6"><Clock3 className="h-7 w-7 text-red-600" /><p className="mt-3 text-sm text-muted-foreground">Late</p><p className="text-3xl font-bold">{late}</p></CardContent></Card></div>
    <Card><CardHeader><CardTitle>Find submissions</CardTitle><CardDescription>{loading ? 'Loading submissions from Firebase...' : visible.length + ' record' + (visible.length === 1 ? '' : 's') + ' shown'}</CardDescription></CardHeader><CardContent className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1.5fr]"><select value={batchId} onChange={(event) => { setBatchId(event.target.value); setContentId('all') }} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="all">All batches</option>{batches.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><select value={contentId} onChange={(event) => setContentId(event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="all">All assignments</option>{assignments.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Student name, ID, email, batch or assignment" /></div></div>
      {error && <p className="rounded-lg bg-red-500/10 p-4 text-sm text-red-600">{error}</p>}
      {!loading && !error && !visible.length && <p className="py-10 text-center text-muted-foreground">No submissions match these filters.</p>}
      <div className="space-y-3">{visible.map((item) => <div key={item.batchId + item.contentId + item.studentUid} className="grid gap-3 rounded-xl border p-4 lg:grid-cols-[1.3fr_1.3fr_1fr_auto] lg:items-center"><div><p className="font-semibold">{item.studentName}</p><p className="text-sm font-medium text-primary">{item.studentId || 'Student ID pending'}</p><p className="text-xs text-muted-foreground">{item.studentEmail}</p></div><div><p className="font-medium">{item.assignmentTitle}</p><p className="text-sm text-muted-foreground">{item.batchName}</p></div><div><p className={item.status === 'late' ? 'font-medium text-red-600' : 'font-medium text-emerald-600'}>{item.status === 'late' ? 'Submitted after deadline' : 'Submitted before deadline'}</p><p className="text-xs text-muted-foreground">{new Date(item.submittedAt).toLocaleString()}</p>{item.deadline && <p className="text-xs text-muted-foreground">Deadline: {new Date(item.deadline).toLocaleString()}</p>}</div><a href={item.fileUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm text-primary-foreground"><Download className="h-4 w-4" />{item.fileName || 'Open file'}</a></div>)}</div>
    </CardContent></Card>
  </div>
}
