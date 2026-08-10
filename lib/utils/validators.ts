export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  password: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (password.length < 6) {
      errors.push('Password must be at least 6 characters')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain an uppercase letter')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain a lowercase letter')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain a number')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  },

  phone: (phone: string): boolean => {
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  },

  firstName: (name: string): boolean => {
    return name.length >= 2 && /^[a-zA-Z\s'-]+$/.test(name)
  },

  lastName: (name: string): boolean => {
    return name.length >= 2 && /^[a-zA-Z\s'-]+$/.test(name)
  },
}
