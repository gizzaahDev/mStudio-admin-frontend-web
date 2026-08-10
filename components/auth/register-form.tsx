'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { registerStudentProfile } from '@/lib/backend-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { validators } from '@/lib/utils/validators'

export function RegisterForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    parentEmail: '',
    phone: '',
    birthday: '',
    grade: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = (): boolean => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.birthday || !formData.grade || !formData.password) {
      toast.error('Please fill in all required fields')
      return false
    }

    if (!validators.firstName(formData.firstName)) {
      toast.error('Please enter a valid first name')
      return false
    }

    if (!validators.lastName(formData.lastName)) {
      toast.error('Please enter a valid last name')
      return false
    }

    if (!validators.email(formData.email)) {
      toast.error('Please enter a valid email address')
      return false
    }

    if (formData.parentEmail && !validators.email(formData.parentEmail)) {
      toast.error('Please enter a valid parent email address')
      return false
    }

    const passwordValidation = validators.password(formData.password)
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.errors[0])
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      await registerStudentProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        parentEmail: formData.parentEmail,
        phone: formData.phone,
        birthday: formData.birthday,
        grade: formData.grade,
      })
      await signOut(auth)

      toast.success('Registration submitted! Please wait for admin approval before logging in.')
      router.push('/auth/login?tab=student')
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email already registered')
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak')
      } else {
        toast.error(error.message || 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
        Student accounts are created as pending requests. You can log in only after an admin approves your request.
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="firstName" className="text-sm font-medium text-foreground">
            First Name *
          </label>
          <Input
            id="firstName"
            name="firstName"
            placeholder="John"
            value={formData.firstName}
            onChange={handleChange}
            disabled={loading}
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="lastName" className="text-sm font-medium text-foreground">
            Last Name *
          </label>
          <Input
            id="lastName"
            name="lastName"
            placeholder="Doe"
            value={formData.lastName}
            onChange={handleChange}
            disabled={loading}
            className="bg-background"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email Address *
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="john@example.com"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          className="bg-background"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="parentEmail" className="text-sm font-medium text-foreground">
          Parent Email (optional)
        </label>
        <Input
          id="parentEmail"
          name="parentEmail"
          type="email"
          placeholder="parent@example.com"
          value={formData.parentEmail}
          onChange={handleChange}
          disabled={loading}
          className="bg-background"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="birthday" className="text-sm font-medium text-foreground">
          Birthday *
        </label>
        <Input
          id="birthday"
          name="birthday"
          type="date"
          value={formData.birthday}
          onChange={handleChange}
          max={new Date().toISOString().slice(0, 10)}
          disabled={loading}
          className="bg-background"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="grade" className="text-sm font-medium text-foreground">Your Grade *</label>
        <Input id="grade" name="grade" placeholder="Example: Grade 11" value={formData.grade} onChange={handleChange} disabled={loading} className="bg-background" />
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-medium text-foreground">
          Phone Number (optional)
        </label>
        <Input
          id="phone"
          name="phone"
          placeholder="+94 77 1234567"
          value={formData.phone}
          onChange={handleChange}
          disabled={loading}
          className="bg-background"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password *
        </label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Minimum 6 characters with uppercase, lowercase, and number"
            value={formData.password}
            onChange={handleChange}
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

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
          Confirm Password *
        </label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            className="bg-background pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full gap-2" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit Student Request
      </Button>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Already approved? </span>
        <Link href="/auth/login?tab=student" className="text-primary hover:underline font-medium">
          Sign in here
        </Link>
      </div>
    </form>
  )
}
