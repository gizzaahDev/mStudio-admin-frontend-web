'use client'

import type { ReactNode } from 'react'
import { useAppSettings } from '@/lib/app-settings-context'

export function AppFooter() {
  const { settings } = useAppSettings()
  const footer = settings.footer
  if (!footer?.enabled) return null
  const align = footer.alignment === 'center' ? 'items-center text-center' : footer.alignment === 'right' ? 'items-end text-right' : 'items-start text-left'
  const blocks: Record<string, ReactNode> = {
    image: footer.imageUrl ? <img src={footer.imageUrl} alt='Footer icon' className='shrink-0 rounded-lg object-contain' style={{ width: footer.imageSize, height: footer.imageSize }} /> : null,
    branding: <div><p className='font-medium'>{footer.text}</p>{footer.poweredBy && <p className='mt-1 opacity-80'>{footer.poweredBy}</p>}<p className='mt-1 text-xs opacity-70'>© {new Date().getFullYear()} {footer.copyrightText}</p></div>,
    links: footer.links.length ? <nav className='flex flex-wrap gap-x-4 gap-y-2'>{footer.links.map((link, index) => <a key={link.url + '-' + index} href={link.url} target='_blank' rel='noreferrer' className='underline-offset-4 hover:underline'>{link.label}</a>)}</nav> : null,
    map: footer.mapUrl ? <div className='w-full max-w-md'><iframe src={footer.mapUrl} title='Institute location' loading='lazy' className='h-36 w-full rounded-xl border bg-white' /><a href={footer.mapUrl} target='_blank' rel='noreferrer' className='mt-1 inline-block text-xs underline'>Open location in Google Maps</a></div> : null,
  }
  return <footer className='app-footer mt-auto border-t px-5 py-4' style={{ backgroundColor: 'color-mix(in srgb, ' + footer.backgroundColor + ' var(--footer-surface-opacity, 82%), transparent)', color: footer.textColor, fontSize: footer.fontSize, minHeight: footer.minHeight }}>
    <div className={'mx-auto flex max-w-7xl flex-col gap-4 ' + align}>{footer.contentOrder.map((key) => blocks[key] ? <div key={key}>{blocks[key]}</div> : null)}</div>
  </footer>
}
