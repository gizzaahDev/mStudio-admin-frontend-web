'use client'

import type { CSSProperties, Dispatch, SetStateAction } from 'react'
import { Check, ChevronDown, Monitor, Moon, MousePointer2, Sun } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { AppSettings, BackgroundEffect, PointerEffect, PortalThemeMode, StudentMoodKey } from '@/lib/backend-api'
import { defaultStudentMoods, defaultTeacherTheme } from '@/lib/portal-theme-defaults'

const backgroundEffects: Array<{ id: BackgroundEffect; name: string }> = [
  { id: 'none', name: 'No effect' },
  { id: 'rectangle-mesh', name: 'Rectangle mesh' },
  { id: 'hex-lattice', name: 'Hexagon lattice' },
  { id: 'blueprint', name: 'Blueprint grid' },
  { id: 'circuit-board', name: 'Circuit board' },
  { id: 'radial-rings', name: 'Radial rings' },
  { id: 'aurora', name: 'Aurora glow' },
  { id: 'waves', name: 'Layered waves' },
  { id: 'starfield', name: 'Starfield' },
  { id: 'diagonal-stripes', name: 'Diagonal stripes' },
  { id: 'soft-orbs', name: 'Soft floating orbs' },
]
const pointerEffectNames = {
  none: 'No pointer effect',
  sparkles: 'Soft sparkles',
  glow: 'Glowing light',
  bubbles: 'Floating bubbles',
  comet: 'Comet trail',
  confetti: 'Colour confetti',
  stars: 'Twinkling stars',
  rings: 'Expanding rings',
  fireflies: 'Fireflies',
  pixel: 'Pixel trail',
  ripple: 'Pointer ripple',
} satisfies Record<PointerEffect, string>
const pointerEffects: readonly PointerEffect[] = ['none', 'sparkles', 'glow', 'bubbles', 'comet', 'confetti', 'stars', 'rings', 'fireflies', 'pixel', 'ripple']
const colourFields: Array<[keyof PortalThemeMode, string]> = [
  ['headerColor', 'Header background'], ['headerTextColor', 'Header text'],
  ['primaryColor', 'Buttons and active tabs'], ['accentColor', 'Accent colour'],
  ['backgroundColor', 'Page background'], ['cardColor', 'Cards and panels'],
  ['textColor', 'Main text'], ['mutedTextColor', 'Secondary text'],
]

function effectPreviewStyle(mode: PortalThemeMode, effect: BackgroundEffect): CSSProperties {
  const p = mode.primaryColor + '52'
  const pSoft = mode.primaryColor + '24'
  const a = mode.accentColor + '4a'
  const aSoft = mode.accentColor + '20'
  const base: CSSProperties = { backgroundColor: mode.backgroundColor, backgroundRepeat: 'repeat' }
  switch (effect) {
    case 'none': return { ...base, backgroundImage: 'none' }
    case 'rectangle-mesh': return { ...base, backgroundImage: `linear-gradient(${p} 1px, transparent 1px), linear-gradient(90deg, ${p} 1px, transparent 1px)`, backgroundSize: '34px 25px' }
    case 'hex-lattice': return { ...base, backgroundImage: `linear-gradient(30deg, ${p} 12%, transparent 12.5%, transparent 87%, ${p} 87.5%), linear-gradient(150deg, ${a} 12%, transparent 12.5%, transparent 87%, ${a} 87.5%), linear-gradient(30deg, ${p} 12%, transparent 12.5%, transparent 87%, ${p} 87.5%)`, backgroundSize: '46px 80px', backgroundPosition: '0 0, 0 0, 23px 40px' }
    case 'blueprint': return { ...base, backgroundImage: `linear-gradient(${pSoft} 1px, transparent 1px), linear-gradient(90deg, ${pSoft} 1px, transparent 1px), linear-gradient(${a} 2px, transparent 2px), linear-gradient(90deg, ${a} 2px, transparent 2px)`, backgroundSize: '12px 12px, 12px 12px, 60px 60px, 60px 60px' }
    case 'circuit-board': return { ...base, backgroundImage: `linear-gradient(90deg, transparent 47%, ${p} 48% 50%, transparent 51%), linear-gradient(0deg, transparent 47%, ${p} 48% 50%, transparent 51%), radial-gradient(circle, ${a} 0 3px, transparent 4px)`, backgroundSize: '58px 29px, 29px 58px, 29px 29px' }
    case 'radial-rings': return { ...base, backgroundImage: `repeating-radial-gradient(circle at center, transparent 0 25px, ${p} 27px 29px, transparent 31px 54px)`, backgroundRepeat: 'no-repeat' }
    case 'aurora': return { ...base, backgroundImage: `conic-gradient(from 210deg at 12% 8%, transparent, ${p}, transparent 28%), conic-gradient(from 25deg at 88% 12%, transparent, ${a}, transparent 30%)`, backgroundSize: '135% 135%', backgroundRepeat: 'no-repeat' }
    case 'waves': return { ...base, backgroundImage: `repeating-radial-gradient(ellipse at 50% 110%, transparent 0 18px, ${p} 20px 22px, transparent 24px 42px)`, backgroundRepeat: 'no-repeat' }
    case 'starfield': return { ...base, backgroundImage: `radial-gradient(circle, ${p} 1px, transparent 2px), radial-gradient(circle, ${a} 1.5px, transparent 2.5px)`, backgroundSize: '43px 43px, 61px 61px', backgroundPosition: '0 0, 19px 25px' }
    case 'diagonal-stripes': return { ...base, backgroundImage: `repeating-linear-gradient(125deg, transparent 0 17px, ${pSoft} 18px 20px, transparent 21px 34px, ${aSoft} 35px 37px, transparent 38px 52px)` }
    case 'soft-orbs': return { ...base, backgroundImage: `radial-gradient(circle at 12% 20%, ${p} 0 3.8rem, transparent 4rem), radial-gradient(circle at 88% 28%, ${a} 0 5rem, transparent 5.2rem), radial-gradient(circle at 52% 88%, ${pSoft} 0 6rem, transparent 6.2rem)`, backgroundRepeat: 'no-repeat' }
    default: return base
  }
}

function EffectSelector({ role, value, mode, onChange }: { role: 'student' | 'teacher'; value: BackgroundEffect; mode: PortalThemeMode; onChange: (effect: BackgroundEffect) => void }) {
  return <div className='space-y-3'>
    <div><p className='text-sm font-semibold capitalize'>{role} app background</p><p className='text-xs text-muted-foreground'>Select a preview. It is only published after you click Save all settings.</p></div>
    <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
      {backgroundEffects.map((item) => {
        const selected = item.id === value
        return <button key={item.id} type='button' aria-pressed={selected} onClick={() => onChange(item.id)} className={`overflow-hidden rounded-xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selected ? 'border-primary ring-2 ring-primary/25' : 'hover:border-primary/60'}`}>
          <span className='relative block h-20' style={effectPreviewStyle(mode, item.id)}>{selected && <span className='absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground shadow'><Check className='h-3.5 w-3.5' /></span>}{item.id === 'none' && <span className='absolute inset-0 grid place-items-center text-xs font-medium' style={{ color: mode.mutedTextColor }}>Plain background</span>}</span>
          <span className='block border-t bg-card px-2.5 py-2 text-xs font-medium text-card-foreground'>{item.name}</span>
        </button>
      })}
    </div>
  </div>
}

function PointerEffectPreview({ effect, mode }: { effect: PointerEffect; mode: PortalThemeMode }) {
  if (effect === 'none') {
    return <span className='absolute inset-0 grid place-items-center text-xs font-medium' style={{ color: mode.mutedTextColor }}>Pointer trail off</span>
  }
  const animation = effect === 'confetti' ? 'pointer-confetti' : effect === 'fireflies' ? 'pointer-firefly' : effect === 'ripple' ? 'pointer-ripple' : 'pointer-fade'
  const sizes = effect === 'glow' ? [56, 48, 40] : effect === 'comet' ? [42, 36, 30] : [22, 18, 14]
  return <>
    {sizes.map((size, index) => {
      const style = {
        left: `${32 + index * 18}%`,
        top: `${62 - index * 13}%`,
        width: `${size}px`,
        height: `${size}px`,
        '--pointer-color': mode.primaryColor,
        '--pointer-color-two': mode.accentColor,
        animation: `${animation} 1.75s ease-out ${index * -0.42}s infinite`,
      } as CSSProperties
      return <span key={index} aria-hidden='true' className={`pointer-${effect} absolute motion-reduce:animate-none`} style={style}>{effect === 'stars' ? '\u2726' : null}</span>
    })}
    <MousePointer2 aria-hidden='true' className='absolute left-[54%] top-[45%] h-5 w-5 -translate-x-1/2 -translate-y-1/2 drop-shadow' style={{ color: mode.headerTextColor }} />
  </>
}

function PointerEffectSelector({ role, value, mode, onChange }: { role: 'student' | 'teacher'; value: PointerEffect; mode: PortalThemeMode; onChange: (effect: PointerEffect) => void }) {
  return <fieldset className='space-y-3'>
    <legend className='text-sm font-semibold capitalize'>{role} app mouse pointer movement</legend>
    <p className='text-xs text-muted-foreground'>Select an animated preview. The effect stays inside these cards until you save.</p>
    <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
      {pointerEffects.map((effect) => {
        const selected = effect === value
        return <button key={effect} type='button' role='radio' aria-checked={selected} aria-label={`${pointerEffectNames[effect]} for ${role} app`} onClick={() => onChange(effect)} className={`overflow-hidden rounded-xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selected ? 'border-primary ring-2 ring-primary/25' : 'hover:border-primary/60'}`}>
          <span className='relative block h-20 overflow-hidden' style={{ backgroundColor: mode.backgroundColor, backgroundImage: `radial-gradient(circle at 50% 50%, ${mode.primaryColor}22, transparent 65%)` }}>
            <PointerEffectPreview effect={effect} mode={mode} />
            {selected && <span className='absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground shadow'><Check className='h-3.5 w-3.5' /></span>}
          </span>
          <span className='block border-t bg-card px-2.5 py-2 text-xs font-medium text-card-foreground'>{pointerEffectNames[effect]}</span>
        </button>
      })}
    </div>
  </fieldset>
}
function ColourControl({ mode, field, label, update }: { mode: PortalThemeMode; field: keyof PortalThemeMode; label: string; update: (patch: Partial<PortalThemeMode>) => void }) {
  const value = String(mode[field])
  return <label className='text-xs font-medium text-muted-foreground'>{label}<div className='mt-1 flex gap-2'><input type='color' value={value} onChange={(event) => update({ [field]: event.target.value })} className='h-9 w-12 cursor-pointer rounded border bg-background p-1' /><Input value={value} onChange={(event) => update({ [field]: event.target.value })} className='font-mono text-xs text-foreground' /></div></label>
}

function ModeEditor({ title, mode, effect, update }: { title: string; mode: PortalThemeMode; effect: BackgroundEffect; update: (patch: Partial<PortalThemeMode>) => void }) {
  const dark = title.toLowerCase().includes('dark')
  return <section className='space-y-5 rounded-2xl border p-4'>
    <div className='flex items-center gap-2'>{dark ? <Moon className='h-4 w-4 text-primary' /> : <Sun className='h-4 w-4 text-primary' />}<h4 className='font-semibold'>{title}</h4></div>
    <div className='overflow-hidden rounded-xl border shadow-sm' style={{ ...effectPreviewStyle(mode, effect), color: mode.textColor }}>
      <div className='px-4 py-3 font-semibold' style={{ backgroundColor: mode.headerColor, color: mode.headerTextColor }}>Header preview</div>
      <div className='space-y-3 p-4'><div className='rounded-lg border p-3' style={{ backgroundColor: mode.cardColor }}><p className='font-semibold'>Dashboard card</p><p className='text-sm' style={{ color: mode.mutedTextColor }}>This is how secondary text will look.</p></div><div className='flex gap-2'><span className='rounded-md px-3 py-1.5 text-sm text-white' style={{ backgroundColor: mode.primaryColor }}>Primary</span><span className='rounded-md px-3 py-1.5 text-sm text-white' style={{ backgroundColor: mode.accentColor }}>Accent</span></div></div>
    </div>
    <div className='grid gap-3 sm:grid-cols-2'>{colourFields.map(([field, label]) => <ColourControl key={String(field)} mode={mode} field={field} label={label} update={update} />)}</div>
  </section>
}

export function ThemeSettingsEditor({ form, setForm }: { form: AppSettings; setForm: Dispatch<SetStateAction<AppSettings>> }) {
  const updateTeacher = (variant: 'light' | 'dark', patch: Partial<PortalThemeMode>) => setForm((current) => {
    const teacher = current.portalThemes?.teacher || defaultTeacherTheme
    return { ...current, portalThemes: { ...current.portalThemes, teacher: { ...teacher, [variant]: { ...teacher[variant], ...patch } } } }
  })
  const updateMood = (mood: StudentMoodKey, variant: 'light' | 'dark', patch: Partial<PortalThemeMode>) => setForm((current) => {
    const moods = current.studentMoods || defaultStudentMoods
    const selected = moods[mood] || defaultStudentMoods[mood]
    return { ...current, studentMoods: { ...moods, [mood]: { ...selected, [variant]: { ...selected[variant], ...patch } } } }
  })
  const updateEffect = (role: 'student' | 'teacher', patch: Partial<AppSettings['effects']['student']>) => setForm((current) => {
    const currentEffects = current.effects || { student: { backgroundEffect: 'rectangle-mesh' as const, pointerEffect: 'sparkles' as const }, teacher: { backgroundEffect: 'rectangle-mesh' as const, pointerEffect: 'glow' as const } }
    return { ...current, effects: { ...currentEffects, [role]: { ...currentEffects[role], ...patch } } }
  })
  const teacherTheme = form.portalThemes?.teacher || defaultTeacherTheme
  const effects = form.effects || { student: { backgroundEffect: 'rectangle-mesh' as const, pointerEffect: 'sparkles' as const }, teacher: { backgroundEffect: 'rectangle-mesh' as const, pointerEffect: 'glow' as const } }
  const moods = Object.entries(form.studentMoods || defaultStudentMoods) as Array<[StudentMoodKey, AppSettings['studentMoods'][StudentMoodKey]]>
  return <div className='space-y-8'>
    <section className='rounded-xl border p-5'><div className='mb-4'><h2 className='flex items-center gap-2'><MousePointer2 className='h-5 w-5 text-primary' />App background and mouse effects</h2><p className='mt-1 text-sm text-muted-foreground'>Choose and preview the student and teacher backgrounds separately. Student wallpaper remains in the student&apos;s own Settings page.</p></div><div className='grid gap-5 xl:grid-cols-2'>{(['student', 'teacher'] as const).map((role) => {
      const previewMode = role === 'student' ? (form.studentMoods?.focus || defaultStudentMoods.focus).dark : teacherTheme.dark
      return <section key={role} className='space-y-5 rounded-xl border p-4'><EffectSelector role={role} value={effects[role].backgroundEffect} mode={previewMode} onChange={(backgroundEffect) => updateEffect(role, { backgroundEffect })} /><PointerEffectSelector role={role} value={effects[role].pointerEffect} mode={previewMode} onChange={(pointerEffect) => updateEffect(role, { pointerEffect })} /></section>
    })}</div></section>
    <section className='rounded-xl border p-5'><div className='mb-4'><h2 className='flex items-center gap-2'><Monitor className='h-5 w-5 text-primary' />Teacher app colours</h2><p className='mt-1 text-sm text-muted-foreground'>Edit and preview light and dark colours separately. Effects are controlled once in the section above.</p></div><div className='grid gap-5 xl:grid-cols-2'><ModeEditor title='Teacher light mode' mode={teacherTheme.light} effect={effects.teacher.backgroundEffect} update={(patch) => updateTeacher('light', patch)} /><ModeEditor title='Teacher dark mode' mode={teacherTheme.dark} effect={effects.teacher.backgroundEffect} update={(patch) => updateTeacher('dark', patch)} /></div></section>
    <section className='rounded-xl border p-5'><div className='mb-4'><h2 className='text-lg font-bold'>Student app — five editable mood colours</h2><p className='mt-1 text-sm text-muted-foreground'>Open a mood to edit only its colours for light and dark mode. The shared student effect above automatically applies to every mood.</p></div><div className='space-y-3'>{moods.map(([key, mood]) => <details key={key} className='group rounded-xl border' open={key === 'focus'}><summary className='flex cursor-pointer list-none items-center justify-between p-4'><span className='flex items-center gap-3'><span className='text-2xl'>{mood.emoji}</span><span><span className='block font-semibold'>{mood.label}</span><span className='text-xs text-muted-foreground'>{mood.description}</span></span></span><ChevronDown className='h-5 w-5 transition group-open:rotate-180' /></summary><div className='grid gap-5 border-t p-4 xl:grid-cols-2'><ModeEditor title={mood.label + ' light mode'} mode={mood.light} effect={effects.student.backgroundEffect} update={(patch) => updateMood(key, 'light', patch)} /><ModeEditor title={mood.label + ' dark mode'} mode={mood.dark} effect={effects.student.backgroundEffect} update={(patch) => updateMood(key, 'dark', patch)} /></div></details>)}</div></section>
  </div>
}
