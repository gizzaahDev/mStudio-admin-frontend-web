'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function HomePage() {
  const { loading, isAuthenticated, role } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    router.replace(isAuthenticated && role === 'admin' ? '/admin' : '/auth/login/admin')
  }, [isAuthenticated, loading, role, router])

  return <div className='flex min-h-screen items-center justify-center bg-background'><div className='h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent' aria-label='Restoring session' /></div>
}