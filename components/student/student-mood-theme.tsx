'use client'

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { useAppSettings } from '@/lib/app-settings-context'
import { defaultStudentMoods } from '@/lib/portal-theme-defaults'
import { addPointerParticle } from '@/lib/pointer-effects'
import type { PortalThemeMode, StudentMoodConfiguration, StudentMoodKey } from '@/lib/backend-api'
import { normalizeBackgroundEffect } from '@/lib/background-effects'

export type StudentMood = StudentMoodKey
export type MoodPalette = PortalThemeMode
export type MoodTheme = StudentMoodConfiguration & { mood: StudentMood }

export interface StudentMoodPreferences {
  wallpaper: string
  wallpaperOpacity: number
  mouseEffect: boolean
  backgroundEffect: boolean
}

const STORAGE_MOOD = 'studentMood'
const STORAGE_PREFS = 'studentMoodPreferences'
const STORAGE_EVENT = 'student-theme-change'
const moodKeys: StudentMood[] = ['focus', 'happy', 'calm', 'energy', 'dream']

export const moodThemes: MoodTheme[] = moodKeys.map((mood) => ({ mood, ...defaultStudentMoods[mood] }))
export const defaultMoodPreferences: StudentMoodPreferences = { wallpaper: '', wallpaperOpacity: 0.55, mouseEffect: true, backgroundEffect: true }

interface StudentMoodContextType {
  mood: StudentMood
  theme: MoodTheme
  themes: MoodTheme[]
  palette: MoodPalette
  preferences: StudentMoodPreferences
  setMood: (mood: StudentMood) => void
  setPreferences: (preferences: Partial<StudentMoodPreferences>) => void
  resetPreferences: () => void
}

const StudentMoodContext = createContext<StudentMoodContextType | undefined>(undefined)
function clamp(value: number) { return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0.55)) }
function wallpaper(value: string) { const clean = value.trim().replace(/^url\((.*)\)$/i, '$1').replace(/^['"]|['"]$/g, ''); return clean ? 'url("' + clean.replace(/"/g, '%22') + '")' : 'none' }
function readPreferences() {
  try { return { ...defaultMoodPreferences, ...JSON.parse(localStorage.getItem(STORAGE_PREFS) || '{}') } }
  catch { return defaultMoodPreferences }
}

export function StudentMoodTheme({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useTheme()
  const { settings } = useAppSettings()
  const [mood, setMoodState] = useState<StudentMood>('focus')
  const [preferences, setPreferencesState] = useState(defaultMoodPreferences)
  const containerRef = useRef<HTMLDivElement>(null)
  const themes = useMemo(() => moodKeys.map((key) => ({ mood: key, ...(settings.studentMoods?.[key] || defaultStudentMoods[key]) })), [settings.studentMoods])
  const theme = themes.find((item) => item.mood === mood) || themes[0]
  const palette = isDarkMode ? theme.dark : theme.light
  const effects = settings.effects?.student || { backgroundEffect: 'rectangle-mesh' as const, pointerEffect: 'sparkles' as const }
  const configuredBackgroundEffect = normalizeBackgroundEffect(effects.backgroundEffect)
  const activeBackgroundEffect = preferences.backgroundEffect ? configuredBackgroundEffect : 'none'

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_MOOD) as StudentMood | null
    setPreferencesState(readPreferences())
    if (saved && moodKeys.includes(saved)) setMoodState(saved)
    const refresh = () => { const next = localStorage.getItem(STORAGE_MOOD) as StudentMood | null; setPreferencesState(readPreferences()); if (next && moodKeys.includes(next)) setMoodState(next) }
    window.addEventListener(STORAGE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => { window.removeEventListener(STORAGE_EVENT, refresh); window.removeEventListener('storage', refresh) }
  }, [])

  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    document.documentElement.dataset.appEffect = activeBackgroundEffect
    root.style.setProperty('--portal-header', palette.headerColor)
    root.style.setProperty('--portal-header-text', palette.headerTextColor)
    root.style.setProperty('--student-primary', palette.primaryColor)
    root.style.setProperty('--primary', palette.primaryColor)
    root.style.setProperty('--student-accent', palette.accentColor)
    root.style.setProperty('--accent', palette.accentColor)
    root.style.setProperty('--student-background', palette.backgroundColor)
    root.style.setProperty('--student-card', palette.cardColor)
    root.style.setProperty('--student-foreground', palette.textColor)
    root.style.setProperty('--student-muted-foreground', palette.mutedTextColor)
    root.style.setProperty('--student-wallpaper', wallpaper(preferences.wallpaper))
    root.style.setProperty('--student-wallpaper-opacity', String(clamp(preferences.wallpaperOpacity)))
    return () => { if (document.documentElement.dataset.appEffect === activeBackgroundEffect) delete document.documentElement.dataset.appEffect }
  }, [palette, preferences, activeBackgroundEffect])

  useEffect(() => {
    const root = containerRef.current
    if (!root || !preferences.mouseEffect || effects.pointerEffect === 'none') return
    let last = 0
    const move = (event: PointerEvent) => {
      const now = performance.now()
      if (now - last < 34) return
      last = now
      addPointerParticle(effects.pointerEffect, event, [palette.primaryColor, palette.accentColor, palette.headerTextColor])
    }
    root.addEventListener('pointermove', move)
    return () => root.removeEventListener('pointermove', move)
  }, [palette, preferences.mouseEffect, effects.pointerEffect])

  const notify = () => window.dispatchEvent(new Event(STORAGE_EVENT))
  const setMood = (next: StudentMood) => { setMoodState(next); localStorage.setItem(STORAGE_MOOD, next); notify() }
  const setPreferences = (next: Partial<StudentMoodPreferences>) => {
    const updated = { ...preferences, ...next, wallpaperOpacity: next.wallpaperOpacity === undefined ? preferences.wallpaperOpacity : clamp(next.wallpaperOpacity) }
    setPreferencesState(updated); localStorage.setItem(STORAGE_PREFS, JSON.stringify(updated)); notify()
  }
  const resetPreferences = () => { setPreferencesState(defaultMoodPreferences); localStorage.setItem(STORAGE_PREFS, JSON.stringify(defaultMoodPreferences)); notify() }

  return <StudentMoodContext.Provider value={{ mood, theme, themes, palette, preferences, setMood, setPreferences, resetPreferences }}><div ref={containerRef} className='student-mood-shell portal-theme-shell' data-background-effect={activeBackgroundEffect}>{children}</div></StudentMoodContext.Provider>
}

export function useStudentMood() {
  const context = useContext(StudentMoodContext)
  if (!context) throw new Error('useStudentMood must be used inside StudentMoodTheme')
  return context
}
