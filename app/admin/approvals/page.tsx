'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  approveStudent,
  approveTeacher,
  listPendingStudents,
  listPendingTeachers,
  type UserProfile,
  fetchTeacherVerificationImage,
  listTeacherProfileChangeRequests,
  decideTeacherProfileChangeRequest,
  type TeacherProfileChangeRequest,
} from '@/lib/backend-api'
import { CheckCircle, GraduationCap, Loader2, Users } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function AdminApprovalsPage() {
  const [students, setStudents] = useState<UserProfile[]>([])
  const [teachers, setTeachers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [approvingUid, setApprovingUid] = useState<string | null>(null)
  const [profileChanges, setProfileChanges] = useState<TeacherProfileChangeRequest[]>([])

  const loadApprovals = async () => {
    setLoading(true)
    try {
      const [studentResult, teacherResult, profileChangeResult] = await Promise.all([
        listPendingStudents(),
        listPendingTeachers(),
        listTeacherProfileChangeRequests(),
      ])
      setStudents(studentResult.students)
      setTeachers(teacherResult.teachers)
      setProfileChanges(profileChangeResult.requests)
    } catch (error: any) {
      toast.error(error.message || 'Could not load approvals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApprovals()
  }, [])

  const approve = async (profile: UserProfile, type: 'student' | 'teacher') => {
    const uid = profile.uid ?? profile.id
    setApprovingUid(uid)
    try {
      if (type === 'teacher') {
        await approveTeacher(uid)
        setTeachers((items) => items.filter((item) => item.id !== uid && item.uid !== uid))
        toast.success('Teacher approved')
      } else {
        await approveStudent(uid)
        setStudents((items) => items.filter((item) => item.id !== uid && item.uid !== uid))
        toast.success('Student approved')
      }
    } catch (error: any) {
      toast.error(error.message || 'Could not approve request')
    } finally {
      setApprovingUid(null)
    }
  }
  const decideProfileChange = async (request: TeacherProfileChangeRequest, approve: boolean) => { setApprovingUid(request.id); try { await decideTeacherProfileChangeRequest(request.id, approve); setProfileChanges((items) => items.filter((item) => item.id !== request.id)); toast.success(approve ? 'Primary teacher details updated' : 'Change request rejected') } catch (error: any) { toast.error(error.message || 'Could not process the request') } finally { setApprovingUid(null) } }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Approvals</h1>
          <p className="text-muted-foreground mt-2">Approve pending student and teacher accounts.</p>
        </div>
        <Button variant="outline" onClick={loadApprovals} disabled={loading}>Refresh</Button>
      </div>

      <div className="space-y-6">
        <Card><CardHeader><CardTitle>Teacher profile change requests</CardTitle><CardDescription>Review secured changes to registered teacher name, primary phone and Gmail.</CardDescription></CardHeader><CardContent className="space-y-3">{profileChanges.length === 0 ? <p className="text-sm text-muted-foreground">No primary-detail changes are waiting.</p> : profileChanges.map((request) => <div key={request.id} className="rounded-xl border p-4"><p className="font-semibold">{request.teacherName || request.teacherUid}</p><div className="mt-3 grid gap-3 text-sm md:grid-cols-3"><ChangeValue label="Name" before={request.current?.displayName} after={request.requested?.displayName} /><ChangeValue label="Phone" before={request.current?.phone} after={request.requested?.phone} /><ChangeValue label="Gmail" before={request.current?.email} after={request.requested?.email} /></div>{request.requested?.reason && <p className="mt-3 text-sm text-muted-foreground">Reason: {request.requested.reason}</p>}<div className="mt-4 flex gap-2"><Button disabled={approvingUid === request.id} onClick={() => void decideProfileChange(request, true)}>Approve changes</Button><Button variant="outline" disabled={approvingUid === request.id} onClick={() => void decideProfileChange(request, false)}>Reject</Button></div></div>)}</CardContent></Card>
        <ApprovalCard
          title="Teacher Requests"
          description="Separate-workspace requests receive access when approved. Partner requests need an admin or institute owner to assign them to an institute."
          icon="teacher"
          loading={loading}
          users={teachers}
          emptyText="No pending teacher requests."
          approvingUid={approvingUid}
          onApprove={(profile) => approve(profile, 'teacher')}
        />
        <ApprovalCard
          title="Student Requests"
          description="Students can access the student dashboard after approval."
          icon="student"
          loading={loading}
          users={students}
          emptyText="No pending student requests."
          approvingUid={approvingUid}
          onApprove={(profile) => approve(profile, 'student')}
        />
      </div>
    </div>
  )
}

function ChangeValue({ label, before, after }: { label: string; before?: string; after?: string }) { return <div className="rounded-lg bg-muted/40 p-3"><p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-1 line-through opacity-60">{before || 'Empty'}</p><p className="font-medium text-primary">{after || 'Empty'}</p></div> }

function ApprovalCard({
  title,
  description,
  icon,
  loading,
  users,
  emptyText,
  approvingUid,
  onApprove,
}: {
  title: string
  description: string
  icon: 'teacher' | 'student'
  loading: boolean
  users: UserProfile[]
  emptyText: string
  approvingUid: string | null
  onApprove: (profile: UserProfile) => void
}) {
  const Icon = icon === 'teacher' ? GraduationCap : Users

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading requests...
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => {
              const uid = user.uid ?? user.id
              const name = user.displayName || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'User'
              return (
                <div key={uid} className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-background p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>{icon === 'teacher' && <div className="mt-4 space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Pending teacher verification</span>
                          <span className="rounded-full border px-3 py-1 text-xs font-medium">{user.separateClassAccount === false || user.requestedAccountMode === 'partner' ? 'Partner account' : 'Independent teacher account'}</span>
                        </div>
                        <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                          <div><p className="text-xs text-muted-foreground">Firebase UID</p><p className="break-all font-semibold">{uid}</p></div>
                          <div><p className="text-xs text-muted-foreground">Email</p><p className="break-all font-semibold">{user.email || 'Missing'}</p></div>
                          <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-semibold">{user.phone || 'Not provided'}</p></div>
                          <div><p className="text-xs text-muted-foreground">NIC number</p><p className="font-semibold">{user.nicNumber || 'Missing'}</p></div>
                          <div><p className="text-xs text-muted-foreground">Expected students</p><p className="font-semibold">{user.estimatedStudentCount || 'Missing'}</p></div>
                          <div><p className="text-xs text-muted-foreground">Requested package</p><p className="font-semibold">{user.subscriptionTierId || 'Missing'}</p></div>
                          <div><p className="text-xs text-muted-foreground">Billing cycle</p><p className="font-semibold capitalize">{user.billingCycle || 'Missing'}</p></div>
                          <div><p className="text-xs text-muted-foreground">Regular price</p><p className="font-semibold">LKR {Number(user.subscriptionRegularPrice || user.subscriptionPrice || 0).toLocaleString()}</p></div>
                          <div><p className="text-xs text-muted-foreground">Offer / payable price</p><p className="font-semibold text-emerald-600">LKR {Number(user.subscriptionPrice || 0).toLocaleString()}{user.subscriptionOfferPrice ? ` (offer: LKR ${Number(user.subscriptionOfferPrice).toLocaleString()})` : ''}</p></div>
                          <div><p className="text-xs text-muted-foreground">Requested at</p><p className="font-semibold">{user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Not recorded'}</p></div>
                          <div><p className="text-xs text-muted-foreground">Verification</p><p className="font-semibold">{user.verificationComplete ? 'Complete' : 'Incomplete'}</p></div>
                          <div><p className="text-xs text-muted-foreground">Requested access</p><p className="font-semibold">{user.separateClassAccount === false || user.requestedAccountMode === 'partner' ? 'Existing institute partner' : 'Separate class workspace'}</p></div>
                        </div>
                        <div>
                          <p className="mb-2 text-sm font-semibold">NIC identity images</p>
                          <div className="grid gap-3 sm:grid-cols-2">{user.nicFrontUrl ? <SecureNicImage path={user.nicFrontUrl} label="NIC front" /> : <MissingNic label="NIC front missing" />}{user.nicBackUrl ? <SecureNicImage path={user.nicBackUrl} label="NIC back" /> : <MissingNic label="NIC back missing" />}</div>
                        </div>
                      </div>}
                      {icon === 'student' && <p className="mt-1 text-sm text-muted-foreground">Birthday: {user.birthday ? new Date(user.birthday + 'T00:00:00').toLocaleDateString() : 'Not provided'}</p>}
                    </div>
                    <Button className="gap-2" onClick={() => onApprove(user)} disabled={approvingUid === uid || (icon === 'teacher' && (!user.verificationComplete || !user.nicFrontUrl || !user.nicBackUrl))}>
                      {approvingUid === uid ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      {icon === 'teacher' ? (user.separateClassAccount === false || user.requestedAccountMode === 'partner' ? 'Approve request' : 'Approve & grant workspace') : 'Approve'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SecureNicImage({ path, label }: { path: string; label: string }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    let active = true
    let created = ''
    void fetchTeacherVerificationImage(path).then((value) => { created = value; if (active) setUrl(value) }).catch(() => undefined)
    return () => { active = false; if (created) URL.revokeObjectURL(created) }
  }, [path])
  return <button type="button" className="text-left" onClick={() => url && window.open(url, '_blank')} disabled={!url}>{url ? <img src={url} alt={label} className="h-32 w-full rounded-lg border bg-black/5 object-contain" /> : <div className="flex h-32 items-center justify-center rounded-lg border"><Loader2 className="h-5 w-5 animate-spin" /></div>}<span className="text-xs text-primary">Open {label}</span></button>
}
function MissingNic({ label }: { label: string }) {
  return <div className="flex h-40 items-center justify-center rounded-xl border border-dashed bg-muted/30 text-sm text-muted-foreground">{label}</div>
}
