'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  CheckCircle,
  BookOpen,
  Settings,
  BarChart3,
  MessageSquare,
  Calendar,
  UserCog,
  PanelLeftClose,
  PanelLeftOpen,
  CreditCard,
  Building2,
  Megaphone,
  CircleHelp,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppSettings } from '@/lib/app-settings-context'

const navItems = [
  { href: '/admin', key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/students', key: 'students', label: 'Students', icon: Users },
  { href: '/admin/approvals', key: 'approvals', label: 'Approvals', icon: CheckCircle },
  { href: '/admin/accounts', key: 'accounts', label: 'Admin Accounts', icon: UserCog },
  { href: '/admin/curriculum', key: 'curriculum', label: 'Curriculum', icon: BookOpen },
  { href: '/admin/reports', key: 'reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/dashboard-content', key: 'dashboardContent', label: 'Quotes & Notices', icon: Megaphone },
  { href: '/admin/messages', key: 'messages', label: 'Messages', icon: MessageSquare },
  { href: '/admin/assignments', key: 'assignments', label: 'Assignments', icon: BookOpen },
  { href: '/admin/calendar', key: 'calendar', label: 'Calendar', icon: Calendar },
  { href: '/admin/payments', key: 'payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/subscriptions', key: 'subscriptions', label: 'Institute Subscriptions', icon: CreditCard },
  { href: '/admin/organization', key: 'organization', label: 'Institutes', icon: Building2 },
  { href: '/admin/tapp-manage', key: 'tappManage', label: 'TAPP Manage', icon: UserCog },
  { href: '/admin/app-settings', key: 'appSettings', label: 'App Configuration', icon: Settings },
  { href: '/admin/about', key: 'about', label: 'About Apps', icon: Info },
  { href: '/admin/support', key: 'support', label: 'Help & Support Chats', icon: CircleHelp },
  { href: '/settings', key: 'settings', label: 'Settings', icon: Settings },
]

export function AdminSidebar() {
  const { label, settings } = useAppSettings()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const order = settings.navigationOrder.admin
  const orderedItems = [...navItems].sort((left, right) => { const leftIndex = order.indexOf(left.key); const rightIndex = order.indexOf(right.key); return (leftIndex < 0 ? 999 : leftIndex) - (rightIndex < 0 ? 999 : rightIndex) })

  return (
    <aside className={cn('sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 flex-col border-r border-border bg-card/50 transition-[width] duration-200 md:flex', collapsed ? 'w-16' : 'w-64')}>
      <div className="flex justify-end p-2"><Button variant="ghost" size="icon" onClick={() => setCollapsed((value) => !value)}>{collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}</Button></div>
      <nav className="flex-1 space-y-1 p-4">
        {orderedItems.filter((item) => settings.sidebarVisibility.admin[item.key] !== false).map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  'w-full gap-2', collapsed ? 'justify-center px-2' : 'justify-start',
                  isActive && 'bg-primary/10 text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                {!collapsed && <span>{label('admin', item.key, item.label)}</span>}
              </Button>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
