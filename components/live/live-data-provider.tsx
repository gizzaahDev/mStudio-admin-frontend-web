'use client'

import { useEffect } from 'react'
import { clearApiCache } from '@/lib/backend-api'

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000'

export function LiveDataProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const events = new EventSource(API_URL + '/api/live-events')
    events.onmessage = (event) => {
      clearApiCache()
      let detail: Record<string, unknown> = {}
      try { detail = JSON.parse(event.data) as Record<string, unknown> } catch { /* Ignore malformed live-event payloads. */ }
      window.dispatchEvent(new CustomEvent('magical-live-update', { detail }))
    }
    return () => events.close()
  }, [])
  return <>{children}</>
}