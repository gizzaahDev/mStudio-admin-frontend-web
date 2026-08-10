'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
}

interface ThemeContextType {
  theme: Theme
  isDarkMode: boolean
  setTheme: (theme: Theme) => void
  colors: ThemeColors
  setColors: (colors: Partial<ThemeColors>) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const DEFAULT_COLORS: ThemeColors = {
  primary: '#5B4B8E',
  secondary: '#E2E8F0',
  accent: '#A78BFA',
  background: '#F8FAFC',
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [colors, setColorsState] = useState<ThemeColors>(DEFAULT_COLORS)
  const [mounted, setMounted] = useState(false)

  // Initialize theme on mount
  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'system'
    const savedColors = localStorage.getItem('themeColors')

    setThemeState(savedTheme)
    if (savedColors) {
      try {
        setColorsState(JSON.parse(savedColors))
      } catch (e) {
        setColorsState(DEFAULT_COLORS)
      }
    }

    // Apply theme and mark as mounted
    applyTheme(savedTheme, JSON.parse(savedColors || JSON.stringify(DEFAULT_COLORS)))
    setMounted(true)
  }, [])

  // Watch for system theme changes
  useEffect(() => {
    if (!mounted) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      if (theme === 'system') {
        const isDark = mediaQuery.matches
        setIsDarkMode(isDark)
        updateDocumentTheme(isDark)
      }
    }

    mediaQuery.addEventListener('change', handleChange)

    // Set initial value based on system preference
    if (theme === 'system') {
      const isDark = mediaQuery.matches
      setIsDarkMode(isDark)
      updateDocumentTheme(isDark)
    } else if (theme === 'dark') {
      setIsDarkMode(true)
      updateDocumentTheme(true)
    } else {
      setIsDarkMode(false)
      updateDocumentTheme(false)
    }

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)

    if (newTheme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(isDark)
      updateDocumentTheme(isDark)
    } else if (newTheme === 'dark') {
      setIsDarkMode(true)
      updateDocumentTheme(true)
    } else {
      setIsDarkMode(false)
      updateDocumentTheme(false)
    }
  }

  const setColors = (newColors: Partial<ThemeColors>) => {
    const updated = { ...colors, ...newColors }
    setColorsState(updated)
    localStorage.setItem('themeColors', JSON.stringify(updated))
  }

  const applyTheme = (themeMode: Theme, themeColors: ThemeColors) => {
    let isDark = false
    if (themeMode === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    } else if (themeMode === 'dark') {
      isDark = true
    }

    updateDocumentTheme(isDark)
  }

  const updateDocumentTheme = (isDark: boolean) => {
    const html = document.documentElement
    html.classList.toggle('dark', isDark)
    html.classList.toggle('light', !isDark)
    html.style.colorScheme = isDark ? 'dark' : 'light'
  }

  const value: ThemeContextType = {
    theme,
    isDarkMode,
    setTheme,
    colors,
    setColors,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
