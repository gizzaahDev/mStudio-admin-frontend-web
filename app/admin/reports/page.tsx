'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Download, Printer, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getTeacherReports, type TeacherReportData } from '@/lib/backend-api'
import { useAppSettings } from '@/lib/app-settings-context'

const months = ['All months','January','February','March','April','May','June','July','August','September','October','November','December']
type Row = Array<string | number>

function downloadCsv(fileName: string, headers: string[], rows: Row[]) {
  const quote = (value: string | number) => '"' + String(value ?? '').replace(/"/g, '""') + '"'
  const csv = [headers, ...rows].map((row) => row.map(quote).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export default function AdminReportsPage() {
  const { settings } = useAppSettings()
  const now = new Date()
  const [data, setData] = useState<TeacherReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ batchId: '', classType: '', studentUid: '', year: now.getFullYear(), month: now.getMonth() + 1 })
  const [exam, setExam] = useState('')

  const load = async () => {
    setLoading(true)
    try { setData(await getTeacherReports({ ...filters, month: filters.month || undefined })) }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  const payments = data?.payments || []
  const paid = payments.filter((item) => item.paid && !item.student?.freeCard)
  const unpaid = payments.filter((item) => !item.paid && !item.student?.freeCard)
  const freeCards = payments.filter((item) => item.student?.freeCard)
  const results = useMemo(() => data?.results.filter((item) => !exam || item.exam.toLowerCase().includes(exam.toLowerCase())) || [], [data, exam])
  const paymentRows = (items: typeof payments): Row[] => items.map((item) => [item.student?.studentId || '', item.student?.name || '', item.student?.instituteName || '', item.student?.grade || '', months[item.month], item.year, item.student?.freeCard ? 'Free card' : item.paid ? 'Paid' : 'Unpaid'])
  const attendanceRows: Row[] = (data?.attendance || []).map((item) => [item.student?.studentId || '', item.student?.name || '', item.batchName, item.classType, item.date, item.attendance ? 'Present' : 'Absent'])
  const resultRows: Row[] = results.map((item) => [item.student?.studentId || '', item.student?.name || '', item.batchName, item.exam, item.category, item.date?.slice(0, 10) || '', item.score, item.total, item.total ? Math.round(item.score / item.total * 100) + '%' : '0%'])

  return <div className='space-y-6 print:bg-white print:text-black'>
    <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
      <div><p className='text-primary'>Live database reports</p><h1 className='text-3xl font-bold'>Admin Reports</h1><p className='text-muted-foreground'>Filter once, then download each report separately.</p></div>
      <div className='flex gap-2 print:hidden'><Button variant='outline' onClick={() => window.print()}><Printer className='h-4 w-4' />Print all / PDF</Button><Button disabled={loading} onClick={() => void load()}><RefreshCw className='h-4 w-4' />{loading ? 'Loading...' : 'Generate report'}</Button></div>
    </div>
    <Card className='print:hidden'><CardContent className='grid gap-3 pt-6 md:grid-cols-3 xl:grid-cols-5'>
      <select value={filters.batchId} onChange={(event) => setFilters({ ...filters, batchId: event.target.value })} className='h-9 rounded-lg border bg-background px-3'><option value=''>All batches</option>{data?.batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select>
      <select value={filters.classType} onChange={(event) => setFilters({ ...filters, classType: event.target.value })} className='h-9 rounded-lg border bg-background px-3'><option value=''>All class types</option>{settings.classTypes.map((type) => <option key={type}>{type}</option>)}</select>
      <select value={filters.studentUid} onChange={(event) => setFilters({ ...filters, studentUid: event.target.value })} className='h-9 rounded-lg border bg-background px-3'><option value=''>All students</option>{data?.students.map((student) => <option key={student.uid} value={student.uid}>{student.studentId} - {student.name}</option>)}</select>
      <Input aria-label='Report year' type='number' value={filters.year} onChange={(event) => setFilters({ ...filters, year: Number(event.target.value) })} />
      <select value={filters.month} onChange={(event) => setFilters({ ...filters, month: Number(event.target.value) })} className='h-9 rounded-lg border bg-background px-3'>{months.map((month, index) => <option key={month} value={index}>{month}</option>)}</select>
    </CardContent></Card>
    <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-5'>
      <Summary label='Students' value={data?.summary.students || 0} />
      <Summary label='Paid' value={paid.length} />
      <Summary label='Unpaid' value={unpaid.length} />
      <Summary label='Free cards' value={freeCards.length} />
      <Summary label='Marks' value={data?.summary.results || 0} />
    </div>
    <ReportTable title='Paid students' headers={['Index','Student','Institute','Grade','Month','Year','Status']} rows={paymentRows(paid)} onDownload={() => downloadCsv('paid-students.csv', ['Index','Student','Institute','Grade','Month','Year','Status'], paymentRows(paid))} />
    <ReportTable title='Unpaid students' headers={['Index','Student','Institute','Grade','Month','Year','Status']} rows={paymentRows(unpaid)} onDownload={() => downloadCsv('unpaid-students.csv', ['Index','Student','Institute','Grade','Month','Year','Status'], paymentRows(unpaid))} />
    <ReportTable title='Free-card students' headers={['Index','Student','Institute','Grade','Month','Year','Status']} rows={paymentRows(freeCards)} onDownload={() => downloadCsv('free-card-students.csv', ['Index','Student','Institute','Grade','Month','Year','Status'], paymentRows(freeCards))} />
    <ReportTable title='Attendance report' headers={['Index','Student','Batch','Class type','Date','Status']} rows={attendanceRows} onDownload={() => downloadCsv('attendance-report.csv', ['Index','Student','Batch','Class type','Date','Status'], attendanceRows)} />
    <Card><CardHeader><div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'><CardTitle className='flex items-center gap-2'><BarChart3 className='h-5 w-5' />Exam and marks report</CardTitle><div className='flex gap-2 print:hidden'><Input className='max-w-xs' value={exam} onChange={(event) => setExam(event.target.value)} placeholder='Filter exam name' /><Button variant='outline' onClick={() => downloadCsv('marks-report.csv', ['Index','Student','Batch','Exam','Category','Date','Score','Total','Percentage'], resultRows)}><Download className='h-4 w-4' />Download marks</Button></div></div></CardHeader><CardContent><DataTable headers={['Index','Student','Batch','Exam','Category','Date','Score','Total','Percentage']} rows={resultRows} /></CardContent></Card>
  </div>
}

function Summary({ label, value }: { label: string; value: number }) { return <Card><CardContent className='pt-5'><p className='text-sm text-muted-foreground'>{label}</p><p className='text-3xl font-bold'>{value}</p></CardContent></Card> }
function ReportTable({ title, headers, rows, onDownload }: { title: string; headers: string[]; rows: Row[]; onDownload: () => void }) { return <Card><CardHeader><div className='flex items-center justify-between gap-3'><CardTitle>{title} ({rows.length})</CardTitle><Button className='print:hidden' variant='outline' onClick={onDownload}><Download className='h-4 w-4' />Download CSV</Button></div></CardHeader><CardContent><DataTable headers={headers} rows={rows} /></CardContent></Card> }
function DataTable({ headers, rows }: { headers: string[]; rows: Row[] }) { return <div className='overflow-x-auto'><table className='w-full min-w-[700px] text-sm'><thead><tr className='border-b text-left'>{headers.map((header) => <th key={header} className='p-3'>{header}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={index} className='border-b'>{row.map((cell, cellIndex) => <td key={cellIndex} className='p-3'>{cell}</td>)}</tr>) : <tr><td className='p-6 text-center text-muted-foreground' colSpan={headers.length}>No matching records</td></tr>}</tbody></table></div> }