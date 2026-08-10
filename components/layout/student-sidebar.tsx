'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  TrendingUp,
  Clock,
  BookOpen,
  MessageSquare,
  Calendar,
  Settings,
  DoorOpen,
  LibraryBig,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/student', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/reception', label: 'Reception', icon: DoorOpen },
  { href: '/student/space', label: 'My Learning Space', icon: LibraryBig },
  { href: '/student/progress', label: 'Progress & Grades', icon: TrendingUp },
  { href: '/student/attendance', label: 'Attendance', icon: Clock },
  { href: '/student/assignments', label: 'Assignments', icon: BookOpen },
  { href: '/student/messages', label: 'Messages', icon: MessageSquare },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function StudentSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/50">
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-2',
                  isActive && 'bg-primary/10 text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
