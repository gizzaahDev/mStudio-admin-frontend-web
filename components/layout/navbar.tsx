'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
import { Button } from '@/components/ui/button'
import { LogOut, Menu, Moon, Sun, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAppSettings } from '@/lib/app-settings-context'

export function Navbar() {
  const { user, logout, role, profile } = useAuth()
  const { theme, setTheme, isDarkMode } = useTheme()
  const { settings, label } = useAppSettings()
  const [isOpen, setIsOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  if (!user) return null
  if (!settings.header.enabled) return null

  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const studentIndex = (profile as (typeof profile & { indexNumber?: string }) | null)?.indexNumber || profile?.studentId || 'Not assigned'
  const displayName = profile?.firstName || profile?.displayName || user.displayName || (role === 'admin' ? 'Administrator' : role === 'teacher' ? 'Teacher' : 'Student')
  const roleLabel = role === 'admin' ? 'Administrator' : role === 'teacher' ? 'Teacher' : 'Student'

  const getDashboardLink = () => {
    switch (role) {
      case 'admin':
        return '/admin'
      case 'teacher':
        return '/teacher'
      case 'student':
        return '/student'
      case 'parent':
        return '/parent'
      default:
        return '/student'
    }
  }

  const mobileLinks: Array<[string, string, string]> = role === 'admin' ? [['dashboard', label('admin', 'dashboard', 'Dashboard'), '/admin'], ['students', label('admin', 'students', 'Students'), '/admin/students'], ['approvals', label('admin', 'approvals', 'Approvals'), '/admin/approvals'], ['accounts', label('admin', 'accounts', 'Admin Accounts'), '/admin/accounts'], ['curriculum', label('admin', 'curriculum', 'Curriculum'), '/admin/curriculum'], ['reports', label('admin', 'reports', 'Reports'), '/admin/reports'], ['dashboardContent', label('admin', 'dashboardContent', 'Quotes & Notices'), '/admin/dashboard-content'], ['messages', label('admin', 'messages', 'Messages'), '/admin/messages'], ['calendar', label('admin', 'calendar', 'Calendar'), '/calendar'], ['payments', label('admin', 'payments', 'Payments'), '/admin/payments'], ['subscriptions', label('admin', 'subscriptions', 'Institute Subscriptions'), '/admin/subscriptions'], ['organization', label('admin', 'organization', 'Institutes'), '/admin/organization'], ['tappManage', label('admin', 'tappManage', 'TAPP Manage'), '/admin/tapp-manage'], ['appSettings', label('admin', 'appSettings', 'App Configuration'), '/admin/app-settings'], ['settings', label('admin', 'settings', 'Settings'), '/settings']] : role === 'teacher' ? [['dashboard', label('teacher', 'dashboard', 'Dashboard'), '/teacher'], ['classes', label('teacher', 'classes', 'Classes'), '/teacher/classes'], ['students', label('teacher', 'students', 'Students'), '/teacher/students'], ['attendance', label('teacher', 'attendance', 'Attendance'), '/teacher/attendance'], ['curriculum', label('teacher', 'curriculum', 'Curriculum'), '/teacher/curriculum'], ['assignments', label('teacher', 'assignments', 'Assignments'), '/teacher/assignments'], ['messages', label('teacher', 'messages', 'Messages'), '/teacher/messages'], ['reports', label('teacher', 'reports', 'Reports'), '/teacher/reports'], ['dashboardContent', label('teacher', 'dashboardContent', 'Quotes & Notices'), '/teacher/dashboard-content'], ['calendar', label('teacher', 'calendar', 'Calendar'), '/calendar'], ['payments', label('teacher', 'payments', 'Payments'), '/teacher/payments'], ['organization', label('teacher', 'organization', 'Profile & Institutes'), '/teacher/organization'], ['instituteOwner', label('teacher', 'instituteOwner', 'Institute Owner'), '/teacher/institute-owner'], ['settings', label('teacher', 'settings', 'Settings'), '/settings']] : [['dashboard', label('student', 'dashboard', 'Dashboard'), '/student'], ['reception', label('student', 'reception', 'Reception'), '/student/reception'], ['space', label('student', 'space', settings.spaceName), '/student/space'], ['progress', label('student', 'progress', 'Progress & Grades'), '/student/progress'], ['attendance', label('student', 'attendance', 'Attendance'), '/student/attendance'], ['assignments', label('student', 'assignments', 'Assignments'), '/student/assignments'], ['messages', label('student', 'messages', 'Messages'), '/student/messages'], ['calendar', label('student', 'calendar', 'Calendar'), '/calendar'], ['profile', label('student', 'profile', 'My Profile'), '/student/profile'], ['settings', label('student', 'settings', 'Settings'), '/settings']]
  const calendarPath = role === 'admin' ? '/admin/calendar' : role === 'teacher' ? '/teacher/calendar' : '/student/calendar'
  const assignmentMobileLink: [string, string, string] | null = role === 'admin' ? ['assignments', label('admin', 'assignments', 'Assignments'), '/admin/assignments'] : null
  const mobileOrder = role === 'student' ? settings.navigationOrder.student : role === 'teacher' ? settings.navigationOrder.teacher : settings.navigationOrder.admin
  const resolvedMobileLinks = [...mobileLinks, ...(assignmentMobileLink ? [assignmentMobileLink] : [])]
    .filter(([key]) => role === 'student' ? settings.sidebarVisibility.student[key] !== false : role === 'teacher' ? settings.sidebarVisibility.teacher[key] !== false : settings.sidebarVisibility.admin[key] !== false)
    .sort((left, right) => { const a = mobileOrder.indexOf(left[0]); const b = mobileOrder.indexOf(right[0]); return (a < 0 ? 999 : a) - (b < 0 ? 999 : b) })
    .map(([, itemLabel, href]) => [itemLabel, href === '/calendar' ? calendarPath : href])

  return (
    <nav className="app-header fixed inset-x-0 top-0 z-50 border-b border-border backdrop-blur">
      <div className="w-full px-4 sm:px-6">
        <div className="grid h-16 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          {/* Logo */}
          <Link href={getDashboardLink()} className="min-w-0 justify-self-start flex items-center gap-2">
            {settings.header.showLogo && (settings.logoUrl ? <img src={settings.logoUrl} alt={settings.appName + ' logo'} className="h-8 w-8 rounded-lg object-contain" /> : <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">{settings.appName.charAt(0).toUpperCase()}</div>)}
            {settings.header.showAppName && <span className="hidden text-lg font-semibold sm:inline">
              {settings.appName}
            </span>}
          </Link>

          {settings.header.showGreeting && <div className="hidden min-w-0 justify-self-center px-4 text-center lg:block"><p className="truncate text-sm font-medium">{greeting}, {displayName}</p><p className="whitespace-nowrap text-xs opacity-75">{role === 'student' ? `Index: ${studentIndex} · ` : `${roleLabel} · `}{now.toLocaleDateString()} · {now.toLocaleTimeString()}</p></div>}

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-4 justify-self-end md:flex">
            {settings.header.showTheme && <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>}
            
            {settings.header.showSettings && <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>}

            {settings.header.showSignOut && <Button 
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="header-signout gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>}
          </div>

          {/* Mobile Navigation */}
          <div className="flex items-center gap-2 justify-self-end md:hidden">
            {settings.header.showTheme && <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>}
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border py-4 space-y-2 md:hidden">
            {resolvedMobileLinks.map(([label, href]) => <Link key={href} href={href} className="block" onClick={() => setIsOpen(false)}><Button variant="ghost" className="w-full justify-start">{label}</Button></Link>)}
            {settings.header.showSignOut && <Button 
              variant="outline" 
              className="header-signout w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>}
          </div>
        )}
      </div>
    </nav>
  )
}
