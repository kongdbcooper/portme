'use client'

import { useEffect, useRef } from 'react'

export default function SearchLogger({ query }) {
  const logged = useRef(false)

  useEffect(() => {
    if (!query || logged.current) return

    logged.current = true

    fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    }).catch(err => console.error('Error logging search', err))

  }, [query])

  return null
}
