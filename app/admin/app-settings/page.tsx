'use client'

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { ImageIcon, Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { normalizeAppSettings, useAppSettings } from '@/lib/app-settings-context'
import { updateAppSettings, updateMobileAppIcon, type AppSettings } from '@/lib/backend-api'
import { storage } from '@/lib/firebase'
import { ThemeSettingsEditor } from '@/components/admin/theme-settings-editor'
import { AdminChromeSettingsEditor, GlassTransparencyEditor, MobileCardEffectsEditor } from '@/components/admin/chrome-settings-editor'

const mobileIconLabels = { student: 'Student app (m.LMS)', teacher: 'Teacher app (m.teacher)', admin: 'Admin app' } as const

const labelNames: Record<string, string> = { scan: 'QR and quick update', dashboardContent: 'Quotes and notices',  dashboard: 'Dashboard', reception: 'Reception', space: 'Learning space', progress: 'Progress and grades', attendance: 'Attendance', assignments: 'Assignments', messages: 'Messages', calendar: 'Calendar', profile: 'Profile', settings: 'Settings', classes: 'Classes', students: 'Students', reports: 'Reports', approvals: 'Approvals', accounts: 'Admin accounts', curriculum: 'Curriculum', payments: 'Payments', organization: 'Institutes', appSettings: 'App configuration', tappManage: 'TAPP Manage', subscriptions: 'Institute subscriptions', instituteOwner: 'Institute owner' }

export default function AdminAppSettingsPage() {
  const { settings, setSettings, loading } = useAppSettings()
  const [form, setFormState] = useState<AppSettings>(settings)
  const initializedRef = useRef(false)
  const editingRef = useRef(false)
  const setForm: Dispatch<SetStateAction<AppSettings>> = (next) => {
    editingRef.current = true
    setFormState(next)
  }
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingMobileIcon, setUploadingMobileIcon] = useState<keyof typeof mobileIconLabels | null>(null)
  const [uploadingDecoration, setUploadingDecoration] = useState(false)
  const [dragging, setDragging] = useState<{ group: 'navigation' | 'dashboard'; role: string; index: number } | null>(null)
  useEffect(() => {
    if (loading || initializedRef.current) return
    initializedRef.current = true
    if (!editingRef.current) setFormState(settings)
  }, [loading, settings])
  const setReception = (key: keyof AppSettings['reception'], value: string) => setForm((current) => ({ ...current, reception: { ...current.reception, [key]: value } }))
  const setList = (key: 'classTypes' | 'resultCategories' | 'teacherGrades' | 'teacherSubjects', index: number, value: string) => setForm((current) => ({ ...current, [key]: current[key].map((item, itemIndex) => itemIndex === index ? value : item) }))
  const removeList = (key: 'classTypes' | 'resultCategories' | 'teacherGrades' | 'teacherSubjects', index: number) => setForm((current) => ({ ...current, [key]: current[key].filter((_, itemIndex) => itemIndex !== index) }))
  const setLabel = (role: keyof AppSettings['labels'], key: string, value: string) => setForm((current) => ({ ...current, labels: { ...current.labels, [role]: { ...current.labels[role], [key]: value } } }))
  const setVisibility = (role: 'student' | 'teacher' | 'admin', key: string, visible: boolean) => setForm((current) => ({ ...current, sidebarVisibility: { ...current.sidebarVisibility, [role]: { ...current.sidebarVisibility[role], [key]: visible } } }))
  const moveItem = (group: 'navigation' | 'dashboard', role: string, from: number, to: number) => {
    if (from === to) return
    setForm((current) => {
      if (group === 'navigation') {
        const key = role as keyof AppSettings['navigationOrder']
        const order = [...current.navigationOrder[key]]
        const [item] = order.splice(from, 1)
        order.splice(to, 0, item)
        return { ...current, navigationOrder: { ...current.navigationOrder, [key]: order } }
      }
      const key = role as keyof AppSettings['dashboardOrder']
      const order = [...current.dashboardOrder[key]]
      const [item] = order.splice(from, 1)
      order.splice(to, 0, item)
      return { ...current, dashboardOrder: { ...current.dashboardOrder, [key]: order } }
    })
  }
  const uploadDecoration = async (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Choose an SVG, PNG, WebP, or other image')
    setUploadingDecoration(true)
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const target = ref(storage, 'dashboard-decorations/' + Date.now() + '-' + safeName)
      await uploadBytes(target, file, { contentType: file.type })
      const fallingAssetUrl = await getDownloadURL(target)
      setForm((current) => ({ ...current, visualEffects: { ...current.visualEffects, fallingAssetUrl } }))
      toast.success('Decoration uploaded. Save settings to publish it.')
    } catch (error: any) { toast.error(error.message || 'Could not upload decoration') }
    finally { setUploadingDecoration(false) }
  }
  const uploadLogo = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    try { const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-'); const logoRef = ref(storage, `app-branding/${Date.now()}-${safeName}`); await uploadBytes(logoRef, file, { contentType: file.type || 'image/png' }); const logoUrl = await getDownloadURL(logoRef); setForm((current) => ({ ...current, logoUrl })); toast.success('Logo uploaded. Save configuration to publish it.') }
    catch (error: any) { toast.error(error.message || 'Could not upload logo') }
    finally { setUploading(false) }
  }
  const uploadMobileIcon = async (role: keyof typeof mobileIconLabels, file: File | null) => {
    if (!file) return
    if (!['image/png', 'image/jpeg'].includes(file.type)) return toast.error('Choose a square PNG or JPG image')
    setUploadingMobileIcon(role)
    try {
      const bitmap = await createImageBitmap(file)
      const valid = bitmap.width === bitmap.height && bitmap.width >= 512
      bitmap.close()
      if (!valid) return toast.error('Mobile launcher icons must be square and at least 512 × 512 pixels')
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const target = ref(storage, `app-branding/mobile-launcher/${role}/${Date.now()}-${safeName}`)
      await uploadBytes(target, file, { contentType: file.type })
      const iconUrl = await getDownloadURL(target)
      const result = await updateMobileAppIcon(role, iconUrl)
      setForm((current) => ({ ...current, mobileAppIcons: result.mobileAppIcons }))
      toast.success(`${mobileIconLabels[role]} icon saved separately. Rebuild only that mobile app to publish it.`)
    } catch (error: any) {
      toast.error(error.message || 'Could not upload the mobile launcher icon')
    } finally {
      setUploadingMobileIcon(null)
    }
  }
  const useHeaderLogoForRole = async (role: keyof typeof mobileIconLabels) => {
    setUploadingMobileIcon(role)
    try {
      const result = await updateMobileAppIcon(role, '')
      setForm((current) => ({ ...current, mobileAppIcons: result.mobileAppIcons }))
      toast.success(`${mobileIconLabels[role]} now uses the header logo. Rebuild that app to publish it.`)
    } catch (error: any) {
      toast.error(error.message || 'Could not update the mobile launcher icon')
    } finally {
      setUploadingMobileIcon(null)
    }
  }
  const useHeaderLogoForAll = async () => {
    if (!form.logoUrl) return
    setUploadingMobileIcon('student')
    try {
      let mobileAppIcons = form.mobileAppIcons
      for (const role of Object.keys(mobileIconLabels) as Array<keyof typeof mobileIconLabels>) {
        const result = await updateMobileAppIcon(role, form.logoUrl)
        mobileAppIcons = result.mobileAppIcons
      }
      setForm((current) => ({ ...current, mobileAppIcons }))
      toast.success('The header logo was saved independently for all three mobile apps.')
    } catch (error: any) {
      toast.error(error.message || 'Could not update all mobile launcher icons')
    } finally {
      setUploadingMobileIcon(null)
    }
  }
  const save = async () => {
    if (!/^[A-Za-z][A-Za-z0-9]{0,9}$/.test(form.idPrefix.trim())) return toast.error('ID prefix must start with a letter and contain 1–10 letters or numbers')
    if (!form.classTypes.filter((item) => item.trim()).length || !form.resultCategories.filter((item) => item.trim()).length || !form.teacherGrades.filter((item) => item.trim()).length || !form.teacherSubjects.filter((item) => item.trim()).length) return toast.error('Add class types, result categories, teacher grades, and teacher subjects')
    setSaving(true)
    try { const prepared = normalizeAppSettings({ ...form, idPrefix: form.idPrefix.trim().toUpperCase(), classTypes: form.classTypes.map((item) => item.trim()).filter(Boolean), resultCategories: form.resultCategories.map((item) => item.trim()).filter(Boolean), teacherGrades: form.teacherGrades.map((item) => item.trim()).filter(Boolean), teacherSubjects: form.teacherSubjects.map((item) => item.trim()).filter(Boolean) }); const result = await updateAppSettings(prepared); editingRef.current = false; initializedRef.current = true; setSettings(result.settings); setFormState(normalizeAppSettings(result.settings)); toast.success('App configuration saved to Firestore') }
    catch (error: any) { toast.error(error.message || 'Could not save app configuration') }
    finally { setSaving(false) }
  }
  return <div className='space-y-8'>
    <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'><div><p className='text-sm font-medium text-primary'>Global administration</p><h1 className='mt-1 text-3xl font-bold'>App Configuration</h1><p className='mt-2 text-muted-foreground'>Change branding, colours, background effects, navigation, class types, results, and student IDs from Firestore-backed settings.</p></div><Button disabled={saving} onClick={() => void save()}><Save className='h-4 w-4' />{saving ? 'Saving...' : 'Save all settings'}</Button></div>
    <Card><CardHeader><CardTitle>System maintenance</CardTitle><CardDescription>Schedule student and teacher app maintenance separately. Saving an enabled or changed schedule sends a device notification.</CardDescription></CardHeader><CardContent className='grid gap-5 lg:grid-cols-2'>{(['student','teacher'] as const).map((role) => { const item=form.maintenance[role]; const update=(values: Partial<typeof item>) => setForm(current => ({...current,maintenance:{...current.maintenance,[role]:{...current.maintenance[role],...values}}})); return <section key={role} className='space-y-3 rounded-xl border p-4'><label className='flex items-center justify-between font-semibold capitalize'>{role} app maintenance<input type='checkbox' className='h-5 w-5 accent-primary' checked={item.enabled} onChange={event=>update({enabled:event.target.checked})}/></label><label className='block text-sm font-medium'>Reason<textarea className='mt-1 min-h-24 w-full rounded-lg border bg-background p-3' value={item.reason} onChange={event=>update({reason:event.target.value})}/></label><label className='block text-sm font-medium'>Start<Input className='mt-1' type='datetime-local' value={item.startsAt} onChange={event=>update({startsAt:event.target.value})}/></label><label className='block text-sm font-medium'>Expected end<Input className='mt-1' type='datetime-local' value={item.endsAt} onChange={event=>update({endsAt:event.target.value})}/></label>{role==='student'&&<label className='flex items-center gap-2 text-sm'><input type='checkbox' checked={item.notifyTeachers} onChange={event=>update({notifyTeachers:event.target.checked})}/>Also notify teachers about student-app maintenance</label>}</section>})}</CardContent></Card>
    <Card><CardHeader><CardTitle>Deployment mode and subscriptions</CardTitle><CardDescription>Individual keeps the existing single-teacher behaviour. Institute isolates each teacher’s batches, spaces, students, resources, attendance, and reports. Set prices and discounts shown to institute owners.</CardDescription></CardHeader><CardContent className='space-y-5'><div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'><label className='text-sm font-medium'>Web app operation mode<select className='mt-1 h-10 w-full rounded-md border bg-background px-3' value={form.deployment.mode} onChange={(event) => setForm({ ...form, deployment: { ...form.deployment, mode: event.target.value as 'individual' | 'institute' } })}><option value='individual'>Individual teacher</option><option value='institute'>Institute / multi-teacher</option></select></label><label className='flex items-center gap-3 self-end rounded-md border px-3 py-2 text-sm font-medium'><input type='checkbox' className='h-5 w-5 accent-primary' checked={form.deployment.enabled} onChange={(event) => setForm({ ...form, deployment: { ...form.deployment, enabled: event.target.checked } })} />Enable configured deployment mode</label><label className='flex items-center gap-3 self-end rounded-md border px-3 py-2 text-sm font-medium'><input type='checkbox' className='h-5 w-5 accent-primary' checked={form.deployment.instituteAccessEnabled} onChange={(event) => setForm({ ...form, deployment: { ...form.deployment, instituteAccessEnabled: event.target.checked } })} />Show Institute Access & Subscription</label></div><div className='grid gap-4 md:grid-cols-3'>{(['monthly','yearly','lifetime'] as const).map((plan) => <section key={plan} className='rounded-lg border p-4'><h3 className='font-semibold capitalize'>{plan} plan</h3><div className='mt-3 grid gap-3'><label className='text-xs font-medium'>Discounted price (LKR)<Input className='mt-1' type='number' min='0' value={form.deployment.subscriptionPlans[plan].current} onChange={(event) => setForm((current) => ({ ...current, deployment: { ...current.deployment, subscriptionPlans: { ...current.deployment.subscriptionPlans, [plan]: { ...current.deployment.subscriptionPlans[plan], current: Number(event.target.value) } } } }))} /></label><label className='text-xs font-medium'>Regular price (LKR)<Input className='mt-1' type='number' min='0' value={form.deployment.subscriptionPlans[plan].regular} onChange={(event) => setForm((current) => ({ ...current, deployment: { ...current.deployment, subscriptionPlans: { ...current.deployment.subscriptionPlans, [plan]: { ...current.deployment.subscriptionPlans[plan], regular: Number(event.target.value) } } } }))} /></label><label className='text-xs font-medium'>Discount (%)<Input className='mt-1' type='number' min='0' max='100' step='0.01' value={form.deployment.subscriptionPlans[plan].discountPercent} onChange={(event) => setForm((current) => ({ ...current, deployment: { ...current.deployment, subscriptionPlans: { ...current.deployment.subscriptionPlans, [plan]: { ...current.deployment.subscriptionPlans[plan], discountPercent: Number(event.target.value) } } } }))} /></label></div></section>)}</div></CardContent></Card>    <Card><CardHeader><CardTitle>Student dashboard welcome</CardTitle><CardDescription>This message appears under the Student Dashboard heading.</CardDescription></CardHeader><CardContent><textarea className='min-h-24 w-full rounded-lg border bg-background p-3 text-sm' value={form.studentWelcomeMessage} onChange={(event) => setForm({ ...form, studentWelcomeMessage: event.target.value })} /></CardContent></Card>
    <Card><CardHeader><CardTitle>Student & Teacher Visual Design Studio</CardTitle><CardDescription>Manage glass transparency, blur, header and footer colours, text sizes, layout, images, links, and dashboard decorations in one ordered place. Saved settings apply to both student and teacher apps.</CardDescription></CardHeader><CardContent className='space-y-10'>
      <section className='rounded-xl border p-5'><h2 className='text-lg font-bold'>About apps</h2><p className='mt-1 text-sm text-muted-foreground'>Only administrators can change these details.</p><div className='mt-4 grid gap-4 md:grid-cols-2'><label className='text-sm font-medium md:col-span-2'>Thank-you message<textarea className='mt-1 min-h-24 w-full rounded-lg border bg-background p-3' value={form.about.thankYouMessage} onChange={(event) => setForm({ ...form, about: { ...form.about, thankYouMessage: event.target.value } })} /></label><label className='text-sm font-medium'>Developer name<Input className='mt-1' value={form.about.developerName} onChange={(event) => setForm({ ...form, about: { ...form.about, developerName: event.target.value } })} /></label><label className='text-sm font-medium'>Developer contact<Input className='mt-1' value={form.about.developerContact} onChange={(event) => setForm({ ...form, about: { ...form.about, developerContact: event.target.value } })} /></label><label className='text-sm font-medium md:col-span-2'>Developer website<Input className='mt-1' type='url' value={form.about.developerWebsite} onChange={(event) => setForm({ ...form, about: { ...form.about, developerWebsite: event.target.value } })} placeholder='https://example.com' /></label></div></section>
      <GlassTransparencyEditor form={form} setForm={setForm} />
      <MobileCardEffectsEditor form={form} setForm={setForm} />
      <AdminChromeSettingsEditor form={form} setForm={setForm} />
      <ThemeSettingsEditor form={form} setForm={setForm} />
      <section className='rounded-xl border p-5'><div className='mb-4'><h2 className='text-lg font-bold'>Dashboard decorations and effects</h2><p className='mt-1 text-sm text-muted-foreground'>Configure falling images, symbols, effect count, and automatic holiday greetings.</p></div><div className='space-y-4'><div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'><label className='flex items-center gap-3 text-sm font-medium'><input type='checkbox' checked={form.visualEffects.fallingEnabled} onChange={(event) => setForm({ ...form, visualEffects: { ...form.visualEffects, fallingEnabled: event.target.checked } })} className='h-5 w-5 accent-primary' />Enable falling dashboard decoration</label><label className='flex items-center gap-3 text-sm font-medium'><input type='checkbox' checked={form.visualEffects.holidayGreetings} onChange={(event) => setForm({ ...form, visualEffects: { ...form.visualEffects, holidayGreetings: event.target.checked } })} className='h-5 w-5 accent-primary' />Automatic holiday greetings</label><label className='text-sm font-medium'>Fallback icon or symbol<Input className='mt-1' maxLength={12} value={form.visualEffects.fallingSymbol} onChange={(event) => setForm({ ...form, visualEffects: { ...form.visualEffects, fallingSymbol: event.target.value } })} /></label><label className='text-sm font-medium'>Falling item count: {form.visualEffects.fallingCount}<input type='range' min='0' max='60' className='mt-3 w-full accent-primary' value={form.visualEffects.fallingCount} onChange={(event) => setForm({ ...form, visualEffects: { ...form.visualEffects, fallingCount: Number(event.target.value) } })} /></label></div><div className='flex flex-wrap items-center gap-3'>{form.visualEffects.fallingAssetUrl && <img src={form.visualEffects.fallingAssetUrl} alt='Decoration preview' className='h-14 w-14 rounded-lg border object-contain' />}<label className='inline-flex cursor-pointer rounded-md border px-4 py-2 text-sm font-medium'>{uploadingDecoration ? 'Uploading...' : 'Upload SVG / PNG / icon'}<input type='file' accept='image/*,.svg' className='hidden' disabled={uploadingDecoration} onChange={(event) => void uploadDecoration(event.target.files?.[0] || null)} /></label>{form.visualEffects.fallingAssetUrl && <Button variant='outline' onClick={() => setForm({ ...form, visualEffects: { ...form.visualEffects, fallingAssetUrl: '' } })}>Use symbol instead</Button>}</div></div></section>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Drag sidebar tabs into order</CardTitle><CardDescription>Drag every student, teacher, or admin tab. Names can be customized in the section below.</CardDescription></CardHeader><CardContent className='grid gap-6 xl:grid-cols-3'>{(['student','teacher','admin'] as const).map((role) => <section key={role}><h3 className='mb-3 font-semibold capitalize'>{role} sidebar</h3><div className='space-y-2'>{form.navigationOrder[role].map((key,index) => <div key={key} draggable onDragStart={() => setDragging({ group: 'navigation', role, index })} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragging?.group === 'navigation' && dragging.role === role) moveItem('navigation', role, dragging.index, index); setDragging(null) }} className='cursor-grab rounded-lg border bg-background px-3 py-2 text-sm active:cursor-grabbing'>☰ {form.labels[role][key] || labelNames[key] || key}</div>)}</div></section>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>Drag dashboard sections into order</CardTitle><CardDescription>Control the vertical structure of the student and teacher dashboards.</CardDescription></CardHeader><CardContent className='grid gap-6 lg:grid-cols-2 xl:grid-cols-3'>{(['student','teacher'] as const).map((role) => <section key={role}><h3 className='mb-3 font-semibold capitalize'>{role} dashboard</h3><div className='space-y-2'>{form.dashboardOrder[role].map((key,index) => <div key={key} draggable onDragStart={() => setDragging({ group: 'dashboard', role, index })} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragging?.group === 'dashboard' && dragging.role === role) moveItem('dashboard', role, dragging.index, index); setDragging(null) }} className='cursor-grab rounded-lg border bg-background px-3 py-2 text-sm capitalize active:cursor-grabbing'>☰ {key}</div>)}</div></section>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>Mobile launcher icons</CardTitle><CardDescription>Upload a separate high-resolution launcher icon for each Android app. Android generates mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi, round, and adaptive icon resources during the mobile build.</CardDescription></CardHeader><CardContent className='space-y-5'><div className='rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200'><p className='font-semibold'>Installed launcher icons cannot change directly from Firestore.</p><p className='mt-1'>Each Student, Teacher, or Admin upload is saved immediately and independently. Run the mobile icon sync script for that role and build a new APK/AAB, then update the installed app. Header and in-app logos can still update immediately.</p></div><div className='grid gap-4 lg:grid-cols-3'>{(Object.keys(mobileIconLabels) as Array<keyof typeof mobileIconLabels>).map((role) => { const iconUrl = form.mobileAppIcons[role] || form.logoUrl; return <section key={role} className='rounded-xl border p-4'><p className='font-semibold'>{mobileIconLabels[role]}</p><p className={form.mobileAppIcons[role] ? 'mt-1 text-xs font-semibold text-emerald-500' : 'mt-1 text-xs text-muted-foreground'}>{form.mobileAppIcons[role] ? '✓ Separate icon saved' : 'Using shared header logo'}</p><div className='mt-3 flex items-center gap-4'>{iconUrl ? <img src={iconUrl} alt={mobileIconLabels[role] + ' launcher icon'} className='h-20 w-20 rounded-2xl border bg-muted object-contain' /> : <span className='flex h-20 w-20 items-center justify-center rounded-2xl border bg-muted'><ImageIcon className='h-7 w-7 text-muted-foreground' /></span>}<div className='space-y-2'><label className='inline-flex h-9 cursor-pointer items-center rounded-md border px-3 text-sm font-medium'>{uploadingMobileIcon === role ? 'Uploading...' : 'Choose 512×512+ PNG/JPG'}<input type='file' accept='image/png,image/jpeg' className='hidden' disabled={uploadingMobileIcon !== null} onChange={(event) => void uploadMobileIcon(role, event.target.files?.[0] || null)} /></label>{form.mobileAppIcons[role] && <Button type='button' size='sm' variant='outline' onClick={() => void useHeaderLogoForRole(role)}>Use header logo</Button>}</div></div></section> })}</div><div className='flex flex-wrap items-end gap-4'><label className='text-sm font-medium'>Adaptive icon background colour<Input className='mt-1 h-11 w-36' type='color' value={form.mobileAppIcons.adaptiveBackgroundColor} onChange={(event) => setForm((current) => ({ ...current, mobileAppIcons: { ...current.mobileAppIcons, adaptiveBackgroundColor: event.target.value } }))} /></label><Button type='button' variant='outline' disabled={!form.logoUrl} onClick={() => void useHeaderLogoForAll()}>Use current header logo for all apps</Button></div><p className='text-xs text-muted-foreground'>Recommended: 1024×1024 PNG, important artwork centred inside the middle 66% safe area, without rounded corners baked into the image.</p></CardContent></Card>    <Card><CardHeader><CardTitle>Branding and student IDs</CardTitle><CardDescription>Changing the ID prefix also updates existing student IDs while keeping their number.</CardDescription></CardHeader><CardContent className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'><label className='text-sm font-medium'>Web app header name<Input className='mt-1' value={form.appName} onChange={(event) => setForm({ ...form, appName: event.target.value })} /></label><label className='text-sm font-medium'>Main subject name<Input className='mt-1' value={form.subjectName} onChange={(event) => setForm({ ...form, subjectName: event.target.value })} placeholder='ICT, Science, Mathematics...' /></label><label className='text-sm font-medium'>Student ID starting letters<Input className='mt-1 uppercase' value={form.idPrefix} maxLength={10} onChange={(event) => setForm({ ...form, idPrefix: event.target.value.toUpperCase() })} placeholder='MICT' /></label><label className='text-sm font-medium'>Learning space title<Input className='mt-1' value={form.spaceName} onChange={(event) => setForm({ ...form, spaceName: event.target.value })} placeholder='My Learning Space' /></label><div className='md:col-span-2'><p className='text-sm font-medium'>Header logo</p><div className='mt-2 flex flex-wrap items-center gap-4'>{form.logoUrl ? <img src={form.logoUrl} alt='App logo preview' className='h-16 w-16 rounded-xl border object-contain' /> : <span className='flex h-16 w-16 items-center justify-center rounded-xl border bg-muted'><ImageIcon className='h-6 w-6 text-muted-foreground' /></span>}<label className='inline-flex h-9 cursor-pointer items-center rounded-md border px-4 text-sm font-medium'>{uploading ? 'Uploading...' : 'Choose logo image'}<input type='file' accept='image/*' className='hidden' disabled={uploading} onChange={(event) => void uploadLogo(event.target.files?.[0] || null)} /></label>{form.logoUrl && <Button variant='outline' onClick={() => setForm({ ...form, logoUrl: '' })}>Remove logo</Button>}</div></div></CardContent></Card>
    {(['classTypes', 'resultCategories'] as const).map((listKey) => <Card key={listKey}><CardHeader><CardTitle>{listKey === 'classTypes' ? 'Class types' : 'Result categories'}</CardTitle><CardDescription>{listKey === 'classTypes' ? 'Used when creating batches and taking attendance.' : 'Used in teacher marks sheets and student progress.'}</CardDescription></CardHeader><CardContent className='space-y-3'>{form[listKey].map((item, index) => <div key={index} className='flex gap-2'><Input value={item} onChange={(event) => setList(listKey, index, event.target.value)} /><Button size='icon' variant='destructive' disabled={form[listKey].length === 1} onClick={() => removeList(listKey, index)}><Trash2 className='h-4 w-4' /></Button></div>)}<Button variant='outline' onClick={() => setForm((current) => ({ ...current, [listKey]: [...current[listKey], ''] }))}><Plus className='h-4 w-4' />Add {listKey === 'classTypes' ? 'class type' : 'result category'}</Button></CardContent></Card>)}
    <Card><CardHeader><CardTitle>Sidebar tabs and page titles</CardTitle><CardDescription>Rename navigation tabs separately for student, teacher, and admin portals.</CardDescription></CardHeader><CardContent className='space-y-6'>{(['student', 'teacher', 'admin'] as const).map((role) => <section key={role}><h2 className='mb-3 font-semibold capitalize'>{role} portal</h2><div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>{Object.entries(form.labels[role]).map(([key, value]) => <label key={key} className='text-xs font-medium text-muted-foreground'>{labelNames[key] || key}<Input className='mt-1 text-foreground' value={value} onChange={(event) => setLabel(role, key, event.target.value)} /></label>)}</div></section>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>Student, teacher, and admin sidebar switches</CardTitle><CardDescription>Turn individual tabs on or off. Dashboard and Settings remain available so users cannot be locked out.</CardDescription></CardHeader><CardContent className='grid gap-6 lg:grid-cols-2 xl:grid-cols-3'>{(['student', 'teacher', 'admin'] as const).map((role) => <section key={role}><h2 className='mb-3 font-semibold capitalize'>{role} app</h2><div className='space-y-2'>{Object.entries(form.sidebarVisibility[role]).map(([key, visible]) => <label key={key} className='flex items-center justify-between rounded-lg border px-4 py-3'><span className='text-sm font-medium'>{form.labels[role][key] || labelNames[key] || key}</span><input type='checkbox' className='h-5 w-5 accent-[var(--primary)]' checked={visible} disabled={key === 'dashboard' || key === 'settings'} onChange={(event) => setVisibility(role, key, event.target.checked)} /></label>)}</div></section>)}</CardContent></Card>
    <div className='flex justify-end'><Button size='lg' disabled={saving} onClick={() => void save()}><Save className='h-4 w-4' />{saving ? 'Saving...' : 'Save all settings'}</Button></div>
  </div>
}
