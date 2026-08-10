import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Magical LMS Admin',
    short_name: 'LMS Admin',
    description: 'Magical LMS administration application',
    start_url: '/',
    display: 'standalone',
    background_color: '#07111f',
    theme_color: '#4f8cff',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}