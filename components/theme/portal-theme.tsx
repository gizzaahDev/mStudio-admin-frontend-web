'use client'

import { useEffect, useRef } from 'react'
import { useAppSettings } from '@/lib/app-settings-context'
import { useTheme } from '@/lib/theme-context'
import { addPointerParticle } from '@/lib/pointer-effects'
import { defaultTeacherTheme } from '@/lib/portal-theme-defaults'
import { normalizeBackgroundEffect } from '@/lib/background-effects'

export function PortalTheme({ role, children }: { role: 'teacher'; children: React.ReactNode }) {
  const { settings } = useAppSettings()
  const { isDarkMode } = useTheme()
  const rootRef = useRef<HTMLDivElement>(null)
  const theme = settings.portalThemes?.[role] || defaultTeacherTheme
  const mode = isDarkMode ? theme.dark : theme.light
  const effects = settings.effects?.teacher || { backgroundEffect: 'rectangle-mesh' as const, pointerEffect: 'glow' as const }
  const backgroundEffect = normalizeBackgroundEffect(effects.backgroundEffect)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    document.documentElement.dataset.appEffect = backgroundEffect
    root.style.setProperty('--portal-header', mode.headerColor)
    root.style.setProperty('--portal-header-text', mode.headerTextColor)
    root.style.setProperty('--primary', mode.primaryColor)
    root.style.setProperty('--ring', mode.primaryColor)
    root.style.setProperty('--accent', mode.accentColor)
    root.style.setProperty('--background', mode.backgroundColor)
    root.style.setProperty('--card', mode.cardColor)
    root.style.setProperty('--popover', mode.cardColor)
    root.style.setProperty('--foreground', mode.textColor)
    root.style.setProperty('--card-foreground', mode.textColor)
    root.style.setProperty('--popover-foreground', mode.textColor)
    root.style.setProperty('--muted-foreground', mode.mutedTextColor)
    root.style.setProperty('--sidebar-primary', mode.primaryColor)
    root.style.setProperty('--portal-background-image', 'none')
    root.style.setProperty('--portal-background-opacity', '0')
    return () => { if (document.documentElement.dataset.appEffect === backgroundEffect) delete document.documentElement.dataset.appEffect }
  }, [mode, backgroundEffect])

  useEffect(() => {
    const root = rootRef.current
    if (!root || effects.pointerEffect === 'none') return
    let last = 0
    const move = (event: PointerEvent) => {
      const now = performance.now()
      if (now - last < 35) return
      last = now
      addPointerParticle(effects.pointerEffect, event, [mode.primaryColor, mode.accentColor, mode.headerTextColor])
    }
    root.addEventListener('pointermove', move)
    return () => root.removeEventListener('pointermove', move)
  }, [mode, effects.pointerEffect])

  return <div ref={rootRef} className='portal-theme-shell' data-background-effect={backgroundEffect}>{children}</div>
}
