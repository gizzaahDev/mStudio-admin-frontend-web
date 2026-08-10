export const DUMMY_CREDENTIALS = {
  admin: {
    email: 'admin@magicalict.com',
    password: 'Admin@123',
    role: 'admin',
  },
  teacher: {
    email: 'teacher@magicalict.com',
    password: 'Teacher@123',
    role: 'teacher',
  },
  student: {
    email: 'student@magicalict.com',
    password: 'Student@123',
    role: 'student',
  },
}

export const APP_NAME = 'Magical ICT'
export const APP_OWNER = 'Geeshan Thisera'
export const BOOTSTRAP_ADMIN_EMAIL = 'geeshanthisera1234@gmail.com'

export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  PARENT: 'parent',
} as const

export const ROUTE_PATHS = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  GUEST: '/auth/guest',
  ADMIN: '/admin',
  STUDENT: '/student',
  PARENT: '/parent',
  CALENDAR: '/calendar',
  SETTINGS: '/settings',
} as const
