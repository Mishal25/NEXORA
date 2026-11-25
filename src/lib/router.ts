import { useEffect, useState } from 'react'

function current(): string {
  const h = window.location.hash.replace(/^#/, '')
  return h.startsWith('/') ? h : '/'
}

export function navigate(path: string): void {
  window.location.hash = path
  window.scrollTo({ top: 0 })
}

export function useRoute(): string {
  const [path, setPath] = useState(current)
  useEffect(() => {
    const on = () => setPath(current())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return path
}

/** Scroll to a landing-page section without leaving the landing route. */
export function scrollToId(id: string): void {
  if (current() !== '/') {
    navigate('/')
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 60)
  } else {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }
}
