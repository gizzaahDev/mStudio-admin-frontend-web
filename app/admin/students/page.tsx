'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { listStudents, type UserProfile } from '@/lib/backend-api'
import { Loader2, Search, Users } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const loadStudents = async () => {
    setLoading(true)
    try {
      const result = await listStudents()
      setStudents(result.students)
    } catch (error: any) {
      toast.error(error.message || 'Could not load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  const filteredStudents = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return students
    return students.filter((student) => {
      const name = student.displayName || `${student.firstName ?? ''} ${student.lastName ?? ''}`
      return `${name} ${student.email} ${student.phone}`.toLowerCase().includes(term)
    })
  }, [query, students])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground mt-2">View registered students and their approval status.</p>
        </div>
        <Link href="/admin/approvals">
          <Button variant="outline">Review Approvals</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Students</p>
            <p className="mt-2 text-3xl font-bold">{students.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="mt-2 text-3xl font-bold">{students.filter((student) => student.status === 'approved').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="mt-2 text-3xl font-bold">{students.filter((student) => student.status === 'pending').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Student Directory
          </CardTitle>
          <CardDescription>Search by name, email, or phone number.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search students..."
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading students...
            </div>
          ) : filteredStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students found.</p>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((student) => {
                const uid = student.uid ?? student.id
                const name = student.displayName || `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || 'Student'
                return (
                  <div key={uid} className="rounded-lg border border-border p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-foreground">{name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        {student.phone && <p className="text-xs text-muted-foreground">Phone: {student.phone}</p>}
                        {student.parentEmail && <p className="text-xs text-muted-foreground">Parent: {student.parentEmail}</p>}
                      </div>
                      <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium capitalize text-primary">
                        {student.status ?? 'unknown'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
