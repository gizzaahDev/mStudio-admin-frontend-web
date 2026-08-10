'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  approveStudent,
  approveTeacher,
  listPendingStudents,
  listPendingTeachers,
  getDashboardSummary,
  type DashboardSummary,
  type UserProfile,
} from '@/lib/backend-api'
import { Users, CheckCircle, BookOpen, TrendingUp, Loader2, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

export default function AdminDashboard() {
  const [pendingStudents, setPendingStudents] = useState<UserProfile[]>([])
  const [pendingTeachers, setPendingTeachers] = useState<UserProfile[]>([])
  const [loadingPending, setLoadingPending] = useState(true)
  const [approvingUid, setApprovingUid] = useState<string | null>(null)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)

  const loadPendingRequests = async () => {
    setLoadingPending(true)
    try {
      const [studentsResult, teachersResult] = await Promise.all([
        listPendingStudents(),
        listPendingTeachers(),
      ])
      setPendingStudents(studentsResult.students)
      setPendingTeachers(teachersResult.teachers)
    } catch (error: any) {
      toast.error(error.message || 'Could not load pending approvals')
    } finally {
      setLoadingPending(false)
    }
  }

  const loadSummary = async () => {
    try { setSummary((await getDashboardSummary()).summary) }
    catch (error: any) { toast.error(error.message || 'Could not load dashboard totals') }
  }

  useEffect(() => {
    void loadPendingRequests()
    void loadSummary()
    const timer = window.setInterval(() => { void loadSummary() }, 15000)
    return () => window.clearInterval(timer)
  }, [])

  const handleApproveStudent = async (uid: string) => {
    setApprovingUid(uid)
    try {
      await approveStudent(uid)
      toast.success('Student approved')
      setPendingStudents((students) => students.filter((student) => student.id !== uid && student.uid !== uid))
    } catch (error: any) {
      toast.error(error.message || 'Could not approve student')
    } finally {
      setApprovingUid(null)
    }
  }

  const handleApproveTeacher = async (uid: string) => {
    setApprovingUid(uid)
    try {
      await approveTeacher(uid)
      toast.success('Teacher approved')
      setPendingTeachers((teachers) => teachers.filter((teacher) => teacher.id !== uid && teacher.uid !== uid))
    } catch (error: any) {
      toast.error(error.message || 'Could not approve teacher')
    } finally {
      setApprovingUid(null)
    }
  }

  const totalPending = pendingStudents.length + pendingTeachers.length

  const stats = [
    {
      label: 'Total Students',
      value: summary ? String(summary.totalStudents) : '...',
      icon: Users,
      href: '/admin/students',
    },
    {
      label: 'Pending Approvals',
      value: loadingPending ? '...' : String(totalPending),
      icon: CheckCircle,
      href: '/admin',
    },
    {
      label: 'Attendance Today',
      value: summary ? String(summary.attendanceSessionsToday) : '...',
      icon: GraduationCap,
      href: '/admin/reports',
    },
    {
      label: 'Active Classes',
      value: summary ? String(summary.activeBatches) : '...',
      icon: BookOpen,
      href: '/admin/curriculum',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back! Review and approve student and teacher requests here.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                    </div>
                    <Icon className="h-8 w-8 text-primary/30" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Teacher Approval Requests</CardTitle>
                <CardDescription>Teachers can log in only after approval.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={loadPendingRequests} disabled={loadingPending}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingPending ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading teacher requests...
              </div>
            ) : pendingTeachers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending teacher requests right now.</p>
            ) : (
              <div className="space-y-4">
                {pendingTeachers.map((teacher) => {
                  const uid = teacher.uid ?? teacher.id
                  return (
                    <div key={uid} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-foreground">{teacher.displayName || 'Teacher'}</p>
                          <p className="text-sm text-muted-foreground">{teacher.email}</p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => handleApproveTeacher(uid)}
                          disabled={approvingUid === uid}
                          className="gap-2"
                        >
                          {approvingUid === uid && <Loader2 className="h-4 w-4 animate-spin" />}
                          Approve Teacher
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Student Approval Requests</CardTitle>
                <CardDescription>Students can log in only after approval.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={loadPendingRequests} disabled={loadingPending}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingPending ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading student requests...
              </div>
            ) : pendingStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending student requests right now.</p>
            ) : (
              <div className="space-y-4">
                {pendingStudents.map((student) => {
                  const uid = student.uid ?? student.id
                  return (
                    <div key={uid} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-foreground">
                            {student.displayName || `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || 'Student'}
                          </p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                          {student.parentEmail && (
                            <p className="text-xs text-muted-foreground">Parent: {student.parentEmail}</p>
                          )}
                          {student.phone && (
                            <p className="text-xs text-muted-foreground">Phone: {student.phone}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          onClick={() => handleApproveStudent(uid)}
                          disabled={approvingUid === uid}
                          className="gap-2"
                        >
                          {approvingUid === uid && <Loader2 className="h-4 w-4 animate-spin" />}
                          Approve Student
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" className="w-full justify-start" onClick={loadPendingRequests}>
              Review Pending Approvals
            </Button>
            <Link href="/admin/students">
              <Button variant="outline" className="w-full justify-start">
                Manage Students
              </Button>
            </Link>
            <Link href="/calendar">
              <Button variant="outline" className="w-full justify-start">
                Schedule Classes
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline" className="w-full justify-start">
                Generate Reports
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
