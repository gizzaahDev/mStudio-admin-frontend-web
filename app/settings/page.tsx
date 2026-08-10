'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { BellRing, Database, LogOut, Moon, RefreshCw, Settings2, ShieldCheck, Sun } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { AppFooter } from '@/components/layout/app-footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
import { getNotificationPreferences, saveNotificationPreferences, type NotificationPreferences } from '@/lib/backend-api'

export default function AdminSettingsPage() {
  const { theme, setTheme, isDarkMode } = useTheme()
  const { user, profile, logout, refreshProfile } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [notifications, setNotifications] = useState<NotificationPreferences | null>(null)
  const [savingNotifications, setSavingNotifications] = useState(false)
  useEffect(() => { void getNotificationPreferences().then((result) => setNotifications(result.preferences)).catch(() => undefined) }, [])
  const setNotification = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!notifications || savingNotifications) return
    const previous = notifications; const next = { ...notifications, [key]: value }
    setNotifications(next); setSavingNotifications(true)
    try { setNotifications((await saveNotificationPreferences(next)).preferences) }
    catch (error) { setNotifications(previous); toast.error(error instanceof Error ? error.message : 'Could not save notification settings') }
    finally { setSavingNotifications(false) }
  }

  const refresh = async () => {
    setRefreshing(true)
    try { await refreshProfile(); toast.success('Administrator profile refreshed') }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not refresh profile') }
    finally { setRefreshing(false) }
  }
  const signOut = async () => { await logout(); window.location.href = '/' }

  return <>
    <Navbar />
    <main className='mx-auto min-h-[calc(100vh-4rem)] max-w-5xl px-4 py-10 sm:px-6'>
      <div className='mb-8'><p className='text-sm font-semibold uppercase tracking-[0.18em] text-primary'>Administration</p><h1 className='mt-2 text-3xl font-bold'>Administrator settings</h1><p className='mt-2 text-muted-foreground'>Administrator identity, system configuration, and this device appearance.</p></div>
      <div className='grid gap-6 lg:grid-cols-2'>
        <Card className='border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card'>
          <CardHeader><CardTitle className='flex items-center gap-2'><ShieldCheck className='h-5 w-5 text-primary' /> Administrator account</CardTitle><CardDescription>This information is not shared with teacher or student settings.</CardDescription></CardHeader>
          <CardContent className='space-y-2'><p className='text-lg font-semibold'>{profile?.displayName || user?.displayName || 'Administrator'}</p><p className='text-sm text-muted-foreground'>{user?.email}</p><p className='text-xs font-medium uppercase tracking-wider text-primary'>Admin access</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Administrator appearance</CardTitle><CardDescription>Changes only the current administrator device.</CardDescription></CardHeader>
          <CardContent className='grid gap-3 sm:grid-cols-3'><Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}><Sun className='mr-2 h-4 w-4' /> Light</Button><Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}><Moon className='mr-2 h-4 w-4' /> Dark</Button><Button variant={theme === 'system' ? 'default' : 'outline'} onClick={() => setTheme('system')}>System</Button><p className='col-span-full text-sm text-muted-foreground'>Currently using {isDarkMode ? 'dark' : 'light'} mode.</p></CardContent>
        </Card>
        <Card className='lg:col-span-2'>
          <CardHeader id='notifications'><CardTitle className='flex items-center gap-2'><BellRing className='h-5 w-5 text-primary' />Administrator notifications</CardTitle><CardDescription>These controls belong only to the administrator account.</CardDescription></CardHeader>
          <CardContent className='grid gap-2 sm:grid-cols-2'>{notifications ? (Object.entries({ enabled: 'All administrator notifications', messages: 'Support and direct messages', assignments: 'Assignment activity', curriculum: 'Curriculum activity', notices: 'Quotes and notices', classes: 'Class activity', reminders: 'Calendar reminders', payments: 'Payments and subscriptions', account: 'Approvals and accounts', system: 'System announcements', soundEnabled: 'Notification sounds' }) as Array<[keyof NotificationPreferences, string]>).map(([key, label]) => <label key={key} className='flex items-center justify-between gap-3 rounded-xl border p-3 text-sm'><span>{label}</span><input type='checkbox' checked={notifications[key]} disabled={savingNotifications} onChange={(event) => void setNotification(key, event.target.checked)} /></label>) : <p className='text-sm text-muted-foreground'>Loading notification controls...</p>}</CardContent>
        </Card>
        <Card className='lg:col-span-2'>
          <CardHeader><CardTitle>System controls</CardTitle><CardDescription>Application-wide settings remain protected inside the administrator portal.</CardDescription></CardHeader>
          <CardContent className='grid gap-3 sm:grid-cols-2'><Link href='/admin/app-settings'><Button variant='outline' className='w-full justify-start'><Settings2 className='mr-2 h-4 w-4' /> App configuration</Button></Link><Link href='/admin/subscriptions'><Button variant='outline' className='w-full justify-start'><Database className='mr-2 h-4 w-4' /> Institute subscriptions</Button></Link><Button variant='outline' className='justify-start' onClick={() => void refresh()} disabled={refreshing}><RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh admin profile</Button><Button variant='outline' className='justify-start' onClick={() => void signOut()}><LogOut className='mr-2 h-4 w-4' /> Sign out</Button></CardContent>
        </Card>
      </div>
    </main>
    <AppFooter />
  </>
}
