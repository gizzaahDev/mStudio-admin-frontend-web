'use client'

import { Navbar } from '@/components/layout/navbar'
import { AppFooter } from '@/components/layout/app-footer'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAppSettings } from '@/lib/app-settings-context'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { role, isAuthenticated, loading } = useAuth()
  const { settings } = useAppSettings()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!isAuthenticated || (role !== 'admin' && role !== 'teacher'))) {
      router.push('/auth/login/admin')
    }
  }, [isAuthenticated, role, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || (role !== 'admin' && role !== 'teacher')) {
    return null
  }

  return (
    <div className="app-effect-surface min-h-screen bg-background">
      <Navbar />
      <div className={settings.header.enabled ? 'flex pt-16' : 'flex'}>
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
        <AppFooter />
        </div>
      </div>
    </div>
  )
}
