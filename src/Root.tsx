// Three pages: the front door, the tool at #check, and the benchmark at #bench.

import { lazy, Suspense, useEffect, useState } from 'react'
import App from './App'
import { Intro } from './ui/Intro'

const Bench = lazy(() => import('./bench/Bench'))

export default function Root() {
  const [hash, setHash] = useState(() => location.hash)
  useEffect(() => {
    const on = () => {
      setHash(location.hash)
      scrollTo(0, 0)
    }
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
  if (hash === '#check') return <App />
  return <Intro onStart={() => (location.hash = 'check')} />
}
