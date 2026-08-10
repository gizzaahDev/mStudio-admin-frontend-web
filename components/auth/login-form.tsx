'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { bootstrapAdminProfile, getMyProfile, registerStaffProfile, type UserProfile } from '@/lib/backend-api'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { BOOTSTRAP_ADMIN_EMAIL, DUMMY_CREDENTIALS } from '@/lib/constants'

interface LoginFormProps {
  userType?: 'admin' | 'student' | 'teacher'
}

export function LoginForm({ userType = 'student' }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const isStaffLogin = userType === 'admin' || userType === 'teacher'

  const redirectForUserType = () => {
    if (userType === 'student') {
      router.replace('/student')
      return
    }

    if (userType === 'teacher') {
      router.replace('/teacher')
      return
    }

    router.replace('/admin')
  }

  const validateProfileAccess = async (profile: UserProfile | null) => {
    if (!profile) {
      await signOut(auth)
      throw new Error('Your account profile is missing. Please contact the admin.')
    }

    if (userType === 'student') {
      if (profile.role !== 'student') {
        throw new Error('This is not a student account. Please use the correct login portal; your account remains signed in.')
      }

      if (profile.status !== 'approved') {
        await signOut(auth)
        throw new Error('Your student account is waiting for admin approval.')
      }
    }

    if (userType === 'admin') {
      if (profile.role !== 'admin') {
        throw new Error('This is not an admin account. Please use the correct login portal; your account remains signed in.')
      }

      if (profile.status !== 'approved') {
        await signOut(auth)
        throw new Error('Your admin account is waiting for approval.')
      }
    }

    if (userType === 'teacher') {
      if (profile.role !== 'teacher' && profile.role !== 'admin') {
        throw new Error('This is not a teacher account. Please use the correct login portal; your account remains signed in.')
      }

      if (profile.status !== 'approved') {
        await signOut(auth)
        throw new Error('Your teacher account is waiting for approval.')
      }
    }
  }

  const finishLogin = async (profileOverride?: UserProfile | null) => {
    let profile = profileOverride ?? (await getMyProfile()).profile
    const bootstrapEmail = process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAIL || BOOTSTRAP_ADMIN_EMAIL
    if (!profile && userType === 'admin' && auth.currentUser?.email?.toLowerCase() === bootstrapEmail.toLowerCase()) {
      const result = await bootstrapAdminProfile()
      profile = result.profile
      toast.success('Owner admin profile restored')
    }
    await validateProfileAccess(profile)
    toast.success('Login successful!')
    redirectForUserType()
  }

  const handleDemoLogin = () => {
    const creds = userType === 'admin'
      ? DUMMY_CREDENTIALS.admin
      : userType === 'teacher'
        ? DUMMY_CREDENTIALS.teacher
        : DUMMY_CREDENTIALS.student

    setEmail(creds.email)
    setPassword(creds.password)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      await setPersistence(auth, browserLocalPersistence)
      await signInWithEmailAndPassword(auth, email, password)
      await finishLogin()
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await setPersistence(auth, browserLocalPersistence)
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const result = await signInWithPopup(auth, provider)
      const signedInEmail = result.user.email?.toLowerCase() || ''
      const bootstrapEmail = (process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAIL || BOOTSTRAP_ADMIN_EMAIL).toLowerCase()
      const { profile } = userType === 'admin' && signedInEmail === bootstrapEmail
        ? await bootstrapAdminProfile()
        : await registerStaffProfile({
            displayName: result.user.displayName || result.user.email || 'Staff user',
            email: result.user.email || '',
            role: userType === 'teacher' ? 'teacher' : 'admin',
          })

      await finishLogin(profile)
    } catch (error: any) {
      toast.error(error.message || 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor={`${userType}-email`} className="text-sm font-medium text-foreground">
          Email Address
        </label>
        <Input
          id={`${userType}-email`}
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="bg-background"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={`${userType}-password`} className="text-sm font-medium text-foreground">
          Password
        </label>
        <div className="relative">
          <Input
            id={`${userType}-password`}
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="bg-background pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full gap-2" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Sign In
      </Button>

      {isStaffLogin && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          Sign in / Sign up with Google
        </Button>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-background px-2 text-muted-foreground">Or use demo credentials</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleDemoLogin}
        disabled={loading}
      >
        Load Demo Credentials
      </Button>

      {userType === 'student' && (
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don&apos;t have an account? </span>
          <Link href="/auth/register" className="text-primary hover:underline font-medium">
            Request an account
          </Link>
        </div>
      )}
    </form>
  )
}
