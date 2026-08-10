'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAppSettings } from '@/lib/app-settings-context'
import { updateAppSettings } from '@/lib/backend-api'
import { Save } from 'lucide-react'

export default function AdminAboutPage() {
  const { settings, setSettings } = useAppSettings()
  const [about, setAbout] = useState(settings.about)
  const [saving, setSaving] = useState(false)
  useEffect(() => setAbout(settings.about), [settings.about])

  const save = async () => {
    setSaving(true)
    try {
      const result = await updateAppSettings({ ...settings, about })
      setSettings(result.settings)
      setAbout(result.settings.about)
      toast.success('About information saved for all apps')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save About information') }
    finally { setSaving(false) }
  }

  return <div className='mx-auto max-w-4xl space-y-6'>
    <div className='flex flex-wrap items-end justify-between gap-4'><div><p className='text-sm font-medium text-primary'>Global app information</p><h1 className='mt-1 text-3xl font-bold'>About Apps</h1><p className='mt-2 text-muted-foreground'>These details appear in student and teacher web and mobile About pages.</p></div><Button onClick={() => void save()} disabled={saving}><Save className='h-4 w-4' />{saving ? 'Saving...' : 'Save About details'}</Button></div>
    <Card><CardHeader><CardTitle>About page details</CardTitle><CardDescription>Only administrators can edit this information.</CardDescription></CardHeader><CardContent className='grid gap-4 md:grid-cols-2'><label className='text-sm font-medium'>Student APK version<Input className='mt-1' value={about.studentApkVersion} onChange={(event) => setAbout({ ...about, studentApkVersion: event.target.value })} placeholder='1.0.0 (1)' /></label><label className='text-sm font-medium'>Teacher APK version<Input className='mt-1' value={about.teacherApkVersion} onChange={(event) => setAbout({ ...about, teacherApkVersion: event.target.value })} placeholder='1.0.0 (1)' /></label><label className='text-sm font-medium md:col-span-2'>Thank-you message<textarea className='mt-1 min-h-32 w-full rounded-lg border bg-background p-3' value={about.thankYouMessage} onChange={(event) => setAbout({ ...about, thankYouMessage: event.target.value })} /></label><label className='text-sm font-medium'>Developer name<Input className='mt-1' value={about.developerName} onChange={(event) => setAbout({ ...about, developerName: event.target.value })} /></label><label className='text-sm font-medium'>Developer contact<Input className='mt-1' value={about.developerContact} onChange={(event) => setAbout({ ...about, developerContact: event.target.value })} placeholder='Email or phone number' /></label><label className='text-sm font-medium md:col-span-2'>Developer website<Input className='mt-1' type='url' value={about.developerWebsite} onChange={(event) => setAbout({ ...about, developerWebsite: event.target.value })} placeholder='https://example.com' /></label></CardContent></Card>
  </div>
}
