// Two pages: the app, and the benchmark at #bench.

import { lazy, Suspense, useEffect, useState } from 'react'
import App from './App'

const Bench = lazy(() => import('./bench/Bench'))

export default function Root() {
  const [hash, setHash] = useState(() => location.hash)
  useEffect(() => {
    const on = () => setHash(location.hash)
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  if (hash === '#bench') {
    return (
      <Suspense fallback={null}>
        <Bench />
      </Suspense>
    )
  }
  return <App />
}

