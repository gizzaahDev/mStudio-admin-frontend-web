'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'
import { ArrowLeft, UserCheck } from 'lucide-react'

export default function AdminLoginPage() {
  const { loading, isAuthenticated, role } = useAuth()
  const router = useRouter()
  const hasSavedSession = isAuthenticated && (role === 'admin')

  useEffect(() => {
    if (!loading && hasSavedSession) router.replace('/admin')
  }, [hasSavedSession, loading, router])

  if (loading || hasSavedSession) return <div className='flex min-h-screen items-center justify-center bg-background'><div className='h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent' aria-label='Restoring session' /></div>

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold mx-auto">
              M
            </div>
            <h1 className="text-2xl font-bold text-foreground">Magical ICT</h1>
            <p className="text-muted-foreground">Admin access</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-card-foreground">Admin Login</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Sign in with admin email/password or Google.
              </p>
            </div>
            <LoginForm userType="admin" />
          </div>
        </div>
      </div>
    </div>
  )
}
