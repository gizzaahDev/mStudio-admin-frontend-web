import { useEffect, useState } from 'react'

interface OfflineAction {
  id: string
  type: string
  data: unknown
  timestamp: number
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  // Check connection status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set initial status
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Add action to queue when offline
  const queueAction = (action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
    const newAction: OfflineAction = {
      ...action,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    }

    setPendingActions((prev) => [...prev, newAction])
  }

  // Sync pending actions when online
  const syncActions = async () => {
    if (!isOnline || isSyncing || pendingActions.length === 0) {
      return
    }

    setIsSyncing(true)
    try {
      // TODO: Send pending actions to server
      // await Promise.all(pendingActions.map(action => sendToServer(action)))
      setPendingActions([])
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  // Auto-sync when back online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      syncActions()
    }
  }, [isOnline])

  return {
    isOnline,
    pendingActions,
    isSyncing,
    queueAction,
    syncActions,
  }
}
