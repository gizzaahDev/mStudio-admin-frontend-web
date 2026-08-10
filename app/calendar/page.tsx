'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { RealCalendar } from '@/components/classroom/real-calendar'
import { useAuth } from '@/lib/auth-context'

export default function CalendarPage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  useEffect(() => { if (!loading && !isAuthenticated) router.push('/auth/login') }, [isAuthenticated, loading, router])
  if (loading) return <div className='flex min-h-screen items-center justify-center bg-background'><div className='text-center'><div className='mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' /><p className='mt-3 text-muted-foreground'>Loading...</p></div></div>
  if (!isAuthenticated) return null
  return <><Navbar /><main className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'><RealCalendar /></main></>
}
