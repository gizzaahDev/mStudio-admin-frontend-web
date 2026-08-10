import { auth } from './firebase'

const API_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000').replace(/\/+$/, '')
const API_CACHE_PREFIX = 'magical-ict:api-cache:v1:'
const API_CACHE_TTL_MS = 2 * 60 * 1000
const pendingReads = new Map<string, Promise<unknown>>()

function cacheScope() { return auth.currentUser?.uid ?? 'public' }
function cacheKey(path: string) { return API_CACHE_PREFIX + cacheScope() + ':' + path }
export function clearApiCache(scope = cacheScope()) {
  if (typeof window === 'undefined') return
  const prefix = API_CACHE_PREFIX + scope + ':'
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index)
    if (key?.startsWith(prefix)) localStorage.removeItem(key)
  }
}
function readApiCache<T>(key: string): T | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const cached = JSON.parse(localStorage.getItem(key) || 'null') as { expiresAt: number; value: T } | null
    if (!cached || cached.expiresAt <= Date.now()) { localStorage.removeItem(key); return undefined }
    return cached.value
  } catch { localStorage.removeItem(key); return undefined }
}
function writeApiCache<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify({ expiresAt: Date.now() + API_CACHE_TTL_MS, value })) }
  catch { /* Storage may be unavailable or full. */ }
}

export type UserRole = 'admin' | 'student' | 'parent' | 'teacher'
export type UserStatus = 'pending' | 'approved' | 'rejected'

export interface UserProfile {
  id: string
  uid?: string
  displayName?: string
  firstName?: string
  lastName?: string
  email?: string
  parentEmail?: string
  phone?: string
  birthday?: string
  profileImageUrl?: string
  chatColor?: string
  studentId?: string
  teacherPublicId?: string
  teacherCode?: string
  batchIds?: string[]
  role?: UserRole
  status?: UserStatus
  instituteId?: string
  grade?: string
  freeCard?: boolean
  separateClassAccount?: boolean
  requestedAccountMode?: 'separate' | 'partner'
  workspaceAccessStatus?: 'pending' | 'active'
  nicNumber?: string
  nicFrontUrl?: string
  nicBackUrl?: string
  estimatedStudentCount?: number
  subscriptionTierId?: string
  billingCycle?: 'monthly' | 'yearly'
  subscriptionPrice?: number
  subscriptionRegularPrice?: number
  subscriptionOfferPrice?: number
  createdAt?: string
  updatedAt?: string
  verificationComplete?: boolean
}

export interface StudentRegistrationPayload {
  firstName: string
  lastName: string
  email: string
  parentEmail?: string
  phone?: string
  birthday: string
  grade: string
  teacherIds?: string[]
}

export interface StaffRegistrationPayload {
  displayName: string
  email: string
  role: 'admin' | 'teacher'
}

export interface BatchContentPayload {
  type: 'heading' | 'text' | 'notice' | 'link' | 'divider' | 'resource' | 'quiz' | 'assignment'
  content: string
  url?: string
  batchName?: string
  style: {
    color: string
    background: string
    borderColor?: string
    fontSize: 'sm' | 'base' | 'lg' | 'xl' | '2xl'
    fontWeight: 'normal' | 'medium' | 'bold'
    fontStyle?: 'normal' | 'italic'
    textDecoration?: 'none' | 'underline'
    align: 'left' | 'center' | 'right'
  }
}

export interface BatchContent extends BatchContentPayload {
  id: string
  order: number
  createdAt: string
  updatedAt?: string
  createdBy?: string
}

export interface FirestoreBatch { id: string; name: string; institute?: string; year: string; classTypes: string[]; studentIds: string[] }

export type ChatMessageType = 'text' | 'notice' | 'audio' | 'image' | 'video' | 'file'
export interface ConversationSummary {
  studentUid: string
  studentName: string
  studentId: string
  phone?: string
  lastMessage: string
  lastMessageType?: string
  lastMessageAt: string
  lastMessageSenderUid?: string
  lastMessageId?: string
}
export interface ChatMessage {
  id: string
  senderUid: string
  senderRole: 'student' | 'teacher'
  senderName: string
  type: ChatMessageType
  text: string
  fileUrl?: string
  fileName?: string
  contentType?: string
  createdAt: string
  deliveredAt?: string
  readAt?: string
  noticeColor?: 'red' | 'green' | 'yellow' | 'orange'
  replyToId?: string
  replyText?: string
  replyType?: ChatMessageType
  replyFileName?: string
}
export interface SendChatMessage {
  type: ChatMessageType
  text?: string
  fileUrl?: string
  fileName?: string
  contentType?: string
  noticeColor?: 'red' | 'green' | 'yellow' | 'orange'
  replyToId?: string
  replyText?: string
  replyType?: ChatMessageType
  replyFileName?: string
}

export async function backendRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || 'GET').toUpperCase()
  const canCache = method === 'GET' && init.cache !== 'no-store'
  const key = cacheKey(path)
  if (canCache) {
    const cached = readApiCache<T>(key)
    if (cached !== undefined) return cached
    const pending = pendingReads.get(key)
    if (pending) return pending as Promise<T>
  }
  const request = (async () => {  const token = await auth.currentUser?.getIdToken()
  const headers = new Headers(init.headers)

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const fieldErrors = body?.details?.fieldErrors as Record<string, string[] | undefined> | undefined
    const firstFieldError = fieldErrors ? Object.entries(fieldErrors).find(([, messages]) => messages?.length) : undefined
    const validationMessage = firstFieldError ? `${firstFieldError[0]}: ${firstFieldError[1]?.[0]}` : ''
    throw new Error(validationMessage ? `${body?.error || 'Request failed'} â€” ${validationMessage}` : (body?.error ?? `Backend request failed (${response.status})`))
  }

  if (response.status === 204) { if (method !== 'GET') clearApiCache(); return undefined as T }
  const raw = await response.text()
  if (!raw.trim()) { if (method !== 'GET') clearApiCache(); return undefined as T }
  const data = JSON.parse(raw) as T
  if (canCache) writeApiCache(key, data)
  else if (method !== 'GET') clearApiCache()
  return data
  })()
  if (canCache) pendingReads.set(key, request)
  try { return await request } finally { if (canCache) pendingReads.delete(key) }
}

export function listConversations() {
  return backendRequest<{ conversations: ConversationSummary[] }>('/api/messages/conversations')
}

export function listConversationMessages(studentUid: string) {
  return backendRequest<{ messages: ChatMessage[] }>('/api/messages/conversations/' + studentUid + '/messages')
}

export function sendChatMessage(studentUid: string, payload: SendChatMessage) {
  return backendRequest<{ message: ChatMessage }>('/api/messages/conversations/' + studentUid + '/messages', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function uploadBatchFile(file: File) {
  const token = await auth.currentUser?.getIdToken()
  const response = await fetch(API_URL + '/api/classroom/uploads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-File-Name': file.name,
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: file,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? 'File upload failed')
  }
  const result = await response.json() as { url: string; fileName: string }
  return { ...result, url: API_URL + result.url }
}

export function getMyProfile() {
  return backendRequest<{ profile: UserProfile | null }>('/api/users/me')
}

export async function checkStudentEmailAvailability(email: string) {
  const response = await fetch(API_URL + '/api/users/student-email-availability?email=' + encodeURIComponent(email))
  if (!response.ok) throw new Error('Could not check this email')
  return response.json() as Promise<{ available: boolean }>
}

export function updateStudentProfile(payload: { firstName: string; lastName: string; parentEmail?: string; birthday?: string; profileImageUrl?: string; chatColor?: string }) {
  return backendRequest<{ profile: UserProfile }>('/api/users/student-profile', { method: 'PATCH', body: JSON.stringify(payload) })
}

export function registerStudentProfile(payload: StudentRegistrationPayload) {
  return backendRequest<{ profile: UserProfile }>('/api/users/student-registration', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function registerStaffProfile(payload: StaffRegistrationPayload) {
  return backendRequest<{ profile: UserProfile }>('/api/users/staff-registration', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listStudents() {
  return backendRequest<{ students: UserProfile[] }>('/api/users/students')
}

export function listTeacherStudents() {
  return backendRequest<{ students: UserProfile[] }>('/api/users/teacher-students')
}

export interface StudentBatch {
  id: string
  name: string
  classTypes: string[]
}

export function assignStudentToBatch(uid: string, batchId: string, batchName?: string) {
  return backendRequest<{ profile: UserProfile }>('/api/users/' + uid + '/batches/' + batchId, {
    method: 'POST',
    body: JSON.stringify({ batchName }),
  })
}

export function listMyBatches() {
  return backendRequest<{ batches: StudentBatch[] }>('/api/users/my-batches')
}

export function listTeachers() {
  return backendRequest<{ teachers: UserProfile[] }>('/api/users/teachers')
}

export function removeTeacherAccount(uid: string) { return backendRequest<void>('/api/users/teachers/' + uid, { method: 'DELETE' }) }

export function listAdmins() {
  return backendRequest<{ admins: UserProfile[] }>('/api/users/admins')
}

export function createAdminAccount(payload: { displayName: string; email: string; password: string }) {
  return backendRequest<{ profile: UserProfile }>('/api/users/admins', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function bootstrapAdminProfile() {
  return backendRequest<{ profile: UserProfile }>('/api/users/bootstrap-admin', {
    method: 'POST',
  })
}

export function listPendingStudents() {
  return backendRequest<{ students: UserProfile[] }>('/api/users/pending-students')
}

export function listPendingTeachers() {
  return backendRequest<{ teachers: UserProfile[] }>('/api/users/pending-teachers')
}

export function approveUser(uid: string) {
  return backendRequest<{ profile: UserProfile }>(`/api/users/${uid}/approve`, {
    method: 'PATCH',
  })
}

export const approveStudent = approveUser
export const approveTeacher = approveUser

export function listBatchContent(batchId: string) {
  return backendRequest<{ content: BatchContent[] }>('/api/classroom/batches/' + batchId + '/content')
}

export function listBatches() {
  return backendRequest<{ batches: FirestoreBatch[] }>('/api/classroom/batches')
}

export function createBatch(payload: { name: string; institute?: string; year: string; classTypes: string[] }) {
  return backendRequest<{ batch: FirestoreBatch }>('/api/classroom/batches', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateBatch(batchId: string, payload: { name: string; institute?: string; year: string; classTypes: string[] }) {
  return backendRequest<{ batch: FirestoreBatch }>('/api/classroom/batches/' + batchId, { method: 'PATCH', body: JSON.stringify(payload) })
}

export function deleteBatch(batchId: string) {
  return backendRequest<void>('/api/classroom/batches/' + batchId, { method: 'DELETE' })
}

export function reorderBatchContent(batchId: string, contentIds: string[]) {
  return backendRequest<void>('/api/classroom/batches/' + batchId + '/content/order', { method: 'PATCH', body: JSON.stringify({ contentIds }) })
}

export function publishBatchContent(batchId: string, payload: BatchContentPayload) {
  return backendRequest<{ content: BatchContent }>('/api/classroom/batches/' + batchId + '/content', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateBatchContent(batchId: string, contentId: string, payload: BatchContentPayload) {
  return backendRequest<{ content: BatchContent }>('/api/classroom/batches/' + batchId + '/content/' + contentId, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteBatchContent(batchId: string, contentId: string) {
  return backendRequest<void>('/api/classroom/batches/' + batchId + '/content/' + contentId, { method: 'DELETE' })
}

export interface QuizAttempt { id?: string; round: number; answers: Record<string, string>; score: number; total: number; submittedAt: string }

export function submitQuizAttempt(batchId: string, contentId: string, answers: Record<string, string>) {
  return backendRequest<{ attempt: QuizAttempt }>('/api/classroom/batches/' + batchId + '/content/' + contentId + '/quiz-attempts', { method: 'POST', body: JSON.stringify({ answers }) })
}

export function listMyQuizAttempts(batchId: string, contentId: string) {
  return backendRequest<{ attempts: QuizAttempt[] }>('/api/classroom/batches/' + batchId + '/content/' + contentId + '/quiz-attempts/me')
}

export interface AssignmentSubmission {
  id: string
  fileName: string
  originalName: string
  fileUrl: string
  contentType?: string
  size?: number
  status: 'submitted' | 'late'
  lateSeconds: number
  deadline?: string | null
  submittedAt: string
  firstSubmittedAt?: string
}

export interface AssignmentSubmissionRecord extends AssignmentSubmission {
  batchId: string
  batchName: string
  contentId: string
  assignmentTitle: string
  studentUid: string
  studentName: string
  studentId: string
  studentEmail?: string
}

export function submitAssignment(batchId: string, contentId: string, payload: { fileName: string; originalName: string; fileUrl: string; contentType?: string; size?: number }) {
  return backendRequest<{ submission: AssignmentSubmission }>('/api/classroom/batches/' + batchId + '/content/' + contentId + '/submissions', { method: 'POST', body: JSON.stringify(payload) })
}

export function getMyAssignmentSubmission(batchId: string, contentId: string) {
  return backendRequest<{ submission: AssignmentSubmission | null }>('/api/classroom/batches/' + batchId + '/content/' + contentId + '/submissions/me')
}

export function listAssignmentSubmissions() {
  return backendRequest<{ submissions: AssignmentSubmissionRecord[] }>('/api/classroom/assignment-submissions')
}

export type ResultCategory = string
export interface StudentResult {
  id: string
  batchId: string
  batchName: string
  source: 'teacher' | 'quiz'
  title: string
  category: ResultCategory
  score: number
  total: number
  resultDate: string
}

export function createResultSheet(batchId: string, payload: { title: string; category: ResultCategory; total: number; resultDate: string; marks: Array<{ studentUid: string; score: number }> }) {
  return backendRequest<{ sheet: { id: string; title: string; category: ResultCategory; total: number; resultDate: string } }>('/api/classroom/batches/' + batchId + '/result-sheets', { method: 'POST', body: JSON.stringify(payload) })
}

export function listMyResults() {
  return backendRequest<{ results: StudentResult[] }>('/api/classroom/results/me')
}

export type AttendanceClassType = string
export interface AttendanceSession {
  id: string
  batchId: string
  classType: AttendanceClassType
  date: string
  studentCount: number
  presentCount: number
  records: Array<{ id: string; studentUid: string; attendance: 0 | 1; present: boolean }>
}

export function getAttendance(batchId: string, classType: AttendanceClassType, date: string) {
  return backendRequest<{ session: AttendanceSession | null }>('/api/classroom/batches/' + batchId + '/attendance?classType=' + encodeURIComponent(classType) + '&date=' + encodeURIComponent(date))
}

export function saveAttendance(batchId: string, payload: { classType: AttendanceClassType; date: string; records: Array<{ studentUid: string; attendance: 0 | 1 }> }) {
  return backendRequest<{ session: AttendanceSession }>('/api/classroom/batches/' + batchId + '/attendance', { method: 'PUT', body: JSON.stringify(payload) })
}

export interface AppSettings {
  deployment: {
    mode: 'individual' | 'institute'
    enabled: boolean
    instituteAccessEnabled: boolean
    teacherSubscriptionsEnabled: boolean
    teacherTrialDays: number
    subscriptionPlans: { monthly: { current: number; regular: number; discountPercent: number }; yearly: { current: number; regular: number; discountPercent: number }; lifetime: { current: number; regular: number; discountPercent: number } }
    teacherSubscriptionPlans: Record<'starter-50' | 'growth-150' | 'academy-300' | 'pro-500' | 'scale-1000' | 'enterprise', { maxStudents: number | null; monthly: number; yearly: number; monthlyOffer: number; yearlyOffer: number }>
  }
  idPrefix: string
  appName: string
  subjectName: string
  logoUrl: string
  mobileAppIcons: { student: string; teacher: string; admin: string; adaptiveBackgroundColor: string }
  spaceName: string
  studentWelcomeMessage: string
  about: { studentApkVersion: string; teacherApkVersion: string; thankYouMessage: string; developerName: string; developerContact: string; developerWebsite: string }
  maintenance: {
    student: { enabled: boolean; reason: string; startsAt: string; endsAt: string; notifyTeachers: boolean }
    teacher: { enabled: boolean; reason: string; startsAt: string; endsAt: string; notifyTeachers: boolean }
  }
  teacherImageFrame: { shape: 'square' | 'rounded' | 'circle' | 'soft' | 'pill' | 'hexagon' | 'diamond' | 'arch' | 'ticket' | 'squircle'; overlayUrl: string; overlayLabel: string }
  visualEffects: { cardBlur: number; headerBlur: number; footerBlur: number; cardTransparent: boolean; cardOpacity: number; headerTransparent: boolean; headerOpacity: number; footerTransparent: boolean; footerOpacity: number; fallingEnabled: boolean; fallingAssetUrl: string; fallingSymbol: string; fallingCount: number; holidayGreetings: boolean }
  mobileVisualEffects: { student: { cardBlur: number; cardTransparent: boolean; cardOpacity: number }; teacher: { cardBlur: number; cardTransparent: boolean; cardOpacity: number } }
  navigationOrder: { student: string[]; teacher: string[]; admin: string[] }
  dashboardOrder: { student: string[]; teacher: string[] }
  header: { enabled: boolean; showLogo: boolean; showAppName: boolean; showGreeting: boolean; showLanguage: boolean; showTheme: boolean; showSettings: boolean; showSignOut: boolean }
  footer: { enabled: boolean; text: string; copyrightText: string; poweredBy: string; backgroundColor: string; textColor: string; fontSize: number; minHeight: number; alignment: 'left' | 'center' | 'right'; mapUrl: string; imageUrl: string; imageSize: number; contentOrder: string[]; links: Array<{ label: string; url: string }> }
  appearance: {
    headerColor: string
    headerTextColor: string
    primaryColor: string
    accentColor: string
    backgroundEffect: BackgroundEffect
  }
  effects: {
    student: { backgroundEffect: BackgroundEffect; pointerEffect: PointerEffect }
    teacher: { backgroundEffect: BackgroundEffect; pointerEffect: PointerEffect }
  }
  portalThemes: {
    teacher: { light: PortalThemeMode; dark: PortalThemeMode }
  }
  studentMoods: Record<StudentMoodKey, StudentMoodConfiguration>
  sidebarVisibility: {
    student: Record<string, boolean>
    teacher: Record<string, boolean>
    admin: Record<string, boolean>
  }
  reception: { title: string; welcomeText: string; teacherName: string; teacherPhone: string; teacherEmail: string; instituteName: string; instituteDetails: string; address: string; mapUrl: string; institutions: Array<{ name: string; mapUrl: string; address: string; phone: string; grades: string[]; subjects: string[] }> }
  classTypes: string[]
  resultCategories: string[]
  teacherGrades: string[]
  teacherSubjects: string[]
  labels: { student: Record<string, string>; teacher: Record<string, string>; admin: Record<string, string> }
}

export type BackgroundEffect = 'none' | 'rectangle-mesh' | 'hex-lattice' | 'blueprint' | 'circuit-board' | 'radial-rings' | 'aurora' | 'waves' | 'starfield' | 'diagonal-stripes' | 'soft-orbs'
export type PointerEffect = 'none' | 'sparkles' | 'glow' | 'bubbles' | 'comet' | 'confetti' | 'stars' | 'rings' | 'fireflies' | 'pixel' | 'ripple'
export type StudentMoodKey = 'focus' | 'happy' | 'calm' | 'energy' | 'dream'
export interface PortalThemeMode {
  headerColor: string
  headerTextColor: string
  primaryColor: string
  accentColor: string
  backgroundColor: string
  cardColor: string
  textColor: string
  mutedTextColor: string
  backgroundEffect: BackgroundEffect
  pointerEffect: PointerEffect
  backgroundImage: string
  backgroundImageOpacity: number
}
export interface StudentMoodConfiguration {
  label: string
  emoji: string
  description: string
  light: PortalThemeMode
  dark: PortalThemeMode
}

export function getAppSettings() {
  return backendRequest<{ settings: AppSettings }>('/api/settings')
}

export function updateAppSettings(settings: AppSettings) {
  return backendRequest<{ settings: AppSettings }>('/api/settings', { method: 'PUT', body: JSON.stringify(settings) })
}

export function updateMobileAppIcon(role: 'student' | 'teacher' | 'admin', iconUrl: string) {
  return backendRequest<{ mobileAppIcons: AppSettings['mobileAppIcons'] }>(`/api/settings/mobile-app-icons/${role}`, { method: 'PUT', body: JSON.stringify({ iconUrl }) })
}
export function updateFooterSettings(footer: AppSettings['footer']) {
  return backendRequest<{ footer: AppSettings['footer'] }>('/api/settings/footer', { method: 'PUT', body: JSON.stringify(footer) })
}

export interface AttendanceHistoryItem {
  id: string
  batchId: string
  batchName: string
  classType: string
  date: string
  attendance: 0 | 1
}

export interface DashboardSummary {
  totalStudents: number
  totalTeachers: number
  activeBatches: number
  pendingStudents: number
  pendingTeachers: number
  attendanceSessionsToday: number
  totalAttendanceSessions: number
  unreadMessages: number
  pendingAssignments: number
  recentResults: StudentResult[]
  upcomingItems: Array<{ id: string; batchId: string; batchName: string; type: 'assignment' | 'quiz'; title: string; date: string }>
  attendance: { total: number; present: number; absent: number; rate: number; history: AttendanceHistoryItem[] }
}

export function getDashboardSummary() {
  return backendRequest<{ summary: DashboardSummary }>('/api/classroom/dashboard-summary')
}

export function getMyAttendanceSummary() {
  return backendRequest<{ attendance: DashboardSummary['attendance'] }>('/api/classroom/attendance/me')
}

export interface Institute { id: string; name: string; shortName?: string; address?: string; mapUrl?: string; phone?: string; email?: string; details?: string; grades: string[]; status?: 'active' | 'inactive'; active: boolean; createdAt?: string; updatedAt?: string }
export interface TeacherPublicProfile { teacherUid: string; teacherCode?: string; teacherPublicId?: string; displayName: string; imageUrl?: string; about?: string; aboutBlocks?: Array<{ id: string; type: 'heading' | 'paragraph' | 'divider'; content: string }>; photoFrame?: { size: 'small' | 'medium' | 'large'; shape: 'square' | 'rounded' | 'circle' | 'soft' | 'pill' | 'hexagon' | 'diamond' | 'arch' | 'ticket' | 'squircle'; fit: 'cover' | 'contain'; positionX: number; positionY: number }; phone?: string; email?: string; phones?: string[]; emails?: string[]; grades: string[]; subjects?: string[]; classTypes?: string[]; monthlyFee?: number; totalFee?: number; instituteIds: string[]; institutes?: Institute[]; updatedAt?: string }
export interface PaymentRecord { studentUid: string; studentId: string; studentName: string; grade?: string; instituteId: string; freeCard: boolean; paid: boolean; year: number; month: number; paidAt?: string | null }
export type InstitutePayload = Omit<Institute, 'id' | 'createdAt' | 'updatedAt'>
export function listInstitutes() { return backendRequest<{ institutes: Institute[] }>('/api/organization/institutes') }
export function createInstitute(payload: InstitutePayload) { return backendRequest<{ institute: Institute }>('/api/organization/institutes', { method: 'POST', body: JSON.stringify(payload) }) }
export function updateInstitute(id: string, payload: InstitutePayload) { return backendRequest<{ institute: Institute }>('/api/organization/institutes/' + id, { method: 'PATCH', body: JSON.stringify(payload) }) }
export function deleteInstitute(id: string) { return backendRequest<void>('/api/organization/institutes/' + id, { method: 'DELETE' }) }
export function listTeacherProfiles() { return backendRequest<{ profiles: TeacherPublicProfile[] }>('/api/organization/teacher-profiles') }
export function getTeacherProfile(teacherUid: string) { return backendRequest<{ profile: TeacherPublicProfile | null }>('/api/organization/teacher-profiles/' + teacherUid) }
export function getMyTeacherProfile() { return backendRequest<{ profile: TeacherPublicProfile | null }>('/api/organization/teacher-profiles/me') }
export function saveTeacherProfile(teacherUid: string, payload: Omit<TeacherPublicProfile, 'teacherUid' | 'updatedAt'>) { return backendRequest<{ profile: TeacherPublicProfile }>('/api/organization/teacher-profiles/' + teacherUid, { method: 'PUT', body: JSON.stringify(payload) }) }
export function setStudentInstitute(studentUid: string, instituteId: string) { return backendRequest<{ profile: UserProfile }>('/api/organization/students/' + studentUid + '/institute', { method: 'PATCH', body: JSON.stringify({ instituteId }) }) }
export function updateStudentPaymentProfile(studentUid: string, payload: { freeCard: boolean; grade?: string; instituteId?: string }) { return backendRequest<{ student: UserProfile }>('/api/organization/students/' + studentUid + '/payment-profile', { method: 'PATCH', body: JSON.stringify(payload) }) }
export function listPayments(instituteId: string, year: number, month: number) { return backendRequest<{ payments: PaymentRecord[] }>('/api/organization/payments?instituteId=' + encodeURIComponent(instituteId) + '&year=' + year + '&month=' + month) }
export function savePayment(studentUid: string, payload: { instituteId: string; year: number; month: number; paid: boolean }) { return backendRequest<{ payment: PaymentRecord }>('/api/organization/payments/' + studentUid, { method: 'PUT', body: JSON.stringify(payload) }) }

export interface ReportStudent { uid:string; studentId:string; name:string; grade:string; instituteName:string; freeCard:boolean; batchIds:string[] }
export interface TeacherReportData { batches:Array<{id:string;name:string;institute:string;classTypes:string[]}>;students:ReportStudent[];payments:Array<{id:string;studentUid:string;year:number;month:number;paid:boolean;freeCard?:boolean;student?:ReportStudent}>;attendance:Array<{id:string;batchId:string;batchName:string;classType:string;date:string;attendance:0|1;student?:ReportStudent}>;results:Array<{id:string;batchId:string;batchName:string;examId:string;exam:string;category:string;date:string;score:number;total:number;student?:ReportStudent}>;summary:{students:number;payments:number;attendance:number;results:number} }
export function getTeacherReports(filters:Record<string,string|number|undefined>={}){const query=new URLSearchParams();Object.entries(filters).forEach(([key,value])=>{if(value!==undefined&&value!=='')query.set(key,String(value))});return backendRequest<TeacherReportData>('/api/reports?'+query.toString())}
export interface DashboardContentItem {
  id: string
  type: 'quote' | 'notice'
  title: string
  content: string
  category?: string
  url?: string
  active: boolean
  priority?: 'high' | 'medium' | 'low'
  expiresAt?: string
  targetTeacherIds?: string[]
  createdAt?: string
  updatedAt?: string
}
export type DashboardContentInput = Omit<DashboardContentItem, 'id' | 'createdAt' | 'updatedAt'>
export function listDashboardContent() { return backendRequest<{ items: DashboardContentItem[] }>('/api/dashboard-content') }
export function createDashboardContent(payload: DashboardContentInput) { return backendRequest<{ item: DashboardContentItem }>('/api/dashboard-content', { method: 'POST', body: JSON.stringify(payload) }) }
export function updateDashboardContent(id: string, payload: DashboardContentInput) { return backendRequest<{ item: DashboardContentItem }>('/api/dashboard-content/' + id, { method: 'PATCH', body: JSON.stringify(payload) }) }
export function deleteDashboardContent(id: string) { return backendRequest<void>('/api/dashboard-content/' + id, { method: 'DELETE' }) }

export type CurriculumResourceType = 'paragraph' | 'pdf' | 'recording' | 'video' | 'audio' | 'image' | 'file'
export interface CurriculumResource { id: string; title: string; description: string; type: CurriculumResourceType; url: string; fileName: string; mimeType: string; allowDownload: boolean; createdAt?: string; updatedAt?: string }
export type CurriculumResourcePayload = Omit<CurriculumResource, 'id' | 'createdAt' | 'updatedAt'>
export function listCurriculumResources() { return backendRequest<{ resources: CurriculumResource[] }>('/api/curriculum') }
export function createCurriculumResource(payload: CurriculumResourcePayload) { return backendRequest<{ resource: CurriculumResource }>('/api/curriculum', { method: 'POST', body: JSON.stringify(payload) }) }
export function updateCurriculumResource(id: string, payload: CurriculumResourcePayload) { return backendRequest<{ resource: CurriculumResource }>('/api/curriculum/' + id, { method: 'PUT', body: JSON.stringify(payload) }) }
export function deleteCurriculumResource(id: string) { return backendRequest<void>('/api/curriculum/' + id, { method: 'DELETE' }) }
export type InstituteSubscriptionPlan = 'monthly' | 'yearly' | 'lifetime'
export type InstituteSubscriptionStatus = 'pending' | 'active' | 'rejected' | 'unavailable'
export interface SubscriptionPrice { current: number; regular: number }
export interface InstituteSubscription { id?: string; instituteId: string; instituteName: string; ownerUid: string; ownerEmail: string; plan: InstituteSubscriptionPlan; tierId?: string; studentCount?: number; price?: number; regularPrice?: number; offerPrice?: number; status: InstituteSubscriptionStatus | 'trial' | 'expired'; paymentStatus?: string; slipUrl: string; slipName: string; note: string; trialStartedAt?: string; trialEndsAt?: string; subscriptionEndsAt?: string; graceEndsAt?: string; submittedAt?: string; activatedAt?: string; updatedAt?: string; subscriptionRequired: boolean }
export async function listInstituteSubscriptions() {
  const result = await backendRequest<{ subscriptions: InstituteSubscription[]; plans: Record<InstituteSubscriptionPlan, SubscriptionPrice> }>('/api/subscriptions/admin')
  return { ...result, subscriptions: result.subscriptions.map((item) => ({
    ...item,
    slipUrl: item.slipUrl?.startsWith('/') ? API_URL + item.slipUrl : item.slipUrl,
  })) }
}
export function setInstituteOwner(payload: { instituteId: string; email: string }) { return backendRequest<{ instituteId: string; ownerUid: string; ownerName: string }>('/api/subscriptions/admin/owner', { method: 'POST', body: JSON.stringify(payload) }) }
export function setInstituteSubscriptionStatus(instituteId: string, status: InstituteSubscriptionStatus) { return backendRequest<{ subscription: InstituteSubscription }>('/api/subscriptions/admin/' + encodeURIComponent(instituteId) + '/status', { method: 'PATCH', body: JSON.stringify({ status }) }) }
export function adjustTeacherTrial(teacherUid: string, trialStartedAt: string, trialEndsAt: string) { return backendRequest<{ subscription: InstituteSubscription }>('/api/subscriptions/admin/teachers/' + encodeURIComponent(teacherUid) + '/trial', { method: 'PATCH', body: JSON.stringify({ trialStartedAt, trialEndsAt }) }) }
export function assignInstitutePartner(payload: { instituteId: string; teacherUid: string }) { return backendRequest<{ teacher: { uid: string; displayName: string; email: string } }>('/api/subscriptions/owner/partners', { method: 'POST', body: JSON.stringify(payload) }) }
export function grantSeparateTeacherWorkspace(teacherUid: string) { return backendRequest<{ teacher: { uid: string; displayName: string; email: string } }>('/api/subscriptions/admin/teachers/' + encodeURIComponent(teacherUid) + '/workspace', { method: 'PATCH' }) }
export interface InstituteAccessRequest { id: string; requestType?: 'existing-institute' | 'new-institute'; teacherUid: string; teacherEmail: string; teacherName: string; instituteId: string; instituteName: string; ownerName?: string; ownerEmail?: string; phone?: string; address?: string; mapUrl?: string; details?: string; subscriptionPlan?: 'monthly' | 'yearly' | 'lifetime'; status: 'pending' | 'approved' | 'rejected'; createdAt?: string }
export function listInstituteAccessRequests() { return backendRequest<{ requests: InstituteAccessRequest[] }>('/api/subscriptions/admin/institute-access-requests') }
export interface TeacherProfileChangeRequest { id: string; teacherUid: string; teacherName: string; current: { displayName: string; phone: string; email: string }; requested: { displayName: string; phone: string; email: string; reason?: string }; status: string }
export function listTeacherProfileChangeRequests() { return backendRequest<{ requests: TeacherProfileChangeRequest[] }>('/api/organization/teacher-profile-change-requests') }
export function decideTeacherProfileChangeRequest(id: string, approve: boolean, note = '') { return backendRequest<{ request: { id: string; status: string } }>('/api/organization/teacher-profile-change-requests/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify({ approve, note }) }) }
export function decideInstituteAccessRequest(requestId: string, approve: boolean) { return backendRequest<{ request: InstituteAccessRequest }>('/api/subscriptions/admin/institute-access-requests/' + encodeURIComponent(requestId), { method: 'PATCH', body: JSON.stringify({ approve }) }) }
export interface HelpVideo { id: string; title: string; youtubeUrl: string; audience: 'all' | 'teacher' | 'student' }
export interface SupportMessage { id: string; senderUid: string; senderRole: string; senderName: string; text: string; createdAt?: string }
export interface SupportThread { id: string; ownerUid: string; ownerName: string; ownerEmail: string; ownerRole: string; lastMessage: string; lastSenderRole: string; updatedAt?: string }
export function getHelpVideos() { return backendRequest<{ videos: HelpVideo[] }>('/api/support/help-videos') }
export function saveHelpVideos(videos: HelpVideo[]) { return backendRequest<{ videos: HelpVideo[] }>('/api/support/help-videos', { method: 'PUT', body: JSON.stringify({ videos }) }) }
export function listSupportThreads() { return backendRequest<{ threads: SupportThread[] }>('/api/support/admin/threads', { cache: 'no-store' }) }
export function getSupportThreadMessages(uid: string) { return backendRequest<{ messages: SupportMessage[] }>('/api/support/admin/threads/' + encodeURIComponent(uid) + '/messages', { cache: 'no-store' }) }
export function sendSupportThreadMessage(uid: string, text: string) { return backendRequest<{ message: SupportMessage }>('/api/support/admin/threads/' + encodeURIComponent(uid) + '/messages', { method: 'POST', body: JSON.stringify({ text }) }) }
export type NotificationPreferences = { enabled: boolean; messages: boolean; assignments: boolean; curriculum: boolean; notices: boolean; classes: boolean; reminders: boolean; payments: boolean; account: boolean; system: boolean; soundEnabled: boolean }
export function getNotificationPreferences() { return backendRequest<{ preferences: NotificationPreferences }>('/api/notifications/preferences') }
export function saveNotificationPreferences(preferences: Partial<NotificationPreferences>) { return backendRequest<{ preferences: NotificationPreferences }>('/api/notifications/preferences', { method: 'PUT', body: JSON.stringify(preferences) }) }
export async function fetchTeacherVerificationImage(path: string) {
  const token = await auth.currentUser?.getIdToken()
  const response = await fetch(/^https:\/\//i.test(path) ? path : API_URL + path, { headers: /^https:\/\//i.test(path) ? {} : token ? { Authorization: 'Bearer ' + token } : {} })
  if (!response.ok) throw new Error('Could not load verification image')
  return URL.createObjectURL(await response.blob())
}
