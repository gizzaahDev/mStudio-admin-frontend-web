'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getAppSettings, type AppSettings } from './backend-api'
import { defaultStudentMoods, defaultTeacherTheme } from './portal-theme-defaults'
import { normalizeBackgroundEffect } from './background-effects'

export const defaultAppSettings: AppSettings = {
  deployment: {
    mode: 'individual', enabled: true, instituteAccessEnabled: false, teacherSubscriptionsEnabled: true, teacherTrialDays: 30,
    subscriptionPlans: { monthly: { current: 12000, regular: 14590, discountPercent: 17.75 }, yearly: { current: 88000, regular: 130000, discountPercent: 32.31 }, lifetime: { current: 478000, regular: 695000, discountPercent: 31.22 } },
    teacherSubscriptionPlans: {
      'starter-50': { maxStudents: 50, monthly: 1500, yearly: 15000, monthlyOffer: 1200, yearlyOffer: 12000 }, 'growth-150': { maxStudents: 150, monthly: 3500, yearly: 35000, monthlyOffer: 3000, yearlyOffer: 30000 }, 'academy-300': { maxStudents: 300, monthly: 6500, yearly: 65000, monthlyOffer: 5500, yearlyOffer: 55000 },
      'pro-500': { maxStudents: 500, monthly: 9500, yearly: 95000, monthlyOffer: 8000, yearlyOffer: 80000 }, 'scale-1000': { maxStudents: 1000, monthly: 15000, yearly: 150000, monthlyOffer: 12500, yearlyOffer: 125000 }, enterprise: { maxStudents: null, monthly: 25000, yearly: 250000, monthlyOffer: 22000, yearlyOffer: 220000 },
    },
  },
  idPrefix: 'MICT', appName: 'Magical ICT', subjectName: 'ICT', logoUrl: '', mobileAppIcons: { student: '', teacher: '', admin: '', adaptiveBackgroundColor: '#07111f' }, spaceName: 'My Learning Space',
  studentWelcomeMessage: 'Welcome! Choose your mood and make the app feel like yours.',
  about: { studentApkVersion: '1.0.0 (1)', teacherApkVersion: '1.0.0 (1)', thankYouMessage: 'Thank you for learning with us.', developerName: 'Magical LMS Development Team', developerContact: '', developerWebsite: '' },
  maintenance: { student: { enabled: false, reason: '', startsAt: '', endsAt: '', notifyTeachers: true }, teacher: { enabled: false, reason: '', startsAt: '', endsAt: '', notifyTeachers: false } },
  teacherImageFrame: { shape: 'rounded', overlayUrl: '', overlayLabel: '' },
  visualEffects: { cardBlur: 8, headerBlur: 14, footerBlur: 10, cardTransparent: true, cardOpacity: 88, headerTransparent: true, headerOpacity: 78, footerTransparent: true, footerOpacity: 82, fallingEnabled: false, fallingAssetUrl: '', fallingSymbol: '❄', fallingCount: 24, holidayGreetings: true },
  mobileVisualEffects: { student: { cardBlur: 8, cardTransparent: true, cardOpacity: 88 }, teacher: { cardBlur: 8, cardTransparent: true, cardOpacity: 90 } },
  navigationOrder: { student: ['dashboard','reception','space','curriculum','progress','attendance','assignments','messages','calendar','profile','about','settings'], teacher: ['dashboard','classes','students','attendance','scan','curriculum','assignments','messages','reports','dashboardContent','calendar','payments','organization','instituteOwner','about','settings'], admin: ['dashboard','students','approvals','accounts','curriculum','reports','dashboardContent','messages','assignments','calendar','payments','subscriptions','organization','tappManage','appSettings','about','settings'] },
  dashboardOrder: { student: ['greeting','quote','notices','moods','stats','results','activities','actions'], teacher: ['stats','activities','attendance','actions'] },
  header: { enabled: true, showLogo: true, showAppName: true, showGreeting: true, showLanguage: true, showTheme: true, showSettings: true, showSignOut: true },
  footer: { enabled: true, text: 'Magical ICT - Learn, practise, and grow.', copyrightText: 'All rights reserved.', poweredBy: 'Powered by Magical ICT', backgroundColor: '#07111f', textColor: '#f8fafc', fontSize: 14, minHeight: 88, alignment: 'left', mapUrl: '', imageUrl: '', imageSize: 48, contentOrder: ['image','branding','links','map'], links: [] },
  appearance: { headerColor: '#07111f', headerTextColor: '#f8fafc', primaryColor: '#4f8cff', accentColor: '#8b5cf6', backgroundEffect: 'rectangle-mesh' },
  effects: { student: { backgroundEffect: 'rectangle-mesh', pointerEffect: 'sparkles' }, teacher: { backgroundEffect: 'rectangle-mesh', pointerEffect: 'glow' } },
  portalThemes: { teacher: defaultTeacherTheme },
  studentMoods: defaultStudentMoods,
  sidebarVisibility: {
    student: { dashboard: true, reception: true, space: true, progress: true, attendance: true, curriculum: true, assignments: true, messages: true, calendar: true, profile: true, about: true, settings: true },
    teacher: { dashboard: true, classes: true, students: true, attendance: true, curriculum: true, assignments: true, messages: true, reports: true, dashboardContent: true, calendar: true, payments: true, organization: true, instituteOwner: true, about: true, settings: true },
    admin: { dashboard: true, students: true, approvals: true, accounts: true, curriculum: true, reports: true, messages: true, assignments: true, calendar: true, payments: true, subscriptions: true, organization: true, tappManage: true, appSettings: true, about: true, settings: true },
  },
  reception: { title: 'Reception', welcomeText: 'Your account is approved. View institute information here while your teacher adds you to a batch.', teacherName: 'Magical ICT Teacher', teacherPhone: '+94 77 123 4567', teacherEmail: 'admin@magicalict.com', instituteName: 'Seththaru Institute', instituteDetails: 'ICT classes', address: 'Add your institute address and landmark.', mapUrl: 'https://maps.google.com', institutions: [] },
  classTypes: ['ICT Theory', 'Paper Class', 'ICT Practical', 'Revision'], resultCategories: ['Quiz', 'Paper', 'Practical', 'Theory', 'Revision'], teacherGrades: ['Pre-School', ...Array.from({ length: 13 }, (_, index) => 'Grade ' + (index + 1))], teacherSubjects: ['ICT'],
  labels: { student: { dashboard: 'Dashboard', reception: 'Reception', space: 'My Learning Space', progress: 'Progress & Grades', attendance: 'Attendance', curriculum: 'Curriculum', assignments: 'Assignments', messages: 'Messages', calendar: 'Calendar', profile: 'My Profile', settings: 'Settings' }, teacher: { dashboard: 'Dashboard', classes: 'Classes', students: 'Students', attendance: 'Attendance', scan: 'QR & Quick Update', assignments: 'Assignments', messages: 'Messages', reports: 'Reports', dashboardContent: 'Quotes & Notices', calendar: 'Calendar', payments: 'Payments', organization: 'My Profile', instituteOwner: 'Institute Access & Subscription', settings: 'Settings' }, admin: { dashboard: 'Dashboard', students: 'Students', approvals: 'Approvals', accounts: 'Admin Accounts', curriculum: 'Curriculum', reports: 'Reports', messages: 'Messages', assignments: 'Assignments', calendar: 'Calendar', payments: 'Payments', subscriptions: 'Institute Subscriptions', organization: 'Institutes', tappManage: 'TAPP Manage', settings: 'Settings', appSettings: 'App Configuration' } },
}

export function normalizeAppSettings(saved?: Partial<AppSettings> | null): AppSettings {
  const source = saved || {}
  const savedMoods = source.studentMoods || ({} as AppSettings['studentMoods'])
  return {
    ...defaultAppSettings,
    ...source,
    deployment: {
      ...defaultAppSettings.deployment, ...(source.deployment || {}),
      subscriptionPlans: { monthly: { ...defaultAppSettings.deployment.subscriptionPlans.monthly, ...(source.deployment?.subscriptionPlans?.monthly || {}) }, yearly: { ...defaultAppSettings.deployment.subscriptionPlans.yearly, ...(source.deployment?.subscriptionPlans?.yearly || {}) }, lifetime: { ...defaultAppSettings.deployment.subscriptionPlans.lifetime, ...(source.deployment?.subscriptionPlans?.lifetime || {}) } },
      teacherSubscriptionPlans: Object.fromEntries(Object.entries(defaultAppSettings.deployment.teacherSubscriptionPlans).map(([id, prices]) => [
        id, { ...prices, ...(source.deployment?.teacherSubscriptionPlans?.[id as keyof AppSettings['deployment']['teacherSubscriptionPlans']] || {}) },
      ])) as AppSettings['deployment']['teacherSubscriptionPlans'],
    },
    mobileAppIcons: { ...defaultAppSettings.mobileAppIcons, ...(source.mobileAppIcons || {}) },
    about: { ...defaultAppSettings.about, ...(source.about || {}) },
    maintenance: { student: { ...defaultAppSettings.maintenance.student, ...(source.maintenance?.student || {}) }, teacher: { ...defaultAppSettings.maintenance.teacher, ...(source.maintenance?.teacher || {}) } },
    appearance: { ...defaultAppSettings.appearance, ...(source.appearance || {}), backgroundEffect: normalizeBackgroundEffect(source.appearance?.backgroundEffect) },
    visualEffects: { ...defaultAppSettings.visualEffects, ...(source.visualEffects || {}) },
    mobileVisualEffects: { student: { ...defaultAppSettings.mobileVisualEffects.student, ...(source.mobileVisualEffects?.student || {}) }, teacher: { ...defaultAppSettings.mobileVisualEffects.teacher, ...(source.mobileVisualEffects?.teacher || {}) } },
    header: { ...defaultAppSettings.header, ...(source.header || {}) },
    navigationOrder: { student: [...(source.navigationOrder?.student || []), ...defaultAppSettings.navigationOrder.student.filter((key) => !source.navigationOrder?.student?.includes(key))], teacher: [...(source.navigationOrder?.teacher || []), ...defaultAppSettings.navigationOrder.teacher.filter((key) => !source.navigationOrder?.teacher?.includes(key))], admin: [...(source.navigationOrder?.admin || []), ...defaultAppSettings.navigationOrder.admin.filter((key) => !source.navigationOrder?.admin?.includes(key))] },
    dashboardOrder: { student: source.dashboardOrder?.student || defaultAppSettings.dashboardOrder.student, teacher: source.dashboardOrder?.teacher || defaultAppSettings.dashboardOrder.teacher },
    effects: {
      student: { ...defaultAppSettings.effects.student, ...(source.effects?.student || {}), backgroundEffect: normalizeBackgroundEffect(source.effects?.student?.backgroundEffect) },
      teacher: { ...defaultAppSettings.effects.teacher, ...(source.effects?.teacher || {}), backgroundEffect: normalizeBackgroundEffect(source.effects?.teacher?.backgroundEffect) },
    },
    portalThemes: {
      teacher: {
        light: { ...defaultTeacherTheme.light, ...(source.portalThemes?.teacher?.light || {}), backgroundEffect: normalizeBackgroundEffect(source.portalThemes?.teacher?.light?.backgroundEffect) },
        dark: { ...defaultTeacherTheme.dark, ...(source.portalThemes?.teacher?.dark || {}), backgroundEffect: normalizeBackgroundEffect(source.portalThemes?.teacher?.dark?.backgroundEffect) },
      },
    },
    studentMoods: Object.fromEntries(Object.entries(defaultStudentMoods).map(([key, mood]) => {
      const savedMood = savedMoods[key as keyof typeof savedMoods]
      return [key, {
        ...mood,
        ...(savedMood || {}),
        light: { ...mood.light, ...(savedMood?.light || {}), backgroundEffect: normalizeBackgroundEffect(savedMood?.light?.backgroundEffect) },
        dark: { ...mood.dark, ...(savedMood?.dark || {}), backgroundEffect: normalizeBackgroundEffect(savedMood?.dark?.backgroundEffect) },
      }]
    })) as AppSettings['studentMoods'],
    sidebarVisibility: {
      student: { ...defaultAppSettings.sidebarVisibility.student, ...(source.sidebarVisibility?.student || {}) },
      teacher: { ...defaultAppSettings.sidebarVisibility.teacher, ...(source.sidebarVisibility?.teacher || {}) },
      admin: { ...defaultAppSettings.sidebarVisibility.admin, ...(source.sidebarVisibility?.admin || {}) },
    },
    reception: { ...defaultAppSettings.reception, ...(source.reception || {}), institutions: source.reception?.institutions || [] },
    footer: { ...defaultAppSettings.footer, ...(source.footer || {}), links: Array.isArray(source.footer?.links) ? source.footer.links : defaultAppSettings.footer.links, contentOrder: Array.isArray(source.footer?.contentOrder) ? source.footer.contentOrder : defaultAppSettings.footer.contentOrder },
    labels: {
      student: { ...defaultAppSettings.labels.student, ...(source.labels?.student || {}) },
      teacher: { ...defaultAppSettings.labels.teacher, ...(source.labels?.teacher || {}) },
      admin: { ...defaultAppSettings.labels.admin, ...(source.labels?.admin || {}) },
    },
  }
}

type ContextValue = { settings: AppSettings; loading: boolean; setSettings: (settings: AppSettings) => void; refreshSettings: () => Promise<void>; label: (role: 'student' | 'teacher' | 'admin', key: string, fallback: string) => string }
const AppSettingsContext = createContext<ContextValue | null>(null)

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState(defaultAppSettings)
  const [loading, setLoading] = useState(true)
  useEffect(() => { const root = document.documentElement; const effects = settings.visualEffects; root.style.setProperty('--card-blur', effects.cardBlur + 'px'); root.style.setProperty('--header-blur', effects.headerBlur + 'px'); root.style.setProperty('--footer-blur', effects.footerBlur + 'px'); root.style.setProperty('--card-surface-opacity', (effects.cardTransparent ? effects.cardOpacity : 100) + '%'); root.style.setProperty('--header-surface-opacity', (effects.headerTransparent ? effects.headerOpacity : 100) + '%'); root.style.setProperty('--footer-surface-opacity', (effects.footerTransparent ? effects.footerOpacity : 100) + '%') }, [settings.visualEffects])
  const setSettings = (next: AppSettings) => setSettingsState(normalizeAppSettings(next))
  const refreshSettings = async () => {
    try { const result = await getAppSettings(); setSettingsState(normalizeAppSettings(result.settings)) }
    catch { /* Keep the latest working configuration during a temporary backend interruption. */ }
    finally { setLoading(false) }
  }
  useEffect(() => {
    void refreshSettings()
    const timer = window.setInterval(() => { void refreshSettings() }, 60000)
    const refreshOnFocus = () => { void refreshSettings() }
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') void refreshSettings() }
    window.addEventListener('focus', refreshOnFocus)
    window.addEventListener('magical-live-update', refreshOnFocus)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refreshOnFocus)
      window.removeEventListener('magical-live-update', refreshOnFocus)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [])
  const label = (role: 'student' | 'teacher' | 'admin', key: string, fallback: string) => settings.labels[role]?.[key] || fallback
  return <AppSettingsContext.Provider value={{ settings, loading, setSettings, refreshSettings, label }}>{children}</AppSettingsContext.Provider>
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext)
  if (!context) throw new Error('useAppSettings must be used within AppSettingsProvider')
  return context
}
