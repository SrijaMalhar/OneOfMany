// Light and dark themes. index.html sets the theme before the first paint;
// this hook keeps it in sync and remembers an explicit choice.

import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'oneofmany.theme.v1'
const META = { light: '#fdfbf6', dark: '#23201b' }

function stored(): Theme | null {
  try {
    const t = localStorage.getItem(KEY)
    return t === 'light' || t === 'dark' ? t : null
  } catch {
    return null
  }
}

function system(): Theme {
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(t: Theme) {
  document.documentElement.dataset.theme = t
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META[t])
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => stored() ?? system())

  useEffect(() => apply(theme), [theme])

  // Follow the system until the user picks a theme themselves.
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const on = () => {
      if (!stored()) setTheme(system())
    }
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const choose = (t: Theme) => {
    try {
      localStorage.setItem(KEY, t)
    } catch {
      /* private mode: the choice lasts for this tab */
    }
    setTheme(t)
  }
  return [theme, choose]
}
