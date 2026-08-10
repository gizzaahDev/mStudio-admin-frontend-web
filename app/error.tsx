'use client'

import { useEffect } from 'react'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error])
  return <main className='grid min-h-[60vh] place-items-center p-6'><section className='w-full max-w-lg rounded-2xl border bg-card p-6 text-center shadow-lg'><h1 className='text-2xl font-bold'>This section could not be loaded</h1><p className='mt-2 text-sm text-muted-foreground'>Please check your connection and try again. Your saved data has not been removed.</p><button className='mt-5 rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground' onClick={reset}>Try again</button></section></main>
}
