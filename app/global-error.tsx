'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html><body><main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,fontFamily:'system-ui'}}><section style={{maxWidth:520,textAlign:'center'}}><h1>We could not open the admin app</h1><p>Please check your connection, then try again.</p><button onClick={reset} style={{padding:'10px 18px',borderRadius:12,cursor:'pointer'}}>Try again</button></section></main></body></html>
}
