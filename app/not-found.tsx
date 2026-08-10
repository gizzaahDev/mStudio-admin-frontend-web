import Link from 'next/link'

export default function NotFound() {
  return <main className='grid min-h-screen place-items-center bg-background p-6 text-foreground'>
    <section className='w-full max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm'>
      <p className='text-sm font-semibold text-primary'>Error 404</p>
      <h1 className='mt-2 text-3xl font-bold'>Page not found</h1>
      <p className='mt-3 text-muted-foreground'>This link does not exist, or you do not have permission to view this page.</p>
      <Link href='/' className='mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground'>Return to sign in</Link>
    </section>
  </main>
}