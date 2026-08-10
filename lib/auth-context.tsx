'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { getMyProfile, type UserProfile, type UserRole } from './backend-api'

export interface AuthUser extends FirebaseUser {
  profile?: UserProfile | null
  role?: UserRole | null
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  role: UserRole | null
  profile: UserProfile | null
  isAuthenticated: boolean
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const PROFILE_CACHE_KEY = 'magical-ict-session-profile'

function readCachedProfile(uid: string) {
  try {
    const cached = JSON.parse(sessionStorage.getItem(PROFILE_CACHE_KEY) || 'null') as UserProfile | null
    return cached && (cached.uid === uid || cached.id === uid) ? cached : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<UserRole | null>(null)

  const loadProfile = async (currentUser: FirebaseUser) => {
    const { profile: loadedProfile } = await getMyProfile()
    const authUser: AuthUser = Object.assign(currentUser, {
      profile: loadedProfile,
      role: loadedProfile?.role ?? null,
    })

    setUser(authUser)
    setProfile(loadedProfile)
    setRole(loadedProfile?.role ?? null)
    if (loadedProfile) sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(loadedProfile))
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          await loadProfile(currentUser)
        } else {
          setUser(null)
          setProfile(null)
          setRole(null)
        }
      } catch {
        const cachedProfile = currentUser ? readCachedProfile(currentUser.uid) : null
        setUser(currentUser ? Object.assign(currentUser, { role: cachedProfile?.role ?? null, profile: cachedProfile }) : null)
        setProfile(cachedProfile)
        setRole(cachedProfile?.role ?? null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const refreshProfile = async () => {
    if (!auth.currentUser) {
      setProfile(null)
      setRole(null)
      return
    }

    await loadProfile(auth.currentUser)
  }

  const logout = async () => {
    await auth.signOut()
    sessionStorage.removeItem(PROFILE_CACHE_KEY)
    setUser(null)
    setProfile(null)
    setRole(null)
  }

  const value: AuthContextType = {
    user,
    loading,
    role,
    profile,
    isAuthenticated: !!user,
    logout,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
